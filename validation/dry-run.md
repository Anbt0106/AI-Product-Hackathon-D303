# Dry run CP5 — kịch bản và biên bản

## Run of show 5 phút

| Mốc | Nội dung | Người phụ trách | Bằng chứng trên màn hình |
|---|---|---|---|
| 0:00–0:35 | User, pain, con số 573/1.252 | Bùi Thọ An | Slide 1 |
| 0:35–1:05 | Vì sao chọn Grounding Gate + teach-back | Bùi Thọ An | Slide 2 |
| 1:05–2:45 | Live demo: happy path và case “đúng thuật ngữ, sai quan hệ” | Lê Tuấn Cảnh | App + trace |
| 2:45–3:25 | Kết quả 24 case, quality bar, failure 17/24 | Phạm Nguyễn Hùng Nguyên | Slide 4 + `eval/` |
| 3:25–4:15 | Hai quote thật và thay đổi từ feedback | Nguyễn Văn Tuấn Anh | Slide 5 |
| 4:15–4:45 | Một tuần tiếp theo và bài học | Nguyễn Văn Tuấn Anh | Slide 6 |
| 4:45–5:00 | Buffer / chuyển Q&A | Cả nhóm | — |

## Biên bản dry run ngày 30/07/2026

- Ngày giờ: **30/07/2026 — 21:30**
- Người bấm giờ: **Nguyễn Minh**
- Tổng thời lượng: **5 phút 08 giây**
- Trạng thái form CP5: **Rồi, nhưng quá giờ**
- Badge AI: **đã chuyển sang “AI thật đã xác minh”**
- Happy path ra `understood`: **Có**
- Hard case ra `misconception`: **Có**
- Câu mơ hồ ra `insufficient`: **Có**
- Gate thiếu nguồn chặn đúng: **Có**
- Trace có model, latency và output: **Có**
- Slide 5 có hai quote thật: **Có sau lần cập nhật CP5 này**
- Kiểm tra thành viên ngẫu nhiên: **chưa ghi nhận trong biên bản nhóm cung cấp**

## Lỗi gặp và quyết định sau dry run

| Lỗi/điểm chậm | Mức ảnh hưởng | Sửa trước demo | Người phụ trách |
|---|---|---|---|
| Sinh câu hỏi teach-back chậm khoảng 2–3 giây | Thấp | Giữ loading state; người demo nói trước câu chuyển để tránh khoảng lặng | Lê Tuấn Cảnh |
| Người mới mất 10–20 giây để thấy “Kiểm tra tôi” | Cao | Làm card CTA nổi bật, thêm câu dẫn sau câu trả lời Tutor | Lê Tuấn Cảnh |
| Một số người đọc lâu để phân biệt `partial`, `misconception`, `insufficient` | Vừa | Thêm định nghĩa một dòng và nhãn lý do ngay trong result card | Lê Tuấn Cảnh |
| Tổng thời lượng vượt 8 giây | Vừa | Cắt phần giải thích slide 4 khoảng 10 giây và không đọc toàn bộ trace | Nguyễn Văn Tuấn Anh |

## Quyết định trước demo

Run đầu đã đi hết happy path, hard case, low-confidence, Gate và trace nhưng vượt 8 giây. Kịch bản trình bày được rút gọn để nhắm **4:50**, tuy nhiên chỉ được chọn “Rồi, đúng 5 phút” sau một lần bấm giờ mới đạt; với bằng chứng hiện có phải khai **“Rồi, nhưng quá giờ”**.
