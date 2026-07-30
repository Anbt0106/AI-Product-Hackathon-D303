/* ============================================================================
 * engine/question.js — Question Generator (spec §8.3)
 * ----------------------------------------------------------------------------
 * Sinh ĐÚNG MỘT câu teach-back cho đoạn slide đã qua Grounding Gate.
 *
 * CP2: đọc từ bank trong data/slides.js (data giả, không gọi AI).
 * CP3: AiClient.generateQuestion() sẽ gọi AI thật; hàm mock ở đây trở thành
 *      đường lui khi API lỗi, và là baseline để so sánh chất lượng câu hỏi.
 *
 * Bất biến bắt buộc: chỉ được sinh câu hỏi khi gate.status === 'pass'.
 * ========================================================================== */

window.QuestionGenerator = (function () {

  /**
   * @param {object} args { context, gate }
   * @returns {object|null} { question, keyPoints, misconceptions, source_page, mode }
   */
  function generateMock(args) {
    var ctx = args.context;
    var gate = args.gate;

    if (!gate || gate.status !== 'pass') {
      throw new Error('QuestionGenerator: không được sinh Micro-Check khi gate chưa pass (status=' + (gate && gate.status) + ')');
    }

    var page = window.SlideContext.getPage(ctx.docCode, ctx.selectedPage);
    if (!page || !page.microCheck) return null;

    var mc = page.microCheck;
    var out = {
      question: mc.question,
      keyPoints: mc.keyPoints,
      misconceptions: mc.misconceptions,
      source_page: ctx.selectedPage,
      source_codes: ctx.sourceCodes,
      mode: 'mock'
    };

    if (window.Trace) {
      window.Trace.add('question_generate', {
        mode: 'mock',
        model: null,
        context: {
          doc_code: ctx.docCode,
          source_page: ctx.selectedPage,
          source_codes: ctx.sourceCodes
        },
        output: {
          question: out.question,
          key_point_ids: mc.keyPoints.map(function (k) { return k.id; }),
          misconception_ids: mc.misconceptions.map(function (m) { return m.id; })
        }
      });
    }
    return out;
  }

  return { generateMock: generateMock };
})();
