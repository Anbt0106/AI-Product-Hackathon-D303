#!/usr/bin/env node
/*
 * Chạy đủ golden set ở hai chế độ:
 *   node eval/run-eval.mjs --mode baseline
 *   AI_PROVIDER=gemini GEMINI_API_KEY=... node eval/run-eval.mjs --mode live
 *
 * Chế độ live gọi đúng Mastery Classifier thật; Gate và Scope Guard vẫn là
 * luật xác định. Mọi case, kể cả lỗi, đều được giữ trong results + traces.
 */
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const mode = valueOf('--mode') || 'baseline';
if (!['baseline', 'live'].includes(mode)) {
  console.error('Dùng --mode baseline hoặc --mode live');
  process.exit(2);
}

function valueOf(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const window = {};
globalThis.window = window;
globalThis.performance = globalThis.performance || { now: () => 0 };
for (const file of [
  'engine/text.js', 'data/slides.js', 'engine/context.js', 'engine/trace.js',
  'engine/scope-guard.js', 'engine/grounding-gate.js', 'engine/question.js',
  'engine/mastery.js'
]) {
  const source = readFileSync(join(ROOT, 'codebase', file), 'utf8');
  new Function('window', 'performance', source)(window, globalThis.performance);
}

const golden = JSON.parse(readFileSync(join(ROOT, 'eval', 'golden-set.json'), 'utf8'));
let liveApi = null;
let provider = { mode: 'mock', provider: null, model: 'rule-based-baseline-v1' };
if (mode === 'live') {
  liveApi = await import('../codebase/server.mjs');
  provider = liveApi.providerState();
  if (provider.mode !== 'live') {
    console.error('Không chạy live: ' + provider.reason);
    console.error('Ví dụ PowerShell: $env:AI_PROVIDER="gemini"; $env:GEMINI_API_KEY="..."; node eval/run-eval.mjs --mode live');
    process.exit(2);
  }
}

const results = [];
const traceEntries = [];
for (const testCase of golden.cases) {
  const started = Date.now();
  try {
    const actual = await runCase(testCase);
    const checks = Object.entries(testCase.expected).map(([key, expected]) => ({
      key, expected, actual: actual[key], pass: actual[key] === expected
    }));
    const pass = checks.every((x) => x.pass) && checkInvariants(testCase, actual).every((x) => x.pass);
    const invariants = checkInvariants(testCase, actual);
    results.push({ id: testCase.id, kind: testCase.kind, layer: testCase.layer,
      source_ref: testCase.source_ref, expected: testCase.expected, actual, checks, invariants, pass,
      latency_ms: Date.now() - started });
  } catch (error) {
    results.push({ id: testCase.id, kind: testCase.kind, layer: testCase.layer,
      source_ref: testCase.source_ref, expected: testCase.expected,
      actual: null, checks: [], invariants: [], pass: false, error: String(error?.message || error),
      latency_ms: Date.now() - started });
  }
}

function checkInvariants(testCase, actual) {
  if (testCase.kind !== 'mastery') return [];
  return [
    { name: 'source_page_in_context', pass: actual.source_page === testCase.page },
    { name: 'misconception_never_understood', pass: testCase.expected.mastery_state !== 'misconception' || actual.mastery_state !== 'understood' },
    { name: 'insufficient_never_continue', pass: actual.mastery_state !== 'insufficient' || actual.next_action !== 'continue' }
  ];
}

async function runCase(testCase) {
  if (testCase.kind === 'scope') {
    const guard = window.ScopeGuard.check(testCase.input);
    const actual = { scope_kind: guard?.kind || null };
    traceEntries.push(trace(testCase, 'scope_guard', 'rule', actual, null));
    return actual;
  }

  const context = window.SlideContext.build(testCase.doc_code, testCase.page, testCase.passage_ids || []);
  const page = window.SlideContext.getPage(testCase.doc_code, testCase.page);
  const answer = buildTutorAnswer(testCase, page);
  const gate = window.GroundingGate.check({
    docCode: testCase.doc_code,
    selectedPage: testCase.page,
    passages: context.passages,
    selectedPassageIds: testCase.passage_ids || [],
    answer
  });

  if (testCase.kind === 'gate') {
    const actual = { gate_status: gate.status, reason: gate.reason };
    traceEntries.push(trace(testCase, 'grounding_gate', 'rule', actual, null));
    return actual;
  }
  if (gate.status !== 'pass') throw new Error(`Gate ${gate.status}: ${gate.reason}`);

  const question = window.QuestionGenerator.generateMock({ context, gate });
  if (!question) throw new Error('Không có Micro-Check trong bank');

  if (mode === 'baseline') {
    const verdict = window.Mastery.classifyMock({ answer: testCase.student_answer, question, context, gate });
    traceEntries.push(trace(testCase, 'mastery_classify', 'mock', verdict, 0, 'rule-based-baseline-v1'));
    return verdict;
  }

  const response = await liveApi.classifyWithProvider({
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
      key_points: (question.keyPoints || []).map((k) => k.label),
      misconceptions: (question.misconceptions || []).map((m) => m.gap)
    },
    student_answer: testCase.student_answer
  });
  const verdict = { ...response.verdict, source_page: context.selectedPage };
  traceEntries.push(trace(testCase, 'mastery_classify', 'live', verdict,
    response.latency_ms, response.model));
  return verdict;
}

function buildTutorAnswer(testCase, page) {
  if (!page?.tutorAnswer) return null;
  const modeName = testCase.citation_mode || 'page';
  let citations = [testCase.page];
  let docCode = testCase.doc_code;
  if (modeName === 'missing') citations = [];
  if (modeName === 'other_page') {
    citations = [window.SlideContext.pages(testCase.doc_code).find((p) => p !== testCase.page) || 999];
  }
  if (modeName === 'other_doc') docCode = testCase.doc_code + '-other';
  return { text: page.tutorAnswer.text, citations, docCode };
}

function trace(testCase, step, traceMode, output, latencyMs, model = null) {
  return {
    case_id: testCase.id,
    step,
    at: new Date().toISOString(),
    mode: traceMode,
    provider: traceMode === 'live' ? provider.provider : null,
    model,
    latency_ms: latencyMs,
    source_ref: testCase.source_ref,
    context: testCase.kind === 'scope' ? null : {
      doc_code: testCase.doc_code, page: testCase.page, passage_ids: testCase.passage_ids
    },
    input: testCase.kind === 'mastery' ? { student_answer: testCase.student_answer } :
      testCase.kind === 'scope' ? { question: testCase.input } : { citation_mode: testCase.citation_mode },
    output
  };
}

const passed = results.filter((r) => r.pass).length;
const mastery = results.filter((r) => r.kind === 'mastery');
const masteryPassed = mastery.filter((r) => r.pass).length;
const summary = {
  run_at: new Date().toISOString(), mode,
  provider: provider.provider, model: provider.model,
  total: results.length, passed, failed: results.length - passed,
  pass_rate_percent: round(100 * passed / results.length),
  mastery_total: mastery.length, mastery_passed: masteryPassed,
  mastery_pass_rate_percent: round(100 * masteryPassed / mastery.length),
  quality_bar_percent: golden.quality_bar.overall_pass_rate_percent,
  quality_bar_met: 100 * passed / results.length >= golden.quality_bar.overall_pass_rate_percent,
  live_ai_call_count: traceEntries.filter((t) => t.mode === 'live').length
};

const artifact = {
  artifact: 'CP3 evaluation run', golden_set: golden.name,
  summary, quality_bar: golden.quality_bar, results
};
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const stem = mode === 'baseline' ? 'baseline-first-run' : `live-${provider.provider}-${stamp}`;
await mkdir(join(ROOT, 'eval', 'results'), { recursive: true });
await mkdir(join(ROOT, 'eval', 'traces'), { recursive: true });
await writeFile(join(ROOT, 'eval', 'results', stem + '.json'), JSON.stringify(artifact, null, 2) + '\n');
await writeFile(join(ROOT, 'eval', 'results', stem + '.md'), renderMarkdown(artifact));
await writeFile(join(ROOT, 'eval', 'traces', stem + '.json'), JSON.stringify({
  product: 'VLearn Hieu Dung Hieu That', checkpoint: mode === 'live' ? 'CP3' : 'CP2-baseline',
  run_at: summary.run_at, mode, provider: provider.provider, model: provider.model,
  entry_count: traceEntries.length, entries: traceEntries
}, null, 2) + '\n');

console.log(`${mode.toUpperCase()}: ${passed}/${results.length} đạt (${summary.pass_rate_percent}%)`);
console.log(`Mastery: ${masteryPassed}/${mastery.length} đạt (${summary.mastery_pass_rate_percent}%)`);
console.log(`AI calls thật: ${summary.live_ai_call_count}`);
console.log(`Kết quả: eval/results/${stem}.md`);
if (!summary.quality_bar_met) process.exitCode = 1;

function renderMarkdown(artifact) {
  const s = artifact.summary;
  const rows = artifact.results.map((r) =>
    `| ${r.id} | ${r.kind}/${r.layer} | ${Object.values(r.expected).join(', ')} | ${r.actual ? Object.values(r.actual).slice(0, 2).join(', ') : r.error} | ${r.pass ? 'Đạt' : 'Chưa đạt'} |`
  ).join('\n');
  return `# Kết quả ${s.mode} — ${s.run_at}\n\n` +
    `- Model: ${s.model || 'n/a'}\n- Tổng: **${s.passed}/${s.total} (${s.pass_rate_percent}%)**\n` +
    `- Mastery: **${s.mastery_passed}/${s.mastery_total} (${s.mastery_pass_rate_percent}%)**\n` +
    `- AI calls thật: **${s.live_ai_call_count}**\n- Quality bar: **${s.quality_bar_percent}%** → ${s.quality_bar_met ? 'Đạt' : 'Chưa đạt'}\n\n` +
    `| Case | Nhóm | Chờ | Nhận | Kết quả |\n|---|---|---|---|---|\n${rows}\n`;
}

function round(n) { return Math.round(n * 10) / 10; }
