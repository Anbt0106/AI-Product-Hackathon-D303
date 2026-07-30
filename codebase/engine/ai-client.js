/* ============================================================================
 * engine/ai-client.js — ĐIỂM NỐI AI (mối hàn cho CP3)
 * ----------------------------------------------------------------------------
 * Ở CP2 file này KHÔNG gọi AI. Nó chỉ làm ba việc:
 *   1. thăm dò /api/health để biết có server và server đã cấu hình AI chưa,
 *   2. nếu có → gọi /api/question và /api/classify,
 *   3. nếu không có, hoặc gọi lỗi → chạy bản mock và GHI RÕ vào trace là đã
 *      fallback (không được im lặng, vì trace là bằng chứng cho eval).
 *
 * Toàn bộ khoá API nằm ở phía server (server.mjs đọc biến môi trường). Trang
 * web không bao giờ giữ khoá — luật an toàn 02-guide.md §3.4.
 *
 * Mở index.html bằng file:// → luôn chạy mock, không cần server.
 * Chạy `node server.mjs` → dùng API nếu đã cấu hình.
 * ========================================================================== */

window.AiClient = (function () {

  var state = {
    mode: 'mock',        // 'mock' | 'live'
    provider: null,      // 'openai' | 'anthropic' | 'gemini' | null
    model: null,
    probed: false,
    reason: 'chưa thăm dò',
    liveSteps: []
  };

  var listeners = [];
  function onModeChange(fn) { listeners.push(fn); }
  function emit() { listeners.forEach(function (fn) { fn(getMode()); }); }
  function getMode() { return JSON.parse(JSON.stringify(state)); }

  /* ---------------------------------------------------------------------- */

  function probe() {
    if (location.protocol === 'file:') {
      state.probed = true;
      state.reason = 'mở bằng file:// nên không có server — chạy mock';
      emit();
      return Promise.resolve(getMode());
    }
    return fetch('api/health', { method: 'GET' })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('health ' + r.status)); })
      .then(function (j) {
        state.mode = j.mode === 'live' ? 'live' : 'mock';
        state.provider = j.provider || null;
        state.model = j.model || null;
        state.liveSteps = j.live_steps || [];
        state.reason = j.reason || '';
        state.probed = true;
        emit();
        return getMode();
      })
      .catch(function (e) {
        state.mode = 'mock';
        state.reason = 'không gọi được /api/health (' + e.message + ') — chạy mock';
        state.probed = true;
        emit();
        return getMode();
      });
  }

  /* ---------------------------------------------------------------------- */

  function generateQuestion(context, gate) {
    var baseline = window.QuestionGenerator.generateMock({ context: context, gate: gate });
    if (state.mode !== 'live' || !baseline) return Promise.resolve(baseline);

    return post('api/question', { context: slim(context) })
      .then(function (j) {
        var out = Object.assign({}, baseline, {
          question: j.question,
          mode: 'live',
          model: j.model || state.model
        });
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
      .catch(function (e) {
        logFallback('question_generate', e);
        return baseline;
      });
  }

  function classify(args) {
    if (state.mode !== 'live') {
      return Promise.resolve(window.Mastery.classifyMock(args));
    }
    return post('api/classify', {
      context: slim(args.context),
      question: args.question.question,
      rubric: {
        key_points: (args.question.keyPoints || []).map(function (k) { return k.label; }),
        misconceptions: (args.question.misconceptions || []).map(function (m) { return m.gap; })
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
              question: args.question.question
            },
            input: { student_answer: args.answer, answer_length: String(args.answer || '').length },
            output: verdict
          });
        }
        return verdict;
      })
      .catch(function (e) {
        logFallback('mastery_classify', e);
        return window.Mastery.classifyMock(args);
      });
  }

  /* ---------------------------------------------------------------------- */

  function post(url, body) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { return Promise.reject(new Error(r.status + ' ' + t.slice(0, 200))); });
      return r.json();
    });
  }

  /** Chỉ gửi phần ngữ cảnh tối thiểu — không gửi thêm dữ liệu không cần. */
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

  function logFallback(step, err) {
    if (!window.Trace) return;
    window.Trace.add(step + '_fallback', {
      mode: 'mock',
      output: { fell_back: true, error: String(err && err.message || err) }
    });
  }

  function askTutor(args) {
    // args = { context, question, baseline }
    // baseline = { text, citations, docCode } lấy từ page.tutorAnswer (catalog) — dùng làm fallback.
    if (state.mode !== 'live') {
      return Promise.resolve(Object.assign({}, args.baseline, { mode: 'mock' }));
    }

    return post('api/ask', {
      context: slim(args.context),
      student_question: args.question,
      // system_prompt được xử lý ở server (server.mjs), KHÔNG gửi từ client
      // để tránh lộ prompt/khoá và để đổi giọng văn tập trung một chỗ.
      allowed_citations: args.context.sourceCodes // Tutor chỉ được trích trong phạm vi nguồn đã chọn
    })
      .then(function (j) {
        var out = {
          text: j.answer,
          citations: j.citations || [],
          docCode: args.context.docCode,
          mode: 'live',
          model: j.model || state.model
        };
        if (window.Trace) {
          window.Trace.add('tutor_answer_live', {
            mode: 'live',
            model: out.model,
            latency_ms: j.latency_ms || null,
            context: { doc_code: args.context.docCode, selected_page: args.context.selectedPage, source_codes: args.context.sourceCodes },
            input: { student_question: args.question },
            output: { citations: out.citations, has_answer: !!out.text }
          });
        }
        return out;
      })
      .catch(function (e) {
        logFallback('tutor_answer', e);
        return Object.assign({}, args.baseline, { mode: 'mock' });
      });
  }

  return {
    probe: probe,
    getMode: getMode,
    onModeChange: onModeChange,
    generateQuestion: generateQuestion,
    classify: classify,
    askTutor: askTutor
  };

})();