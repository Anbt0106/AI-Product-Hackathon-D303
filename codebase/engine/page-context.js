/* ============================================================================
 * engine/page-context.js — hợp đồng ngữ cảnh bất biến của một trang PDF.
 * Không phụ thuộc DOM để các quy tắc chọn trang, source ID và trace được test
 * độc lập với PDF.js.
 * ========================================================================== */

window.PageContext = (function () {
  'use strict';

  function chooseActivePage(entries, viewportCenter) {
    if (!Array.isArray(entries) || !entries.length) return null;
    var center = Number(viewportCenter) || 0;
    var candidates = entries.filter(function (entry) {
      return entry && Number.isInteger(entry.pageNumber) &&
        Number(entry.ratio) > 0;
    }).slice();
    if (!candidates.length) return null;

    candidates.sort(function (a, b) {
      var ratioDelta = Number(b.ratio) - Number(a.ratio);
      if (Math.abs(ratioDelta) > 0.000001) return ratioDelta;
      return Math.abs(Number(a.center) - center) -
        Math.abs(Number(b.center) - center);
    });
    return candidates[0].pageNumber;
  }

  function sourceId(documentCode, pageNumber) {
    var code = String(documentCode || '').trim();
    var page = Number(pageNumber);
    if (!code) throw new Error('Thiếu mã tài liệu');
    if (!Number.isInteger(page) || page < 1) throw new Error('Số trang không hợp lệ');
    return code + ':page-' + page;
  }

  function freeze(context) {
    if (!context || typeof context !== 'object') {
      throw new Error('Ngữ cảnh trang không hợp lệ');
    }
    var page = Number(context.pageNumber);
    var pageCount = Number(context.pageCount);
    if (!Number.isInteger(page) || !Number.isInteger(pageCount) ||
        page < 1 || page > pageCount) {
      throw new Error('Số trang nằm ngoài tài liệu');
    }
    var image = String(context.imageDataUrl || '');
    if (!/^data:image\/(?:jpeg|png);base64,[A-Za-z0-9+/=]+$/i.test(image)) {
      throw new Error('Ảnh trang phải là JPEG hoặc PNG data URL hợp lệ');
    }
    var width = Number(context.width);
    var height = Number(context.height);
    var imageBytes = Number(context.imageBytes);
    if (!(width > 0) || !(height > 0) || !(imageBytes > 0)) {
      throw new Error('Kích thước ảnh trang không hợp lệ');
    }

    return Object.freeze({
      documentCode: String(context.documentCode || '').trim(),
      documentTitle: String(context.documentTitle || '').trim(),
      pageNumber: page,
      pageCount: pageCount,
      sourceId: sourceId(context.documentCode, page),
      text: String(context.text || '').trim(),
      imageDataUrl: image,
      imageBytes: imageBytes,
      width: width,
      height: height
    });
  }

  function safeTrace(context) {
    return {
      document_code: context.documentCode,
      page: context.pageNumber,
      source_id: context.sourceId,
      text_length: String(context.text || '').length,
      image_bytes: context.imageBytes,
      width: context.width,
      height: context.height
    };
  }

  return {
    chooseActivePage: chooseActivePage,
    sourceId: sourceId,
    freeze: freeze,
    safeTrace: safeTrace
  };
})();
