/* ============================================================================
 * engine/mastery.js — Mastery Classifier (spec §8.4) · QUYẾT ĐỊNH AI TRUNG TÂM
 * ----------------------------------------------------------------------------
 * Câu hỏi quyết định: dựa trên câu trả lời teach-back và nội dung slide, học
 * viên đang hiểu đúng, hiểu một phần, mắc misconception cụ thể, hay chưa cung
 * cấp đủ thông tin?
 *
 * CP2 — bản MOCK theo luật (rule-based), KHÔNG gọi AI. Mục đích không phải để
 * giả vờ có AI, mà để:
 *   1. chốt SCHEMA đầu ra trước khi nối AI (spec §7.3),
 *   2. có baseline xác định trên golden set — CP3 so kết quả AI thật với baseline
 *      này để biết AI thêm giá trị ở đâu,
 *   3. làm đường lui khi API lỗi giữa lúc demo.
 *
 * CP3 — AiClient.classify() gọi AI thật với đúng schema dưới đây.
 *
 * Thứ tự luật (quan trọng, đã cố tình đặt): mơ hồ → misconception → đủ ý →
 * một phần → không liên quan. Misconception phải được xét TRƯỚC khi đếm ý đúng,
 * vì học viên có thể dùng đúng thuật ngữ nhưng giải thích sai quan hệ — case này
 * tuyệt đối không được gắn "đã hiểu" (spec §11.3, quality bar cứng).
 * ========================================================================== */

window.Mastery = (function () {

  var VAGUE = [
    'em hiểu rồi', 'hiểu rồi', 'đã hiểu', 'biết rồi', 'ok', 'okie', 'oke',
    'vâng', 'dạ', 'ừ', 'như trên', 'thế thôi', 'vậy đó', 'không biết',
    'chưa biết', 'bó tay', 'chịu', 'không rõ', 'giống thầy nói',
    'như slide', 'đúng như trong slide'
  ];

  var MIN_CHARS = 15;          // dưới ngưỡng này coi là chưa đủ thông tin
  var MIN_TOPIC_OVERLAP = 3;   // số từ trùng nội dung trang tối thiểu

  /**
   * @param {object} args
   *   args.answer    {string}  câu trả lời teach-back của học viên
   *   args.question  {object}  output của QuestionGenerator
   *   args.context   {object}  output của SlideContext.build()
   *   args.gate      {object}  kết quả Grounding Gate (phải pass)
   * @returns {object} schema spec §7.3
   */
  function classifyMock(args) {
    var t0 = (window.performance && window.performance.now) ? window.performance.now() : 0;

    if (!args.gate || args.gate.status !== 'pass') {
      throw new Error('Mastery: không được phân loại khi Grounding Gate chưa pass');
    }

    var raw = String(args.answer || '');
    var norm = window.VText.normalize(raw);
    var q = args.question;
    var page = args.context.selectedPage;

    var result = decide(raw, norm, q, args.context);
    result.source_page = page;

    var t1 = (window.performance && window.performance.now) ? window.performance.now() : 0;

    if (window.Trace) {
      window.Trace.add('mastery_classify', {
        mode: 'mock',
        model: 'rule-based-baseline-v1',
        latency_ms: Math.round(t1 - t0),
        context: {
          doc_code: args.context.docCode,
          source_page: page,
          source_codes: args.context.sourceCodes,
          question: q.question
        },
        input: { student_answer: raw, answer_length: raw.length },
        output: result
      });
    }
    return result;
  }

  /* ---------------------------------------------------------------------- */

  function decide(raw, norm, q, context) {
    // ── Luật 1: mơ hồ / quá ngắn / tuyên bố suông ─────────────────────────
    var vagueHit = window.VText.firstMatch(norm, VAGUE);
    var isShort = norm.replace(/\s/g, '').length < MIN_CHARS;

    if (isShort || (vagueHit && norm.length < 40)) {
      return {
        mastery_state: 'insufficient',
        evidence_from_student: raw ? '"' + raw.trim() + '"' : '(chưa nhập gì)',
        gap: null,
        matched_key_points: [],
        matched_misconception: null,
        confidence: 'low',
        next_action: 'clarify',
        reason: isShort ? 'answer_too_short' : 'vague_claim'
      };
    }

    // ── Luật 2: misconception (xét TRƯỚC khi đếm ý đúng) ──────────────────
    var mis = matchMisconception(norm, q.misconceptions);
    if (mis) {
      return {
        mastery_state: 'misconception',
        evidence_from_student: quoteAround(raw, mis.matchedKeyword),
        gap: mis.gap,
        matched_key_points: matchKeyPoints(norm, q.keyPoints).map(function (k) { return k.id; }),
        matched_misconception: mis.id,
        reinforce: mis.reinforce,
        confidence: norm.length >= 40 ? 'high' : 'medium',
        next_action: 'reinforce',
        reason: 'misconception_trigger:' + mis.id
      };
    }

    // ── Luật 3: không khớp ý đúng nào → CHƯA ĐỦ CĂN CỨ, không phải "một phần"
    // "Hiểu một phần" là một tuyên bố về học viên, nên phải có ít nhất một ý
    // đúng làm bằng chứng. Khớp 0 ý thì hệ thống không biết gì về mức hiểu —
    // phải hỏi lại, không được đoán.
    var matched = matchKeyPoints(norm, q.keyPoints);
    if (matched.length === 0) {
      var offTopic = topicOverlap(norm, context) < MIN_TOPIC_OVERLAP;
      return {
        mastery_state: 'insufficient',
        evidence_from_student: '"' + raw.trim() + '"',
        gap: null,
        matched_key_points: [],
        matched_misconception: null,
        confidence: 'low',
        next_action: 'clarify',
        reason: offTopic ? 'answer_off_topic' : 'no_key_point_matched'
      };
    }

    // ── Luật 4: đủ ý ─────────────────────────────────────────────────────
    if (matched.length >= q.keyPoints.length) {
      return {
        mastery_state: 'understood',
        evidence_from_student: quoteAround(raw, matched[0].matchedKeyword),
        gap: null,
        matched_key_points: matched.map(function (k) { return k.id; }),
        matched_misconception: null,
        confidence: 'high',
        next_action: 'continue',
        reason: 'all_key_points_matched'
      };
    }

    // ── Luật 5: một phần ─────────────────────────────────────────────────
    var missing = q.keyPoints.filter(function (k) {
      return matched.map(function (m) { return m.id; }).indexOf(k.id) === -1;
    });
    return {
      mastery_state: 'partial',
      evidence_from_student: matched.length
        ? quoteAround(raw, matched[0].matchedKeyword)
        : '"' + raw.trim() + '"',
      gap: 'Câu trả lời chưa nêu: ' + missing[0].label + '.',
      matched_key_points: matched.map(function (k) { return k.id; }),
      missing_key_points: missing.map(function (k) { return k.id; }),
      matched_misconception: null,
      confidence: matched.length >= 2 ? 'high' : 'medium',
      next_action: 'reinforce',
      reason: 'partial_' + matched.length + '_of_' + q.keyPoints.length
    };
  }

  /* ---------------------------------------------------------------------- */

  function matchKeyPoints(norm, keyPoints) {
    var out = [];
    (keyPoints || []).forEach(function (k) {
      var hit = window.VText.firstMatch(norm, k.kw);
      if (hit) out.push({ id: k.id, label: k.label, matchedKeyword: hit });
    });
    return out;
  }

  function matchMisconception(norm, misconceptions) {
    for (var i = 0; i < (misconceptions || []).length; i++) {
      var m = misconceptions[i];
      var hit = window.VText.firstMatch(norm, m.kw);
      if (!hit) continue;
      // notKw: nếu học viên đã tự phủ định thì KHÔNG gắn misconception.
      if (m.notKw && window.VText.containsAny(norm, m.notKw)) continue;
      return {
        id: m.id,
        gap: m.gap,
        reinforce: m.reinforce,
        matchedKeyword: hit
      };
    }
    return null;
  }

  /**
   * Đếm số TỪ MANG NỘI DUNG của câu trả lời có xuất hiện trong nội dung trang.
   * Không đếm từ chức năng (xem VText.STOPWORDS): nếu đếm cả "không", "nên",
   * "được" thì mọi câu tiếng Việt đều trông như liên quan tới mọi trang.
   */
  function topicOverlap(norm, context) {
    var pageText = (context.passages || []).map(function (p) { return p.text; }).join(' ') +
                   ' ' + (context.heading || '');
    var pageWords = {};
    window.VText.contentWords(pageText).forEach(function (w) { pageWords[w] = true; });
    var n = 0;
    window.VText.contentWords(norm).forEach(function (w) { if (pageWords[w]) n += 1; });
    return n;
  }

  /** Trích một mẩu ngắn quanh từ khoá khớp để làm evidence_from_student. */
  function quoteAround(raw, keyword) {
    if (!keyword) return '"' + raw.trim() + '"';
    var norm = window.VText.normalize(raw);
    var idx = norm.indexOf(window.VText.normalize(keyword));
    if (idx === -1) return '"' + raw.trim() + '"';
    var start = Math.max(0, idx - 30);
    var end = Math.min(raw.length, idx + keyword.length + 40);
    var frag = raw.slice(start, end).trim();
    return (start > 0 ? '…' : '') + '"' + frag + '"' + (end < raw.length ? '…' : '');
  }

  return {
    classifyMock: classifyMock,
    VAGUE: VAGUE,
    MIN_CHARS: MIN_CHARS
  };
})();
