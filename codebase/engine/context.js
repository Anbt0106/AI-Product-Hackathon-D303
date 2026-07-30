/* ============================================================================
 * engine/context.js — Slide Context Provider (spec §8.1)
 * ----------------------------------------------------------------------------
 * Cung cấp mã tài liệu, số trang và các đoạn của trang. Đây là NGUỒN SỰ THẬT
 * duy nhất mà Grounding Gate và Question Generator được phép dùng.
 * ========================================================================== */

window.SlideContext = (function () {
  var DOCS = window.VLEARN_SLIDES || [];

  function docs() {
    return DOCS.map(function (d) {
      return {
        docCode: d.docCode,
        materialId: d.materialId || null,
        docTitle: d.docTitle,
        courseCode: d.courseCode || null,
        day: d.day || null,
        pageCount: d.pageCount || d.pages.length,
        pdfUrl: d.pdfUrl || null,
        note: d.note || null
      };
    });
  }

  function getDoc(docCode) {
    for (var i = 0; i < DOCS.length; i++) {
      if (DOCS[i].docCode === docCode) return DOCS[i];
    }
    return null;
  }

  function pages(docCode) {
    var d = getDoc(docCode);
    return d ? d.pages.map(function (p) { return p.page; }) : [];
  }

  /** Trả về object trang, hoặc null nếu không có. */
  function getPage(docCode, page) {
    var d = getDoc(docCode);
    if (!d) return null;
    for (var i = 0; i < d.pages.length; i++) {
      if (d.pages[i].page === page) return d.pages[i];
    }
    return null;
  }

  /** Ngữ cảnh tối thiểu để đưa vào prompt / vào rule engine. */
  function build(docCode, page, selectedPassageIds) {
    var d = getDoc(docCode);
    var p = getPage(docCode, page);
    var ids = selectedPassageIds || [];
    var selected = p ? p.passages.filter(function (x) { return ids.indexOf(x.id) !== -1; }) : [];
    return {
      docCode: docCode,
      materialId: d ? d.materialId || null : null,
      docTitle: d ? d.docTitle : null,
      pdfUrl: d ? d.pdfUrl || null : null,
      pageCount: d ? d.pageCount || d.pages.length : 0,
      selectedPage: page,
      heading: p ? p.heading : null,
      passages: p ? p.passages : [],
      selectedPassageIds: ids,
      selectedText: selected.map(function (x) { return x.text; }).join(' '),
      sourceCodes: selected.map(function (x) { return x.src; })
    };
  }

  function suggested(page) {
    var map = window.VLEARN_SUGGESTED || {};
    return map[page] || [];
  }

  return {
    docs: docs,
    getDoc: getDoc,
    pages: pages,
    getPage: getPage,
    build: build,
    suggested: suggested
  };
})();
