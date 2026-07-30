# Kịch bản user test 10 phút

## Chuẩn bị

- Mở ứng dụng ở `http://localhost:5173`.
- Trước lượt classify, badge phải ghi `AI đã cấu hình — chưa xác minh kết nối`; sau một classify live thành công, badge phải chuyển thành `AI thật đã xác minh (<model>)`. Nếu đang mock hoặc có fallback, ghi rõ vào log và không dùng lượt đó để đánh giá độ tin cậy của AI.
- Không hướng dẫn vị trí nút trong lúc người dùng làm task.

## Task đọc nguyên văn cho người thử

> Bạn đang học về self-attention trên VLearn. Tutor vừa giải thích một đoạn ở trang 15. Hãy dùng sản phẩm để kiểm tra xem bạn đã hiểu đúng chưa. Sau đó thử một câu trả lời mà bạn nghĩ là có vẻ đúng thuật ngữ nhưng sai bản chất, rồi tìm cách sửa hoặc phản đối kết quả AI nếu cần.

## Nhịp 10 phút

| Thời gian | Người điều phối làm gì |
|---|---|
| 0:00–0:30 | Đọc task, nhắc người thử nói thành tiếng điều họ đang nghĩ. |
| 0:30–5:30 | Im lặng quan sát. Chỉ nhắc lại task nếu họ hỏi “phải làm gì”; không chỉ nút. |
| 5:30–7:00 | Yêu cầu họ mở căn cứ/trace nếu chưa tự mở và nói điều khiến họ tin hoặc không tin. |
| 7:00–10:00 | Hỏi đúng ba câu dưới đây, ghi nguyên văn. |

## Ba câu bắt buộc

1. **Điều gì khó hiểu hoặc khó chịu nhất?**
2. **Kết quả này bạn có tin không — vì sao?**
3. **Bạn có dùng thật không — vì sao / vì sao chưa?**

## Quy tắc ghi log

- Quan sát là hành vi nhìn thấy được: “dừng 8 giây ở nút…”, không phải suy đoán “bạn ấy không hiểu”.
- Quote giữ nguyên từ ngữ, kể cả lỗi chính tả hoặc câu cụt.
- Severity:
  - `Critical`: không thể hoàn thành task hoặc tin nhầm kết quả nguy hiểm.
  - `Major`: hoàn thành được nhưng cần trợ giúp hoặc hiểu sai một phần quan trọng.
  - `Minor`: chậm, khó chịu, nhãn chưa rõ nhưng vẫn tự hoàn thành.
  - `Positive`: điểm tạo niềm tin hoặc giá trị rõ ràng.
