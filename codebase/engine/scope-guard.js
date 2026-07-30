/* ============================================================================
 * engine/scope-guard.js — Chặn câu hỏi ngoài phạm vi & prompt injection
 * ----------------------------------------------------------------------------
 * Phủ lớp chỗ khó ③ "Ngoài phạm vi / thẩm quyền" trong 8 kịch bản của spec §9.
 * Chạy TRƯỚC khi Tutor trả lời, nên chặn được cả trường hợp học viên cố dùng
 * Micro-Check để hỏi việc không thuộc tài liệu.
 *
 * Thành phần này chưa có trong spec §8 (7 thành phần); phải bổ sung vào spec
 * trước CP4 để bản khai khớp bản build.
 * ========================================================================== */

window.ScopeGuard = (function () {

  var INJECTION = [
    'bỏ qua mọi quy tắc', 'bỏ qua quy tắc', 'bỏ qua hướng dẫn trên',
    'ignore previous', 'ignore all previous', 'ignore your instructions',
    'system prompt', 'prompt hệ thống', 'cho tôi xem prompt',
    'in ra prompt', 'lộ prompt', 'bạn được lập trình thế nào',
    'quên hết hướng dẫn', 'act as', 'bạn không còn là tutor',
    'từ giờ bạn là', 'disregard'
  ];

  var OFF_TOPIC = [
    'bóng đá', 'crush', 'người yêu', 'thời tiết', 'nấu ăn', 'chơi game',
    'học phí', 'điểm danh', 'lịch thi', 'bao giờ nghỉ',
    'giá cà phê', 'chứng khoán', 'mã số thuế',
    'viết hộ luận văn', 'làm hộ bài tập'
  ];

  /**
   * @param {string} question câu hỏi học viên gửi cho Tutor
   * @returns {object|null} null nếu hợp lệ; ngược lại là hành vi mong muốn.
   */
  function check(question) {
    var q = window.VText.normalize(question);
    if (!q) return null;

    var inj = window.VText.firstMatch(q, INJECTION);
    if (inj) {
      return report('injection', {
        title: 'Mình không làm theo yêu cầu này',
        message: 'Mình không bỏ qua quy tắc và không tiết lộ cấu hình bên trong. Mình vẫn ở đây để giúp bạn hiểu đoạn tài liệu đang mở — bạn muốn mình giải thích phần nào?',
        matched: inj
      });
    }

    var off = window.VText.firstMatch(q, OFF_TOPIC);
    if (off) {
      return report('off_topic', {
        title: 'Câu này ngoài phạm vi tài liệu',
        message: 'Mình chỉ trả lời dựa trên đoạn tài liệu bạn đang đọc, nên câu này mình xin phép không trả lời. Quay lại trang đang mở nhé — bạn muốn hiểu rõ phần nào?',
        matched: off
      });
    }

    return null;
  }

  function report(kind, payload) {
    var result = {
      kind: kind,
      title: payload.title,
      message: payload.message,
      allowMicroCheck: false
    };
    if (window.Trace) {
      window.Trace.add('scope_guard', {
        mode: 'rule',
        input: { matched_rule: payload.matched },
        output: { kind: kind, allow_micro_check: false }
      });
    }
    return result;
  }

  return { check: check, INJECTION: INJECTION, OFF_TOPIC: OFF_TOPIC };
})();
