/* ============================================================================
 * server.mjs — server tĩnh + điểm nối AI cho CP3
 * ----------------------------------------------------------------------------
 * KHÔNG dependency. Chỉ dùng module có sẵn của Node (>=18, cần global fetch).
 *
 *   node server.mjs            → http://localhost:5173  (chế độ mock)
 *   AI_PROVIDER=anthropic ANTHROPIC_API_KEY=... node server.mjs   → AI thật
 *   AI_PROVIDER=gemini    GEMINI_API_KEY=...    node server.mjs   → AI thật
 *
 * Vì sao khoá nằm ở server: trang web không bao giờ được giữ API key
 * (02-guide.md §3.4). Không commit .env, không hardcode khoá vào file này.
 *
 * CP2: chưa set biến môi trường → /api/health trả mode "mock", front-end tự
 * chạy bản rule-based và ghi rõ vào trace là đang mock. Không có chỗ nào giả vờ
 * là AI thật.
 * ========================================================================== */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 5173);

/* ========================= cấu hình provider ========================= */

const PROVIDER = (process.env.AI_PROVIDER || '').toLowerCase();

const ANTHROPIC = {
  key: process.env.ANTHROPIC_API_KEY || '',
  model: process.env.ANTHROPIC_MODEL || 'claude-opus-5',
  url: 'https://api.anthropic.com/v1/messages',
  version: '2023-06-01'
};

const GEMINI = {
  key: process.env.GEMINI_API_KEY || '',
  model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  base: 'https://generativelanguage.googleapis.com/v1beta/models'
};

function providerState() {
  if (PROVIDER === 'anthropic' && ANTHROPIC.key) {
    return { mode: 'live', provider: 'anthropic', model: ANTHROPIC.model, reason: 'đã cấu hình ANTHROPIC_API_KEY' };
  }
  if (PROVIDER === 'gemini' && GEMINI.key) {
    return { mode: 'live', provider: 'gemini', model: GEMINI.model, reason: 'đã cấu hình GEMINI_API_KEY' };
  }
  return {
    mode: 'mock',
    provider: null,
    model: null,
    reason: PROVIDER
      ? `AI_PROVIDER=${PROVIDER} nhưng thiếu API key trong biến môi trường`
      : 'chưa set AI_PROVIDER — đang chạy bản mock của CP2'
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
  required: ['mastery_state', 'evidence_from_student', 'gap', 'feedback', 'confidence', 'next_action', 'reason'],
  additionalProperties: false
};

const QUESTION_SCHEMA = {
  type: 'object',
  properties: { question: { type: 'string' } },
  required: ['question'],
  additionalProperties: false
};

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
  '4. gap chỉ nêu ĐÚNG MỘT lỗ hổng quan trọng nhất, viết cụ thể, không phán xét.',
  '5. evidence_from_student phải trích lại chữ của học viên, không diễn giải thêm.',
  '6. feedback tối đa 2 câu, nêu phần đúng trước rồi mới nêu chỗ lệch.',
  '7. Không cho điểm số. Không dùng giọng phê bình.'
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
    `Câu trả lời của học viên: ${body.student_answer}`,
    '',
    'Phân loại mức hiểu theo schema.'
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
    max_tokens: 4000,          // gồm cả thinking: Opus 5 bật thinking mặc định
    system,
    messages: [{ role: 'user', content: user }],
    output_config: {
      effort: 'low',           // classifier ngắn: ưu tiên độ trễ
      format: { type: 'json_schema', schema }
    },
    fallbacks: 'default'       // classifier bị từ chối thì vẫn có câu trả lời
  };

  let res = await fetch(ANTHROPIC.url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC.key,
      'anthropic-version': ANTHROPIC.version,
      'anthropic-beta': 'server-side-fallback-2026-07-01'
    },
    body: JSON.stringify(payload)
  });

  // Org chưa bật beta fallbacks thì bỏ tham số đó và gọi lại, đừng để vỡ demo.
  if (res.status === 400) {
    const t = await res.text();
    if (/fallback/i.test(t)) {
      delete payload.fallbacks;
      res = await fetch(ANTHROPIC.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': ANTHROPIC.key,
          'anthropic-version': ANTHROPIC.version
        },
        body: JSON.stringify(payload)
      });
    } else {
      throw new Error(`anthropic 400: ${t.slice(0, 300)}`);
    }
  }

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
  /* LƯU Ý CHO CP3: shape dưới đây theo generateContent của Google AI Studio.
   * Trước khi chốt, đối chiếu lại tài liệu AI Studio hiện hành — Google đổi tên
   * trường khá thường xuyên. Nhắc lại luật của khoá: free tier có thể dùng dữ
   * liệu để huấn luyện, nên chỉ gửi data giả hoặc data pack, không gửi dữ liệu
   * thật của người thật.
   */
  const url = `${GEMINI.base}/${GEMINI.model}:generateContent?key=${encodeURIComponent(GEMINI.key)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: toGeminiSchema(schema)
      }
    })
  });
  if (!res.ok) throw new Error(`gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const j = await res.json();
  const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('gemini: response rỗng');
  return { data: JSON.parse(text), model: GEMINI.model };
}

/** responseSchema của Gemini không nhận type dạng mảng — hạ ["string","null"] về "string". */
function toGeminiSchema(schema) {
  const clone = JSON.parse(JSON.stringify(schema));
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node.type)) node.type = node.type.find((t) => t !== 'null') || 'string';
    delete node.additionalProperties;
    if (node.properties) Object.values(node.properties).forEach(walk);
  };
  walk(clone);
  return clone;
}

async function callProvider(args) {
  const st = providerState();
  if (st.mode !== 'live') {
    const err = new Error(st.reason);
    err.statusCode = 503;
    throw err;
  }
  return st.provider === 'anthropic' ? callAnthropic(args) : callGemini(args);
}

/* ========================= HTTP ========================= */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
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

  if (p === '/api/question' || p === '/api/classify') {
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'chỉ nhận POST' });
    let body;
    try { body = await readBody(req); }
    catch (e) { return sendJson(res, 400, { error: 'body không phải JSON: ' + e.message }); }

    const t0 = Date.now();
    try {
      if (p === '/api/question') {
        const r = await callProvider({
          system: SYSTEM_QUESTION,
          user: questionUserPrompt(body),
          schema: QUESTION_SCHEMA
        });
        return sendJson(res, 200, { question: r.data.question, model: r.model, latency_ms: Date.now() - t0 });
      }
      const r = await callProvider({
        system: SYSTEM_CLASSIFY,
        user: classifyUserPrompt(body),
        schema: VERDICT_SCHEMA
      });
      return sendJson(res, 200, { verdict: r.data, model: r.model, latency_ms: Date.now() - t0 });
    } catch (e) {
      const code = e.statusCode || 502;
      // Trả lỗi rõ ràng để front-end ghi vào trace là đã fallback về mock.
      return sendJson(res, code, { error: String(e.message || e) });
    }
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.writeHead(405).end('method not allowed');
  }
  return serveStatic(req, res, p);
});

server.listen(PORT, () => {
  const st = providerState();
  console.log(`VLearn prototype → http://localhost:${PORT}`);
  console.log(`Chế độ AI: ${st.mode}${st.provider ? ' · ' + st.provider + ' · ' + st.model : ''} — ${st.reason}`);
});
