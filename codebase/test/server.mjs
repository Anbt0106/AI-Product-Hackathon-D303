import assert from 'node:assert/strict';

process.env.AI_PROVIDER = 'gemini';
process.env.GEMINI_API_KEY = 'TEST-ONLY-NOT-A-REAL-KEY';
delete process.env.GEMINI_MODEL;

const serverModule = await import('../server.mjs?test=gemini-multimodal');

const state = serverModule.providerState();
assert.equal(serverModule.MIME['.mjs'], 'text/javascript; charset=utf-8');
assert.equal(state.mode, 'live');
assert.equal(state.provider, 'gemini');
assert.equal(state.model, 'gemini-3.5-flash-lite');
assert.deepEqual(state.live_steps, [
  'tutor_answer',
  'question_generate',
  'mastery_classify'
]);
assert.equal(
  serverModule.resolveProviderState({
    provider: 'openai',
    geminiKey: 'configured-but-not-for-openai',
    geminiModel: 'gemini-test'
  }).mode,
  'unavailable'
);

const rawPageContext = {
  document_code: 'day02',
  document_title: 'Xác định bài toán AI',
  page: 6,
  page_count: 29,
  source_id: 'day02:page-6',
  text: 'Discover mở rộng; Define thu hẹp.',
  image_data_url: 'data:image/jpeg;base64,AAAA',
  image_bytes: 3,
  width: 1200,
  height: 675
};

const pageContext = serverModule.validatePageContext(rawPageContext);
assert.equal(pageContext.source_id, 'day02:page-6');
assert.equal(pageContext.image_mime_type, 'image/jpeg');
assert.equal(pageContext.image_base64, 'AAAA');

assert.deepEqual(
  serverModule.buildGeminiParts(pageContext, 'Hãy giải thích trang này.'),
  [
    { inlineData: { mimeType: 'image/jpeg', data: 'AAAA' } },
    { text: 'Hãy giải thích trang này.' }
  ]
);

assert.throws(
  () => serverModule.validatePageContext({ ...rawPageContext, source_id: 'day02:page-7' }),
  /source_id/i
);
assert.throws(
  () => serverModule.validatePageContext({ ...rawPageContext, image_data_url: 'data:text/plain;base64,AAAA' }),
  /ảnh trang/i
);

assert.deepEqual(
  serverModule.validateTutorAnswer(
    {
      answer: 'Discover mở rộng còn Define thu hẹp.',
      citations: ['day02:page-6']
    },
    ['day02:page-6']
  ),
  {
    answer: 'Discover mở rộng còn Define thu hẹp.',
    citations: ['day02:page-6']
  }
);

assert.throws(
  () => serverModule.validateTutorAnswer(
    { answer: 'Nội dung ngoài nguồn.', citations: ['UNKNOWN'] },
    ['day02:page-6']
  ),
  /citation không thuộc ngữ cảnh/i
);

assert.throws(
  () => serverModule.validateTutorAnswer(
    { answer: 'Không có nguồn.', citations: [] },
    ['day02:page-6']
  ),
  /ít nhất một citation/i
);

assert.deepEqual(
  serverModule.toPublicApiError(Object.assign(new Error('gemini 429: busy'), { statusCode: 429 })),
  { status: 429, code: 'rate_limit', message: 'Dịch vụ AI đang bận. Vui lòng thử lại.' }
);
assert.deepEqual(
  serverModule.toPublicApiError(Object.assign(new Error('body quá lớn'), { statusCode: 413 })),
  { status: 413, code: 'payload_too_large', message: 'Ảnh trang quá lớn để gửi tới AI.' }
);

assert.deepEqual(
  serverModule.toPublicApiError(new Error('x-goog-api-key SECRET-VALUE')),
  { status: 502, code: 'invalid_response', message: 'AI trả về kết quả không hợp lệ. Vui lòng thử lại.' }
);

// Keep the OpenAI parser regression-covered while Gemini is the configured provider.
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

await assert.rejects(
  serverModule.fetchWithTimeout(
    'https://example.invalid',
    {},
    5,
    (_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        reject(error);
      });
    })
  ),
  (error) => error?.name === 'AbortError'
);

await new Promise((resolve) => serverModule.server.listen(0, '127.0.0.1', resolve));
try {
  const address = serverModule.server.address();
  const oversizedResponse = await fetch(`http://127.0.0.1:${address.port}/api/tutor`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: 'x'.repeat(6 * 1024 * 1024 + 1)
  });
  assert.equal(oversizedResponse.status, 413);
  assert.deepEqual(await oversizedResponse.json(), {
    error: 'Ảnh trang quá lớn để gửi tới AI.',
    code: 'payload_too_large'
  });
} finally {
  await new Promise((resolve, reject) => {
    serverModule.server.close((error) => error ? reject(error) : resolve());
  });
}

console.log('Server tests: assertions passed.');
