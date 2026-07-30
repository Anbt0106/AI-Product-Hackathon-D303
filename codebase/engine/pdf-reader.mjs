/* ============================================================================
 * engine/pdf-reader.mjs — trình đọc PDF cuộn liên tục.
 * PDF.js chỉ được import khi mở tài liệu, vì vậy các helper thuần vẫn test được
 * trong Node mà không cần DOM/canvas.
 * ========================================================================== */

export const DEBOUNCE_DELAY = 250;
const MAX_IMAGE_EDGE = 1600;
const JPEG_QUALITY = 0.78;

export function fitWithin(width, height, maxEdge) {
  const w = Number(width);
  const h = Number(height);
  const limit = Number(maxEdge);
  if (!(w > 0) || !(h > 0) || !(limit > 0)) {
    throw new Error('Kích thước trang hoặc giới hạn ảnh không hợp lệ');
  }
  const scale = Math.min(1, limit / Math.max(w, h));
  return {
    width: Math.round(w * scale),
    height: Math.round(h * scale),
    scale
  };
}

export function pageElementId(pageNumber) {
  return `pdf-page-${Number(pageNumber)}`;
}

function dataUrlBytes(dataUrl) {
  const base64 = String(dataUrl).split(',')[1] || '';
  const padding = (base64.match(/=*$/) || [''])[0].length;
  return Math.max(0, Math.floor(base64.length * 3 / 4) - padding);
}

function normalizeTextContent(content) {
  return (content?.items || [])
    .map(item => typeof item?.str === 'string' ? item.str.trim() : '')
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function createPageShell(pageNumber) {
  const shell = document.createElement('article');
  shell.id = pageElementId(pageNumber);
  shell.className = 'pdf-page pdf-page-loading';
  shell.dataset.pageNumber = String(pageNumber);
  shell.setAttribute('aria-label', `Trang ${pageNumber}`);
  shell.innerHTML =
    `<div class="pdf-page-placeholder" role="status">Đang chuẩn bị trang ${pageNumber}…</div>`;
  return shell;
}

export function create(options) {
  const root = options?.container;
  if (!root) throw new Error('PdfReader cần container');

  const pagesRoot = root.querySelector('.pdf-pages');
  const statusRoot = root.querySelector('.pdf-reader-status');
  if (!pagesRoot || !statusRoot) {
    throw new Error('PdfReader thiếu vùng status hoặc pages');
  }

  const onStatus = typeof options.onStatus === 'function'
    ? options.onStatus
    : () => {};
  const onActivePage = typeof options.onActivePage === 'function'
    ? options.onActivePage
    : () => {};

  let pdfDocument = null;
  let loadingTask = null;
  let observer = null;
  let generation = 0;
  let activePage = null;
  let debounceTimer = null;
  const cache = new Map();
  const ratios = new Map();

  function emitStatus(type, detail = {}) {
    const payload = { type, ...detail };
    statusRoot.textContent = payload.message || '';
    statusRoot.hidden = !payload.message;
    onStatus(payload);
  }

  function disconnectObserver() {
    if (observer) observer.disconnect();
    observer = null;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = null;
    ratios.clear();
  }

  async function destroy() {
    generation += 1;
    disconnectObserver();
    cache.clear();
    activePage = null;
    pagesRoot.replaceChildren();
    root.scrollTop = 0;
    if (loadingTask) {
      try { await loadingTask.destroy(); } catch {}
    } else if (pdfDocument) {
      try { await pdfDocument.destroy(); } catch {}
    }
    loadingTask = null;
    pdfDocument = null;
  }

  function scheduleActivePage() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const viewportCenter = root.clientHeight / 2;
      const candidates = [];
      ratios.forEach((value, pageNumber) => {
        if (cache.has(pageNumber)) {
          candidates.push({
            pageNumber,
            ratio: value.ratio,
            center: value.center
          });
        }
      });
      const selected = window.PageContext.chooseActivePage(
        candidates,
        viewportCenter
      );
      if (!selected || selected === activePage) return;
      activePage = selected;
      pagesRoot.querySelectorAll('.pdf-page-active').forEach(node => {
        node.classList.remove('pdf-page-active');
      });
      const shell = pagesRoot.querySelector(`#${pageElementId(selected)}`);
      if (shell) shell.classList.add('pdf-page-active');
      onActivePage(cache.get(selected));
    }, DEBOUNCE_DELAY);
  }

  function observePages() {
    disconnectObserver();
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const pageNumber = Number(entry.target.dataset.pageNumber);
        const rootTop = entry.rootBounds?.top || 0;
        ratios.set(pageNumber, {
          ratio: entry.intersectionRatio,
          center: entry.boundingClientRect.top - rootTop +
            entry.boundingClientRect.height / 2
        });
      }
      scheduleActivePage();
    }, {
      root,
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1]
    });
    pagesRoot.querySelectorAll('.pdf-page').forEach(node => observer.observe(node));
  }

  async function renderPage(pageNumber, expectedGeneration) {
    if (!pdfDocument || expectedGeneration !== generation) return null;
    const shell = pagesRoot.querySelector(`#${pageElementId(pageNumber)}`);
    if (!shell) return null;

    emitStatus('rendering-page', {
      pageNumber,
      message: `Đang chuẩn bị nội dung trang ${pageNumber}…`
    });

    try {
      const page = await pdfDocument.getPage(pageNumber);
      if (expectedGeneration !== generation) return null;

      const baseViewport = page.getViewport({ scale: 1 });
      const containerWidth = Math.max(720, root.clientWidth - 44);
      const desiredWidth = Math.min(
        MAX_IMAGE_EDGE,
        Math.round(containerWidth * Math.min(window.devicePixelRatio || 1, 1.5))
      );
      const scale = Math.min(
        desiredWidth / baseViewport.width,
        MAX_IMAGE_EDGE / Math.max(baseViewport.width, baseViewport.height)
      );
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(viewport.width));
      canvas.height = Math.max(1, Math.round(viewport.height));
      canvas.setAttribute('aria-label', `Nội dung trang ${pageNumber}`);

      const [textContent] = await Promise.all([
        page.getTextContent(),
        page.render({
          canvasContext: canvas.getContext('2d', { alpha: false }),
          viewport
        }).promise
      ]);
      if (expectedGeneration !== generation) return null;

      const imageDataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      const context = window.PageContext.freeze({
        documentCode: root.dataset.documentCode,
        documentTitle: root.dataset.documentTitle,
        pageNumber,
        pageCount: pdfDocument.numPages,
        text: normalizeTextContent(textContent),
        imageDataUrl,
        imageBytes: dataUrlBytes(imageDataUrl),
        width: canvas.width,
        height: canvas.height
      });
      cache.set(pageNumber, context);

      shell.className = 'pdf-page';
      shell.replaceChildren(canvas);
      shell.dataset.ready = 'true';
      scheduleActivePage();
      return context;
    } catch (error) {
      shell.className = 'pdf-page pdf-page-error';
      shell.innerHTML =
        `<div role="alert">Không đọc được trang ${pageNumber}. ` +
        '<button class="btn btn-ghost" type="button" data-retry-page="' +
        pageNumber + '">Thử lại</button></div>';
      emitStatus('snapshot-error', {
        pageNumber,
        error,
        message: `Không chuẩn bị được trang ${pageNumber}.`
      });
      return null;
    }
  }

  async function open(documentInfo) {
    await destroy();
    const expectedGeneration = generation;
    if (!documentInfo?.pdfUrl) {
      emitStatus('document-error', {
        message: 'Tài liệu này chưa có file PDF.'
      });
      return;
    }

    root.dataset.documentCode = documentInfo.docCode;
    root.dataset.documentTitle = documentInfo.docTitle || documentInfo.docCode;
    emitStatus('loading-document', { message: 'Đang tải tài liệu PDF…' });

    try {
      const pdfjs = await import('../vendor/pdfjs/pdf.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc =
        new URL('../vendor/pdfjs/pdf.worker.mjs', import.meta.url).href;
      loadingTask = pdfjs.getDocument({ url: documentInfo.pdfUrl });
      pdfDocument = await loadingTask.promise;
      if (expectedGeneration !== generation) return;

      const fragment = document.createDocumentFragment();
      for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
        fragment.appendChild(createPageShell(pageNumber));
      }
      pagesRoot.replaceChildren(fragment);
      observePages();
      emitStatus('document-loaded', {
        pageCount: pdfDocument.numPages,
        message: ''
      });

      for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
        if (expectedGeneration !== generation) return;
        await renderPage(pageNumber, expectedGeneration);
      }
      emitStatus('document-ready', {
        pageCount: pdfDocument.numPages,
        message: ''
      });
    } catch (error) {
      emitStatus('document-error', {
        error,
        message: 'Không tải được tài liệu PDF. Hãy thử lại.'
      });
    }
  }

  function getContext(pageNumber) {
    return cache.get(Number(pageNumber)) || null;
  }

  function retry(pageNumber) {
    return renderPage(Number(pageNumber), generation);
  }

  function scrollTo(pageNumber) {
    const shell = pagesRoot.querySelector(`#${pageElementId(pageNumber)}`);
    if (shell) shell.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  pagesRoot.addEventListener('click', event => {
    const button = event.target.closest('[data-retry-page]');
    if (button) retry(Number(button.dataset.retryPage));
  });

  return {
    open,
    getContext,
    retry,
    scrollTo,
    destroy
  };
}

if (typeof window !== 'undefined') {
  window.PdfReader = { create };
}
