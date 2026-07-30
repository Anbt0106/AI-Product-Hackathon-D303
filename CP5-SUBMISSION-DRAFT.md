# CP5 — Bản bàn giao và nội dung nộp form

## Trạng thái bằng chứng

- Người ngoài nhóm đã thử prototype: **5**
- Tự hoàn thành không cần trợ giúp: **4/5**
- Tin hoặc khá tin kết quả sau khi xem giải thích/căn cứ: **5/5**
- Nói sẽ dùng thật: **5/5**
- Kết quả eval chính thức: **24/24**; 16/16 output AI live hợp lệ
- Smoke test: **43/43**; toàn bộ test AI client, reader, server, UI demo và CP5 feedback đều đạt
- Dry run: **5 phút 08 giây**

## Nội dung điền form

### Bao nhiêu người ngoài nhóm đã thử prototype?

**5**

### Họ nói gì?

Huy, học viên AI: “Mình không rõ Partial khác Misconception ở mức nào.” Lan, sinh viên năm 2: “Mình tưởng cuộc hội thoại kết thúc sau khi AI trả lời.” Cả hai phản hồi phản ánh hai vấn đề nhóm quan sát được: trạng thái mastery chưa đủ rõ và CTA “Kiểm tra tôi” chưa đủ nổi bật.

### Nhóm đã sửa gì từ phản hồi đó?

Nhóm làm card “Kiểm tra tôi” nổi bật hơn, thêm câu dẫn ngay sau câu trả lời Tutor và tăng kích thước CTA. Result card được bổ sung định nghĩa một dòng cho từng mastery state cùng nhãn “Điểm cần sửa”, “Vì sao chưa đủ” hoặc “Kết luận”. Nhóm không tự động bật Micro-Check vì muốn giữ quyền chủ động và tránh làm gián đoạn người học.

### Kết quả đo lần cuối

**24/24**

### Nếu chưa đạt chuẩn nhóm tự đặt thì vì sao?

Không áp dụng cho lượt chính thức: chuẩn chốt trước là ≥85% và không vi phạm ba bất biến cứng; lượt live chính thức đạt 24/24. Nhóm vẫn giữ lượt 17/24 và các lượt lỗi để chứng minh quá trình sửa rubric/schema.

### Đã chạy thử demo có bấm giờ chưa?

Chọn **“Rồi, nhưng quá giờ”**. Dry run ngày 30/07/2026 lúc 21:30, Nguyễn Minh bấm giờ, tổng 5:08. Happy path, hard case, insufficient, Gate, badge và trace đều đạt; nhóm cần cắt ít nhất 8 giây và rerun trước demo.

### Ai nói phần nào khi demo?

- Bùi Thọ An: người dùng, pain, bằng chứng 573/1.252 và quyết định chọn giải pháp.
- Lê Tuấn Cảnh: live demo, happy path, hard case và trace.
- Phạm Nguyễn Hùng Nguyên: golden set, quality bar, 17/24 → 24/24 và failure analysis.
- Nguyễn Văn Tuấn Anh: human validation 5/5, thay đổi từ feedback và kết luận.

## Nguồn kiểm chứng

- `validation/feedback-log.md`
- `validation/summary.md`
- `validation/dry-run.md`
- `eval/results/`, `eval/traces/`
- `codebase/test/cp5-feedback-ui.mjs`
