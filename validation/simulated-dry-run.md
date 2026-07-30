# Dry run mô phỏng — CP5

> Snapshot kỹ thuật trước human validation; trạng thái hiện tại nằm trong dry-run.md.

## Run of show ước tính

| Mốc | Nội dung | Người nói | Trạng thái kỹ thuật |
|---|---|---|---|
| 0:00–0:40 | Pain 573/1.252 và job | Bùi Thọ An | Evidence script tái lập được |
| 0:40–1:15 | Ba phương án và quyết định | Bùi Thọ An | Khớp `spec.md` §2 |
| 1:15–2:50 | Live demo normal + hard case | Lê Tuấn Cảnh | Pilot live 5/5; browser automation không khả dụng |
| 2:50–3:35 | 17/24 → 24/24 và failure | Phạm Nguyễn Hùng Nguyên | Result/trace có trong `eval/` |
| 3:35–4:15 | Human validation | Nguyễn Văn Tuấn Anh | Tại thời điểm snapshot: chưa có dữ liệu người thật |
| 4:15–4:45 | Nếu có thêm một tuần | Nguyễn Văn Tuấn Anh | Kịch bản đã viết |
| 4:45–5:00 | Buffer | Cả nhóm | 15 giây |

## Bằng chứng kỹ thuật đã chạy

- [x] Provider cấu hình Gemini `gemini-3.5-flash-lite`.
- [x] Simulated pilot giữ hai lượt lỗi HTTP 0/5.
- [x] Simulated direct-live pilot đạt 5/5.
- [x] Có đủ `understood`, `partial`, `misconception`, `insufficient`.
- [x] Smoke test 39/39 sau thay đổi badge.
- [x] JavaScript syntax check không lỗi.
- [ ] Click-through bằng browser automation — browser không khả dụng trong phiên.
- [x] Spoken rehearsal đã thực hiện sau snapshot: 5:08; xem `dry-run.md`.
- [x] Slide 5 đã có hai quote người thật sau snapshot.

## Kết luận

Kịch bản ban đầu được thiết kế ở mức **4:45 + 0:15 buffer**. Dry run thật sau snapshot đạt **5:08**, vì vậy form CP5 hiện phải chọn **“Rồi, nhưng quá giờ”**; xem `dry-run.md`.
