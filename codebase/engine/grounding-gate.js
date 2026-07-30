/* ============================================================================
 * engine/grounding-gate.js — Grounding Gate
 * ----------------------------------------------------------------------------
 * Điều kiện ĐẦU VÀO của quyết định AI trung tâm: chỉ khi nguồn đủ và đúng
 * ngữ cảnh thì mới được sinh Micro-Check.
 *
 * Ba trạng thái đầu ra:
 *   pass    → cho phép sinh Micro-Check
 *   review  → trích dẫn trỏ trang khác; KHÔNG tự kết luận là sai, KHÔNG tự sinh
 *             Micro-Check; chuyển quyền quyết định cho học viên
 *   block   → thiếu căn cứ; không sinh Micro-Check
 *
 * Vì sao có "review": trong 1.252 lượt có selected page, 239 lượt chỉ cite
 * trang khác. Nhóm chưa audit hết nội dung các lượt đó nên không mặc định coi
 * mọi cross-page citation là lỗi (xem CP1 §"Hai việc bắt buộc trước khi nộp").
 * ========================================================================== */

window.GroundingGate = (function () {

  var REASONS = {
    no_selection: {
      status: 'block',
      title: 'Chưa chọn đoạn tài liệu',
      message: 'Mình cần biết bạn đang đọc đoạn nào để trả lời có căn cứ. Bạn chọn một đoạn ở slide bên trái nhé.',
      action: 'select_passage'
    },
    empty_page: {
      status: 'block',
      title: 'Trang này chưa có nội dung',
      message: 'Mã tài liệu này không trỏ tới nội dung trang cụ thể, nên mình chưa đủ căn cứ để giải thích hay tạo câu kiểm tra. Bạn chọn lại một trang có nội dung nhé.',
      action: 'select_other_page'
    },
    citation_missing: {
      status: 'block',
      title: 'Câu trả lời chưa có trích dẫn',
      message: 'Lời giải thích này không kèm trích dẫn trang nào, nên mình không tạo bước Kiểm tra tôi. Bạn thử chọn lại đoạn hoặc hỏi lại cụ thể hơn.',
      action: 'reask'
    },
    citation_cross_page: {
      status: 'review',
      title: 'Trích dẫn trỏ sang trang khác',
      message: 'Câu trả lời trích trang khác với trang bạn đang chọn. Mình không tự kết luận trích dẫn này sai, nhưng cũng không tự tạo Kiểm tra tôi — bạn chọn cách xử lý.',
      action: 'confirm_or_jump'
    },
    citation_cross_doc: {
      status: 'block',
      title: 'Trích dẫn trỏ sang tài liệu khác',
      message: 'Trích dẫn thuộc một tài liệu khác với tài liệu bạn đang đọc, nên mình dừng lại ở đây thay vì đánh giá mức hiểu.',
      action: 'reask'
    }
  };

  /**
   * @param {object} ctx
   *   ctx.docCode        {string|null}
   *   ctx.selectedPage   {number|null}
   *   ctx.passages       {Array}  các đoạn của trang đang chọn
   *   ctx.selectedPassageIds {Array<string>}
   *   ctx.answer         {object|null} { text, citations:number[], docCode? }
   * @returns {object} { status, reason, title, message, action, verified }
   */
  function check(ctx) {
    // Xét trang rỗng TRƯỚC khi xét việc chọn đoạn: nếu trang không có nội dung
    // thì học viên không thể chọn được đoạn nào, báo "chưa chọn đoạn" sẽ sai
    // nguyên nhân và đẩy học viên vào một việc không làm được.
    if (!ctx.passages || ctx.passages.length === 0) {
      return build('empty_page', ctx);
    }
    if (!ctx.selectedPage || !ctx.selectedPassageIds || ctx.selectedPassageIds.length === 0) {
      return build('no_selection', ctx);
    }
    if (!ctx.answer) {
      return build('citation_missing', ctx);
    }

    var citations = ctx.answer.citations || [];
    if (citations.length === 0) {
      return build('citation_missing', ctx);
    }

    if (ctx.answer.docCode && ctx.answer.docCode !== ctx.docCode) {
      return build('citation_cross_doc', ctx);
    }

    if (citations.indexOf(ctx.selectedPage) === -1) {
      return build('citation_cross_page', ctx);
    }

    var result = {
      status: 'pass',
      reason: 'citation_matches_selection',
      title: 'Đã xác minh nguồn',
      message: 'Trích dẫn trang ' + ctx.selectedPage + ' khớp đoạn bạn đang chọn.',
      action: null,
      verified: {
        docCode: ctx.docCode,
        page: ctx.selectedPage,
        passageIds: ctx.selectedPassageIds.slice(),
        citations: citations.slice()
      }
    };
    log(ctx, result);
    return result;
  }

  function build(reasonKey, ctx) {
    var r = REASONS[reasonKey];
    var result = {
      status: r.status,
      reason: reasonKey,
      title: r.title,
      message: r.message,
      action: r.action,
      verified: null,
      cited: ctx.answer ? (ctx.answer.citations || []) : []
    };
    log(ctx, result);
    return result;
  }

  function log(ctx, result) {
    if (!window.Trace) return;
    window.Trace.add('grounding_gate', {
      mode: 'rule',
      context: {
        doc_code: ctx.docCode,
        selected_page: ctx.selectedPage,
        selected_passage_ids: ctx.selectedPassageIds || [],
        page_has_content: !!(ctx.passages && ctx.passages.length)
      },
      input: { citations: ctx.answer ? (ctx.answer.citations || []) : [] },
      output: { status: result.status, reason: result.reason }
    });
  }

  return { check: check, REASONS: REASONS };
})();
