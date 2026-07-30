# CP5 — Trạng thái nghiệm thu

## Đã có

- Flow bấm được và AI thật ở quyết định Mastery.
- Golden set 24 case; quality bar chốt trước là ≥85% và không vi phạm ba bất biến.
- Lượt live đầu có response hợp lệ: 17/24; lượt live chính thức: 24/24 với 16 lời gọi AI thật.
- Demo script 5 phút có happy path, hard case và đường lỗi thiếu nguồn.
- Bộ validation 10 phút, log, mẫu tổng hợp và dry-run checklist trong `validation/`.
- Deck 6 slide ở trạng thái draft có đánh dấu đúng phần cần dữ liệu thật.
- Simulated technical pilot: giữ hai lượt HTTP 0/5 và một lượt direct-live 5/5; đây không phải human validation.
- Từ pilot đã sửa badge để chỉ ghi “AI thật đã xác minh” sau classify live thành công.
- Kiểm kỹ thuật ngày 30/07/2026: trang chủ HTTP 200; provider gemini, mode live, model gemini-3.5-flash-lite; smoke test **39 pass, 0 fail**.
- demo-slides.pptx có đúng 6 slide; demo-slides.pdf đã xuất; từng slide đã render và kiểm tra trực quan.

## Chưa thể xác nhận thay nhóm

- 5/5 buổi test với người ngoài nhóm.
- Tên/vai, quan sát và quote nguyên văn của từng người.
- Ít nhất 2 willing users được xác nhận.
- Thay đổi thiết kế dựa trên feedback thật.
- Dry run nói thật đã bấm giờ với cả nhóm.

CP5 chỉ hoàn tất khi các mục trên có dữ liệu thật; không dùng placeholder làm bằng chứng nộp.
