# Reflection cá nhân — Nguyễn Văn Tuấn Anh

- **Mã học viên:** 2A202601813
- **Vai trò:** Validation & Demo

## Phần tôi phụ trách

Tôi phụ trách chuẩn bị vòng kiểm tra với người dùng và biến chuỗi quyết định của nhóm thành câu chuyện demo 5 phút. Phần việc gồm:

- kịch bản user test 10 phút trong `validation/test-script.md`;
- cấu trúc feedback log và quy tắc severity;
- mẫu tổng hợp theme, thay đổi, phần giữ nguyên và backlog;
- run of show, phân vai và biên bản bấm giờ trong `validation/dry-run.md`;
- deck sáu slide và kịch bản demo một case chuẩn, một case khó.

Tôi phải bảo đảm slide, lời nói và artifact dùng cùng một số liệu: evidence 573/1.252, quality bar 85%, lượt live 17/24 và lượt chính thức 24/24.

## AI đã hỗ trợ tôi như thế nào

AI hỗ trợ dựng cấu trúc script, checklist, deck và rà soát tính nhất quán giữa slide với `spec.md`, `eval/results/` và `eval/traces/`. Tôi phải tự kiểm thời lượng, thao tác bấm thực tế, câu chữ người điều phối và việc mỗi claim trên slide có bằng chứng trong repo.

AI không thể thay nhóm đi phỏng vấn người thật. Vì vậy tôi không sử dụng tên, quote hoặc kết quả validation do AI tạo ra.

## Case fail và bài học

Case fail của phần tôi phụ trách là **CP5 hiện chưa có 5 user test thật**. Feedback log và slide 5 vẫn là scaffold; chúng không được tính là bằng chứng validation. Nếu đưa placeholder hoặc lời nhận xét tự nghĩ vào deck, bản trình bày có thể trông hoàn chỉnh nhưng vi phạm nguyên tắc “không có bằng chứng thì không có slide”.

Tôi chọn giữ trạng thái `0/5` và ghi rõ blocker thay vì làm đẹp số liệu. Bài học là **chuẩn bị biểu mẫu không đồng nghĩa đã validate**. Validation chỉ tồn tại khi có người ngoài nhóm tự làm task, có quan sát hành vi, quote nguyên văn, tên/vai và quyết định thiết kế dựa trên feedback.

## Nếu làm tiếp

Tôi sẽ mời ít nhất năm người ngoài nhóm, ưu tiên willing users; giao đúng một task rồi im lặng quan sát. Sau đó tôi hỏi đúng ba câu bắt buộc, tổng hợp theme lặp lại, chọn một thay đổi làm trước demo và chạy rehearsal có bấm giờ với cả nhóm.

## Tôi phải tự giải thích được khi bị hỏi

1. Vì sao slide 5 chưa được coi là hoàn tất?
2. Một dòng feedback hợp lệ phải có những trường nào?
3. Vì sao người điều phối phải im lặng khi user làm task?
4. Demo case khó chứng minh điều gì mà happy path không chứng minh được?
