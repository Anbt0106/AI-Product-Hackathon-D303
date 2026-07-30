# Reflection cá nhân — Bùi Thọ An

- **Mã học viên:** 2A202601883
- **Vai trò:** Evidence, Spec & Product

## Phần tôi phụ trách

Tôi phụ trách chứng minh vấn đề tồn tại, so sánh các phương án và giữ `spec.md` nhất quán với sản phẩm đã build. Tôi tập trung vào:

- Evidence B từ chatlog;
- phương pháp đếm selected page và citation;
- bảng impact ba ứng viên;
- lựa chọn lát cắt Grounding Gate + teach-back;
- ranh giới non-goal, phần thật/mock và changelog quyết định.

Script `evidence/mining-selected-page.ps1` ghép Student–Tutor bằng `turn_id`, nhận diện selected page rồi chia citation thành thiếu, đúng trang hoặc chỉ trang khác. Kết quả tái lập là 1.252 lượt có selected page, 573 thiếu citation, 440 cite đúng trang và 239 chỉ cite trang khác.

## AI đã hỗ trợ tôi như thế nào

AI hỗ trợ rà soát rubric, đề xuất cách trình bày bảng impact và viết script kiểm đếm. Tôi phải tự kiểm lại bằng CSV, mã lượt và phép tính phần trăm; đồng thời loại các câu khẳng định không có bằng chứng.

AI cũng giúp phát hiện một lỗi lập luận: 1.252 lượt là số interaction đủ điều kiện có selected page, không có nghĩa toàn bộ 1.252 lượt đều muốn teach-back. Tôi sửa cách diễn đạt thành exposure tiềm năng và bổ sung ba ví dụ người học nói “không hiểu/chưa rõ”, đều không được Tutor hỏi kiểm tra hiểu.

## Case fail và bài học

Phiên bản evidence ban đầu chỉ nêu các con số 573/1.252 nhưng chưa có script tái lập và năm ví dụ nguyên văn. Nó có thể đúng nhưng người chấm không kiểm lại được. Ngoài ra, việc dùng 1.252 làm số người cần teach-back là một suy rộng quá mức.

Nhóm sửa bằng cách thêm phương pháp đếm, script, báo cáo, mã `Cxxxx/Txxxx` và phân biệt rõ evidence về grounding với evidence về vòng kiểm tra hiểu.

Bài học của tôi là **một con số chỉ mạnh khi người khác tái tạo được và khi phạm vi kết luận không vượt quá dữ liệu**. Product decision cần nối bằng chứng với trade-off, không chỉ chọn ý tưởng nghe hợp lý.

## Nếu làm tiếp

Tôi sẽ bổ sung Evidence A từ ≥20 người ngoài nhóm để đo không chỉ việc pain tồn tại mà cả mức người dùng muốn giải quyết. Tôi cũng sẽ tách rõ tỷ lệ interaction, số user duy nhất và tần suất lặp theo user.

## Tôi phải tự giải thích được khi bị hỏi

1. 573, 440 và 239 được đếm như thế nào?
2. Vì sao citation-only bị loại?
3. Vì sao không được nói 1.252 người đều cần teach-back?
4. Evidence B chứng minh được gì và chưa chứng minh được gì?
