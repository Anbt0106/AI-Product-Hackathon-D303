# Kịch bản demo 5 phút — bấm đâu, gõ gì, ra gì

## Chuẩn bị trước khi lên demo

```powershell
cd codebase
# Bảo đảm codebase/.env có AI_PROVIDER=gemini và GEMINI_API_KEY
.\start.ps1
```

Mở `http://127.0.0.1:5173`. Chỉ bắt đầu khi badge góc trên phải ghi **`AI thật · gemini-3.5-flash-lite`** (hoặc model Gemini đang dùng).

## 0:00–0:35 — Nỗi đau và lời hứa

Nói: “Tutor hiện có thể giải thích sai/mất nguồn, và gần như không kiểm tra học viên đã hiểu thật. Bản này chỉ làm một vòng 60 giây: đúng nguồn → teach-back → quyết định mức hiểu → một bước củng cố.”

Nói: "Khi sinh viên hỏi Tutor, AI có thể trả lời sai nguồn hoặc làm sinh viên ngộ nhận là đã hiểu. VLearn giải quyết bằng vòng lặp khép kín: Gemini đọc cả chữ và ảnh đúng trang → Tutor trả lời trích nguồn → Grounding Gate kiểm định → Gemini sinh Micro-Check teach-back → Gemini đánh giá mức hiểu thật và đưa đúng một bước củng cố."

1. Bấm nút đen dưới cùng **`1 · Hiểu đúng`**.
2. Màn hình đã chọn trang 15, hỏi Tutor và mở câu Micro-Check.
3. Ô trả lời được điền sẵn. Bấm **`Gửi câu trả lời`**.
4. Kết quả mong đợi: thẻ **`Đã nắm`**, độ tin cậy, nút **`Tiếp tục học`**.
5. Bấm **`Xem căn cứ AI đã dùng`**: chỉ ra tài liệu, trang, mã đoạn, Gate và chế độ `AI thật`.
6. Bấm **`Trace`**: chỉ vào entry `mastery_classify`, `mode: live`, model, latency, input/output. Đây là bằng chứng AI thật ở quyết định trung tâm.

Câu được gửi:

> Vì mỗi token nhìn tất cả các token khác song song và tính similarity score, nên không có token nào bị bỏ lại phía sau.

## 2:20–3:25 — Case hiểm: đúng thuật ngữ nhưng sai quan hệ

1. Bấm **`3 · Đang nhầm`**.
2. Bấm **`Gửi câu trả lời`**.
3. Kết quả mong đợi: **`Có thể đang nhầm`**, không phải “Đã nắm”; chỉ một lỗ hổng “attention không xử lý tuần tự”; có một bước củng cố và nguồn trang 15.

Câu được gửi:

> Vì self-attention đọc tuần tự từ trái sang phải và ghi nhớ lại các token đã đọc, nên nó không quên đoạn đầu.

## 3:25–4:10 — Không có nguồn thì không gọi AI

1. **Thiếu nguồn:** Bỏ chọn các đoạn transcript (hoặc chuyển sang trang trống). Bấm gửi câu hỏi.
2. **Kết quả:** Hệ thống báo thiếu ngữ cảnh trang và không gửi request lên Gemini.
3. **Lệch trang:** Nếu Tutor trích dẫn trang khác, **Grounding Gate** đưa trạng thái `Cần đối chiếu` chứ không tự ý phán quyết sai hay chặn Micro-Check.

## 4:10–4:40 — Người dùng sửa được

1. Quay lại **`3 · Đang nhầm`** → gửi.
2. Bấm **`Tôi không đồng ý`**.
3. Kết quả cũ biến mất; căn cứ hiện lại; ô trả lời cho sửa và chạy lại. Trace ghi `previous_verdict_discarded: true`.

1. Bấm **Tôi không đồng ý** ở kết quả đánh giá:
   - Kết quả cũ bị xóa khỏi luồng UI.
   - Căn cứ được hiển thị lại để sinh viên xem xét và nhập câu trả lời mới.
2. Bấm **Trace (N)** ở thanh tiêu đề:
   - Chỉ cho người xem thấy các entry `tutor_answer`, `question_generate_live`, và `mastery_classify`.
   - Tất cả đều ghi rõ `mode: live`, model Gemini, latency và output đã được kiểm schema.
   - Không chứa API key, auth header hay system prompt.
