import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pageContextSource = readFileSync(new URL('../engine/page-context.js', import.meta.url), 'utf8');
const aiClientSource = readFileSync(new URL('../engine/ai-client.js', import.meta.url), 'utf8');
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
  new Function('window', pageContextSource)(window);
  new Function('window', aiClientSource)(window);
  return window.AiClient;
}

// 1. Health unavailable when network is down.
const unavailable = loadWithFetch(async () => {
  throw new Error('network down');
});
const mode = await unavailable.probe();
assert.equal(mode.mode, 'unavailable');
assert.match(mode.reason, /server AI/i);

const pageContext = window.PageContext.freeze({
  documentCode: 'day02',
  documentTitle: 'Xác định bài toán AI',
  pageNumber: 6,
  pageCount: 29,
  text: 'Discover mở rộng để khảo sát vấn đề; Define thu hẹp để xác định bài toán gốc.',
  imageDataUrl: 'data:image/jpeg;base64,AAAA',
  imageBytes: 3,
  width: 1200,
  height: 675
});
const context = {
  docCode: 'day02',
  docTitle: 'Xác định bài toán AI',
  selectedPage: 6,
  heading: 'Double Diamond',
  selectedText: pageContext.text,
  sourceCodes: [pageContext.sourceId],
  pageContext
};

// 2. All three live steps send the same immutable multimodal page snapshot.
const calls = [];
const live = loadWithFetch(async (url, options = {}) => {
  calls.push({ url, options });
  if (url === 'api/health') {
    return response(200, {
      mode: 'live',
      provider: 'gemini',
      model: 'test-gemini-model',
      live_steps: ['tutor_answer', 'question_generate', 'mastery_classify']
    });
  }
  if (url === 'api/tutor') {
    return response(200, {
      answer: 'Discover mở rộng, còn Define thu hẹp phạm vi vấn đề.',
      citations: ['day02:page-6'],
      model: 'test-gemini-model',
      latency_ms: 12
    });
  }
  if (url === 'api/question') {
    return response(200, {
      question: 'Discover và Define khác nhau thế nào?',
      model: 'test-gemini-model',
      latency_ms: 15
    });
  }
  if (url === 'api/classify') {
    return response(200, {
      verdict: {
        mastery_state: 'understood',
        evidence_from_student: 'Discover mở rộng, Define thu hẹp',
        gap: null,
        feedback: 'Bạn đã nêu đúng mối quan hệ.',
        reinforce: null,
        confidence: 'high',
        next_action: 'continue',
        reason: 'matched_all_key_points'
      },
      model: 'test-gemini-model',
      latency_ms: 20
    });
  }
  return response(429, { code: 'rate_limit', error: 'Dịch vụ AI đang bận. Vui lòng thử lại.' });
});

const liveMode = await live.probe();
assert.equal(liveMode.provider, 'gemini');

const tutor = await live.answerTutor({
  question: 'Hai bước này khác nhau thế nào?',
  context
});
assert.deepEqual(tutor.citations, ['day02:page-6']);

const generated = await live.generateQuestion(context);
assert.match(generated.question, /Discover/);

const verdict = await live.classify({
  context,
  question: generated,
  answer: 'Discover mở rộng, Define thu hẹp.'
});
assert.equal(verdict.mastery_state, 'understood');

const aiCalls = calls.filter((call) => call.url !== 'api/health');
assert.deepEqual(aiCalls.map((call) => call.url), [
  'api/tutor',
  'api/question',
  'api/classify'
]);

for (const call of aiCalls) {
  const body = JSON.parse(call.options.body);
  assert.deepEqual(body.page_context, {
    document_code: 'day02',
    document_title: 'Xác định bài toán AI',
    page: 6,
    page_count: 29,
    source_id: 'day02:page-6',
    text: pageContext.text,
    image_data_url: 'data:image/jpeg;base64,AAAA',
    image_bytes: 3,
    width: 1200,
    height: 675
  });
  assert.equal('context' in body, false);
}

// Traces keep metadata but never the base64 image payload.
assert.equal(traces.filter((trace) => trace.step.includes('fallback')).length, 0);
const serializedTraces = JSON.stringify(traces);
assert.doesNotMatch(serializedTraces, /image_data_url/i);
assert.doesNotMatch(serializedTraces, /base64,AAAA/i);
assert.match(serializedTraces, /day02:page-6/);

console.log('AiClient tests: assertions passed.');
