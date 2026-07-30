#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const baseUrl = process.env.PROTOTYPE_URL || 'http://localhost:5173';

const page15 = {
  doc_code: 'Lecture_material_ms2044ey_k6uor3',
  doc_title: 'Foundation · Transformer & attention',
  page: 15,
  heading: 'Self-attention và công thức Q–K–V',
  selected_text: [
    'Mỗi từ (token) được biểu diễn trong không gian toán học để tự nó nhìn được những từ khác, tự đánh giá similarity score.',
    'Công thức Q, K, V với hàm softmax: Q là query, K là key, V là value.'
  ].join(' '),
  source_codes: ['T06-130']
};

const page18 = {
  doc_code: 'Lecture_material_ms2044ey_k6uor3',
  doc_title: 'Foundation · Transformer & attention',
  page: 18,
  heading: 'Token và cơ chế dự đoán next token',
  selected_text: 'LLM không đọc ký tự, cũng không đọc word by word — nó đọc token. Một từ có thể tách thành nhiều token.',
  source_codes: ['T06-134', 'T06-135']
};

const scenarios = [
  {
    id: 'SIM01',
    persona: 'Người học trả lời đủ ý',
    task: 'Giải thích vì sao self-attention không quên đoạn đầu.',
    question: 'Trong một câu, hãy giải thích vì sao self-attention giúp mô hình không quên đoạn đầu của một văn bản dài.',
    context: page15,
    rubric: {
      key_points: ['mỗi token nhìn tất cả token khác', 'song song / cùng lúc', 'similarity score hoặc Q–K–V'],
      misconceptions: ['attention xử lý tuần tự', 'attention chỉ nhìn token gần', 'attention là bộ nhớ']
    },
    student_answer: 'Mỗi token nhìn tất cả token khác cùng lúc và dùng similarity score Q K V để xác định quan hệ.',
    expected_state: 'understood'
  },
  {
    id: 'SIM02',
    persona: 'Người học mới nắm một phần',
    task: 'Trả lời đúng nhưng thiếu cơ chế quan hệ token.',
    question: 'Trong một câu, hãy giải thích vì sao self-attention giúp mô hình không quên đoạn đầu của một văn bản dài.',
    context: page15,
    rubric: {
      key_points: ['mỗi token nhìn tất cả token khác', 'song song / cùng lúc', 'similarity score hoặc Q–K–V'],
      misconceptions: ['attention xử lý tuần tự', 'attention chỉ nhìn token gần', 'attention là bộ nhớ']
    },
    student_answer: 'Vì self-attention xử lý các token song song nên mô hình đọc nhanh hơn.',
    expected_state: 'partial'
  },
  {
    id: 'SIM03',
    persona: 'Người học dùng đúng thuật ngữ nhưng sai quan hệ',
    task: 'Kiểm tra hệ thống có bị từ khóa self-attention đánh lừa không.',
    question: 'Trong một câu, hãy giải thích vì sao self-attention giúp mô hình không quên đoạn đầu của một văn bản dài.',
    context: page15,
    rubric: {
      key_points: ['mỗi token nhìn tất cả token khác', 'song song / cùng lúc', 'similarity score hoặc Q–K–V'],
      misconceptions: ['attention xử lý tuần tự', 'attention chỉ nhìn token gần', 'attention là bộ nhớ']
    },
    student_answer: 'Self-attention đọc tuần tự từ trái sang phải rồi lưu các token đã đọc trong bộ nhớ.',
    expected_state: 'misconception'
  },
  {
    id: 'SIM04',
    persona: 'Người học trả lời mơ hồ',
    task: 'Kiểm tra hệ thống hỏi lại thay vì đoán mức hiểu.',
    question: 'Trong một câu, hãy giải thích vì sao self-attention giúp mô hình không quên đoạn đầu của một văn bản dài.',
    context: page15,
    rubric: {
      key_points: ['mỗi token nhìn tất cả token khác', 'song song / cùng lúc', 'similarity score hoặc Q–K–V'],
      misconceptions: ['attention xử lý tuần tự', 'attention chỉ nhìn token gần', 'attention là bộ nhớ']
    },
    student_answer: 'Em hiểu rồi ạ.',
    expected_state: 'insufficient'
  },
  {
    id: 'SIM05',
    persona: 'Người học hiểu sai về token',
    task: 'Kiểm tra một misconception ở domain khác trang 18.',
    question: 'Phát biểu một từ tương ứng một token đúng hay sai, và vì sao?',
    context: page18,
    rubric: {
      key_points: ['kết luận sai', 'một từ có thể thành nhiều token', 'ví dụ tiếng Việt hoặc Hello World'],
      misconceptions: ['một từ luôn bằng một token', 'LLM đọc từng ký tự']
    },
    student_answer: 'Đúng, mỗi từ luôn tương ứng chính xác một token nên mô hình đọc word by word.',
    expected_state: 'misconception'
  }
];

const health = await fetch(`${baseUrl}/api/health`).then(async (r) => {
  if (!r.ok) throw new Error(`Health HTTP ${r.status}`);
  return r.json();
});
if (health.mode !== 'live') throw new Error(`Prototype không live: ${JSON.stringify(health)}`);

const results = [];
for (const scenario of scenarios) {
  const started = Date.now();
  const response = await fetch(`${baseUrl}/api/classify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      context: scenario.context,
      question: scenario.question,
      rubric: scenario.rubric,
      student_answer: scenario.student_answer
    })
  });
  const payload = await response.json();
  const actual = payload?.verdict?.mastery_state || null;
  results.push({
    ...scenario,
    http_status: response.status,
    model: payload.model || health.model,
    latency_ms: payload.latency_ms ?? (Date.now() - started),
    actual_state: actual,
    pass: response.ok && actual === scenario.expected_state,
    output: payload
  });
}

const runAt = new Date().toISOString();
const passed = results.filter((r) => r.pass).length;
const artifact = {
  artifact: 'CP5 simulated technical pilot — NOT human validation',
  disclaimer: 'Năm scenario/persona là mô phỏng có chủ đích. Không có tên người thật, quan sát hành vi hay quote người dùng; không được dùng để thay yêu cầu ≥5 người ngoài nhóm.',
  run_at: runAt,
  prototype_url: baseUrl,
  provider_state: health,
  summary: {
    total: results.length,
    passed,
    failed: results.length - passed,
    live_calls: results.filter((r) => r.http_status === 200).length
  },
  results
};

const stamp = runAt.replace(/[:.]/g, '-');
const outDir = join(ROOT, 'validation', 'simulated-runs');
await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, `simulated-pilot-${stamp}.json`), JSON.stringify(artifact, null, 2) + '\n');
await writeFile(join(outDir, `simulated-pilot-${stamp}.md`), renderMarkdown(artifact));

console.log(`SIMULATED PILOT: ${passed}/${results.length} đạt; ${artifact.summary.live_calls} live calls`);
console.log(`validation/simulated-runs/simulated-pilot-${stamp}.md`);
if (passed !== results.length) process.exitCode = 1;

function renderMarkdown(run) {
  const rows = run.results.map((r) =>
    `| ${r.id} | ${r.persona} | ${r.expected_state} | ${r.actual_state || r.output?.error || 'n/a'} | ${r.latency_ms} ms | ${r.pass ? 'Đạt' : 'Chưa đạt'} |`
  ).join('\n');
  return `# CP5 simulated technical pilot\n\n` +
    `> **Không phải human validation.** ${run.disclaimer}\n\n` +
    `- Thời điểm: ${run.run_at}\n- Provider: ${run.provider_state.provider}\n` +
    `- Model: ${run.provider_state.model}\n- Kết quả: **${run.summary.passed}/${run.summary.total}**\n` +
    `- Lời gọi live HTTP 200: **${run.summary.live_calls}**\n\n` +
    `| Case | Persona mô phỏng | Chờ | Nhận | Latency | Kết quả |\n` +
    `|---|---|---|---|---:|---|\n${rows}\n\n` +
    `## Cách dùng bằng chứng này\n\n` +
    `Artifact chứng minh API live xử lý được năm kiểu input và giữ đúng state. ` +
    `Artifact không chứng minh khả năng sử dụng, mức tin hay nhu cầu của người thật.\n`;
}
