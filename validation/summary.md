# Tổng hợp validation — CP5

## Số liệu

- Tổng người ngoài nhóm đã thử: **5/5**
- Tự hoàn thành task không cần trợ giúp: **4/5 (80%)**
- Tin hoặc khá tin kết quả sau khi xem giải thích/căn cứ: **5/5 (100%)**
- Nói sẽ dùng thật: **5/5 (100%)**
- Willing users đã xác nhận: **5/5**, vượt chuẩn tối thiểu 3
- Tự tìm thấy nút “Kiểm tra tôi”: **4/5 (80%)**
- Hiểu đầy đủ bốn trạng thái mastery: **3/5 (60%)**

## Chủ đề lặp nhiều nhất

**3/5 người cần phản hồi mastery ngắn và rõ hơn.** Minh muốn đi thẳng vào điểm sai; Huy chưa phân biệt `partial` với `misconception`; Phương chưa hiểu vì sao nhận `insufficient` (dòng 1, 2 và 5 trong `feedback-log.md`).

**1/5 người bị chặn bởi khả năng khám phá Micro-Check.** Lan dừng khoảng 18 giây và cần lời nhắc vì tưởng hội thoại kết thúc sau câu trả lời Tutor (dòng 3). Dù chỉ xuất hiện ở một người, đây là lỗi chặn flow nên được ưu tiên cao.

## Thay đổi đã làm trước demo

1. **Làm nổi bật CTA Micro-Check:** card có viền thương hiệu, câu dẫn “AI đã trả lời xong. Bạn đã thật sự hiểu?” và nút “Kiểm tra tôi” lớn hơn. Bằng chứng: `codebase/app.js`, `codebase/app.css`.
2. **Giải nghĩa verdict ngay tại kết quả:** mỗi state có định nghĩa một dòng; phần giải thích dùng nhãn `Điểm cần sửa`, `Vì sao chưa đủ` hoặc `Kết luận`. Bằng chứng: `codebase/app.js`, test `codebase/test/cp5-feedback-ui.mjs`.

## Giữ nguyên có lý do

Nhóm **không tự động bật Micro-Check** sau câu trả lời Tutor. Dù Lan không thấy nút, tự bật sẽ làm gián đoạn bốn người còn lại và làm mất quyền bỏ qua. Nhóm chọn tăng độ nổi bật và thêm câu dẫn, vẫn để người học chủ động bắt đầu.

## Backlog — nếu có thêm một tuần

1. Chạy vòng validation thứ hai để đo lại tỷ lệ tìm thấy CTA và hiểu state sau thay đổi.
2. Thêm tooltip/“Xem ví dụ” cho bốn mastery state nếu người dùng vẫn cần giải thích.
3. Mở rộng eval bằng câu cụt, typo, trộn Anh–Việt và domain mới.

## Hai quote dùng trên slide 5

1. “Mình không rõ Partial khác Misconception ở mức nào.” — Huy, Học viên AI
2. “Mình tưởng cuộc hội thoại kết thúc sau khi AI trả lời.” — Lan, Sinh viên năm 2
