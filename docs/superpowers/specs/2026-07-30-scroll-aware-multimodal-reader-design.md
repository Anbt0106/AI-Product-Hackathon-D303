# Thiết kế trình đọc PDF đồng bộ trang và AI multimodal

**Ngày:** 2026-07-30
**Trạng thái:** Đã được người dùng duyệt trong phiên làm việc
**Phạm vi:** Bổ sung vào web VLearn live student demo trên `main`

## 1. Mục tiêu

Sinh viên cuộn tự nhiên trong tài liệu PDF. Trang đang hiển thị được tự động
nhận diện và trở thành ngữ cảnh cho câu hỏi tiếp theo. AI phải giải thích dựa
trên cả chữ lẫn hình ảnh của trang, sau đó đưa ra lựa chọn kiểm tra lại kiến
thức.

Tính năng phải hoạt động trên tất cả trang của tất cả PDF trong web, không chỉ
những trang đã có transcript kiểm chứng viết sẵn.

## 2. Trải nghiệm người dùng

### 2.1 Đọc và cuộn tài liệu

- Thay iframe của Chrome PDF Viewer bằng trình xem PDF.js chạy cục bộ.
- Các trang PDF được render liên tục trong một vùng cuộn.
- Trang có tỷ lệ hiển thị lớn nhất trong viewport được coi là trang hiện tại.
- Việc cập nhật trang được debounce khoảng 250 ms sau thao tác cuộn để tránh
  nhảy trạng thái liên tục.
- Thanh công cụ, chip nguồn và ô hỏi Tutor tự cập nhật thành `Trang X / N`.
- Khi trang chưa render xong, ô hỏi bị khóa và hiển thị
  `Đang chuẩn bị nội dung trang…`.

### 2.2 Hỏi Tutor

Khi sinh viên bấm gửi, frontend tạo một snapshot bất biến gồm:

- mã và tên tài liệu;
- số trang hiện tại;
- source ID dạng `document-code:page-X`;
- text do PDF.js trích xuất từ trang;
- ảnh JPEG thu nhỏ từ canvas của trang;
- câu hỏi của sinh viên.

Nếu sinh viên cuộn sang trang khác trong lúc request đang chạy, kết quả vẫn gắn
với snapshot tại thời điểm bấm gửi. Ngữ cảnh không được đổi giữa chừng.

### 2.3 Lịch sử theo trang

- Cuộn sang trang khác không xóa lịch sử hội thoại.
- Mỗi câu hỏi, câu trả lời Tutor, Micro-Check và kết quả đánh giá đều có nhãn
  `Tên tài liệu · Trang X`.
- Mỗi lượt Tutor giữ snapshot riêng để Micro-Check và đánh giá sau đó luôn dùng
  đúng trang nguồn của lượt đó.

### 2.4 Kiểm tra lại kiến thức

Sau khi câu trả lời Tutor vượt qua Grounding Gate, giao diện hiển thị ngay dưới
câu trả lời hai lựa chọn:

1. `Kiểm tra lại kiến thức`
2. `Tiếp tục đọc`

`Kiểm tra lại kiến thức` gọi AI để sinh một câu teach-back từ cùng snapshot.
Kết quả đánh giá câu trả lời sinh viên tiếp tục dùng snapshot đó, kể cả khi vùng
đọc PDF đã cuộn sang trang khác.

## 3. Kiến trúc

### 3.1 PDF reader

PDF.js được đóng gói cục bộ cùng ứng dụng, không tải thư viện từ CDN khi chạy.
Frontend dùng PDF.js để:

- tải PDF cùng origin từ server hiện tại;
- lấy tổng số trang;
- render từng trang vào canvas;
- lấy text content theo từng trang;
- tạo ảnh JPEG đã resize từ canvas;
- theo dõi phần tử trang bằng `IntersectionObserver`.

Một module reader riêng phát các sự kiện:

```text
document-loaded(documentCode, pageCount)
page-preparing(pageNumber)
page-ready(pageContext)
active-page-changed(pageNumber)
document-error(error)
```

`app.js` chỉ tiêu thụ các sự kiện này; không trực tiếp quản lý chi tiết render
PDF.

### 3.2 Xác định trang hiện tại

Mỗi trang có một phần tử wrapper với `data-page-number`. Observer lưu
intersection ratio mới nhất của từng trang. Sau debounce, thuật toán chọn trang
có ratio lớn nhất; khi hòa, chọn trang có tâm gần tâm viewport hơn.

Trang hiện tại chỉ được công bố khi:

- canvas đã render xong;
- snapshot ảnh đã tạo được;
- text extraction đã hoàn tất hoặc đã xác định trang không có text.

### 3.3 Page context cache

Frontend cache theo khóa `documentCode:pageNumber`:

```js
{
  documentCode,
  documentTitle,
  pageNumber,
  sourceId,
  text,
  imageDataUrl,
  imageBytes,
  width,
  height
}
```

Ảnh được resize tối đa khoảng 1600 px theo cạnh dài và nén JPEG trước khi đưa
vào cache. Khi đổi tài liệu, hủy render đang chờ, disconnect observer và giải
phóng cache của tài liệu cũ.

### 3.4 AI multimodal

Ba endpoint live tiếp tục tách biệt:

- `POST /api/tutor`
- `POST /api/question`
- `POST /api/classify`

Mỗi request mang cùng `page_context` gồm metadata, text và ảnh của snapshot.
Server validate source ID, page, MIME type, kích thước ảnh và giới hạn tổng body
trước khi gọi Gemini generateContent API.

Tutor và question generation nhận text cùng `input_image`. Classifier nhận cùng
snapshot, câu Micro-Check và câu trả lời sinh viên để đánh giá đúng cả nội dung
sơ đồ. Server không ghi ảnh xuống ổ đĩa.

## 4. Grounding Gate

Với trang được lấy trực tiếp từ PDF, source ID của lượt hỏi là
`document-code:page-X`.

Grounding Gate kiểm tra:

- snapshot thuộc tài liệu đang mở tại thời điểm gửi;
- số trang hợp lệ trong tài liệu;
- source ID khớp tài liệu và trang;
- phản hồi Tutor chỉ viện dẫn source ID đã cấp;
- ảnh trang tồn tại và vượt qua validation;
- text extraction đã hoàn tất, kể cả khi kết quả là chuỗi rỗng.

Nếu AI viện dẫn trang hoặc tài liệu khác, Gate không mở Micro-Check.

Transcript curator hiện có có thể giữ làm metadata bổ sung cho những trang đã
được kiểm chứng, nhưng không còn là điều kiện để một trang được hỏi Tutor.

## 5. Trạng thái và lỗi

- `loading-document`: đang tải PDF.
- `rendering-page`: đang render trang hoặc trích text.
- `page-ready`: snapshot trang sẵn sàng để hỏi.
- `document-error`: PDF không tải hoặc không đọc được.
- `snapshot-error`: không tạo được ảnh trang.
- `ai-error`: Gemini không xử lý được request multimodal.

Khi lỗi:

- giữ nguyên lịch sử và input sinh viên;
- hiển thị lỗi tại đúng lượt hoặc vùng reader;
- có nút `Thử lại` cho bước vừa lỗi;
- không fallback sang mock;
- không tự chuyển sang trang khác làm nguồn thay thế.

Nếu text extraction rỗng nhưng ảnh hợp lệ, AI vẫn có thể xử lý trang bằng
vision. Nếu ảnh không hợp lệ, nút hỏi bị khóa vì yêu cầu sản phẩm bắt buộc đọc
cả ảnh.

## 6. Bảo mật và giới hạn dữ liệu

- Chỉ snapshot một trang được gửi trong mỗi request.
- Ảnh phải là JPEG hoặc PNG data URL và nằm dưới giới hạn byte cấu hình.
- Server từ chối MIME khác, base64 lỗi, source ID sai hoặc request quá lớn.
- API key chỉ tồn tại phía server.
- Trace không lưu `imageDataUrl`, base64, system prompt hoặc API key.
- Trace chỉ ghi document code, page, source ID, image byte count, model,
  latency, trạng thái Gate và kết quả đã kiểm schema.

## 7. Thay đổi dự kiến

- Thêm bản PDF.js cục bộ và worker tương ứng.
- Thêm module reader/page-context tách khỏi `app.js`.
- Thay iframe trong `codebase/index.html` bằng vùng chứa các page canvas.
- Cập nhật `codebase/app.js` để nhận active page, tạo snapshot bất biến và giữ
  lịch sử theo trang.
- Cập nhật `codebase/app.css` cho continuous reader, loading và active-page
  marker.
- Cập nhật `codebase/engine/ai-client.js` để gửi `page_context` multimodal.
- Cập nhật `codebase/server.mjs` để validate ảnh và tạo Gemini multimodal input có
  `input_text` cùng `input_image`.
- Cập nhật Grounding Gate để dùng source ID cấp trang cho mọi PDF page.
- Bổ sung unit test cho page selection, debounce, snapshot và payload.
- Bổ sung browser smoke test cho Day 1 và Day 2.
- Cập nhật README, spec và kịch bản demo.

## 8. Tiêu chí nghiệm thu

1. Cuộn tới bất kỳ trang nào của mỗi PDF đều cập nhật đúng `Trang X / N`.
2. Câu hỏi được khóa vào trang hiện tại tại thời điểm bấm gửi.
3. AI nhận cả text và ảnh của trang, không dựa vào transcript viết sẵn.
4. Cuộn trong lúc request chạy không thay đổi nguồn của kết quả.
5. Lịch sử được giữ và mọi block đều ghi rõ tài liệu, trang.
6. `Kiểm tra lại kiến thức` chỉ xuất hiện sau Tutor answer qua Grounding Gate.
7. Micro-Check và classifier dùng đúng snapshot của lượt Tutor tương ứng.
8. Tất cả trang của cả Day 1 và Day 2 render được; trang không có text vẫn có
   ảnh hợp lệ.
9. PDF/Vision lỗi hiển thị rõ và retry được, không fallback mock.
10. Trace không chứa ảnh base64, API key hoặc system prompt.
11. Test offline vượt qua và browser smoke test hoàn thành trên cả hai tài liệu.
