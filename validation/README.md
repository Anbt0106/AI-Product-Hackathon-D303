# CP5 — Validation với người dùng thật

## Trạng thái

- Người đã thử: **0/5**
- Người ngoài nhóm xác nhận sẵn sàng dùng thử: **0/2 tối thiểu**
- Quote nguyên văn có tên/vai: **0/2 tối thiểu cho slide 5**
- Thay đổi từ feedback: **chưa chốt**

> Không điền dữ liệu giả. Một dòng chỉ được tính khi người ngoài nhóm đã thực sự làm task và trả lời ba câu hỏi trong `test-script.md`.

## Pilot mô phỏng đã có

- `SIMULATED-CP5-REPORT.md`: tổng hợp hai lượt HTTP 0/5, lượt direct-live 5/5 và thay đổi badge.
- `simulated-runs/`: input/output/model/latency thật của từng lượt.
- `simulated-dry-run.md`: run of show và checklist kỹ thuật.

Các artifact này chứng minh prototype và AI live, nhưng **không được cộng vào số người ngoài nhóm** và không được dùng làm quote người thật.

## Cách hoàn thành trong khoảng 60 phút

1. Mời ít nhất 5 người ngoài nhóm; ưu tiên ít nhất 2 người đã nói sẵn sàng dùng thử.
2. Với từng người, chạy đúng kịch bản 10 phút trong `test-script.md`.
3. Ghi ngay một dòng vào `feedback-log.md`: tên/vai, willing user, task, quan sát, quote nguyên văn, mức nghiêm trọng.
4. Sau người thứ 5, điền `summary.md`; chọn 1–2 thay đổi làm trước demo.
5. Cập nhật thay đổi vào `spec.md` §9 và thay hai placeholder ở slide 5 bằng quote thật.
6. Chạy dry run theo `dry-run.md`, bấm giờ và ghi kết quả thật.

## Điều kiện CP5 được xem là hoàn tất

- `feedback-log.md` có ≥5 dòng thật từ ≥5 người ngoài nhóm.
- Có ≥2 quote nguyên văn kèm tên/vai trên slide 5.
- `summary.md` chỉ ra chủ đề lặp lại và ít nhất một quyết định thiết kế.
- `spec.md` §9 có thay đổi từ feedback hoặc lý do có căn cứ để giữ nguyên.
- Deck 6 slide và demo script thống nhất số liệu.
- Dry run đã bấm giờ, ghi thời lượng và lỗi gặp phải.
