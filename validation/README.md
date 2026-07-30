# CP5 — Validation với người dùng thật

## Trạng thái

- Người ngoài nhóm đã thử: **5/5**
- Tự hoàn thành không cần trợ giúp: **4/5**
- Willing users: **5/5**, vượt chuẩn tối thiểu 3
- Quote nguyên văn có tên/vai: **5/5**, đã chọn 2 quote cho slide 5
- Thay đổi từ feedback: **2 thay đổi đã triển khai và có test**
- Dry run: **5:08 — đã chạy nhưng quá giờ 8 giây**

## Artifact human validation

- `feedback-log.md`: đủ tên/biệt danh, vai trò, task, quan sát, ba câu trả lời nguyên văn và severity của 5 người.
- `summary.md`: số liệu tổng hợp, hai chủ đề ưu tiên, quyết định sửa/giữ và hai quote cho slide.
- `dry-run.md`: thời gian thật, kết quả các đường demo và điểm chậm.
- `test-script.md`: kịch bản dùng thống nhất cho các lượt thử.

## Thay đổi đã làm

1. CTA “Kiểm tra tôi” được làm nổi bật và có câu dẫn ngay sau câu trả lời Tutor.
2. Result card giải nghĩa ngắn từng mastery state và gắn nhãn `Điểm cần sửa`/`Vì sao chưa đủ`.

Bằng chứng code và test: `../codebase/app.js`, `../codebase/app.css`, `../codebase/test/cp5-feedback-ui.mjs`.

## Pilot kỹ thuật

- `SIMULATED-CP5-REPORT.md`: hai lượt HTTP 0/5, lượt direct-live 5/5 và thay đổi badge.
- `simulated-runs/`: input/output/model/latency thật của từng lượt.
- `simulated-dry-run.md`: run of show kỹ thuật trước human validation.

Pilot kỹ thuật và human validation được giữ tách biệt; persona mô phỏng không được cộng vào 5 người thật.

## Điều kiện nghiệm thu

- [x] ≥5 người ngoài nhóm tự thử prototype.
- [x] ≥2 quote nguyên văn kèm tên/vai.
- [x] Summary chỉ ra chủ đề lặp lại và quyết định thiết kế.
- [x] Có thay đổi sản phẩm từ feedback và test hồi quy.
- [x] `spec.md` §9 ghi thay đổi từ feedback.
- [x] Deck 6 slide và demo script dùng cùng số liệu.
- [x] Dry run đã bấm giờ, ghi thời lượng và lỗi.
- [ ] Dry run nằm trong 5 phút — lượt hiện tại vượt 8 giây; cần rerun sau khi cắt lời slide 4.
