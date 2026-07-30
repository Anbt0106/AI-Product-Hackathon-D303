import assert from 'node:assert/strict';

process.env.AI_PROVIDER = 'openai';
process.env.OPENAI_API_KEY = 'TEST-ONLY-NOT-A-REAL-KEY';
delete process.env.OPENAI_MODEL;

const serverModule = await import('../server.mjs?test=openai');

const state = serverModule.providerState();
assert.equal(state.mode, 'live');
assert.equal(state.provider, 'openai');
assert.equal(state.model, 'gpt-5.6-terra');
assert.deepEqual(state.live_steps, [
  'tutor_answer',
  'question_generate',
  'mastery_classify'
]);

assert.deepEqual(
  serverModule.validateTutorAnswer(
    { answer: 'Self-attention cho mỗi token đối chiếu với các token khác.', citations: ['T06-130'] },
    ['T06-130', 'T06-132']
  ),
  { answer: 'Self-attention cho mỗi token đối chiếu với các token khác.', citations: ['T06-130'] }
);

assert.throws(
  () => serverModule.validateTutorAnswer(
    { answer: 'Nội dung ngoài nguồn.', citations: ['UNKNOWN'] },
    ['T06-130']
  ),
  /citation không thuộc ngữ cảnh/i
);

assert.throws(
  () => serverModule.validateTutorAnswer(
    { answer: 'Không có nguồn.', citations: [] },
    ['T06-130']
  ),
  /ít nhất một citation/i
);

assert.deepEqual(
  serverModule.toPublicApiError(Object.assign(new Error('openai 429: busy'), { statusCode: 429 })),
  { status: 429, code: 'rate_limit', message: 'Dịch vụ AI đang bận. Vui lòng thử lại.' }
);

assert.deepEqual(
  serverModule.toPublicApiError(new Error('authorization Bearer SECRET-VALUE')),
  { status: 502, code: 'invalid_response', message: 'AI trả về kết quả không hợp lệ. Vui lòng thử lại.' }
);

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
