# VLearn Reader · Hiểu Đúng, Hiểu Thật

Demo giao diện học viên đọc PDF. Khi người học cuộn đến trang nào.

Cả ba bước đều dùng Gemini:

1. Giải thích câu hỏi của học viên (`POST /api/tutor`).
2. Sinh câu hỏi Micro-Check (`POST /api/question`).
3. Đánh giá câu trả lời teach-back (`POST /api/classify`).

Không có fallback sang câu trả lời mock. Lịch sử hội thoại được giữ, mỗi lượt có nhãn tài liệu và trang nguồn.

## Cấu hình Gemini

Từ thư mục `codebase`, tạo file `.env` dựa trên `.env.example`:

```dotenv
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
PORT=5173
```

## Chạy demo

```powershell
cd codebase
.\start.ps1
```

Sau đó mở <http://127.0.0.1:5173>.

Luồng demo:

1. Chọn tài liệu Day 1 hoặc Day 2.
2. Cuộn PDF đến trang cần hỏi và đợi nhãn trang bên Tutor cập nhật.
3. Nhập câu hỏi như một học viên bình thường.
4. Đọc phần giải thích có nguồn của đúng trang.
5. Bấm `Kiểm tra tôi.`, trả lời bằng lời của mình và xem đánh giá.

## Dữ liệu gửi tới Gemini

- Ảnh JPEG của đúng trang đang hoạt động.
- Văn bản PDF.js trích xuất từ toàn trang.
- Câu hỏi hoặc câu trả lời hiện tại của học viên.
- Mã nguồn ổn định theo dạng `document:page-N`.

Ảnh base64 không được ghi vào trace. Server giới hạn kích thước request và chỉ
chấp nhận ảnh JPEG/PNG có source ID khớp với tài liệu và số trang.

## Kiểm thử

```powershell
node test/page-context.mjs
node test/pdf-reader.mjs
node test/ai-client.mjs
node test/server.mjs
node test/smoke.mjs
node test/manual-demo-ui.mjs
```

## Thành phần chính

- `engine/page-context.js`: hợp đồng snapshot trang bất biến và trace an toàn.
- `engine/pdf-reader.mjs`: PDF.js reader cuộn liên tục, trích text và render ảnh.
- `engine/ai-client.js`: gửi cùng snapshot trang cho cả ba bước AI.
- `engine/grounding-gate.js`: kiểm citation phải khớp đúng trang.
- `server.mjs`: giữ Gemini key, kiểm tra payload, gọi Gemini multimodal và kiểm
  structured output.
- `app.js` + `app.css`: giao diện học viên, lịch sử theo trang và luồng Micro-Check.
