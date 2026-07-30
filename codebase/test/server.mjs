import assert from 'node:assert/strict';

process.env.AI_PROVIDER = 'openai';
process.env.OPENAI_API_KEY = 'TEST-ONLY-NOT-A-REAL-KEY';
delete process.env.OPENAI_MODEL;

const serverModule = await import('../server.mjs?test=openai');

const state = serverModule.providerState();
assert.equal(state.mode, 'live');
assert.equal(state.provider, 'openai');
assert.equal(state.model, 'gpt-5.6-terra');
assert.deepEqual(state.live_steps, ['question_generate', 'mastery_classify']);

const fixture = {
  id: 'resp_test',
  model: 'gpt-5.6-terra',
  output: [
    {
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'output_text',
          text: JSON.stringify({
            mastery_state: 'understood',
            evidence_from_student: 'các token nhìn nhau song song',
            gap: null,
            feedback: 'Bạn đã nêu đúng quan hệ cốt lõi.',
            reinforce: null,
            confidence: 'high',
            next_action: 'continue',
            reason: 'matched_all_key_points'
          })
        }
      ]
    }
  ]
};

const parsed = serverModule.parseOpenAIResponse(fixture);
assert.equal(parsed.model, 'gpt-5.6-terra');
assert.equal(parsed.data.mastery_state, 'understood');

assert.throws(
  () => serverModule.parseOpenAIResponse({ output: [{ type: 'refusal', refusal: 'blocked' }] }),
  /refusal/i
);

console.log('Server tests: 8 assertions passed.');
