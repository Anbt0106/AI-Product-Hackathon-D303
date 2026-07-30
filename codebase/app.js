/* ============================================================================
 * app.js — VLearn live student flow bound to immutable PDF page snapshots.
 * ========================================================================== */

(function () {
  'use strict';

  var S = {
    docCode: null,
    activePageContext: null,
    roundContext: null,
    readerStatus: 'loading-document',
    reader: null,
    roundId: 0,
    phase: 'idle',
    thread: [],
    composerMode: 'ask',
    answer: null,
    gate: null,
    question: null,
    verdict: null,
    feedback: null,
    lastStudentAnswer: '',
    correctionRound: 0,
    countdown: null,
    countdownLeft: 30,
    showBasis: false,
    request: idleRequest()
  };

  var el = {};
  function $(id) { return document.getElementById(id); }

  function idleRequest() {
    return { step: null, status: 'idle', error: null, retry: null };
  }

  function cacheDom() {
    el.docSelect = $('doc-select');
    el.slideMeta = $('slide-meta');
    el.pdfReader = $('pdf-reader');
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

  function init() {
    cacheDom();
    var docs = window.SlideContext.docs().filter(function (doc) {
      return !!doc.pdfUrl;
    });
    el.docSelect.innerHTML = docs.map(function (doc) {
      return '<option value="' + esc(doc.docCode) + '">' +
        esc(doc.docTitle) + '</option>';
    }).join('');

    bindEvents();
    S.reader = window.PdfReader.create({
      container: el.pdfReader,
      onStatus: onReaderStatus,
      onActivePage: onActivePage
    });

    window.AiClient.onModeChange(renderModeBadge);
    window.AiClient.probe();
    renderModeBadge(window.AiClient.getMode());
    window.Trace.onChange(function (entries) {
      if (el.btnTrace) el.btnTrace.textContent = 'Trace (' + entries.length + ')';
      if (el.traceDrawer && !el.traceDrawer.hidden) renderTrace();
    });

    openDocument(docs[0].docCode);
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
    el.btnAsk.addEventListener('click', onComposerSubmit);
    el.askInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        onComposerSubmit();
      }
    });
    el.suggested.addEventListener('click', function (event) {
      var button = event.target.closest('[data-suggest]');
      if (!button) return;
      el.askInput.value = button.getAttribute('data-suggest');
      onComposerSubmit();
    });
    el.thread.addEventListener('click', onThreadClick);
    if ($('btn-trace')) {
      $('btn-trace').addEventListener('click', function () {
        el.traceDrawer.hidden = !el.traceDrawer.hidden;
        if (!el.traceDrawer.hidden) renderTrace();
      });
    }
    $('btn-trace-close').addEventListener('click', function () {
      el.traceDrawer.hidden = true;
    });
    $('btn-trace-download').addEventListener('click', function () {
      window.Trace.download();
    });
  }

  /* ====================== READER ====================== */

  function openDocument(docCode) {
    var doc = window.SlideContext.getDoc(docCode);
    if (!doc || !doc.pdfUrl) return;
    S.docCode = docCode;
    S.activePageContext = null;
    S.readerStatus = 'loading-document';
    el.docSelect.value = docCode;
    clearRoundResult();
    renderAll();
    S.reader.open(doc);
  }

  function onReaderStatus(status) {
    S.readerStatus = status.type;
    renderReaderMeta();
    renderSelectionChip();
    renderTutor();
  }

  function onActivePage(pageContext) {
    S.activePageContext = pageContext;
    S.docCode = pageContext.documentCode;
    S.readerStatus = 'page-ready';
    renderReaderMeta();
    renderSelectionChip();
    renderSuggested();
    renderTutor();
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
    S.request = idleRequest();
    updateAiStatus('');
  }

  function retryFailedStep() {
    if (S.request.status === 'error' && typeof S.request.retry === 'function') {
      S.request.retry();
    }
  }

  function loadingLabel(step) {
    if (step === 'tutor') return 'AI đang trả lời câu hỏi của bạn…';
    if (step === 'question') return 'AI đang sinh câu kiểm tra…';
    if (step === 'classify') return 'AI đang đánh giá câu trả lời…';
    return 'AI đang xử lý…';
  }

  function updateAiStatus(message) {
    var status = $('ai-status');
    if (status) status.textContent = message || '';
  }

  /* ====================== LIVE AI FLOW ====================== */

  function onComposerSubmit() {
    if (S.request.status === 'loading') return;
    var text = el.askInput.value.trim();
    if (!text) return;
    if (S.composerMode === 'teachback') submitTeachBack(text);
    else askTutor(text);
  }

  function askTutor(text, isRetry, capturedPageContext) {
    var pageContext = capturedPageContext || S.activePageContext;
    if (!pageContext) {
      S.thread.push({
        type: 'note',
        text: 'Trang đang mở chưa sẵn sàng. Hãy chờ ảnh và nội dung tải xong.'
      });
      return renderTutor();
    }

    var guard = window.ScopeGuard.check(text);
    if (guard) {
      S.thread.push({
        type: 'guard',
        title: guard.title,
        message: guard.message,
        sourceLabel: sourceLabel(pageContext)
      });
      S.phase = 'blocked';
      return renderTutor();
    }

    if (!isRetry) {
      clearRoundResult();
      S.roundContext = pageContext;
      S.roundId += 1;
      S.thread.push({
        type: 'student',
        text: text,
        roundId: S.roundId,
        sourceLabel: sourceLabel(pageContext)
      });
    }
    var roundId = S.roundId;
    var context = currentContext(pageContext);
    el.askInput.value = '';
    beginRequest('tutor', function () {
      askTutor(text, true, pageContext);
    });
    renderTutor();

    window.AiClient.answerTutor({ question: text, context: context })
      .then(function (result) {
        finishRequest();
        S.answer = {
          text: result.answer,
          citations: result.citations,
          docCode: pageContext.documentCode
        };
        S.thread.push({
          type: 'tutor',
          text: result.answer,
          citations: result.citations,
          pageNumber: pageContext.pageNumber,
          roundId: roundId,
          sourceLabel: sourceLabel(pageContext)
        });
        applyGroundingGate(pageContext, roundId);
        renderTutor();
      })
      .catch(function (error) {
        failRequest('tutor', error, function () {
          askTutor(text, true, pageContext);
        });
        renderTutor();
      });
  }

  function applyGroundingGate(pageContext, roundId) {
    var gate = window.GroundingGate.check({
      pageContext: pageContext,
      answer: S.answer
    });
    S.gate = gate;
    S.thread.push({
      type: 'gate',
      gate: gate,
      roundId: roundId,
      sourceLabel: sourceLabel(pageContext)
    });
    if (gate.status === 'pass') {
      S.phase = 'offered';
      S.thread.push({
        type: 'offer',
        roundId: roundId,
        sourceLabel: sourceLabel(pageContext)
      });
    } else {
      S.phase = 'blocked';
    }
  }

  function startMicroCheck() {
    var pageContext = S.roundContext;
    if (!pageContext || !S.gate || S.gate.status !== 'pass') return;
    var context = currentContext(pageContext);
    var roundId = S.roundId;
    beginRequest('question', startMicroCheck);
    S.phase = 'loading-question';
    renderTutor();

    window.AiClient.generateQuestion(context, S.gate)
      .then(function (question) {
        finishRequest();
        S.question = question;
        S.phase = 'question';
        S.composerMode = 'teachback';
        S.thread.push({
          type: 'question',
          question: question,
          roundId: roundId,
          sourceLabel: sourceLabel(pageContext)
        });
        startCountdown();
        renderTutor();
        el.askInput.focus();
      })
      .catch(function (error) {
        failRequest('question', error, startMicroCheck);
        renderTutor();
      });
  }

  function submitTeachBack(text, isRetry) {
    var pageContext = S.roundContext;
    if (!pageContext || !S.question) return;
    var roundId = S.roundId;
    el.askInput.value = '';
    stopCountdown();
    S.lastStudentAnswer = text;
    if (!isRetry) {
      S.thread.push({
        type: 'student',
        text: text,
        teachback: true,
        roundId: roundId,
        sourceLabel: sourceLabel(pageContext)
      });
    }
    S.phase = 'loading-verdict';
    S.composerMode = 'ask';
    beginRequest('classify', function () {
      submitTeachBack(text, true);
    });
    renderTutor();

    window.AiClient.classify({
      answer: text,
      question: S.question,
      context: currentContext(pageContext),
      gate: S.gate
    })
      .then(function (verdict) {
        finishRequest();
        if (S.correctionRound > 0) verdict.is_correction = true;
        S.verdict = verdict;
        S.feedback = window.FeedbackComposer.compose(verdict, S.question);
        S.phase = 'result';
        S.thread.push({
          type: 'result',
          verdict: verdict,
          feedback: S.feedback,
          roundId: roundId,
          sourceLabel: sourceLabel(pageContext)
        });
        renderTutor();
      })
      .catch(function (error) {
        failRequest('classify', error, function () {
          submitTeachBack(text, true);
        });
        renderTutor();
      });
  }

  function startCorrection() {
    var currentRound = S.roundId;
    S.correctionRound += 1;
    S.showBasis = false;
    S.thread = S.thread.filter(function (block) {
      return !(block.type === 'result' && block.roundId === currentRound);
    });
    S.thread.push({
      type: 'note',
      text: 'Kết quả cũ đã được bỏ. Bạn sửa câu trả lời để AI đánh giá lại.',
      sourceLabel: sourceLabel(S.roundContext)
    });
    S.verdict = null;
    S.feedback = null;
    S.phase = 'question';
    S.composerMode = 'teachback';
    el.askInput.value = S.lastStudentAnswer;
    window.Trace.add('correction_requested', {
      mode: 'ui',
      context: window.PageContext.safeTrace(S.roundContext),
      input: { previous_answer: S.lastStudentAnswer },
      output: {
        correction_round: S.correctionRound,
        previous_verdict_discarded: true
      }
    });
    renderTutor();
    el.askInput.focus();
  }

  /* ====================== EVENTS ====================== */

  function onThreadClick(event) {
    var button = event.target.closest('[data-action]');
    if (!button) return;
    var action = button.getAttribute('data-action');
    if (action === 'retry-ai') return retryFailedStep();
    if (action === 'start-check') return startMicroCheck();
    if (action === 'continue-reading' || action === 'continue') {
      S.thread.push({
        type: 'note',
        text: 'Bạn tiếp tục đọc. Lịch sử của lượt này vẫn được giữ.'
      });
      S.phase = 'done';
      S.composerMode = 'ask';
      return renderTutor();
    }
    if (action === 'jump-page') {
      S.reader.scrollTo(Number(button.getAttribute('data-page')));
      return;
    }
    if (action === 'reask') {
      S.composerMode = 'ask';
      clearRoundResult();
      return renderTutor();
    }
    if (action === 'toggle-basis') {
      S.showBasis = !S.showBasis;
      return renderTutor();
    }
    if (action === 'disagree') return startCorrection();
    if (action === 'retry-answer') {
      S.phase = 'question';
      S.composerMode = 'teachback';
      renderTutor();
      el.askInput.focus();
    }
  }

  /* ====================== COUNTDOWN ====================== */

  function startCountdown() {
    stopCountdown();
    S.countdownLeft = 30;
    S.countdown = setInterval(function () {
      S.countdownLeft -= 1;
      var node = $('countdown');
      if (!node) return stopCountdown();
      if (S.countdownLeft > 0) {
        node.textContent = 'Còn ' + S.countdownLeft + ' giây — không bắt buộc';
      } else {
        node.textContent = 'Hết 30 giây — bạn vẫn trả lời được';
        node.classList.add('countdown-done');
        stopCountdown();
      }
    }, 1000);
  }

  function stopCountdown() {
    if (S.countdown) clearInterval(S.countdown);
    S.countdown = null;
  }

  /* ====================== RENDER ====================== */

  function renderAll() {
    renderMaterials();
    renderReaderMeta();
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
      card.classList.toggle(
        'day-active',
        card.getAttribute('data-day-card') === S.docCode
      );
    });
  }

  function renderReaderMeta() {
    var doc = window.SlideContext.getDoc(S.docCode);
    if (!doc) return;
    el.docTitle.textContent = doc.docTitle || 'VLearn Reader';
    if (S.activePageContext) {
      el.slideMeta.innerHTML = 'Trang <strong>' +
        S.activePageContext.pageNumber + '</strong> / ' +
        S.activePageContext.pageCount;
    } else {
      el.slideMeta.textContent = S.readerStatus === 'document-error'
        ? 'Không tải được tài liệu'
        : 'Đang chuẩn bị trang…';
    }
    if (doc.pdfUrl) el.pdfDownload.href = doc.pdfUrl;
    else el.pdfDownload.removeAttribute('href');
  }

  function renderSelectionChip() {
    if (!S.activePageContext) {
      el.selectionChip.className = 'selection-chip selection-empty';
      el.selectionChip.textContent = S.readerStatus === 'document-error'
        ? 'Không có ngữ cảnh trang'
        : 'Đang chuẩn bị nội dung trang…';
      return;
    }
    el.selectionChip.className = 'selection-chip';
    el.selectionChip.innerHTML =
      '<strong>Trang ' + S.activePageContext.pageNumber + '</strong> · nguồn ' +
      esc(S.activePageContext.sourceId);
  }

  function renderSuggested() {
    if (!S.activePageContext) {
      el.suggested.innerHTML = '';
      return;
    }
    var questions = window.SlideContext.suggested(
      S.activePageContext.pageNumber
    );
    el.suggested.innerHTML = questions.map(function (question) {
      return '<button type="button" class="chip" data-suggest="' +
        esc(question) + '">' + esc(question) + '</button>';
    }).join('');
  }

  function renderTutor() {
    var content = S.thread.length
      ? S.thread.map(renderBlock).join('')
      : '<div class="welcome-card"><span class="spark">✦</span>' +
        '<h2>Hỏi ngay trên trang đang xem</h2>' +
        '<p>Cuộn đến trang cần học, hỏi Tutor, rồi chọn kiểm tra lại kiến thức.</p></div>';

    if (S.request.status === 'loading') {
      content += '<div class="ai-loading" role="status">' +
        '<span class="spinner" aria-hidden="true"></span>' +
        esc(loadingLabel(S.request.step)) + '</div>';
    }
    if (S.request.status === 'error') {
      content += '<div class="ai-error" role="alert">' +
        '<strong>Không gọi được AI</strong>' +
        '<p>' + esc(S.request.error.message) + '</p>' +
        '<p class="card-note">Không thể tự chuyển sang mock.</p>' +
        '<button type="button" class="btn btn-primary" data-action="retry-ai">Thử lại</button>' +
        '</div>';
    }
    el.thread.innerHTML = content;

    var teachback = S.composerMode === 'teachback';
    el.askInput.placeholder = teachback
      ? 'Trả lời bằng một câu, dùng từ của bạn…'
      : (S.activePageContext
        ? 'Hỏi về trang đang xem…'
        : 'Đang chuẩn bị nội dung trang…');
    el.btnAsk.textContent = teachback ? '✓' : '↑';
    el.btnAsk.setAttribute(
      'aria-label',
      teachback ? 'Gửi câu trả lời' : 'Gửi câu hỏi'
    );
    el.suggested.hidden = teachback;
    var blocked = S.request.status === 'loading' ||
      (!teachback && !S.activePageContext);
    el.askInput.disabled = blocked;
    el.btnAsk.disabled = blocked;
    el.thread.scrollTop = el.thread.scrollHeight;
  }

  function renderBlock(block) {
    var tag = renderSourceTag(block);
    if (block.type === 'student') {
      return '<div class="msg msg-student' +
        (block.teachback ? ' msg-teachback' : '') + '">' + tag +
        (block.teachback ? '<span class="msg-tag">Teach-back</span>' : '') +
        '<p>' + esc(block.text) + '</p></div>';
    }
    if (block.type === 'tutor') {
      return '<div class="msg msg-tutor">' + tag +
        '<p>' + esc(block.text) + '</p>' +
        '<div class="cites">' +
        (block.citations || []).map(function (citation) {
          return '<button type="button" class="cite" data-action="jump-page" ' +
            'data-page="' + block.pageNumber + '">' +
            esc(citation) + '</button>';
        }).join('') + '</div></div>';
    }
    if (block.type === 'guard') {
      return '<div class="card card-alert">' + tag +
        '<strong>' + esc(block.title) + '</strong>' +
        '<p>' + esc(block.message) + '</p>' +
        '<button class="btn btn-ghost" data-action="reask">Hỏi lại</button></div>';
    }
    if (block.type === 'gate') return tag + renderGate(block.gate);
    if (block.type === 'offer') {
      return '<div class="card card-offer">' + tag +
        '<button type="button" class="btn btn-check" data-action="start-check">' +
        'Kiểm tra lại kiến thức</button>' +
        '<button type="button" class="btn btn-ghost" data-action="continue-reading">' +
        'Tiếp tục đọc</button>' +
        '<p class="card-note">Một câu teach-back khoảng 30 giây, không tính điểm.</p></div>';
    }
    if (block.type === 'question') {
      return '<div class="card card-question">' + tag +
        '<span class="card-label">Kiểm tra lại kiến thức</span>' +
        '<p class="q">' + esc(block.question.question) + '</p>' +
        '<p id="countdown" class="countdown">Còn 30 giây — không bắt buộc</p></div>';
    }
    if (block.type === 'result') {
      return renderResult(block.verdict, block.feedback, block);
    }
    if (block.type === 'note') {
      return '<div class="note">' + tag + esc(block.text) + '</div>';
    }
    return '';
  }

  function renderGate(gate) {
    var pass = gate.status === 'pass';
    return '<div class="gate ' + (pass ? 'gate-pass' : 'gate-block') + '">' +
      '<span class="gate-badge">Grounding Gate · ' +
      (pass ? 'Đã xác minh' : 'Chưa đủ căn cứ') + '</span>' +
      '<strong>' + esc(gate.title) + '</strong>' +
      '<p>' + esc(gate.message) + '</p></div>';
  }

  function renderResult(verdict, feedback, block) {
    var actions = verdict.next_action === 'clarify'
      ? '<button class="btn btn-primary" data-action="retry-answer">Trả lời rõ hơn</button>'
      : '<button class="btn btn-primary" data-action="continue">Tiếp tục học</button>';
    if (verdict.next_action === 'reinforce') {
      actions += '<button class="btn btn-ghost" data-action="retry-answer">Trả lời lại</button>';
    }
    return '<div class="card card-result tone-' + feedback.tone + '">' +
      renderSourceTag(block) +
      '<div class="result-head"><span class="state-chip">' +
      esc(feedback.label) + '</span><span class="conf">Độ tin cậy: ' +
      esc(verdict.confidence) + '</span></div>' +
      '<p class="result-headline">' + esc(feedback.headline) + '</p>' +
      '<p class="result-body">' + esc(feedback.body) + '</p>' +
      (feedback.reinforce
        ? '<div class="reinforce"><span class="card-label">Một bước củng cố</span><p>' +
          esc(feedback.reinforce) + '</p></div>'
        : '') +
      '<p class="evidence">Căn cứ trong câu của bạn: ' +
      esc(verdict.evidence_from_student) + '</p>' +
      '<p class="source-line">' + esc(feedback.sourceLine) + '</p>' +
      '<div class="card-actions">' + actions +
      '<button class="btn btn-ghost" data-action="toggle-basis">' +
      (S.showBasis ? 'Ẩn căn cứ AI đã dùng' : 'Xem căn cứ AI đã dùng') +
      '</button><button class="btn btn-ghost btn-disagree" data-action="disagree">' +
      'Tôi không đồng ý</button></div>' +
      (S.showBasis ? renderBasis() : '') + '</div>';
  }

  function renderBasis() {
    var page = S.roundContext;
    var mode = window.AiClient.getMode();
    var rows = [
      ['Tài liệu', page ? page.documentTitle : '(không)'],
      ['Trang', page ? String(page.pageNumber) : '(không)'],
      ['Nguồn', page ? page.sourceId : '(không)'],
      ['Trích dẫn Tutor', S.answer ? S.answer.citations.join(', ') : '(không)'],
      ['Grounding Gate', S.gate ? S.gate.status + ' · ' + S.gate.reason : '(chưa)'],
      ['Câu kiểm tra', S.question ? S.question.question : '(chưa)'],
      ['AI', mode.mode === 'live' ? mode.model : 'chưa sẵn sàng']
    ];
    return '<div class="basis"><span class="card-label">Căn cứ đã dùng</span><dl>' +
      rows.map(function (row) {
        return '<dt>' + esc(row[0]) + '</dt><dd>' + esc(row[1]) + '</dd>';
      }).join('') + '</dl></div>';
  }

  function renderTrace() {
    var entries = window.Trace.all();
    if (!entries.length) {
      el.traceBody.innerHTML = '<p class="card-note">Chưa có bước nào được ghi.</p>';
      return;
    }
    el.traceBody.innerHTML = entries.map(function (entry) {
      return '<div class="trace-item"><div class="trace-head">' +
        '<span class="mono">#' + entry.seq + ' ' + esc(entry.step) + '</span>' +
        '<span class="trace-meta">' + esc(entry.mode) +
        (entry.model ? ' · ' + esc(entry.model) : '') +
        (entry.latency_ms !== null ? ' · ' + entry.latency_ms + 'ms' : '') +
        '</span></div><pre>' +
        esc(JSON.stringify({
          context: entry.context,
          input: entry.input,
          output: entry.output
        }, null, 2)) + '</pre></div>';
    }).join('');
  }

  function renderModeBadge(mode) {
    if (mode.mode === 'live') {
      el.modeBadge.className = 'badge badge-live';
      el.modeBadge.textContent = mode.model || mode.provider || 'OpenAI';
    } else {
      el.modeBadge.className = 'badge badge-error';
      el.modeBadge.textContent = 'AI chưa sẵn sàng';
    }
    el.modeBadge.title = mode.reason || '';
  }

  /* ====================== HELPERS ====================== */

  function currentContext(pageContext) {
    return {
      docCode: pageContext.documentCode,
      docTitle: pageContext.documentTitle,
      selectedPage: pageContext.pageNumber,
      heading: 'Trang ' + pageContext.pageNumber,
      selectedText: pageContext.text,
      sourceCodes: [pageContext.sourceId],
      passages: [{
        id: pageContext.sourceId,
        src: pageContext.sourceId,
        text: pageContext.text
      }],
      pageContext: pageContext
    };
  }

  function clearRoundResult() {
    stopCountdown();
    finishRequest();
    S.roundContext = null;
    S.answer = null;
    S.gate = null;
    S.question = null;
    S.verdict = null;
    S.feedback = null;
    S.composerMode = 'ask';
    S.correctionRound = 0;
    S.showBasis = false;
    S.lastStudentAnswer = '';
    S.phase = 'idle';
  }

  function sourceLabel(pageContext) {
    return pageContext
      ? pageContext.documentTitle + ' · Trang ' + pageContext.pageNumber
      : '';
  }

  function renderSourceTag(block) {
    return block && block.sourceLabel
      ? '<span class="msg-source">' + esc(block.sourceLabel) + '</span>'
      : '';
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
