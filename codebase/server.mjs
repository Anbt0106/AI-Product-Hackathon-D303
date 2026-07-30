/* ============================================================================
 * server.mjs — server tĩnh + điểm nối AI cho CP3
 * ----------------------------------------------------------------------------
 * KHÔNG dependency. Chỉ dùng module có sẵn của Node (>=18, cần global fetch).
 *
 *   node server.mjs            → http://localhost:5173  (chế độ mock)
 *   AI_PROVIDER=openai OPENAI_API_KEY=... node server.mjs → AI thật
 *   AI_PROVIDER=anthropic ANTHROPIC_API_KEY=... node server.mjs → AI thật
 *   AI_PROVIDER=gemini GEMINI_API_KEY=... node server.mjs → AI thật
 *
 * Vì sao khoá nằm ở server: trang web không bao giờ được giữ API key
 * (02-guide.md §3.4). Không commit .env, không hardcode khoá vào file này.
 *
 * CP2: chưa set biến môi trường → /api/health trả mode "mock", front-end tự
 * chạy bản rule-based và ghi rõ vào trace là đang mock. Không có chỗ nào giả vờ
 * là AI thật.
 * ========================================================================== */

import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));

/**
 * Đọc codebase/.env không cần dependency. Biến đã đặt từ terminal luôn được
 * ưu tiên; file chỉ điền những biến còn thiếu. Không log giá trị secret.
 */
function loadLocalEnv(path) {
  if (!existsSync(path)) return;
  const lines = readFileSync(path, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i < 1) continue;
    const name = trimmed.slice(0, i).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || process.env[name] !== undefined) continue;
    let value = trimmed.slice(i + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[name] = value;
  }
}

loadLocalEnv(join(ROOT, '.env'));
const PORT = Number(process.env.PORT || 5173);
const HOST = process.env.HOST || '127.0.0.1';

/* ========================= cấu hình provider ========================= */

const PROVIDER = (process.env.AI_PROVIDER || '').toLowerCase();

const OPENAI = {
  key: process.env.OPENAI_API_KEY || '',
  // Terra cân bằng chất lượng/chi phí cho classifier ngắn; có thể đổi qua .env.
  model: process.env.OPENAI_MODEL || 'gpt-5.6-terra',
  url: 'https://api.openai.com/v1/responses'
};

const ANTHROPIC = {
  key: process.env.ANTHROPIC_API_KEY || '',
  model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
  url: 'https://api.anthropic.com/v1/messages',
  version: '2023-06-01'
};

const GEMINI = {
  key: process.env.GEMINI_API_KEY || '',
  // gemini-2.0-flash đã bị tắt từ 01/06/2026. Classifier cần độ trễ/chi phí
  // thấp hơn năng lực agentic, nên dùng bản Flash-Lite GA hiện hành.
  model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  base: 'https://generativelanguage.googleapis.com/v1beta/models'
};

export function providerState() {
  if (PROVIDER === 'openai' && OPENAI.key) {
    return {
      mode: 'live',
      provider: 'openai',
      model: OPENAI.model,
      live_steps: ['tutor_answer', 'question_generate', 'mastery_classify'],
      reason: 'đã cấu hình OPENAI_API_KEY'
    };
  }
  return {
    mode: 'unavailable',
    provider: null,
    model: null,
    live_steps: [],
    reason: PROVIDER
      ? `AI_PROVIDER=${PROVIDER} nhưng thiếu API key trong biến môi trường`
      : 'chưa set AI_PROVIDER'
  };
}

/* ========================= schema đầu ra ========================= */
/* Chốt đúng schema spec §7.3. Cả hai provider đều bị buộc trả JSON theo schema
 * này, nên eval ở CP3 chấm được mà không phải parse văn bản tự do.            */

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    mastery_state: { type: 'string', enum: ['understood', 'partial', 'misconception', 'insufficient'] },
    evidence_from_student: { type: 'string' },
    gap: { type: ['string', 'null'] },
    feedback: { type: 'string' },
    reinforce: { type: ['string', 'null'] },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    next_action: { type: 'string', enum: ['continue', 'reinforce', 'retry', 'clarify'] },
    reason: { type: 'string' }
  },
  required: ['mastery_state', 'evidence_from_student', 'gap', 'feedback', 'reinforce', 'confidence', 'next_action', 'reason'],
  additionalProperties: false
};

const QUESTION_SCHEMA = {
  type: 'object',
  properties: { question: { type: 'string' } },
  required: ['question'],
  additionalProperties: false
};

const TUTOR_SCHEMA = {
  type: 'object',
  properties: {
    answer: { type: 'string' },
    citations: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1
    }
  },
  required: ['answer', 'citations'],
  additionalProperties: false
};

const SYSTEM_TUTOR = [
  'Bạn là VLearn Tutor trả lời bằng tiếng Việt.',
  'Chỉ dùng các đoạn tài liệu được cấp; không thêm kiến thức ngoài.',
  'Trả lời ngắn gọn, dễ hiểu và trích ít nhất một source code đã được cấp.',
  'Không được tạo hoặc sửa source code.',
  'Nếu ngữ cảnh không đủ, nói rõ phần chưa đủ thay vì đoán.'
].join('\n');

export function validateTutorAnswer(value, allowedSourceCodes) {
  if (!value || typeof value.answer !== 'string' || !value.answer.trim()) {
    throw new Error('Tutor answer rỗng/không phải string');
  }
  if (!Array.isArray(value.citations) || value.citations.length === 0) {
    throw new Error('Tutor answer cần ít nhất một citation');
  }
  const allowed = new Set(allowedSourceCodes || []);
  const normalizedCitations = [];
  for (let citation of value.citations) {
    if (typeof citation === 'string') {
      citation = citation.replace(/^\[|\]$/g, '').trim();
    }
    if (!allowed.has(citation)) {
      throw new Error(`Tutor citation không thuộc ngữ cảnh: ${citation}`);
    }
    normalizedCitations.push(citation);
  }
  return { answer: value.answer.trim(), citations: [...new Set(normalizedCitations)] };
}

function tutorUserPrompt(body) {
  const c = body.context || {};
  const sources = (c.source_codes || c.sourceCodes || []).map((code) => `Mã nguồn: ${code}\nNội dung: ${c.selected_text || c.selectedText || ''}`).join('\n\n');
  return [
    `Mã tài liệu: ${c.doc_code || c.docCode || ''}`,
    `Trang: ${c.source_page || c.selectedPage || ''}`,
    `Tiêu đề: ${c.heading || ''}`,
    `Nguồn trích dẫn:\n${sources}`,
    '',
    `Câu hỏi của sinh viên: ${body.question}`,
    '',
    'Trả lời câu hỏi theo schema. Trong mảng citations, chỉ ghi mã nguồn hợp lệ (ví dụ: "T06-130").'
  ].join('\n');
}

/* ========================= prompt ========================= */

const SYSTEM_CLASSIFY = [
  'Bạn là bộ phân loại mức hiểu bài cho một tính năng học tập tiếng Việt.',
  '',
  'LUẬT CỨNG:',
  '1. Chỉ dùng thông tin trong ngữ cảnh được cấp. Không thêm kiến thức ngoài.',
  '2. Nếu câu trả lời quá ngắn, mơ hồ, hoặc chỉ tuyên bố "em hiểu rồi" mà không',
  '   có nội dung để đối chiếu, thì mastery_state = "insufficient". Không đoán.',
  '3. Nếu học viên dùng đúng thuật ngữ nhưng nêu sai quan hệ giữa các khái niệm,',
  '   thì mastery_state = "misconception". Tuyệt đối không gắn "understood".',
  '4. Dùng rubric được cấp: đủ mọi ý đúng = understood; có ít nhất một nhưng',
  '   chưa đủ = partial; không có ý đối chiếu được = insufficient.',
  '5. Chỉ gắn misconception khi học viên KHẲNG ĐỊNH một quan hệ sai; thiếu ý',
  '   không phải misconception. Không suy diễn quan hệ sai từ một câu đúng.',
  '6. Ánh xạ bắt buộc: understood→continue; partial/misconception→reinforce;',
  '   insufficient→clarify. gap phải null khi understood hoặc insufficient.',
  '7. gap chỉ nêu ĐÚNG MỘT lỗ hổng quan trọng nhất, viết cụ thể, không phán xét.',
  '8. evidence_from_student phải trích lại chữ của học viên, không diễn giải thêm.',
  '9. feedback tối đa 2 câu, nêu phần đúng trước rồi mới nêu chỗ lệch.',
  '10. Không cho điểm số. Không dùng giọng phê bình.'
].join('\n');

const SYSTEM_QUESTION = [
  'Bạn sinh ĐÚNG MỘT câu hỏi teach-back tiếng Việt cho học viên vừa được giải',
  'thích một khái niệm từ đoạn tài liệu được cấp.',
  '',
  'LUẬT CỨNG:',
  '1. Chỉ một câu hỏi, trả lời được trong một câu, dưới 30 giây.',
  '2. Hỏi vào QUAN HỆ giữa các khái niệm, không hỏi định nghĩa để học viên đọc lại.',
  '3. Chỉ dựa trên đoạn tài liệu được cấp. Không hỏi ngoài phạm vi.',
  '4. Không hỏi dạng trắc nghiệm, không hỏi nhiều ý trong một câu.'
].join('\n');

function classifyUserPrompt(body) {
  const c = body.context || {};
  return [
    `Mã tài liệu: ${c.doc_code}`,
    `Trang: ${c.page}`,
    `Tiêu đề: ${c.heading || ''}`,
    `Đoạn học viên đang đọc: ${c.selected_text || ''}`,
    '',
    `Câu hỏi kiểm tra: ${body.question}`,
    `Các ý đúng cần tìm: ${(body.rubric?.key_points || []).join(' | ')}`,
    `Các quan hệ sai đã biết: ${(body.rubric?.misconceptions || []).join(' | ')}`,
    `Câu trả lời của học viên: ${body.student_answer}`,
    '',
    'Phân loại mức hiểu theo schema và rubric. Chấp nhận diễn đạt tương đương, không chỉ khớp từ khoá.'
  ].join('\n');
}

function questionUserPrompt(body) {
  const c = body.context || {};
  return [
    `Mã tài liệu: ${c.doc_code}`,
    `Trang: ${c.page}`,
    `Tiêu đề: ${c.heading || ''}`,
    `Đoạn tài liệu: ${c.selected_text || ''}`,
    '',
    'Sinh đúng một câu hỏi teach-back theo schema.'
  ].join('\n');
}

/* ========================= gọi provider ========================= */

async function callAnthropic({ system, user, schema }) {
  const payload = {
    model: ANTHROPIC.model,
    max_tokens: 1200,
    system,
    messages: [{ role: 'user', content: user }],
    output_config: {
      effort: 'low',
      format: { type: 'json_schema', schema }
    }
  };

  const res = await fetch(ANTHROPIC.url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC.key,
      'anthropic-version': ANTHROPIC.version
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error(`anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);

  const j = await res.json();

  // Luôn kiểm stop_reason trước khi đọc content.
  if (j.stop_reason === 'refusal') {
    throw new Error('anthropic refusal: ' + JSON.stringify(j.stop_details || {}));
  }
  const textBlock = (j.content || []).find((b) => b.type === 'text');
  if (!textBlock) throw new Error('anthropic: không có text block trong response');

  return { data: JSON.parse(textBlock.text), model: j.model };
}

async function callGemini({ system, user, schema }) {
  /* Shape đã đối chiếu tài liệu Google AI for Developers ngày 30/07/2026.
   * Chỉ gửi data giả/trích ngắn trong prototype, không gửi dữ liệu định danh. */
  const url = `${GEMINI.base}/${GEMINI.model}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': GEMINI.key
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseJsonSchema: schema
      }
    })
  });
  if (!res.ok) throw new Error(`gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const j = await res.json();
  const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('gemini: response rỗng');
  return { data: JSON.parse(text), model: GEMINI.model };
}

/**
 * Tách structured output khỏi Responses API. Không tin output cho tới khi JSON
 * được parse và validator nghiệp vụ kiểm tra ở tầng gọi phía trên.
 */
export function parseOpenAIResponse(response) {
  const output = Array.isArray(response?.output) ? response.output : [];
  for (const item of output) {
    if (item?.type === 'refusal' || item?.refusal) {
      throw new Error(`openai refusal: ${item.refusal || 'request refused'}`);
    }
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (part?.type === 'refusal' || part?.refusal) {
        throw new Error(`openai refusal: ${part.refusal || 'request refused'}`);
      }
      if (part?.type === 'output_text' && typeof part.text === 'string') {
        return { data: JSON.parse(part.text), model: response.model || OPENAI.model };
      }
    }
  }
  if (typeof response?.output_text === 'string' && response.output_text.trim()) {
    return { data: JSON.parse(response.output_text), model: response.model || OPENAI.model };
  }
  throw new Error('openai: response không có structured output');
}

async function callOpenAI({ system, user, schema }) {
  const schemaName = schema === TUTOR_SCHEMA ? 'tutor_answer' : schema === QUESTION_SCHEMA ? 'micro_check_question' : 'mastery_verdict';
  const res = await fetch(OPENAI.url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${OPENAI.key}`
    },
    body: JSON.stringify({
      model: OPENAI.model,
      instructions: system,
      input: user,
      reasoning: { effort: 'low' },
      text: {
        verbosity: 'low',
        format: {
          type: 'json_schema',
          name: schemaName,
          strict: true,
          schema
        }
      },
      store: false
    })
  });
  if (!res.ok) throw new Error(`openai ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return parseOpenAIResponse(await res.json());
}

async function callProvider(args) {
  const st = providerState();
  if (st.mode !== 'live') {
    const err = new Error(st.reason);
    err.statusCode = 503;
    throw err;
  }
  if (st.provider === 'openai') return callOpenAI(args);
  return st.provider === 'anthropic' ? callAnthropic(args) : callGemini(args);
}

const STATE_ACTION = {
  understood: 'continue',
  partial: 'reinforce',
  misconception: 'reinforce',
  insufficient: 'clarify'
};

/** Kiểm schema và bất biến nghiệp vụ trước khi đưa phán quyết AI lên UI. */
export function validateVerdict(verdict) {
  if (!verdict || typeof verdict !== 'object' || Array.isArray(verdict)) {
    throw new Error('AI verdict không phải object');
  }
  const allowed = Object.keys(VERDICT_SCHEMA.properties);
  const extra = Object.keys(verdict).filter((k) => !allowed.includes(k));
  if (extra.length) throw new Error(`AI verdict có field ngoài schema: ${extra.join(', ')}`);

  for (const key of VERDICT_SCHEMA.required) {
    if (!(key in verdict)) throw new Error(`AI verdict thiếu field bắt buộc: ${key}`);
  }
  if (!(verdict.mastery_state in STATE_ACTION)) {
    throw new Error(`AI verdict có mastery_state không hợp lệ: ${verdict.mastery_state}`);
  }
  if (!['high', 'medium', 'low'].includes(verdict.confidence)) {
    throw new Error(`AI verdict có confidence không hợp lệ: ${verdict.confidence}`);
  }
  if (verdict.next_action !== STATE_ACTION[verdict.mastery_state]) {
    throw new Error(`AI verdict vi phạm bất biến: ${verdict.mastery_state} phải đi với ${STATE_ACTION[verdict.mastery_state]}`);
  }
  for (const key of ['evidence_from_student', 'feedback', 'reason']) {
    if (typeof verdict[key] !== 'string' || !verdict[key].trim()) {
      throw new Error(`AI verdict có ${key} rỗng/không phải string`);
    }
  }
  if (verdict.gap !== null && typeof verdict.gap !== 'string') {
    throw new Error('AI verdict có gap không hợp lệ');
  }
  if (verdict.mastery_state === 'understood' && verdict.gap !== null) {
    throw new Error('AI verdict understood nhưng vẫn có gap');
  }
  return verdict;
}

export async function tutorWithProvider(body) {
  const sourceCodes = body?.context?.source_codes || body?.context?.sourceCodes || [];
  const selectedText = body?.context?.selected_text || body?.context?.selectedText || '';
  if (!sourceCodes.length || !selectedText.trim()) {
    const error = new Error('Cần chọn nguồn trước khi hỏi Tutor');
    error.statusCode = 400;
    throw error;
  }
  const t0 = Date.now();
  const result = await callProvider({
    system: SYSTEM_TUTOR,
    user: tutorUserPrompt(body),
    schema: TUTOR_SCHEMA
  });
  return {
    ...validateTutorAnswer(result.data, sourceCodes),
    model: result.model,
    latency_ms: Date.now() - t0
  };
}

export function toPublicApiError(error) {
  const rawStatus = Number(error?.statusCode || 0);
  const message = String(error?.message || '');
  if (rawStatus === 400) {
    return { status: 400, code: 'invalid_request', message: 'Dữ liệu gửi lên chưa hợp lệ.' };
  }
  if (rawStatus === 401 || rawStatus === 403 || /\b(401|403)\b/.test(message)) {
    return { status: 503, code: 'ai_not_configured', message: 'Cấu hình AI chưa hợp lệ.' };
  }
  if (rawStatus === 429 || /\b429\b/.test(message)) {
    return { status: 429, code: 'rate_limit', message: 'Dịch vụ AI đang bận. Vui lòng thử lại.' };
  }
  if (error?.name === 'AbortError' || /timeout/i.test(message)) {
    return { status: 504, code: 'timeout', message: 'AI phản hồi quá lâu. Vui lòng thử lại.' };
  }
  return {
    status: 502,
    code: 'invalid_response',
    message: 'AI trả về kết quả không hợp lệ. Vui lòng thử lại.'
  };
}

export async function classifyWithProvider(body) {
  const t0 = Date.now();
  const r = await callProvider({
    system: SYSTEM_CLASSIFY,
    user: classifyUserPrompt(body),
    schema: VERDICT_SCHEMA
  });
  return {
    verdict: validateVerdict(r.data),
    model: r.model,
    latency_ms: Date.now() - t0
  };
}

/* ========================= HTTP ========================= */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(body) });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > 1e6) { reject(new Error('body quá lớn')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

async function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  // Chặn path traversal: chuẩn hoá rồi bắt buộc nằm trong ROOT.
  const target = normalize(join(ROOT, rel));
  if (target !== ROOT && !target.startsWith(ROOT + sep)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  try {
    const s = await stat(target);
    if (s.isDirectory()) { res.writeHead(403).end('forbidden'); return; }
    const buf = await readFile(target);
    res.writeHead(200, {
      'content-type': MIME[extname(target).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store'
    });
    res.end(buf);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('not found');
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const p = url.pathname;

  if (p === '/api/health') return sendJson(res, 200, providerState());

  if (p === '/api/tutor' || p === '/api/question' || p === '/api/classify') {
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'chỉ nhận POST' });
    let body;
    try { body = await readBody(req); }
    catch (e) { return sendJson(res, 400, { error: 'body không phải JSON: ' + e.message }); }

    const t0 = Date.now();
    try {
      if (p === '/api/tutor') {
        const r = await tutorWithProvider(body);
        return sendJson(res, 200, r);
      }
      if (p === '/api/question') {
        const r = await callProvider({
          system: SYSTEM_QUESTION,
          user: questionUserPrompt(body),
          schema: QUESTION_SCHEMA
        });
        return sendJson(res, 200, { question: r.data.question, model: r.model, latency_ms: Date.now() - t0 });
      }
      const r = await classifyWithProvider(body);
      return sendJson(res, 200, r);
    } catch (e) {
      const publicError = toPublicApiError(e);
      return sendJson(res, publicError.status, {
        error: publicError.message,
        code: publicError.code
      });
    }
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.writeHead(405).end('method not allowed');
  }
  return serveStatic(req, res, p);
});

// Import từ eval runner không được tự mở port; chỉ listen khi chạy trực tiếp.
const IS_MAIN = process.argv[1] &&
  normalize(fileURLToPath(import.meta.url)) === normalize(resolve(process.argv[1]));

if (IS_MAIN) {
  server.listen(PORT, HOST, () => {
    const st = providerState();
    console.log(`VLearn prototype → http://${HOST}:${PORT}`);
    console.log(`Chế độ AI: ${st.mode}${st.provider ? ' · ' + st.provider + ' · ' + st.model : ''} — ${st.reason}`);
  });
}
