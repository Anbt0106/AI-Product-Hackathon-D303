# VLearn Reader · Hiểu Đúng, Hiểu Thật

Demo nâng cấp VLearn Tutor bằng **Adaptive Micro-Check**: sau khi Tutor giải thích theo trang slide, học viên trả lời một câu teach-back trong khoảng 30 giây. Hệ thống phân loại bốn trạng thái `đã nắm / hiểu một phần / có thể đang nhầm / chưa đủ căn cứ`, rồi đưa đúng một bước củng cố.

## Chạy demo

Không cần API key:

```powershell
cd codebase
.\start.ps1 -Mock
```

Mở <http://127.0.0.1:5173>. Mock mode vẫn chạy toàn bộ flow bằng rule engine và hiển thị rõ badge `Demo mock`.

Chạy với OpenAI:

```powershell
cd codebase
Copy-Item .env.example .env
# Mở .env và điền OPENAI_API_KEY của bạn
.\start.ps1
```

Server mặc định dùng `gpt-5.6-terra` qua Responses API. Có thể đổi `OPENAI_MODEL` trong `.env`. API key chỉ được đọc phía server; frontend không nhận hoặc lưu key.

## Đường demo chính

1. Chọn Day 1 hoặc Day 2 ở danh sách tài liệu.
2. Mở một trang có ngữ cảnh kiểm chứng; prototype chọn sẵn transcript để giảm thao tác.
3. Bấm câu hỏi gợi ý hoặc hỏi Tutor.
4. Grounding Gate kiểm tra tài liệu, trang và trích dẫn.
5. Bấm **Kiểm tra tôi · 30 giây**.
6. Trả lời một câu bằng lời của mình.
7. Xem trạng thái hiểu, căn cứ nguồn và một bước củng cố; có thể phản đối hoặc trả lời lại.

Giao diện không có nút chạy kịch bản dựng sẵn. Người thuyết trình tự thao tác
toàn bộ luồng như một học viên thật: chọn tài liệu, hỏi Tutor, bắt đầu
Micro-Check và nhập câu trả lời.

## Dữ liệu thật và bảo mật

- Hai PDF thật được đọc cục bộ từ `data/vlearn-pack/slides/`.
- `data/material-catalog.js` chỉ giữ metadata và trích đoạn ngắn có mã nguồn `[Txx-NNN]`.
- Không đọc hoặc gửi chatlog lên OpenAI.
- Khi live, chỉ gửi đoạn transcript đã chọn, câu hỏi, rubric và câu trả lời học viên.
- Toàn bộ `data/vlearn-pack/` và `.env` bị Git bỏ qua. Không ép add chúng vào repo nộp bài.
- Server mặc định chỉ lắng nghe `127.0.0.1` để data pack không bị phục vụ ra mạng LAN.

## Kiểm thử

```powershell
node test/smoke.mjs
node test/server.mjs
```

`smoke.mjs` kiểm tra Grounding Gate, bốn trạng thái mastery, correction/scope guard và trace. `server.mjs` kiểm tra OpenAI provider/parser bằng fixture, không gọi mạng và không cần key thật.

## Thành phần chính

- `data/material-catalog.js`: catalog an toàn trỏ tới hai PDF và trích đoạn transcript thật.
- `engine/context.js`: tạo context tối thiểu theo tài liệu/trang/đoạn.
- `engine/grounding-gate.js`: chặn thiếu nguồn, sai tài liệu và yêu cầu đối chiếu khi lệch trang.
- `engine/ai-client.js`: gọi sinh câu hỏi/phân loại live hoặc fallback mock minh bạch.
- `server.mjs`: giữ secret, gọi OpenAI Responses API và validate structured output.
- `app.js` + `app.css`: VLearn Reader ba cột và flow Adaptive Micro-Check.
