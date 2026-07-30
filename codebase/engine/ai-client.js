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
      context: slim(args.context)
    }).then(function (json) {
      if (window.Trace) {
        window.Trace.add('tutor_answer', {
          mode: 'live',
          model: json.model || state.model,
          latency_ms: json.latency_ms || null,
          context: {
            doc_code: args.context.docCode,
            source_page: args.context.selectedPage,
            source_codes: args.context.sourceCodes
          },
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
    return post('api/question', { context: slim(context) })
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
            context: { doc_code: context.docCode, source_page: context.selectedPage, source_codes: context.sourceCodes },
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
      context: slim(args.context),
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
            context: {
              doc_code: args.context.docCode,
              source_page: args.context.selectedPage,
              source_codes: args.context.sourceCodes,
              question: questionText
            },
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

  function slim(context) {
    return {
      doc_code: context.docCode,
      doc_title: context.docTitle,
      page: context.selectedPage,
      heading: context.heading,
      selected_text: context.selectedText,
      source_codes: context.sourceCodes
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
