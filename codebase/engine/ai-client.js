/* ============================================================================
 * engine/ai-client.js — ĐIỂM NỐI AI (Live Only cho Student Demo)
 * ----------------------------------------------------------------------------
 * Kết nối với /api/health, /api/tutor, /api/question, /api/classify.
 * Không fallback về mock khi có lỗi API.
 * ========================================================================== */

window.AiClient = (function () {

  var state = {
    mode: 'unavailable',   // 'unavailable' | 'live'
    provider: null,        // 'openai' | null
    model: null,
    probed: false,
    reason: 'chưa thăm dò',
    liveSteps: []
  };

  var listeners = [];
  function onModeChange(fn) { listeners.push(fn); }
  function emit() { listeners.forEach(function (fn) { fn(getMode()); }); }
  function getMode() { return JSON.parse(JSON.stringify(state)); }

  function publicError(status, body) {
    var error = new Error(body && body.error || 'Không gọi được AI.');
    error.status = status;
    error.code = body && body.code || 'request_failed';
    return error;
  }

  function requireLive(step) {
    if (state.mode !== 'live' || state.liveSteps.indexOf(step) === -1) {
      var error = new Error('AI chưa sẵn sàng cho bước này.');
      error.code = 'ai_unavailable';
      throw error;
    }
  }

  /* ---------------------------------------------------------------------- */

  function probe() {
    if (location.protocol === 'file:') {
      state.mode = 'unavailable';
      state.probed = true;
      state.reason = 'mở bằng file:// nên không có server AI';
      emit();
      return Promise.resolve(getMode());
    }
    return fetch('api/health', { method: 'GET' })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('health ' + r.status)); })
      .then(function (j) {
        state.mode = j.mode === 'live' ? 'live' : 'unavailable';
        state.provider = j.provider || null;
        state.model = j.model || null;
        state.liveSteps = j.live_steps || [];
        state.reason = j.reason || '';
        state.probed = true;
        emit();
        return getMode();
      })
      .catch(function (e) {
        state.mode = 'unavailable';
        state.reason = 'Không kết nối được server AI (' + e.message + ').';
        state.probed = true;
        emit();
        return getMode();
      });
  }

  /* ---------------------------------------------------------------------- */

  function answerTutor(args) {
    try {
      requireLive('tutor_answer');
    } catch (err) {
      return Promise.reject(err);
    }
    return post('api/tutor', {
      question: args.question,
      page_context: slimPageContext(args.context)
    }).then(function (json) {
      if (window.Trace) {
        window.Trace.add('tutor_answer', {
          mode: 'live',
          model: json.model || state.model,
          latency_ms: json.latency_ms || null,
          context: safePageTrace(args.context),
          input: { student_question: args.question },
          output: { answer: json.answer, citations: json.citations }
        });
      }
      return json;
    }).catch(function (error) {
      if (window.Trace) {
        window.Trace.add('tutor_answer_error', {
          mode: 'live',
          code: error.code || 'request_failed',
          status: error.status || 0
        });
      }
      return Promise.reject(error);
    });
  }

  function generateQuestion(context, gate) {
    try {
      requireLive('question_generate');
    } catch (err) {
      return Promise.reject(err);
    }
    return post('api/question', { page_context: slimPageContext(context) })
      .then(function (j) {
        var out = {
          question: j.question,
          mode: 'live',
          model: j.model || state.model
        };
        if (window.Trace) {
          window.Trace.add('question_generate_live', {
            mode: 'live',
            model: out.model,
            latency_ms: j.latency_ms || null,
            context: safePageTrace(context),
            output: { question: out.question }
          });
        }
        return out;
      })
      .catch(function (error) {
        if (window.Trace) {
          window.Trace.add('question_generate_error', {
            mode: 'live',
            code: error.code || 'request_failed',
            status: error.status || 0
          });
        }
        return Promise.reject(error);
      });
  }

  function classify(args) {
    try {
      requireLive('mastery_classify');
    } catch (err) {
      return Promise.reject(err);
    }
    var questionText = typeof args.question === 'object' ? args.question.question : args.question;
    var keyPoints = args.question && Array.isArray(args.question.keyPoints)
      ? args.question.keyPoints.map(function (k) { return k.label || k; })
      : [];
    var misconceptions = args.question && Array.isArray(args.question.misconceptions)
      ? args.question.misconceptions.map(function (m) { return m.gap || m; })
      : [];

    return post('api/classify', {
      page_context: slimPageContext(args.context),
      question: questionText,
      rubric: {
        key_points: keyPoints,
        misconceptions: misconceptions
      },
      student_answer: args.answer
    })
      .then(function (j) {
        var verdict = j.verdict;
        verdict.source_page = args.context.selectedPage;
        if (window.Trace) {
          window.Trace.add('mastery_classify', {
            mode: 'live',
            model: j.model || state.model,
            latency_ms: j.latency_ms || null,
            context: Object.assign(safePageTrace(args.context), { question: questionText }),
            input: { student_answer: args.answer, answer_length: String(args.answer || '').length },
            output: verdict
          });
        }
        return verdict;
      })
      .catch(function (error) {
        if (window.Trace) {
          window.Trace.add('mastery_classify_error', {
            mode: 'live',
            code: error.code || 'request_failed',
            status: error.status || 0
          });
        }
        return Promise.reject(error);
      });
  }

  /* ---------------------------------------------------------------------- */

  function post(url, body) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) {
      return r.json().then(
        function (j) {
          if (!r.ok) {
            return Promise.reject(publicError(r.status, j));
          }
          return j;
        },
        function () {
          return Promise.reject(publicError(r.status, { error: 'Response không phải JSON' }));
        }
      );
    }, function (err) {
      return Promise.reject(publicError(0, { error: 'Không thể kết nối tới server: ' + (err && err.message || err) }));
    });
  }

  function pageFrom(context) {
    return context && context.pageContext ? context.pageContext : context;
  }

  function slimPageContext(context) {
    var page = pageFrom(context) || {};
    return {
      document_code: page.documentCode,
      document_title: page.documentTitle,
      page: page.pageNumber,
      page_count: page.pageCount,
      source_id: page.sourceId,
      text: page.text,
      image_data_url: page.imageDataUrl,
      image_bytes: page.imageBytes,
      width: page.width,
      height: page.height
    };
  }

  function safePageTrace(context) {
    var page = pageFrom(context) || {};
    if (window.PageContext && window.PageContext.safeTrace) {
      return window.PageContext.safeTrace(page);
    }
    return {
      document_code: page.documentCode,
      page: page.pageNumber,
      source_id: page.sourceId,
      text_length: String(page.text || '').length,
      image_bytes: page.imageBytes,
      width: page.width,
      height: page.height
    };
  }

  return {
    probe: probe,
    getMode: getMode,
    onModeChange: onModeChange,
    answerTutor: answerTutor,
    generateQuestion: generateQuestion,
    classify: classify
  };
})();
