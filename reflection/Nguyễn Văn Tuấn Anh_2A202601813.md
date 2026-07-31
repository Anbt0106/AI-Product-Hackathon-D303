# Reflection cá nhân — Nguyễn Văn Tuấn Anh

- **Mã học viên:** 2A202601813
- **Vai trò:** Validation & Demo

## Phần tôi phụ trách

Tôi phụ trách phần validation với người ngoài nhóm và phần kể lại kết quả đó trong demo. Công việc chính của tôi là chuẩn bị task test, ghi nhận phản hồi nguyên văn, tổng hợp theme lặp lại, cập nhật phần CP5 và phối hợp kịch bản demo 5 phút.

Artifact tôi chịu trách nhiệm chính gồm `validation/feedback-log.md`, `validation/summary.md`, `validation/dry-run.md`, phần user thật trên slide 5 và đoạn cuối demo về việc nhóm đã sửa gì từ feedback.

Kết quả CP5 hiện tại có 5 người ngoài nhóm thử prototype. Trong đó 4/5 tự hoàn thành flow không cần trợ giúp, 5/5 tin hoặc khá tin kết quả sau khi xem căn cứ, và 5/5 nói sẽ dùng thật. Hai quote tôi chọn đưa vào demo là của Huy: “Mình không rõ Partial khác Misconception ở mức nào.” và Lan: “Mình tưởng cuộc hội thoại kết thúc sau khi AI trả lời.”

## AI đã hỗ trợ tôi như thế nào

AI hỗ trợ tôi biến dữ liệu thô từ user test thành feedback log có cấu trúc: tên/vai trò, task đã làm, quan sát hành vi, quote nguyên văn, willingness và severity. AI cũng giúp rà lại sự nhất quán giữa `validation/`, `spec.md`, bản nháp nộp CP5 và kịch bản slide để các con số không bị lệch nhau.

Tôi không dùng AI để bịa tên, quote hoặc kết quả validation. Phần dữ liệu người dùng được ghi theo thông tin nhóm đã cung cấp, còn AI chỉ hỗ trợ chuẩn hoá cách trình bày và kiểm tra xem claim nào cần có bằng chứng trong repo.

## Case fail và bài học

Case fail quan trọng nhất ở phần tôi phụ trách là Lan không tự tìm thấy nút “Kiểm tra tôi”. Bạn ấy dừng khoảng 18 giây sau khi Tutor trả lời và tưởng cuộc hội thoại đã kết thúc. Điều này cho thấy flow CP2 tuy đã bấm đi hết được, nhưng affordance của bước Micro-Check chưa đủ rõ với người mới.

Một điểm yếu khác là 3/5 người cần kết quả mastery ngắn và rõ hơn. Minh muốn biết thẳng mình sai ở đâu, Huy chưa phân biệt `partial` với `misconception`, còn Phương chưa hiểu `insufficient` là do trả lời quá ngắn hay do sai. Từ đó nhóm đã làm nổi bật CTA “Kiểm tra tôi”, thêm câu dẫn sau câu trả lời Tutor, và bổ sung định nghĩa ngắn cho từng trạng thái verdict.

Bài học của tôi là validation không chỉ để lấy vài câu khen cho slide. Giá trị thật nằm ở chỗ quan sát người dùng mắc ở đâu, chọn một lỗi đáng sửa nhất, rồi chứng minh thay đổi đó bằng Changelog và code.

## Nếu làm tiếp

Nếu có thêm thời gian, tôi sẽ chạy vòng validation thứ hai sau khi sửa CTA để đo lại tỷ lệ tự tìm thấy nút “Kiểm tra tôi” và tỷ lệ hiểu bốn trạng thái mastery. Tôi cũng sẽ rút gọn kịch bản demo vì dry run hiện tại là 5 phút 08 giây, vượt 8 giây so với giới hạn. Mục tiêu tiếp theo là demo lại dưới 5 phút nhưng vẫn giữ đủ một happy path, một hard case và phần trace chứng minh AI đang chạy live.

