# Kịch bản trình bày 6 slide — VLearn Hiểu Đúng, Hiểu Thật

**Tổng thời lượng mục tiêu:** 4 phút 45 giây, chừa 15 giây buffer
**Nguyên tắc:** không đọc toàn bộ chữ trên slide; mỗi slide chỉ chốt một quyết định và một bằng chứng.

## Phân vai đề xuất

| Phần | Người nói |
|---|---|
| Slide 1–2: pain, evidence, quyết định sản phẩm | Bùi Thọ An |
| Slide 3: giải pháp và live demo | Lê Tuấn Cảnh |
| Slide 4: AI, eval và failure | Phạm Nguyễn Hùng Nguyên |
| Slide 5–6: validation, thay đổi và bước tiếp theo | Nguyễn Văn Tuấn Anh |

---

## Slide 1 — User & Job

**Thời gian:** 0:00–0:40
**Mục tiêu:** chứng minh đây là pain có thật trước khi giới thiệu tính năng.

### Lời nói

> “Nhóm em tập trung vào một thời điểm rất cụ thể: học viên vừa nhờ Tutor giải thích một đoạn slide khó. Lúc này, học viên không chỉ cần một câu trả lời; họ cần biết câu trả lời có đúng nguồn và mình đã hiểu thật hay chưa.
>
> Trong 1.252 lượt có selected page, 573 lượt — tương đương 45,8% — không có citation. Trên toàn bộ 1.261 lượt, Tutor chỉ chủ động hỏi kiểm tra hiểu đúng 3 lần.
>
> Vì vậy job nhóm em chọn là: sau một giải thích khó, giúp học viên kiểm tra nhanh mình hiểu đúng để sửa lỗ hổng trước khi học tiếp.”

### Chuyển slide

> “Từ pain này, nhóm em cân nhắc ba hướng thay vì chọn ngay ý tưởng đầu tiên.”

---

## Slide 2 — Vì sao chọn tính năng này?

**Thời gian:** 0:40–1:15
**Mục tiêu:** cho thấy nhóm đã so sánh và loại phương án bằng trade-off.

### Lời nói

> “Hướng thứ nhất là chỉ sửa citation. Hướng này xử lý được 573 lượt thiếu nguồn, nhưng chưa biết học viên đã hiểu hay chưa.
>
> Hướng thứ hai là sinh quiz cho mọi trang. Phạm vi rộng, nhưng nhóm chưa có evidence riêng cho nhu cầu đó, và câu hỏi sinh sai có cost-of-error cao.
>
> Nhóm chọn Grounding Gate cộng teach-back 60 giây. Gate kiểm căn cứ trước; chỉ khi nguồn đủ, học viên mới giải thích lại một câu và AI đánh giá mức hiểu.
>
> Đây là phương án duy nhất nối hai rủi ro thành một vòng khép kín: đúng nguồn trước, hiểu đúng sau.”

### Chuyển slide

> “Sau đây là đúng đường người dùng bấm trong demo.”

---

## Slide 3 — Giải pháp và live demo

**Thời gian:** 1:15–2:50
**Mục tiêu:** cho thấy flow end-to-end và lời gọi AI thật ở quyết định trung tâm.

### Lời dẫn trước khi chuyển sang ứng dụng

> “Flow có bốn bước: Gate kiểm nguồn, học viên teach-back, AI quyết định một trong bốn mastery state, rồi hệ thống đưa đúng một bước tiếp theo có nguồn.
>
> Tutor, câu Micro-Check và Mastery Classifier đều gọi Gemini `gemini-3.5-flash-lite` trên đúng trang PDF đang mở. Grounding Gate là luật xác định ở giữa; nếu AI lỗi, hệ thống báo lỗi và cho thử lại, không âm thầm chuyển sang mock.”

### Live demo — case chuẩn

1. Chuyển sang ứng dụng.
2. Bấm **`1 · Hiểu đúng`**.
3. Chỉ vào câu teach-back đã điền.
4. Bấm **`Gửi câu trả lời`**.
5. Chờ thẻ **`Đã nắm`**.
6. Mở **`Xem căn cứ AI đã dùng`** hoặc **`Trace`**.

### Lời nói khi bấm

> “Ở case chuẩn, học viên nói được hai ý: các token nhìn nhau và được xử lý song song. Khi em bấm gửi, đây là lời gọi AI thật.
>
> Kết quả là `understood`, nên hành động tiếp theo mới được phép là tiếp tục học. Trong trace có mode live, model, latency, input và output.”

### Live demo — case khó

1. Bấm **`3 · Đang nhầm`**.
2. Bấm **`Gửi câu trả lời`**.
3. Chỉ vào kết quả **`Có thể đang nhầm`**.

### Lời nói

> “Case khó dùng đúng từ ‘self-attention’ nhưng nói rằng nó đọc tuần tự từ trái sang phải. AI không được thấy đúng thuật ngữ rồi gắn `understood`; kết quả phải là `misconception`.
>
> Hệ thống chỉ ra đúng quan hệ sai và đưa một bước củng cố có nguồn. Học viên vẫn có thể trả lời lại hoặc bấm ‘Tôi không đồng ý’.”

### Chuyển slide

> “Để biết đây không chỉ là hai case demo đẹp, nhóm em chạy một golden set đã chốt trước.”

---

## Slide 4 — Kết quả đo và failure đáng học

**Thời gian:** 2:50–3:35
**Mục tiêu:** đối chiếu kết quả với quality bar và nói thật về failure.

### Lời nói

> “Golden set có 24 case, gồm 8 normal, 12 hard và 4 rare. Quality bar nhóm chốt trước khi đo là đạt ít nhất 85% và không vi phạm ba bất biến cứng.
>
> Lượt live đầu có output hợp lệ đạt 17/24, tức 70,8%, nên chưa đạt bar. Failure đáng học nhất là model tự biến câu trả lời đúng nhưng thiếu ý thành misconception; ngoài ra ba output `insufficient` bị server từ chối vì không đi với hành động `clarify`.
>
> Nhóm không hạ quality bar và không xóa lượt fail. Nhóm bổ sung rubric ý đúng, quan hệ sai và khóa state-to-action ở server.
>
> Lượt chính thức đạt 24/24, với 16 trên 16 output live hợp lệ. Con số này chỉ chứng minh đạt trên bộ 24 case đã chốt, không có nghĩa model đúng 100% ngoài thực tế.”

### Chuyển slide

> “Kết quả máy trả lời ‘hệ thống chạy đúng test chưa’; còn validation phải trả lời ‘người thật có hiểu và muốn dùng không’.”

---

## Slide 5 — User thật nói gì?

**Thời gian:** 3:35–4:15
**Mục tiêu:** đưa feedback nguyên văn và chứng minh nhóm đã thay đổi sản phẩm.

### Lời nói

> “Nhóm em đã test với **5 người ngoài nhóm**. Bốn người tự hoàn thành không cần trợ giúp; cả năm người tin hoặc khá tin kết quả và nói sẽ dùng thật.
>
> Chủ đề lớn nhất là **3/5 người cần phần mastery ngắn và rõ hơn**. Huy, học viên AI, nói: ‘**Mình không rõ Partial khác Misconception ở mức nào.**’
>
> Lan, sinh viên năm 2, không tìm thấy bước tiếp theo và nói: ‘**Mình tưởng cuộc hội thoại kết thúc sau khi AI trả lời.**’
>
> Nhóm đã làm card ‘Kiểm tra tôi’ nổi bật hơn, thêm câu dẫn sau câu trả lời Tutor và giải nghĩa từng mastery state bằng một dòng. Nhóm không tự bật Micro-Check vì muốn giữ quyền chủ động và tránh làm gián đoạn người học.”

### Chuyển slide

> “Dry run đã đi hết các đường chính nhưng mất 5 phút 08 giây, nên ưu tiên tiếp theo là đo lại sau thay đổi và cắt ít nhất 8 giây.”

---
## Slide 6 — Nếu có thêm một tuần

**Thời gian:** 4:15–4:45
**Mục tiêu:** kết thúc bằng ưu tiên có căn cứ, không đọc roadmap dài.

### Lời nói

> “Nếu có thêm một tuần, nhóm em ưu tiên ba việc.
>
> Thứ nhất, chạy vòng validation thứ hai để đo lại khả năng tìm CTA và hiểu bốn mastery state sau thay đổi.
>
> Thứ hai, mở rộng eval ngoài 24 case bằng câu cụt, typo, trộn Anh–Việt và domain mới.
>
> Thứ ba, đo calibration: khi nào học viên tin quá mức hoặc phản đối verdict của AI.
>
> Bài học lớn nhất của nhóm em là: AI đáng tin không phải là AI luôn trả lời. Đó là AI biết dừng khi thiếu căn cứ, cho người dùng xem nguồn và cho phép họ sửa hoặc phản đối kết quả.”

### Câu kết

> “Đó là VLearn Hiểu Đúng, Hiểu Thật: đúng nguồn trước, hiểu đúng sau.”

---

## Checklist trước khi lên demo

- [x] Tutor, Question và Classify live thành công; badge hiển thị `gemini-3.5-flash-lite`; trace có model, latency và output.
- [x] Case `1 · Hiểu đúng` trả về `understood`.
- [x] Case `3 · Đang nhầm` trả về `misconception`.
- [x] Trace mở được và không lộ API key.
- [x] Slide 5 có 2 quote thật của Huy và Lan, kèm vai trò.
- [ ] Mỗi thành viên nói được phần có tên mình mà không cần đọc file.
- [ ] Rerun sau khi rút gọn: lượt hiện tại 5:08, cần cắt ít nhất 8 giây.
