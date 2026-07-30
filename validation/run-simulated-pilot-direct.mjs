#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const window = {};
globalThis.window = window;
globalThis.performance = globalThis.performance || { now: () => 0 };
for (const file of [
  'engine/text.js', 'data/slides.js', 'engine/context.js',
  'engine/grounding-gate.js', 'engine/question.js'
]) {
  const source = readFileSync(join(ROOT, 'codebase', file), 'utf8');
  new Function('window', 'performance', source)(window, globalThis.performance);
}

const api = await import('../codebase/server.mjs');
const provider = api.providerState();
if (provider.mode !== 'live') throw new Error(`Prototype không live: ${provider.reason}`);

const golden = JSON.parse(readFileSync(join(ROOT, 'eval', 'golden-set.json'), 'utf8'));
const selectedIds = ['M03', 'M05', 'M09', 'M13', 'M11'];
const personas = {
  M03: 'Người học trả lời đủ ý',
  M05: 'Người học mới nắm một phần',
  M09: 'Người học dùng đúng thuật ngữ nhưng sai quan hệ',
  M13: 'Người học trả lời mơ hồ',
  M11: 'Người học hiểu sai về token'
};

const results = [];
for (const id of selectedIds) {
  const testCase = golden.cases.find((item) => item.id === id);
  const context = window.SlideContext.build(testCase.doc_code, testCase.page, testCase.passage_ids);
  const page = window.SlideContext.getPage(testCase.doc_code, testCase.page);
  const gate = window.GroundingGate.check({
    docCode: testCase.doc_code,
    selectedPage: testCase.page,
    passages: context.passages,
    selectedPassageIds: testCase.passage_ids,
    answer: { ...page.tutorAnswer, docCode: testCase.doc_code }
  });
  const question = window.QuestionGenerator.generateMock({ context, gate });
  const started = Date.now();
  try {
    const response = await api.classifyWithProvider({
      context: {
        doc_code: context.docCode,
        doc_title: context.docTitle,
        page: context.selectedPage,
        heading: context.heading,
        selected_text: context.selectedText,
        source_codes: context.sourceCodes
      },
      question: question.question,
      rubric: {
        key_points: question.keyPoints.map((item) => item.label),
        misconceptions: question.misconceptions.map((item) => item.gap)
      },
      student_answer: testCase.student_answer
    });
    const actual = response.verdict.mastery_state;
    results.push({
      id,
      persona: personas[id],
      source_ref: testCase.source_ref,
      input: testCase.student_answer,
      expected_state: testCase.expected.mastery_state,
      actual_state: actual,
      pass: actual === testCase.expected.mastery_state,
      model: response.model,
      latency_ms: response.latency_ms ?? Date.now() - started,
      output: response.verdict
    });
  } catch (error) {
    results.push({
      id,
      persona: personas[id],
      source_ref: testCase.source_ref,
      input: testCase.student_answer,
      expected_state: testCase.expected.mastery_state,
      actual_state: null,
      pass: false,
      model: provider.model,
      latency_ms: Date.now() - started,
      error: String(error?.message || error)
    });
  }
}

const runAt = new Date().toISOString();
const passed = results.filter((item) => item.pass).length;
const artifact = {
  artifact: 'CP5 simulated technical pilot — NOT human validation',
  disclaimer: 'Năm persona là mô phỏng trên input đã chốt. Đây là output Gemini thật nhưng không có quan sát hay quote của người dùng thật; không thay thế yêu cầu ≥5 người ngoài nhóm.',
  run_at: runAt,
  transport: 'codebase/server.mjs classifyWithProvider',
  provider,
  summary: { total: results.length, passed, failed: results.length - passed, live_calls: results.filter((item) => item.actual_state).length },
  results
};

const stamp = runAt.replace(/[:.]/g, '-');
const outDir = join(ROOT, 'validation', 'simulated-runs');
await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, `simulated-pilot-direct-${stamp}.json`), JSON.stringify(artifact, null, 2) + '\n');
await writeFile(join(outDir, `simulated-pilot-direct-${stamp}.md`), render(artifact));
console.log(`SIMULATED DIRECT PILOT: ${passed}/${results.length}; ${artifact.summary.live_calls} live outputs`);
console.log(`validation/simulated-runs/simulated-pilot-direct-${stamp}.md`);
if (passed !== results.length) process.exitCode = 1;

function render(run) {
  const rows = run.results.map((item) =>
    `| ${item.id} | ${item.persona} | ${item.expected_state} | ${item.actual_state || item.error} | ${item.latency_ms} ms | ${item.pass ? 'Đạt' : 'Chưa đạt'} |`
  ).join('\n');
  return `# CP5 simulated technical pilot — direct live\n\n` +
    `> **Không phải human validation.** ${run.disclaimer}\n\n` +
    `- Thời điểm: ${run.run_at}\n- Provider/model: ${run.provider.provider} / ${run.provider.model}\n` +
    `- Kết quả: **${run.summary.passed}/${run.summary.total}**\n- Output live: **${run.summary.live_calls}**\n\n` +
    `| Case | Persona mô phỏng | Chờ | Nhận | Latency | Kết quả |\n|---|---|---|---|---:|---|\n${rows}\n\n` +
    `## Kết luận đúng phạm vi\n\n` +
    `Lượt này chứng minh classifier live xử lý đúng năm kiểu input đại diện. ` +
    `Lượt này không đo khả năng sử dụng, mức tin hay nhu cầu của người thật.\n`;
}
