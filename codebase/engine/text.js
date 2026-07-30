/* ============================================================================
 * engine/text.js — chuẩn hoá văn bản tiếng Việt
 * ----------------------------------------------------------------------------
 * Dùng chung cho ScopeGuard và Mastery Classifier. Học viên gõ có dấu hoặc
 * không dấu đều phải khớp cùng một luật, nếu không thì kết quả phân loại phụ
 * thuộc vào bộ gõ của người dùng — một lỗi đo lường chứ không phải lỗi hiểu bài.
 *
 * Lọc dấu bằng cách bỏ code point trong dải U+0300..U+036F sau khi normalize
 * NFD (không dùng regex để tránh sai sót khi ghi dải ký tự tổ hợp vào file).
 * ========================================================================== */

window.VText = (function () {

  function stripMarks(s) {
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c >= 0x0300 && c <= 0x036f) continue;
      out += s.charAt(i);
    }
    return out;
  }

  /** lowercase + bỏ dấu + đ→d + gộp khoảng trắng. */
  function normalize(s) {
    var base = String(s == null ? '' : s).toLowerCase();
    if (typeof base.normalize === 'function') base = base.normalize('NFD');
    return stripMarks(base)
      .split('đ').join('d')   // đ
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Chuỗi đã chuẩn hoá, bỏ dấu câu, có khoảng trắng bao hai đầu — để khớp theo
   * RANH GIỚI TỪ chứ không phải substring.
   *
   * Vì sao cần: khớp substring làm từ khoá một chữ như "q", "k", "v" khớp vào
   * "qua", "không", "về"; và "ok" khớp vào "token". Cả hai đều đã gây phân loại
   * sai trong test/smoke.mjs trước khi sửa.
   */
  function padded(s) {
    return ' ' + normalize(s).replace(/[^a-z0-9%]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  }

  function hasPhrase(paddedText, keyword) {
    var core = padded(keyword).trim();
    if (!core) return false;
    return paddedText.indexOf(' ' + core + ' ') !== -1;
  }

  /** true nếu văn bản chứa BẤT KỲ từ khoá nào (khớp theo ranh giới từ). */
  function containsAny(normalized, keywords) {
    if (!keywords || !keywords.length) return false;
    var p = padded(normalized);
    for (var i = 0; i < keywords.length; i++) {
      if (hasPhrase(p, keywords[i])) return true;
    }
    return false;
  }

  /** Từ khoá đầu tiên khớp, hoặc null. */
  function firstMatch(normalized, keywords) {
    if (!keywords) return null;
    var p = padded(normalized);
    for (var i = 0; i < keywords.length; i++) {
      if (hasPhrase(p, keywords[i])) return keywords[i];
    }
    return null;
  }

  /** Tách token chữ để đo độ liên quan với nội dung trang. */
  function words(normalized) {
    return normalize(normalized).split(/[^a-z0-9]+/).filter(function (w) { return w.length >= 3; });
  }

  /* Từ chức năng tiếng Việt. Lọc chúng ra khi đo "câu trả lời có liên quan tới
   * nội dung trang không": nếu đếm cả "không", "nên", "được" thì gần như mọi câu
   * tiếng Việt đều trông như có liên quan, và tín hiệu mất giá trị. */
  var STOPWORDS = {};
  ('cac cua cho khong nhu nhung duoc trong voi mot nay tren khi den tai vao ' +
   'minh neu nen thi con hoac hay rat cung the nao sao phai viec lam biet thay ' +
   'can sau truoc luc gio ngay thoi qua roi cai bang tuc gi la va co de nhieu ' +
   'khac hon nua chi cu day nhat toi anh chj chua san lai boi vay dau tren duoi'
  ).split(' ').forEach(function (w) { if (w) STOPWORDS[w] = true; });

  /** Chỉ giữ từ mang nội dung — dùng để đo độ liên quan. */
  function contentWords(text) {
    return words(text).filter(function (w) { return !STOPWORDS[w]; });
  }

  return {
    normalize: normalize,
    padded: padded,
    hasPhrase: hasPhrase,
    containsAny: containsAny,
    firstMatch: firstMatch,
    words: words,
    contentWords: contentWords
  };
})();
