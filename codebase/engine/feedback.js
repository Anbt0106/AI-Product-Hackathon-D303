/* ============================================================================
 * engine/feedback.js — Feedback Composer (spec §8.5)
 * ----------------------------------------------------------------------------
 * Chuyển kết quả có cấu trúc của Mastery Classifier thành phản hồi ngắn cho học
 * viên. Tách riêng khỏi classifier để: (a) đổi giọng/độ dài mà không sửa logic
 * quyết định, (b) người ngoài nhóm chấm chiều "Brevity" và "Gap precision" trên
 * đúng một file.
 *
 * Nguyên tắc trải nghiệm áp ở đây (spec §5):
 *   #5 Không gây áp lực điểm số → nhãn "Đã nắm / Cần củng cố / Có thể đang nhầm
 *      / Chưa đủ căn cứ", không có điểm số.
 *   #6 Phản hồi tối thiểu đủ dùng → chỉ nêu MỘT lỗ hổng.
 *   #7 Có thể kiểm chứng → luôn kèm trang nguồn.
 * ========================================================================== */

window.FeedbackComposer = (function () {

  var LABELS = {
    understood:   { text: 'Đã nắm',          tone: 'ok' },
    partial:      { text: 'Cần củng cố',     tone: 'warn' },
    misconception:{ text: 'Có thể đang nhầm', tone: 'alert' },
    insufficient: { text: 'Chưa đủ căn cứ',  tone: 'neutral' }
  };

  var CTA = {
    continue:  'Tiếp tục học',
    reinforce: 'Xem bước củng cố',
    clarify:   'Trả lời rõ hơn',
    retry:     'Thử lại'
  };

  /**
   * @param {object} verdict output của Mastery.classifyMock / AiClient.classify
   * @param {object} question output của QuestionGenerator
   * @returns {object} { label, tone, headline, body, reinforce, cta, sourceLine }
   */
  function compose(verdict, question) {
    var label = LABELS[verdict.mastery_state] || LABELS.insufficient;
    var out = {
      state: verdict.mastery_state,
      label: label.text,
      tone: label.tone,
      headline: '',
      body: '',
      reinforce: null,
      cta: CTA[verdict.next_action] || CTA.clarify,
      sourceLine: 'Căn cứ: trang ' + verdict.source_page +
                  (question.source_codes && question.source_codes.length
                    ? ' · đoạn ' + question.source_codes.join(', ')
                    : '')
    };

    if (verdict.mastery_state === 'understood') {
      out.headline = 'Bạn nắm đúng phần cốt lõi.';
      out.body = 'Câu trả lời của bạn có đủ các ý mà trang ' + verdict.source_page +
                 ' yêu cầu. Bạn học tiếp được rồi.';
      return out;
    }

    if (verdict.mastery_state === 'partial') {
      out.headline = 'Đúng phần chính, còn thiếu một ý.';
      out.body = verdict.gap || 'Câu trả lời còn thiếu một ý so với nội dung trang.';
      out.reinforce = reinforceForMissing(verdict, question);
      return out;
    }

    if (verdict.mastery_state === 'misconception') {
      out.headline = praiseFirst(verdict, question) + ' Nhưng có một chỗ đang lệch.';
      out.body = verdict.gap;
      out.reinforce = verdict.reinforce || null;
      return out;
    }

    // insufficient
    out.headline = 'Mình chưa đủ căn cứ để kết luận.';
    out.body = clarifyBody(verdict, question);
    return out;
  }

  /* Nêu phần đúng TRƯỚC khi chỉ ra lỗ hổng (spec §6.2). */
  function praiseFirst(verdict, question) {
    var ids = verdict.matched_key_points || [];
    if (!ids.length) return 'Bạn đã diễn đạt lại được nội dung.';
    var first = findKeyPoint(question, ids[0]);
    return 'Bạn nêu đúng: ' + (first ? first.label : ids[0]) + '.';
  }

  function reinforceForMissing(verdict, question) {
    var ids = verdict.missing_key_points || [];
    if (!ids.length) return null;
    var kp = findKeyPoint(question, ids[0]);
    if (!kp) return null;
    return 'Đọc lại trang ' + verdict.source_page + ' và bổ sung đúng một ý: ' +
           kp.label + '. Không cần trả lời lại cả câu.';
  }

  function clarifyBody(verdict, question) {
    if (verdict.reason === 'answer_too_short') {
      return 'Câu trả lời hơi ngắn nên mình không biết bạn đang hiểu theo hướng nào. ' +
             'Bạn thử diễn đạt lại bằng một câu đầy đủ, dùng từ của bạn.';
    }
    if (verdict.reason === 'vague_claim') {
      return 'Bạn nói là đã hiểu, nhưng mình chưa thấy nội dung để đối chiếu. ' +
             'Bạn nói lại một câu cụ thể: ' + shortenQuestion(question.question);
    }
    if (verdict.reason === 'answer_off_topic') {
      return 'Câu trả lời chưa liên quan tới nội dung trang ' + verdict.source_page +
             '. Bạn thử trả lời sát câu hỏi hơn, hoặc chọn lại đoạn tài liệu khác.';
    }
    if (verdict.reason === 'no_key_point_matched') {
      return 'Câu trả lời có nói về nội dung trang ' + verdict.source_page +
             ' nhưng chưa chạm vào ý mà câu hỏi đang nhắm tới, nên mình chưa dám kết luận. ' +
             'Bạn trả lời lại sát câu hỏi hơn: ' + shortenQuestion(question.question);
    }
    return 'Bạn bổ sung thêm một câu để mình có căn cứ đánh giá nhé.';
  }

  function shortenQuestion(q) {
    var s = String(q || '');
    var i = s.indexOf(':');
    return i !== -1 ? s.slice(i + 1).trim() : s;
  }

  function findKeyPoint(question, id) {
    var list = question.keyPoints || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  return { compose: compose, LABELS: LABELS };
})();
