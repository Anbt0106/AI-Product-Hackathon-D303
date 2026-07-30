# Bản nói tổng kết CP3 — VLearn Hiểu Đúng, Hiểu Thật

> Thời lượng gợi ý: 3–4 phút. Có thể đọc trực tiếp khi checkpoint hoặc dùng làm speaker notes.

## Mở đầu

Ở CP2, nhóm em đã hoàn thành một prototype mức Mock với flow chính bấm được từ đầu đến cuối. Học viên có thể chọn tài liệu, chọn trang, bôi đen một đoạn slide, hỏi Tutor, xem trích dẫn, bấm “Kiểm tra tôi”, trả lời một câu teach-back và nhận kết quả về mức độ hiểu.

Tuy nhiên, ở CP2 quyết định mức hiểu vẫn được thực hiện bằng luật khớp từ khóa. Vì vậy nhóm khai rõ đây chưa phải AI thật. Mục tiêu của CP3 là đưa ít nhất một lời gọi AI thật vào đúng quyết định trung tâm, đồng thời giữ các phần còn lại ở dạng mock để không làm flow demo thiếu ổn định.

## Nhóm đã làm gì ở CP3

Quyết định trung tâm nhóm chọn là **Mastery Classifier**. Sau khi học viên trả lời câu teach-back, hệ thống gọi Gemini để quyết định một trong bốn trạng thái:

- `understood`: học viên đã nắm đủ các ý chính;
- `partial`: có ít nhất một ý đúng nhưng còn thiếu;
- `misconception`: học viên đang khẳng định một quan hệ sai;
- `insufficient`: câu trả lời chưa đủ thông tin để kết luận.

Đường chạy thật hiện tại là:

```text
Học viên gửi teach-back
→ POST /api/classify
→ Gemini structured output
→ server kiểm schema và các bất biến
→ UI hiển thị trạng thái hiểu và một bước củng cố
```

Nhóm cố ý chỉ gọi AI thật ở Mastery Classifier. Câu trả lời của Tutor và câu hỏi Micro-Check vẫn lấy từ bank viết sẵn. Lý do là nhóm muốn cùng một input được dùng cho cả baseline và AI live, nhờ đó việc so sánh có ý nghĩa và demo không bị thay đổi câu hỏi giữa các lượt.

API key chỉ nằm trong `codebase/.env` ở máy cục bộ. File này đã được `.gitignore` bỏ qua. Key không nằm trong JavaScript phía client, không xuất hiện trong trace và không được commit lên Git.

## Những cải thiện so với CP2

So với CP2, thay đổi lớn nhất là quyết định mức hiểu không còn chỉ dựa trên khớp từ khóa. Gemini có thể đánh giá cách diễn đạt tự do của học viên, kể cả khi học viên không dùng đúng từ khóa trong bank.

Nhóm cũng bổ sung các lớp bảo vệ xung quanh AI:

- Output bị ép theo JSON schema thay vì văn bản tự do.
- Server kiểm lại schema trước khi đưa kết quả lên UI.
- `understood` bắt buộc đi với `continue` và không được có `gap`.
- `partial` và `misconception` phải đi với `reinforce`.
- `insufficient` phải đi với `clarify`, không được cho học tiếp.
- Mọi verdict đều được gắn lại với đúng trang nguồn từ context.
- Nếu API lỗi, hệ thống fallback về baseline luật và phải ghi rõ vào trace, không im lặng giả vờ là AI thật.

Badge trên giao diện cũng được đổi để nói chính xác phần nào đang chạy thật. Khi cấu hình đúng, badge hiển thị `CP3 · AI thật ở Mastery (gemini-3.5-flash-lite)`. Các phần Tutor, tài liệu và câu hỏi vẫn được khai là mock trong `spec.md` §4.

## Golden set và cách đo

Nhóm xây một golden set gồm 24 case:

- 8 case thông thường;
- 12 case khó;
- 4 case hiếm;
- 12 case được phát triển từ mã hội thoại thật trong data pack;
- mỗi lớp chỗ khó có ít nhất 2 case.

Bốn lớp được phủ gồm:

1. thiếu hoặc lệch nguồn;
2. câu trả lời mơ hồ hoặc thiếu thông tin;
3. yêu cầu ngoài phạm vi và prompt injection;
4. lỗi đặc thù domain, đặc biệt là dùng đúng thuật ngữ nhưng nêu sai quan hệ.

Quality bar được chốt là **đạt ít nhất 85% toàn bộ golden set và không vi phạm ba bất biến cứng**. Baseline luật đạt 24/24. Lượt Gemini live chính thức cũng đạt 24/24, với 16 lời gọi AI thật ở 16 case Mastery. Latency quan sát được nằm trong khoảng 1,11 đến 1,73 giây.

Kết quả chính thức nằm tại:

- `eval/results/live-gemini-2026-07-30T07-38-48-056Z.md`;
- `eval/traces/live-gemini-2026-07-30T07-38-48-056Z.json`.

Trace lưu mode live, model, latency, context tối thiểu, input và output; không lưu API key.

## Những vấn đề đã gặp và cách sửa

### 1. Model cũ không còn sử dụng được

Cấu hình ban đầu dùng `gemini-2.0-flash`. Nhóm đã chuyển sang `gemini-3.5-flash-lite`, phù hợp hơn với tác vụ phân loại cần độ trễ thấp.

### 2. Payload structured output không khớp endpoint

Lượt đầu Gemini trả HTTP 400 vì `responseFormat` không tương thích với endpoint `generateContent` đang gọi. Nhóm chuyển sang cấu hình:

```javascript
generationConfig: {
  responseMimeType: "application/json",
  responseJsonSchema: schema
}
```

Sau thay đổi, API bắt đầu trả response có cấu trúc.

### 3. Node không tin chứng thư TLS của Avast Web Shield

Node báo `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, trong khi PowerShell vẫn kết nối được. Nguyên nhân là Avast Web Shield ký lại kết nối TLS bằng một CA có trong Windows Certificate Store nhưng không nằm trong CA bundle riêng của Node.

Nhóm không tắt kiểm tra TLS. Thay vào đó, nhóm tạo `codebase/start.ps1` để lấy CA công khai của Avast từ Windows và truyền cho Node qua `NODE_EXTRA_CA_CERTS`. Nhờ đó kết nối vẫn được xác minh đầy đủ và lệnh chạy demo được rút gọn thành:

```powershell
cd codebase
.\start.ps1
```

### 4. Lượt AI hoạt động đầu tiên chỉ đạt 70,8%

Lượt này tổng thể đạt 17/24, trong đó Mastery đạt 9/16. Nhóm quan sát được ba kiểu lỗi:

- câu đúng nhưng thiếu một ý bị gắn thành misconception;
- một số câu cần partial lại bị gắn understood;
- insufficient đôi khi đi với hành động retry thay vì clarify.

Nguyên nhân không nằm ở golden set mà nằm ở prompt. Model chỉ nhận context, câu hỏi và câu trả lời nhưng chưa nhận rubric các ý đúng và các quan hệ sai đã chốt. Vì vậy model tự đặt tiêu chuẩn khác với tiêu chuẩn đo của nhóm.

Nhóm bổ sung vào mỗi lời gọi:

- danh sách các ý đúng cần tìm;
- danh sách các quan hệ sai đã biết;
- quy tắc “thiếu ý không đồng nghĩa với misconception”;
- ánh xạ bắt buộc giữa mastery state và next action;
- yêu cầu chấp nhận cách diễn đạt tương đương, không chỉ khớp từ khóa.

Sau thay đổi, nhóm chạy lại trên cùng golden set, giữ nguyên nhãn và quality bar. Kết quả tăng từ 70,8% lên 100%.

### 5. Server không mở port trong một số cách chạy

Điều kiện kiểm tra `server.mjs` có đang được chạy trực tiếp hay không từng so sánh đường dẫn tương đối với đường dẫn tuyệt đối. Nhóm sửa bằng cách resolve đường dẫn trước khi so sánh. Sau đó server mở đúng cổng 5173 cả khi chạy trực tiếp và qua `start.ps1`.

## Cách nhóm xử lý các lượt lỗi

Nhóm không xóa các lượt thất bại hoặc lượt dưới quality bar. Repo vẫn giữ:

- hai lượt lỗi kết nối TLS;
- một lượt lỗi payload structured output;
- một lượt live đạt 70,8%;
- lượt chính thức đạt 100%.

Việc giữ lại các artifact này giúp quá trình đo có thể phúc khảo và chứng minh kết quả cuối đến từ việc sửa đúng nguyên nhân, không phải do xóa case khó hoặc thay nhãn golden set.

## Kết luận

Kết quả của CP3 không chỉ là “đã gọi được API”. Nhóm đã đưa AI thật vào đúng quyết định trung tâm, đo nó trên một golden set cố định, ghi lại cả lượt tốt lẫn lượt lỗi, rồi bổ sung lớp validation và fallback để flow demo vẫn an toàn.

Prototype hiện vẫn được khai đúng là **Mock có AI thật ở lõi**: Tutor, tài liệu và câu Micro-Check là mock; Mastery Classifier là Gemini thật. Flow CP2 vẫn giữ nguyên và smoke test đạt 39/39. Lượt CP3 chính thức đạt 24/24 với 16 lời gọi AI thật và trace đầy đủ trong repo.

## Câu chốt 20 giây

> Ở CP2, nhóm em chứng minh flow bấm được. Sang CP3, nhóm đưa Gemini thật vào đúng quyết định “học viên đã hiểu đến đâu”, giữ các phần khác ở dạng mock để đo ổn định. Sau các lỗi về TLS, payload và prompt rubric, cùng một golden set đã đi từ 70,8% lên 100%, với 16 lời gọi live và trace đầy đủ, không thay nhãn để làm đẹp kết quả.