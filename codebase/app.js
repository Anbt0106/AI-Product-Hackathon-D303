/* ============================================================================
 * app.js — Session State (spec §8.6) + UI + máy trạng thái các đường đi
 * ----------------------------------------------------------------------------
 * VLearn Live Student Demo:
 *   1. Hỏi Tutor -> POST /api/tutor (AI live) -> Grounding Gate
 *   2. Micro-Check -> POST /api/question (AI live)
 *   3. Teach-back -> POST /api/classify (AI live)
 *   Không fallback sang mock khi AI lỗi.
 * ========================================================================== */

(function () {
  'use strict';

  /* ====================== STATE ====================== */

  var S = {
    docCode: null,
    page: null,
    selectedPassageIds: [],
    phase: 'idle',
    thread: [],              // các block hiển thị trong panel Tutor
    composerMode: 'ask',     // 'ask' | 'teachback'
    answer: null,            // câu trả lời Tutor
    gate: null,
    question: null,
    verdict: null,
    feedback: null,
    lastStudentAnswer: '',
    correctionRound: 0,
    countdown: null,
    countdownLeft: 30,
    showBasis: false,
    request: {
      step: null,            // 'tutor' | 'question' | 'classify' | null
      status: 'idle',        // 'idle' | 'loading' | 'error'
      error: null,           // { code, message }
      retry: null            // function to retry
    }
  };

  /* ====================== DOM refs ====================== */

  var el = {};
  function $(id) { return document.getElementById(id); }

  function cacheDom() {
    el.docSelect = $('doc-select');
    el.pageTabs = $('page-tabs');
    el.slideMeta = $('slide-meta');
    el.slideBody = $('slide-body');
    el.pdfFrame = $('pdf-frame');
    el.pdfDownload = $('pdf-download');
    el.docTitle = $('doc-title');
    el.selectionChip = $('selection-chip');
    el.thread = $('thread');
    el.suggested = $('suggested');
    el.askInput = $('ask-input');
    el.btnAsk = $('btn-ask');
    el.modeBadge = $('mode-badge');
    el.btnTrace = $('btn-trace');
    el.traceDrawer = $('trace-drawer');
    el.traceBody = $('trace-body');
  }

  /* ====================== KHỞI TẠO ====================== */

  function init() {
    cacheDom();

    var docs = window.SlideContext.docs();
    el.docSelect.innerHTML = docs.map(function (d) {
      return '<option value="' + esc(d.docCode) + '">' + esc(d.docTitle) + '</option>';
    }).join('');

    S.docCode = docs[0].docCode;
    S.page = window.SlideContext.pages(S.docCode)[0];
    selectDefaultContext();

    bindEvents();

    window.AiClient.onModeChange(renderModeBadge);
    window.AiClient.probe();
    renderModeBadge(window.AiClient.getMode());

    window.Trace.onChange(function (entries) {
      el.btnTrace.textContent = 'Trace (' + entries.length + ')';
      if (!el.traceDrawer.hidden) renderTrace();
    });

    renderAll();
  }

  function bindEvents() {
    el.docSelect.addEventListener('change', function () {
      openDocument(el.docSelect.value);
    });

    document.querySelectorAll('[data-doc]').forEach(function (button) {
      button.addEventListener('click', function () {
        openDocument(button.getAttribute('data-doc'));
      });
    });

    el.pageTabs.addEventListener('click', function (e) {
      var b = e.target.closest('[data-page]');
      if (!b) return;
      S.page = parseInt(b.getAttribute('data-page'), 10);
      resetRound();
      selectDefaultContext();
      renderAll();
    });

    el.slideBody.addEventListener('click', function (e) {
      var p = e.target.closest('[data-passage]');
      if (!p) return;
      togglePassage(p.getAttribute('data-passage'));
    });

    el.btnAsk.addEventListener('click', onComposerSubmit);
    el.askInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onComposerSubmit();
    });

    el.suggested.addEventListener('click', function (e) {
      var b = e.target.closest('[data-suggest]');
      if (!b) return;
      el.askInput.value = b.getAttribute('data-suggest');
      onComposerSubmit();
    });

    el.thread.addEventListener('click', onThreadClick);

    $('btn-trace').addEventListener('click', function () {
      el.traceDrawer.hidden = !el.traceDrawer.hidden;
      if (!el.traceDrawer.hidden) renderTrace();
    });
    $('btn-trace-close').addEventListener('click', function () { el.traceDrawer.hidden = true; });
    $('btn-trace-download').addEventListener('click', function () { window.Trace.download(); });
  }

  /* ====================== REQUEST STATE ====================== */

  function beginRequest(step, retry) {
    S.request = { step: step, status: 'loading', error: null, retry: retry };
    updateAiStatus(loadingLabel(step));
  }

  function failRequest(step, error, retry) {
    S.request = {
      step: step,
      status: 'error',
      error: {
        code: error.code || 'request_failed',
        message: error.message || 'Không gọi được AI.'
      },
      retry: retry
    };
    updateAiStatus('Lỗi: ' + S.request.error.message);
  }

  function finishRequest() {
    S.request = { step: null, status: 'idle', error: null, retry: null };
    updateAiStatus('');
  }

  function retryFailedStep() {
    if (S.request.status === 'error' && typeof S.request.retry === 'function') {
      S.request.retry();
    }
  }

  function loadingLabel(step) {
    if (step === 'tutor') return 'AI đang trả lời câu hỏi của bạn…';
    if (step === 'question') return 'AI đang sinh câu Micro-Check…';
    if (step === 'classify') return 'AI đang đánh giá câu trả lời teach-back…';
    return 'AI đang xử lý…';
  }

  function updateAiStatus(msg) {
    var statusEl = $('ai-status');
    if (statusEl) statusEl.textContent = msg || '';
  }

  /* ====================== HÀNH ĐỘNG ====================== */

  function togglePassage(id) {
    var i = S.selectedPassageIds.indexOf(id);
    if (i === -1) S.selectedPassageIds.push(id);
    else S.selectedPassageIds.splice(i, 1);
    if (S.phase !== 'idle' && S.phase !== 'selected') resetRound(true);
    S.phase = S.selectedPassageIds.length ? 'selected' : 'idle';
    renderAll();
  }

  function onComposerSubmit() {
    if (S.request.status === 'loading') return;
    var text = el.askInput.value.trim();
    if (!text) return;
    if (S.composerMode === 'teachback') submitTeachBack(text);
    else askTutor(text);
  }

  /* --- Bước 1: học viên hỏi Tutor (live AI) ------------------------------ */

  function askTutor(text, isRetry) {
    var ctx = currentContext();
    if (!ctx.sourceCodes.length || !ctx.selectedText.trim()) {
      S.thread.push({
        type: 'note',
        text: 'Hãy chọn ít nhất một đoạn transcript trước khi hỏi Tutor.'
      });
      return renderTutor();
    }

    var guard = window.ScopeGuard.check(text);
    if (guard) {
      S.thread.push({ type: 'guard', kind: guard.kind, title: guard.title, message: guard.message });
      S.phase = 'blocked';
      return renderTutor();
    }

    el.askInput.value = '';
    if (!isRetry) {
      S.thread.push({ type: 'student', text: text });
    }

    beginRequest('tutor', function () { askTutor(text, true); });
    renderTutor();

    window.AiClient.answerTutor({ question: text, context: ctx })
      .then(function (result) {
        finishRequest();
        S.answer = {
          text: result.answer,
          citations: result.citations,
          docCode: S.docCode
        };
        S.thread.push({ type: 'tutor', text: result.answer, citations: result.citations });
        applyGroundingGate(ctx);
        renderTutor();
      })
      .catch(function (error) {
        failRequest('tutor', error, function () { askTutor(text, true); });
        renderTutor();
      });
  }

  function applyGroundingGate(ctx) {
    var gate = window.GroundingGate.check({
      docCode: S.docCode,
      selectedPage: S.page,
      passages: ctx.passages,
      selectedPassageIds: S.selectedPassageIds,
      answer: S.answer
    });
    S.gate = gate;
    S.thread.push({ type: 'gate', gate: gate });

    if (gate.status === 'pass') {
      S.phase = 'offered';
      S.thread.push({ type: 'offer' });
    } else if (gate.status === 'review') {
      S.phase = 'review';
      S.thread.push({ type: 'review-choice', cited: gate.cited });
    } else {
      S.phase = 'blocked';
    }
  }

  /* --- Bước 2: sinh câu Micro-Check (live AI) --------------------------- */

  function startMicroCheck() {
    var ctx = currentContext();
    beginRequest('question', startMicroCheck);
    S.phase = 'loading-question';
    renderTutor();

    window.AiClient.generateQuestion(ctx, S.gate)
      .then(function (q) {
        finishRequest();
        if (!q || !q.question) {
          S.thread.push({
            type: 'note',
            text: 'Không sinh được câu Micro-Check từ ngữ cảnh này.'
          });
          S.phase = 'blocked';
          renderTutor();
          return;
        }
        S.question = q;
        S.phase = 'question';
        S.composerMode = 'teachback';
        S.thread.push({ type: 'question', question: q });
        startCountdown();
        renderTutor();
        el.askInput.focus();
      })
      .catch(function (error) {
        failRequest('question', error, startMicroCheck);
        renderTutor();
      });
  }

  /* --- Bước 3: học viên teach-back (live AI) --------------------------- */

  function submitTeachBack(text, isRetry) {
    el.askInput.value = '';
    stopCountdown();
    S.lastStudentAnswer = text;
    if (!isRetry) {
      S.thread.push({ type: 'student', text: text, teachback: true });
    }
    S.phase = 'loading-verdict';
    S.composerMode = 'ask';
    beginRequest('classify', function () { submitTeachBack(text, true); });
    renderTutor();

    window.AiClient.classify({
      answer: text,
      question: S.question,
      context: currentContext(),
      gate: S.gate
    })
      .then(function (verdict) {
        finishRequest();
        if (S.correctionRound > 0) verdict.is_correction = true;
        S.verdict = verdict;
        S.feedback = window.FeedbackComposer.compose(verdict, S.question);
        S.phase = 'result';
        S.thread.push({ type: 'result', verdict: verdict, feedback: S.feedback });
        renderTutor();
      })
      .catch(function (error) {
        failRequest('classify', error, function () { submitTeachBack(text, true); });
        renderTutor();
      });
  }

  /* --- Đường lui: correction path ------------------------------------- */

  function startCorrection() {
    S.correctionRound += 1;
    S.showBasis = false;
    S.thread = S.thread.filter(function (b) { return b.type !== 'result'; });
    S.thread.push({
      type: 'note',
      text: 'Bạn không đồng ý với đánh giá. Mình hiển thị lại toàn bộ căn cứ đã dùng và đánh giá lại từ câu trả lời mới — kết quả cũ đã được bỏ.'
    });
    S.thread.push({ type: 'basis' });
    S.verdict = null;
    S.feedback = null;
    S.phase = 'question';
    S.composerMode = 'teachback';
    el.askInput.value = S.lastStudentAnswer;

    window.Trace.add('correction_requested', {
      mode: 'ui',
      input: { previous_answer: S.lastStudentAnswer },
      output: { correction_round: S.correctionRound, previous_verdict_discarded: true }
    });
    renderTutor();
    el.askInput.focus();
  }

  /* ====================== ĐẾM 30 GIÂY ====================== */

  function startCountdown() {
    stopCountdown();
    S.countdownLeft = 30;
    S.countdown = setInterval(function () {
      S.countdownLeft -= 1;
      var node = $('countdown');
      if (!node) { stopCountdown(); return; }
      if (S.countdownLeft > 0) {
        node.textContent = 'Còn ' + S.countdownLeft + ' giây — không bắt buộc';
      } else {
        node.textContent = 'Hết 30 giây — bạn vẫn trả lời được, không bị tính là sai';
        node.classList.add('countdown-done');
        stopCountdown();
      }
    }, 1000);
  }

  function stopCountdown() {
    if (S.countdown) clearInterval(S.countdown);
    S.countdown = null;
  }

  /* ====================== EVENT DELEGATION ====================== */

  function onThreadClick(e) {
    var b = e.target.closest('[data-action]');
    if (!b) return;
    var act = b.getAttribute('data-action');

    if (act === 'retry-ai') return retryFailedStep();

    if (act === 'start-check') return startMicroCheck();

    if (act === 'skip-check') {
      S.thread.push({ type: 'note', text: 'Đã bỏ qua. Bạn học tiếp bình thường.' });
      S.phase = 'skipped';
      window.Trace.add('micro_check_skipped', { mode: 'ui', output: { skipped: true } });
      return renderTutor();
    }

    if (act === 'jump-page') {
      var p = parseInt(b.getAttribute('data-page'), 10);
      var pages = window.SlideContext.pages(S.docCode);
      if (pages.indexOf(p) !== -1) {
        S.page = p;
        resetRound(true);
        selectDefaultContext();
        renderAll();
      }
      return;
    }

    if (act === 'accept-cross-page') {
      S.thread.push({
        type: 'note',
        text: 'Bạn xác nhận vẫn kiểm tra dựa trên trang ' + S.page +
              '. Đánh giá sẽ chỉ dùng nội dung trang này, không dùng trang được trích dẫn.'
      });
      S.gate = {
        status: 'pass',
        reason: 'student_confirmed_cross_page',
        title: 'Học viên xác nhận dùng trang đang chọn',
        message: 'Trích dẫn lệch trang, học viên chọn tiếp tục theo trang đang đọc.',
        verified: {
          docCode: S.docCode,
          page: S.page,
          passageIds: S.selectedPassageIds.slice(),
          citations: S.answer ? S.answer.citations : []
        }
      };
      window.Trace.add('grounding_gate_override', {
        mode: 'ui',
        input: { cited: S.answer ? S.answer.citations : [], selected_page: S.page },
        output: { status: 'pass', reason: 'student_confirmed_cross_page' }
      });
      S.phase = 'offered';
      S.thread.push({ type: 'offer' });
      return renderTutor();
    }

    if (act === 'reask') {
      S.composerMode = 'ask';
      resetRound(true);
      S.phase = S.selectedPassageIds.length ? 'selected' : 'idle';
      return renderAll();
    }

    if (act === 'continue') {
      S.thread.push({ type: 'note', text: 'Ghi nhận. Bạn học tiếp nhé.' });
      S.phase = 'done';
      return renderTutor();
    }

    if (act === 'toggle-basis') {
      S.showBasis = !S.showBasis;
      return renderTutor();
    }

    if (act === 'disagree') return startCorrection();

    if (act === 'retry-answer') {
      S.phase = 'question';
      S.composerMode = 'teachback';
      renderTutor();
      el.askInput.focus();
      return;
    }
  }

  /* ====================== RENDER ====================== */

  function renderAll() {
    renderMaterials();
    renderPageTabs();
    renderSlide();
    renderSelectionChip();
    renderSuggested();
    renderTutor();
  }

  function renderMaterials() {
    document.querySelectorAll('[data-doc]').forEach(function (button) {
      var active = button.getAttribute('data-doc') === S.docCode;
      button.classList.toggle('material-active', active);
      button.setAttribute('aria-current', active ? 'true' : 'false');
    });
    document.querySelectorAll('[data-day-card]').forEach(function (card) {
      card.classList.toggle('day-active', card.getAttribute('data-day-card') === S.docCode);
    });
  }

  function renderModeBadge(mode) {
    if (mode.mode === 'live') {
      el.modeBadge.className = 'badge badge-live';
      el.modeBadge.textContent = 'AI thật · ' + (mode.model || mode.provider || 'OpenAI');
    } else {
      el.modeBadge.className = 'badge badge-error';
      el.modeBadge.textContent = 'AI chưa sẵn sàng';
    }
    el.modeBadge.title = mode.reason || '';
  }

  function renderPageTabs() {
    var pages = window.SlideContext.pages(S.docCode);
    el.pageTabs.innerHTML = pages.map(function (p) {
      return '<button type="button" class="tab' + (p === S.page ? ' tab-on' : '') +
             '" data-page="' + p + '">Trang ' + p + '</button>';
    }).join('');
  }

  function renderSlide() {
    var doc = window.SlideContext.getDoc(S.docCode);
    var page = window.SlideContext.getPage(S.docCode, S.page);

    el.docTitle.textContent = doc.docTitle || 'VLearn Reader';
    el.slideMeta.innerHTML = 'Trang <strong>' + S.page + '</strong> / ' +
      (doc.pageCount || doc.pages.length);
    if (doc.pdfUrl) {
      var pdfTarget = doc.pdfUrl + '#page=' + S.page + '&toolbar=0&navpanes=0&view=FitH';
      if (el.pdfFrame.getAttribute('src') !== pdfTarget) el.pdfFrame.setAttribute('src', pdfTarget);
      el.pdfDownload.href = doc.pdfUrl;
      el.pdfFrame.hidden = false;
    } else {
      el.pdfFrame.removeAttribute('src');
      el.pdfFrame.hidden = true;
      el.pdfDownload.removeAttribute('href');
    }

    if (!page) { el.slideBody.innerHTML = ''; return; }

    if (!page.passages.length) {
      el.slideBody.innerHTML =
        '<h2 class="slide-h">' + esc(page.heading) + '</h2>' +
        '<div class="empty-page">Không lấy được nội dung trang này.<br>' +
        'Không có đoạn nào để bôi đen, nên Grounding Gate sẽ chặn Micro-Check.</div>';
      return;
    }

    el.slideBody.innerHTML =
      '<h2 class="slide-h">' + esc(page.heading) + '</h2>' +
      page.passages.map(function (p) {
        var on = S.selectedPassageIds.indexOf(p.id) !== -1;
        return '<div class="passage' + (on ? ' passage-on' : '') + '" data-passage="' + esc(p.id) + '" role="button" tabindex="0">' +
               '<p>' + esc(p.text) + '</p>' +
               '<span class="src">[' + esc(p.src) + ']</span></div>';
      }).join('');
  }

  function renderSelectionChip() {
    var n = S.selectedPassageIds.length;
    if (!n) {
      el.selectionChip.className = 'selection-chip selection-empty';
      el.selectionChip.textContent = 'Trang ' + S.page + ' · chưa có context kiểm chứng';
      return;
    }
    var ctx = currentContext();
    el.selectionChip.className = 'selection-chip';
    el.selectionChip.innerHTML =
      '<strong>Trang slide: ' + S.page + '</strong> · nguồn ' + esc(ctx.sourceCodes.join(', '));
  }

  function renderSuggested() {
    var list = window.SlideContext.suggested(S.page);
    el.suggested.innerHTML = list.map(function (q) {
      return '<button type="button" class="chip" data-suggest="' + esc(q) + '">' + esc(q) + '</button>';
    }).join('');
  }

  function renderTutor() {
    var htmlContent = S.thread.length
      ? S.thread.map(renderBlock).join('')
      : '<div class="welcome-card"><span class="spark">✦</span>' +
        '<h2>Hỏi ngay trên slide</h2>' +
        '<p>Tutor trả lời theo trang đang đọc. Sau đó làm một Micro-Check 30 giây để tự kiểm tra mức hiểu.</p></div>';

    if (S.request.status === 'loading') {
      htmlContent +=
        '<div class="ai-loading" role="status">' +
        '<span class="spinner" aria-hidden="true"></span>' +
        esc(loadingLabel(S.request.step)) +
        '</div>';
    }

    if (S.request.status === 'error') {
      htmlContent +=
        '<div class="ai-error" role="alert">' +
        '<strong>Không gọi được AI</strong>' +
        '<p>' + esc(S.request.error.message) + '</p>' +
        '<p class="card-note">Không thể tự chuyển sang mock.</p>' +
        '<button type="button" class="btn btn-primary" data-action="retry-ai">Thử lại</button>' +
        '</div>';
    }

    el.thread.innerHTML = htmlContent;

    var teach = S.composerMode === 'teachback';
    el.askInput.placeholder = teach
      ? 'Trả lời bằng một câu, dùng từ của bạn…'
      : 'Hỏi về đoạn bạn vừa chọn…';
    el.btnAsk.textContent = teach ? '✓' : '↑';
    el.btnAsk.setAttribute('aria-label', teach ? 'Gửi câu trả lời' : 'Gửi câu hỏi');
    el.suggested.hidden = teach;

    var isLoading = S.request.status === 'loading';
    el.askInput.disabled = isLoading;
    el.btnAsk.disabled = isLoading;

    el.thread.scrollTop = el.thread.scrollHeight;
  }

  function renderBlock(b) {
    switch (b.type) {
      case 'student':
        return '<div class="msg msg-student' + (b.teachback ? ' msg-teachback' : '') + '">' +
               (b.teachback ? '<span class="msg-tag">Teach-back</span>' : '') +
               '<p>' + esc(b.text) + '</p></div>';

      case 'tutor':
        return '<div class="msg msg-tutor"><p>' + esc(b.text) + '</p>' +
               (b.citations && b.citations.length
                 ? '<div class="cites">' + b.citations.map(function (c) {
                     return '<button type="button" class="cite" data-action="jump-page" data-page="' + c +
                            '">Trang ' + c + '</button>';
                   }).join('') + '</div>'
                 : '<div class="cites cites-none">Không có trích dẫn</div>') +
               '</div>';

      case 'guard':
        return '<div class="card card-alert"><strong>' + esc(b.title) + '</strong>' +
               '<p>' + esc(b.message) + '</p>' +
               '<div class="card-actions"><button type="button" class="btn btn-ghost" data-action="reask">Hỏi lại về trang đang mở</button></div>' +
               '</div>';

      case 'gate':
        return renderGate(b.gate);

      case 'review-choice':
        return '<div class="card card-warn"><strong>Bạn chọn cách xử lý</strong>' +
               '<p>Mình không tự kết luận trích dẫn này sai — có thể nội dung liên quan thật, cần đối chiếu.</p>' +
               '<div class="card-actions">' +
               (b.cited || []).map(function (c) {
                 return '<button type="button" class="btn btn-ghost" data-action="jump-page" data-page="' + c +
                        '">Mở trang ' + c + ' để đối chiếu</button>';
               }).join('') +
               '<button type="button" class="btn btn-primary" data-action="accept-cross-page">Vẫn kiểm tra theo trang ' + S.page + '</button>' +
               '</div></div>';

      case 'offer':
        return '<div class="card card-offer">' +
               '<button type="button" class="btn btn-check" data-action="start-check">Kiểm tra tôi · 30 giây</button>' +
               '<button type="button" class="btn btn-ghost" data-action="skip-check">Bỏ qua</button>' +
               '<p class="card-note">Không tính điểm. Bỏ qua lúc nào cũng được.</p>' +
               '</div>';

      case 'question':
        return '<div class="card card-question">' +
               '<span class="card-label">Kiểm tra tôi · trang ' + S.page + '</span>' +
               '<p class="q">' + esc(b.question.question) + '</p>' +
               '<p id="countdown" class="countdown">Còn 30 giây — không bắt buộc</p>' +
               '</div>';

      case 'result':
        return renderResult(b.verdict, b.feedback);

      case 'basis':
        return renderBasis();

      case 'note':
        return '<div class="note">' + esc(b.text) + '</div>';

      default:
        return '';
    }
  }

  function renderGate(g) {
    var cls = g.status === 'pass' ? 'gate-pass' : (g.status === 'review' ? 'gate-review' : 'gate-block');
    var icon = g.status === 'pass' ? 'Đã xác minh' : (g.status === 'review' ? 'Cần đối chiếu' : 'Chưa đủ căn cứ');
    var extra = '';
    if (g.status !== 'pass' && g.cited && g.cited.length) {
      extra = '<p class="gate-extra">Câu trả lời trích: trang ' + g.cited.join(', ') +
              ' · bạn đang chọn: trang ' + S.page + '</p>';
    }
    var actions = '';
    if (g.action === 'select_passage' || g.action === 'select_other_page') {
      actions = '<div class="card-actions"><span class="card-note">Chọn một đoạn có nội dung ở slide bên trái.</span></div>';
    } else if (g.action === 'reask') {
      actions = '<div class="card-actions"><button type="button" class="btn btn-ghost" data-action="reask">Hỏi lại</button></div>';
    }
    return '<div class="gate ' + cls + '">' +
           '<span class="gate-badge">Grounding Gate · ' + icon + '</span>' +
           '<strong>' + esc(g.title) + '</strong>' +
           '<p>' + esc(g.message) + '</p>' + extra + actions +
           '</div>';
  }

  function renderResult(v, f) {
    var actions = '';
    if (v.next_action === 'continue') {
      actions = '<button type="button" class="btn btn-primary" data-action="continue">Tiếp tục học</button>';
    } else if (v.next_action === 'clarify') {
      actions = '<button type="button" class="btn btn-primary" data-action="retry-answer">Trả lời rõ hơn</button>';
    } else {
      actions = '<button type="button" class="btn btn-primary" data-action="continue">Đã củng cố, học tiếp</button>' +
                '<button type="button" class="btn btn-ghost" data-action="retry-answer">Trả lời lại</button>';
    }

    return '<div class="card card-result tone-' + f.tone + '">' +
           '<div class="result-head">' +
             '<span class="state-chip">' + esc(f.label) + '</span>' +
             '<span class="conf">Độ tin cậy: ' + esc(v.confidence) + '</span>' +
             (v.is_correction ? '<span class="conf">Đánh giá lại lần ' + S.correctionRound + '</span>' : '') +
           '</div>' +
           '<p class="result-headline">' + esc(f.headline) + '</p>' +
           '<p class="result-body">' + esc(f.body) + '</p>' +
           (f.reinforce ? '<div class="reinforce"><span class="card-label">Một bước củng cố</span><p>' + esc(f.reinforce) + '</p></div>' : '') +
           '<p class="evidence">Căn cứ trong câu của bạn: ' + esc(v.evidence_from_student) + '</p>' +
           '<p class="source-line">' + esc(f.sourceLine) + '</p>' +
           '<div class="card-actions">' + actions +
             '<button type="button" class="btn btn-ghost" data-action="toggle-basis">' +
               (S.showBasis ? 'Ẩn căn cứ AI đã dùng' : 'Xem căn cứ AI đã dùng') + '</button>' +
             '<button type="button" class="btn btn-ghost btn-disagree" data-action="disagree">Tôi không đồng ý</button>' +
           '</div>' +
           (S.showBasis ? renderBasis() : '') +
           '</div>';
  }

  function renderBasis() {
    var ctx = currentContext();
    var q = S.question;
    var v = S.verdict;
    var mode = window.AiClient.getMode();
    var rows = [
      ['Tài liệu', S.docCode],
      ['Trang', String(S.page)],
      ['Đoạn đã chọn', ctx.sourceCodes.join(', ') || '(không)'],
      ['Trích dẫn của Tutor', S.answer ? (S.answer.citations.join(', ') || '(không)') : '(không)'],
      ['Grounding Gate', S.gate ? (S.gate.status + ' · ' + S.gate.reason) : '(chưa chạy)'],
      ['Câu Micro-Check', q ? q.question : '(chưa sinh)'],
      ['Chế độ quyết định', mode.mode === 'live' ? ('AI thật · ' + (mode.model || mode.provider || 'OpenAI')) : 'AI chưa sẵn sàng']
    ];
    if (v) {
      rows.push(['Ý đúng khớp', (v.matched_key_points || []).join(', ') || '(không)']);
      rows.push(['Misconception khớp', v.matched_misconception || '(không)']);
      rows.push(['Luật đã chạy', v.reason || '(không ghi)']);
    }
    return '<div class="basis"><span class="card-label">Căn cứ đã dùng</span><dl>' +
           rows.map(function (r) {
             return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>';
           }).join('') +
           '</dl><p class="card-note">Bảng này là nội dung của trace log — tải được ở nút Trace.</p></div>';
  }

  function renderTrace() {
    var entries = window.Trace.all();
    if (!entries.length) {
      el.traceBody.innerHTML = '<p class="card-note">Chưa có bước nào được ghi.</p>';
      return;
    }
    el.traceBody.innerHTML = entries.map(function (t) {
      return '<div class="trace-item">' +
             '<div class="trace-head"><span class="mono">#' + t.seq + ' ' + esc(t.step) + '</span>' +
             '<span class="trace-meta">' + esc(t.mode) + (t.model ? ' · ' + esc(t.model) : '') +
             (t.latency_ms !== null ? ' · ' + t.latency_ms + 'ms' : '') + '</span></div>' +
             '<pre>' + esc(JSON.stringify({ context: t.context, input: t.input, output: t.output }, null, 2)) + '</pre>' +
             '</div>';
    }).join('');
  }

  /* ====================== HELPERS ====================== */

  function currentContext() {
    return window.SlideContext.build(S.docCode, S.page, S.selectedPassageIds);
  }

  function openDocument(docCode) {
    var pages = window.SlideContext.pages(docCode);
    if (!pages.length) return;
    S.docCode = docCode;
    el.docSelect.value = docCode;
    S.page = pages[0];
    resetRound();
    selectDefaultContext();
    renderAll();
  }

  function selectDefaultContext() {
    var page = window.SlideContext.getPage(S.docCode, S.page);
    S.selectedPassageIds = page
      ? page.passages.map(function (p) { return p.id; })
      : [];
    S.phase = S.selectedPassageIds.length ? 'selected' : 'idle';
  }

  function resetRound(keepSelection) {
    stopCountdown();
    finishRequest();
    S.thread = [];
    S.answer = null;
    S.gate = null;
    S.question = null;
    S.verdict = null;
    S.feedback = null;
    S.composerMode = 'ask';
    S.correctionRound = 0;
    S.showBasis = false;
    S.lastStudentAnswer = '';
    if (!keepSelection) S.selectedPassageIds = [];
    S.phase = S.selectedPassageIds.length ? 'selected' : 'idle';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ====================== GO ====================== */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
