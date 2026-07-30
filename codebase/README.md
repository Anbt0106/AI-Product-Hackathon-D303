# codebase — VLearn Hiểu Đúng, Hiểu Thật

Prototype của lát cắt: **học viên vừa được giải thích một khái niệm từ đoạn slide đã qua Grounding Gate → AI đánh giá câu teach-back → một bước củng cố có nguồn.**

Mức prototype hiện tại: **Mock** — flow bấm hết được, data giả, **chưa có lời gọi AI thật**. Lời gọi AI thật là việc của CP3; mối hàn đã dựng sẵn (xem §4).

## 1. Chạy

Hai cách, không cần cài gì:

```bash
# Cách A — mở trực tiếp, không cần Node
#   double-click codebase/index.html   (luôn chạy chế độ mock)

# Cách B — có server (cần Node >= 18)
node server.mjs                 # → http://localhost:5173
```

Chạy test logic không cần browser:

```bash
node test/smoke.mjs             # 39 case: gate, 4 trạng thái mastery, scope guard, trace
```

Badge góc phải màn hình luôn nói thật đang ở chế độ nào: `CP2 · Mock — chưa gọi AI` hoặc `CP3 · AI thật (<model>)`.

## 2. Cấu trúc

| File | Trách nhiệm | Thành phần trong spec §8 |
|---|---|---|
| `index.html` · `app.css` | vỏ UI | — |
| `app.js` | Session State + máy trạng thái + render | §8.6 |
| `data/slides.js` | data giả: đoạn slide, câu trả lời Tutor, bank Micro-Check | — |
| `engine/text.js` | chuẩn hoá tiếng Việt, khớp theo ranh giới từ | — |
| `engine/context.js` | Slide Context Provider | §8.1 |
| `engine/grounding-gate.js` | Grounding Gate | §8.2 |
| `engine/question.js` | Question Generator | §8.3 |
| `engine/mastery.js` | **Mastery Classifier — quyết định AI trung tâm** | §8.4 |
| `engine/feedback.js` | Feedback Composer | §8.5 |
| `engine/trace.js` | Trace Logger | §8.7 |
| `engine/scope-guard.js` | chặn ngoài phạm vi + prompt injection | *chưa có trong spec — phải bổ sung trước CP4* |
| `engine/ai-client.js` | điểm nối AI (mock ↔ live) | — |
| `server.mjs` | server tĩnh + `/api/*` | — |

## 3. Phần nào thật, phần nào mock

**Chạy thật ở CP2:**
- chọn tài liệu / trang / bôi đen đoạn
- Grounding Gate với 3 trạng thái `pass` / `review` / `block`
- chặn câu hỏi ngoài phạm vi và prompt injection
- sinh câu Micro-Check từ bank, đếm 30 giây
- phân loại 4 trạng thái hiểu bằng **luật** (`rule-based-baseline-v1`)
- một bước củng cố + trích dẫn nguồn
- đường lui: bỏ qua, hỏi lại, trả lời lại, "Tôi không đồng ý"
- trace log đầy đủ, tải được `.json`

**Mock (ghi rõ, không giả vờ):**
- câu trả lời của Tutor là văn bản viết sẵn theo từng trang, không sinh động
- phân loại mức hiểu là luật khớp từ khoá, **không phải AI**
- đăng nhập, danh sách khoá, đồng bộ VLearn production, tiến độ dài hạn, analytics lớp

## 4. Nối AI ở CP3 — cần làm gì

Toàn bộ mối hàn nằm ở `engine/ai-client.js` (phía client) và `server.mjs` (phía server). Khoá API **chỉ ở server**, trang web không bao giờ giữ khoá.

```bash
# Claude
AI_PROVIDER=anthropic ANTHROPIC_API_KEY=... node server.mjs

# Gemini (free tier theo 02-guide.md §3.4)
AI_PROVIDER=gemini GEMINI_API_KEY=... node server.mjs
```

Khi đã cấu hình, `/api/health` trả `mode: "live"`, badge đổi, và `ai-client.js` gọi `/api/question` + `/api/classify` thay cho bản mock.

Hai điều đã chốt sẵn để CP3 không phải sửa lại:
1. **Schema đầu ra** (`VERDICT_SCHEMA` trong `server.mjs`) khớp đúng spec §7.3, và được **ép bằng structured output** ở cả hai provider — eval không phải parse văn bản tự do.
2. **Bản mock là baseline**: khi AI thật chạy, cùng một golden set chấm được hai lượt (luật vs AI) để biết AI thêm giá trị ở đâu. Nếu API lỗi giữa demo, `ai-client.js` tự lùi về mock và **ghi vào trace là đã fallback** — không im lặng.

Việc còn lại của CP3: đối chiếu shape `generateContent` của Gemini với tài liệu AI Studio hiện hành (có ghi chú trong `server.mjs`), và xây golden set trong `eval/`.

## 5. Luật an toàn đang được tuân thủ

- Không có API key trong repo; khoá đọc từ biến môi trường.
- Trace tự động che mọi trường tên có `key|token|secret|authorization|password`.
- Không commit data pack. `data/slides.js` chỉ chứa **trích ngắn** kèm mã đoạn `[Txx-NNN]`.
- Server chặn path traversal, chỉ serve trong thư mục `codebase/`.
- Không dùng font/CSS/JS từ mạng — mở bằng `file://` vẫn chạy đủ.

## 6. Đã biết chưa xử lý

- Bank Micro-Check chỉ phủ 8 trang; trang ngoài bank thì báo rõ "chưa có câu Micro-Check" thay vì sinh bừa.
- Bản mock khớp từ khoá nên bỏ sót cách diễn đạt lạ — đây chính là chỗ AI thật ở CP3 phải hơn baseline, và là con số nhóm sẽ đo.
- Không có bộ nhớ dài hạn: reload trang là mất phiên (đúng phạm vi khai ở spec §10).
