import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const window = {
  Trace: { add() {} },
  Mastery: { classifyMock() { return { mastery_state: 'fallback' }; } }
};
globalThis.window = window;
globalThis.location = { protocol: 'http:' };

let fetchImpl = async () => ({
  ok: true,
  json: async () => ({
    mode: 'live',
    provider: 'gemini',
    model: 'gemini-3.5-flash-lite',
    live_steps: ['mastery_classify'],
    reason: 'đã cấu hình key'
  })
});
globalThis.fetch = (...args) => fetchImpl(...args);

const source = readFileSync(new URL('../engine/ai-client.js', import.meta.url), 'utf8');
new Function('window', source)(window);

await window.AiClient.probe();
assert.equal(window.AiClient.getMode().mode, 'live');
assert.equal(window.AiClient.getMode().verified, false);

fetchImpl = async () => ({
  ok: true,
  json: async () => ({
    model: 'gemini-3.5-flash-lite',
    latency_ms: 100,
    verdict: { mastery_state: 'understood' }
  })
});
const args = {
  answer: 'đủ ý',
  question: { question: 'q', keyPoints: [], misconceptions: [] },
  context: {
    docCode: 'doc', docTitle: 'title', selectedPage: 1,
    heading: 'h', selectedText: 'text', sourceCodes: ['src']
  }
};
await window.AiClient.classify(args);
assert.equal(window.AiClient.getMode().verified, true);

fetchImpl = async () => { throw new Error('network down'); };
const fallback = await window.AiClient.classify(args);
assert.equal(fallback.mastery_state, 'fallback');
assert.equal(window.AiClient.getMode().verified, false);

console.log('ai-client mode: configured → verified → fallback, đạt');
