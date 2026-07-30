/* ============================================================================
 * engine/trace.js — Trace Logger
 * ----------------------------------------------------------------------------
 * Ghi lại từng bước của một vòng Micro-Check để làm bằng chứng cho eval (R4)
 * và cho mục "≥1 lời gọi AI thật có log/trace trong repo" (R5).
 *
 * Luật: KHÔNG ghi API key, KHÔNG ghi dữ liệu cá nhân. Chỉ ghi mã tài liệu,
 * số trang, mã đoạn, input/output có cấu trúc, model và thời gian.
 * ========================================================================== */

window.Trace = (function () {
  var entries = [];
  var listeners = [];
  var seq = 0;

  /** Loại bỏ các khoá có nguy cơ chứa secret trước khi ghi. */
  function scrub(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(scrub);
    var out = {};
    Object.keys(obj).forEach(function (k) {
      if (/key|token|secret|authorization|password/i.test(k)) {
        out[k] = '[redacted]';
      } else {
        out[k] = scrub(obj[k]);
      }
    });
    return out;
  }

  function add(step, payload) {
    seq += 1;
    var entry = {
      seq: seq,
      step: step,
      at: new Date().toISOString(),
      mode: payload.mode || 'mock',
      model: payload.model || null,
      latency_ms: typeof payload.latency_ms === 'number' ? payload.latency_ms : null,
      context: scrub(payload.context || null),
      input: scrub(payload.input || null),
      output: scrub(payload.output || null)
    };
    entries.push(entry);
    listeners.forEach(function (fn) { fn(entries); });
    return entry;
  }

  function all() { return entries.slice(); }
  function count() { return entries.length; }
  function onChange(fn) { listeners.push(fn); }

  function reset() {
    entries = [];
    seq = 0;
    listeners.forEach(function (fn) { fn(entries); });
  }

  /** Xuất file JSON để bỏ vào eval/traces/ khi chạy golden set. */
  function download() {
    var doc = {
      product: 'VLearn Hieu Dung Hieu That',
      checkpoint: entries.some(function (e) { return e.mode === 'live'; }) ? 'CP3' : 'CP2',
      exported_at: new Date().toISOString(),
      entry_count: entries.length,
      entries: entries
    };
    var blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'trace-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return { add: add, all: all, count: count, onChange: onChange, reset: reset, download: download };
})();
