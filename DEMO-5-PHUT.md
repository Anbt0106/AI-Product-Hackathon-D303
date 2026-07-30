# Kịch bản demo 5 phút — Trải nghiệm sinh viên VLearn (All-Live AI)

## Chuẩn bị trước khi lên demo

```powershell
cd codebase
# Bảo đảm codebase/.env có AI_PROVIDER=gemini và GEMINI_API_KEY
.\start.ps1
```

Mở `http://127.0.0.1:5173`. Chỉ bắt đầu khi badge góc trên phải ghi **`AI thật · gemini-3.5-flash-lite`** (hoặc model Gemini đang dùng).

---

## 0:00–0:40 — Nỗi đau và giải pháp VLearn

Nói: "Khi sinh viên hỏi Tutor, AI có thể trả lời sai nguồn hoặc làm sinh viên ngộ nhận là đã hiểu. VLearn giải quyết bằng vòng lặp khép kín: Gemini đọc cả chữ và ảnh đúng trang → Tutor trả lời trích nguồn → Grounding Gate kiểm định → Gemini sinh Micro-Check teach-back → Gemini đánh giá mức hiểu thật và đưa đúng một bước củng cố."

---

## 0:40–2:20 — Sinh viên tự chọn bài, hỏi Tutor và làm Micro-Check

1. **Chọn bài & trang:** Chọn tài liệu **AI & LLM Foundation**, chọn **Trang 15** (Self-attention).
2. **Hỏi Tutor:** Nhập câu hỏi tự do: *"Self-attention trong Transformer hoạt động như thế nào?"* và bấm **Gửi**.
3. **Quan sát Tutor live:**
   - Thẻ `AI đang trả lời…` xuất hiện.
   - Tutor trả lời ngắn gọn và trích dẫn mã nguồn `[T06-130]`.
   - **Grounding Gate** báo `Đã xác minh` vì trích dẫn thuộc đúng trang 15.
4. **Micro-Check live:**
   - Bấm **Kiểm tra tôi · 30 giây**.
   - AI sinh câu hỏi teach-back live: *"Hãy giải thích bằng lời của bạn cơ chế so sánh song song giữa các token trong self-attention?"*
5. **Trả lời teach-back:** Nhập câu trả lời bằng lời sinh viên:
   > *"Vì mỗi token đối chiếu với tất cả các token khác song song để tính điểm tương đồng, nên không có token nào bị bỏ qua."*
6. **Kết quả:** Thẻ **Đã nắm** hiện ra kèm độ tin cậy, trích lại chính xác câu trả lời và nguồn kiểm chứng.

---

## 2:20–3:30 — Đánh giá trường hợp hiểu sai (Misconception)

1. Sinh viên bấm **Hỏi lại** hoặc chọn đoạn transcript khác trên slide.
2. Hỏi Tutor một câu khác, sau đó bắt đầu Micro-Check.
3. Khi AI hỏi, nhập một câu chứa thuật ngữ đúng nhưng sai quan hệ:
   > *"Vì self-attention đọc tuần tự từng token từ trái sang phải và ghi nhớ lại, nên nó không quên đoạn đầu."*
4. **Kết quả:** Thẻ **Có thể đang nhầm** xuất hiện, chỉ ra lỗ hổng: *"Attention xử lý song song chứ không tuần tự"*, đi kèm **Một bước củng cố** dẫn thẳng về trang 15.

---

## 3:30–4:15 — Chặn khi thiếu nguồn và kiểm soát lệch trang

1. **Thiếu nguồn:** Bỏ chọn các đoạn transcript (hoặc chuyển sang trang trống). Bấm gửi câu hỏi.
2. **Kết quả:** Hệ thống báo thiếu ngữ cảnh trang và không gửi request lên Gemini.
3. **Lệch trang:** Nếu Tutor trích dẫn trang khác, **Grounding Gate** đưa trạng thái `Cần đối chiếu` chứ không tự ý phán quyết sai hay chặn Micro-Check.

---

## 4:15–5:00 — Quyền điều chỉnh của sinh viên & Trace minh bạch

1. Bấm **Tôi không đồng ý** ở kết quả đánh giá:
   - Kết quả cũ bị xóa khỏi luồng UI.
   - Căn cứ được hiển thị lại để sinh viên xem xét và nhập câu trả lời mới.
2. Bấm **Trace (N)** ở thanh tiêu đề:
   - Chỉ cho người xem thấy các entry `tutor_answer`, `question_generate_live`, và `mastery_classify`.
   - Tất cả đều ghi rõ `mode: live`, model Gemini, latency và output đã được kiểm schema.
   - Không chứa API key, auth header hay system prompt.
