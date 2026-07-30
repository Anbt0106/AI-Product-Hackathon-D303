# Kịch bản demo 5 phút — bấm đâu, gõ gì, ra gì

## Chuẩn bị trước khi lên demo

```powershell
cd codebase
Mở `codebase/.env`, điền `GEMINI_API_KEY=...`, lưu file
.\start.ps1
```

Mở `http://localhost:5173`. Chỉ bắt đầu khi badge góc phải ghi **`CP3 · AI thật ở Mastery (gemini-3.5-flash-lite)`**. Nếu badge là Mock, không nói đây là CP3 live.

## 0:00–0:35 — Nỗi đau và lời hứa

Nói: “Tutor hiện có thể giải thích sai/mất nguồn, và gần như không kiểm tra học viên đã hiểu thật. Bản này chỉ làm một vòng 60 giây: đúng nguồn → teach-back → quyết định mức hiểu → một bước củng cố.”

## 0:35–2:20 — Happy path, lời gọi AI thật

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

1. Bấm **`5 · Thiếu nguồn`**.
2. Kết quả mong đợi: Gate **block**, nói không lấy được nội dung; không có nút Micro-Check và không có `mastery_classify` mới.
3. Nếu còn thời gian, bấm **`6 · Cite lệch trang`**: Gate `review`, không tự kết luận citation sai.

## 4:10–4:40 — Người dùng sửa được

1. Quay lại **`3 · Đang nhầm`** → gửi.
2. Bấm **`Tôi không đồng ý`**.
3. Kết quả cũ biến mất; căn cứ hiện lại; ô trả lời cho sửa và chạy lại. Trace ghi `previous_verdict_discarded: true`.

## 4:40–5:00 — Chốt bằng số, nói thật phần mock

Nói: “Golden set có 24 case, baseline luật đạt 24/24. Lượt AI live phải xem file trong `eval/results/` và so với quality bar 85%; kết quả thấp vẫn giữ nguyên. Phần Tutor, tài liệu và câu hỏi là mock; phần gọi AI thật duy nhất là Mastery Classifier.”

Sau demo, bấm **Trace → Tải .json** và lưu file vào `eval/traces/` nếu đây là lượt chính thức.