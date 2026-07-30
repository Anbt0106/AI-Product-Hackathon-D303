# CP5 — Bản bàn giao và nội dung nộp form

## 1. Trạng thái có thể khai báo bằng bằng chứng trong repo

- Prototype chạy được end-to-end với Tutor và Micro-Check dùng dữ liệu mock ổn định.
- Quyết định trung tâm `understood / partial / misconception / insufficient` gọi Gemini thật qua `POST /api/classify`.
- Provider/model đã kiểm tra: `gemini / gemini-3.5-flash-lite`.
- Golden set: **24 câu**; chuẩn đạt chốt trước là **≥85%** và không vi phạm ba bất biến cứng.
- Kết quả live chính thức: **24/24**, trong đó có **16/16 output AI live hợp lệ**.
- Simulated technical pilot: hai lượt HTTP **0/5** được giữ làm failure evidence; lượt direct-live sau khi sửa kết nối đạt **5/5**.
- Smoke test sau thay đổi badge: **39/39**.
- Thay đổi từ pilot: badge không còn coi “có key” là bằng chứng AI đã hoạt động; chỉ ghi “AI thật đã xác minh” sau một classify live thành công.

## 2. Câu trả lời CP5 có thể dùng ngay

### Kết quả đo lần cuối

**24/24.** Kết quả đầy đủ nằm trong `eval/results/`; trace live nằm trong `eval/traces/`.

### Nếu chưa đạt chuẩn nhóm tự đặt thì vì sao?

**Không áp dụng cho lượt chính thức:** nhóm đặt chuẩn ≥85% và không vi phạm ba bất biến cứng; lượt live chính thức đạt 24/24. Nhóm vẫn giữ lượt 17/24 và các lượt lỗi trước đó để chứng minh quá trình tìm lỗi, sửa schema/rubric và không chỉ báo cáo kết quả đẹp.

### Nhóm đã sửa gì từ phản hồi/pilot?

Trong pilot kỹ thuật, `/api/health` từng báo live chỉ vì đã có API key, nhưng hai lượt HTTP vẫn thất bại 0/5. Nhóm bổ sung trạng thái `verified`: badge chỉ ghi “AI thật đã xác minh” sau khi Mastery Classifier gọi provider thành công; khi live call lỗi và dùng fallback, badge quay về trạng thái chưa xác minh và trace giữ nguyên lỗi.

### Ai nói phần nào khi demo?

- **Bùi Thọ An:** người dùng, vấn đề, bằng chứng 573/1.252 và quyết định chọn giải pháp.
- **Lê Tuấn Cảnh:** thao tác live demo, happy path, hard case và trace.
- **Phạm Nguyễn Hùng Nguyên:** golden set, quality bar, kết quả 17/24 → 24/24 và failure analysis.
- **Nguyễn Văn Tuấn Anh:** validation, thay đổi sau phản hồi, kế hoạch tiếp theo và kết luận.

### Đã chạy thử demo có bấm giờ chưa?

Hiện chỉ có **dry run mô phỏng 4:45 + 0:15 buffer** và kiểm thử kỹ thuật; chưa có biên bản cả nhóm nói thật kèm đồng hồ. Nếu chưa tổ chức spoken rehearsal, trong form phải chọn **“Chưa chạy thử”**. Không chọn “Rồi, đúng 5 phút” chỉ dựa trên timeline dự kiến.

## 3. Các trường bắt buộc phải lấy từ người thật trước khi nộp

Những trường sau không thể được thay bằng persona mô phỏng hoặc output AI:

1. **Bao nhiêu người ngoài nhóm đã thử prototype?** Hiện repo ghi **0/5**.
2. **Họ nói gì?** Cần tên/vai và ít nhất hai câu nói nguyên văn, tổng tối thiểu 100 ký tự.
3. **Nhóm sửa gì từ phản hồi người thật?** Cần liên kết tới dòng tương ứng trong `validation/feedback-log.md`; thay đổi badge hiện tại đến từ pilot kỹ thuật, không phải human feedback.
4. **Willing users:** hiện **0/3**; cần ít nhất ba người ngoài nhóm xác nhận, không dùng persona mô phỏng.
5. **Dry run thật:** cần ngày giờ, người bấm giờ, tổng thời lượng và lỗi gặp phải.

## 4. Checklist trước lần push/nộp cuối

- [x] `spec.md` mô tả đúng ranh giới thật/mock và model.
- [x] `eval/` có golden set, kết quả pass/fail và trace kể cả lượt lỗi.
- [x] `validation/` có test script, feedback log, summary, dry-run và simulated evidence.
- [x] Có deck 6 slide ở `demo-slides.pptx` và bản xuất `demo-slides.pdf`.
- [x] Có reflection riêng cho bốn thành viên.
- [x] `.env` và API key bị Git ignore.
- [ ] Điền đủ ≥5 người thử thật vào `validation/feedback-log.md`.
- [ ] Thay hai quote placeholder trên slide bằng quote thật.
- [ ] Chốt thay đổi từ human feedback trong `validation/summary.md` và `spec.md` §9.
- [ ] Chạy spoken rehearsal, bấm giờ và hoàn tất `validation/dry-run.md`.

## 5. Nguồn bằng chứng

- Trạng thái tổng: `CP5-STATUS.md`
- Golden set và kết quả: `eval/golden-set.json`, `eval/results/`, `eval/traces/`
- Pilot kỹ thuật: `validation/SIMULATED-CP5-REPORT.md`, `validation/simulated-runs/`
- Kịch bản user test: `validation/test-script.md`
- Log người thử: `validation/feedback-log.md`
- Kịch bản demo: `DEMO-5-PHUT.md`, `KICH-BAN-SLIDE-6-TRANG.md`
