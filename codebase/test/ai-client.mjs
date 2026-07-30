import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../engine/ai-client.js', import.meta.url), 'utf8');
const traces = [];
const window = {
  Trace: { add: (step, data) => traces.push({ step, ...data }) }
};
globalThis.location = { protocol: 'http:' };
globalThis.window = window;

function response(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body)
  };
}

function loadWithFetch(fakeFetch) {
  globalThis.fetch = fakeFetch;
  traces.length = 0;
  new Function('window', source)(window);
  return window.AiClient;
}

// 1. Health unavailable when network down
const unavailable = loadWithFetch(async () => {
  throw new Error('network down');
});
const mode = await unavailable.probe();
assert.equal(mode.mode, 'unavailable');
assert.match(mode.reason, /không kết nối/i);

// 2. Tutor live success & tracing
const calls = [];
const live = loadWithFetch(async (url, options = {}) => {
  calls.push({ url, options });
  if (url === 'api/health') {
    return response(200, {
      mode: 'live',
      provider: 'openai',
      model: 'test-model',
      live_steps: ['tutor_answer', 'question_generate', 'mastery_classify']
    });
  }
  if (url === 'api/tutor') {
    return response(200, {
      answer: 'Câu trả lời có nguồn.',
      citations: ['T06-130'],
      model: 'test-model',
      latency_ms: 12
    });
  }
  if (url === 'api/question') {
    return response(200, {
      question: 'Giải thích theo lời bạn?',
      model: 'test-model',
      latency_ms: 15
    });
  }
  if (url === 'api/classify') {
    return response(200, {
      verdict: {
        mastery_state: 'understood',
        evidence_from_student: 'test',
        gap: null,
        feedback: 'Good',
        reinforce: null,
        confidence: 'high',
        next_action: 'continue',
        reason: 'ok'
      },
      model: 'test-model',
      latency_ms: 20
    });
  }
  return response(429, { code: 'rate_limit', error: 'Dịch vụ AI đang bận. Vui lòng thử lại.' });
});

await live.probe();
const tutor = await live.answerTutor({
  question: 'Self-attention hoạt động thế nào?',
  context: {
    docCode: 'doc',
    docTitle: 'Day 1',
    selectedPage: 15,
    heading: 'Self-attention',
    selectedText: 'Nội dung',
    sourceCodes: ['T06-130']
  }
});
assert.equal(tutor.answer, 'Câu trả lời có nguồn.');
assert.deepEqual(tutor.citations, ['T06-130']);
assert.equal(traces.at(-1).step, 'tutor_answer');

// Verify no fallback trace exists in live calls
assert.equal(traces.filter(t => t.step.includes('fallback')).length, 0);

console.log('AiClient tests: assertions passed.');
