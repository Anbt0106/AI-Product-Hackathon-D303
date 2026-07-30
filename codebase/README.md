# VLearn Reader · Hiểu Đúng, Hiểu Thật (Live Student Demo)

Demo nâng cấp VLearn Tutor bằng **Adaptive Micro-Check**: sinh viên chọn tài liệu, trang slide và trích đoạn transcript, tự hỏi Tutor, sinh câu hỏi Micro-Check và trả lời teach-back. Cả ba bước AI đều gọi OpenAI thật live.

## Chạy demo

Chạy với OpenAI:

```powershell
cd codebase
.\start.ps1
```

Yêu cầu `codebase/.env` chứa `AI_PROVIDER=openai`, `OPENAI_API_KEY` và `OPENAI_MODEL` (mặc định `gpt-5.6-terra`). API key chỉ được đọc phía server; frontend không bao giờ nhận hoặc lưu key.

Khi server chạy, cả ba bước:
1. **Tutor trả lời** (`POST /api/tutor`),
2. **Sinh câu hỏi Micro-Check** (`POST /api/question`),
3. **Đánh giá teach-back** (`POST /api/classify`)
đều gọi OpenAI live. Khi API lỗi, hệ thống hiển thị thông báo lỗi rõ ràng và nút "Thử lại", tuyệt đối không tự chuyển sang mock.

## Đường demo chính

1. Chọn Day 1 hoặc Day 2 ở danh sách tài liệu.
2. Mở một trang có ngữ cảnh transcript.
3. Nhập câu hỏi tự do cho Tutor.
4. Grounding Gate kiểm tra trích dẫn nguồn trả về từ Tutor.
5. Bấm **Kiểm tra tôi · 30 giây**.
6. Trả lời một câu teach-back bằng lời của mình.
7. Xem trạng thái hiểu, căn cứ nguồn và đúng một bước củng cố; có thể phản đối hoặc trả lời lại.

Giao diện không có nút kịch bản hay điền sẵn câu trả lời. Sinh viên tự do thao tác toàn bộ luồng.

## Dữ liệu thật và bảo mật

- Hai PDF thật được đọc cục bộ từ `data/vlearn-pack/slides/`.
- `data/material-catalog.js` chỉ giữ metadata và trích đoạn ngắn có mã nguồn `[Txx-NNN]`.
- Không đọc hoặc gửi chatlog lên OpenAI.
- Chỉ gửi đoạn transcript đã chọn và nội dung câu hỏi/trả lời của sinh viên.
- `data/vlearn-pack/` và `.env` bị Git bỏ qua.

## Kiểm thử

```powershell
node test/server.mjs
node test/ai-client.mjs
node test/smoke.mjs
node test/manual-demo-ui.mjs
```

## Thành phần chính

- `data/material-catalog.js`: catalog an toàn trỏ tới hai PDF và trích đoạn transcript thật.
- `engine/context.js`: tạo context tối thiểu theo tài liệu/trang/đoạn.
- `engine/grounding-gate.js`: chặn thiếu nguồn, sai tài liệu và yêu cầu đối chiếu khi lệch trang.
- `engine/ai-client.js`: client AI live-only cho cả 3 bước với tracing và error mapping.
- `server.mjs`: giữ secret, gọi OpenAI Responses API cho Tutor, question và classify, validate structured output.
- `app.js` + `app.css`: VLearn Reader ba cột và luồng Adaptive Micro-Check live.
