# Thiết kế web demo VLearn dùng AI thật

**Ngày:** 2026-07-30
**Trạng thái:** Đã được người dùng duyệt trong phiên làm việc
**Phạm vi:** Nâng cấp web hiện có trên `main`, vốn đã chứa code từ branch `anbt/vlearn-manual-demo`

## 1. Mục tiêu

Tạo một web demo có giao diện và hành vi như trải nghiệm của sinh viên bình
thường. Sinh viên tự chọn tài liệu, trang, đoạn transcript, tự đặt câu hỏi và
tự trả lời Micro-Check. Cả ba bước AI trung tâm đều gọi OpenAI thật:

1. Tutor trả lời câu hỏi dựa trên ngữ cảnh đã chọn.
2. AI sinh một câu Micro-Check dạng teach-back.
3. AI đánh giá câu trả lời và đề xuất đúng một bước củng cố.

Web phải minh bạch khi API lỗi, không được tự động thay thế kết quả live bằng
mock.

## 2. Không thuộc phạm vi

- Không thêm bảng điều khiển dành riêng cho người thuyết trình.
- Không thêm nút chọn tình huống, tự chạy kịch bản hoặc điền sẵn câu trả lời.
- Không xây agent tự chọn tài liệu hoặc tự quyết định toàn bộ hành trình học.
- Không gửi toàn bộ data pack hoặc chatlog lên OpenAI.
- Không đưa API key, system prompt hoặc nội dung bí mật vào frontend hay trace.

## 3. Kiến trúc

Giữ kiến trúc web hiện tại: frontend HTML/CSS/JavaScript thuần, Node server và
các engine tách riêng cho context, Grounding Gate, mastery, feedback và trace.
Nâng server thành ba lời gọi live độc lập:

```text
Chọn tài liệu/trang/đoạn
  -> POST /api/tutor
  -> Grounding Gate kiểm lại nguồn
  -> POST /api/question
  -> Sinh viên nhập teach-back
  -> POST /api/classify
  -> Hiển thị mức hiểu + căn cứ + một bước củng cố
```

Các endpoint dùng cùng cấu hình `OPENAI_API_KEY` và `OPENAI_MODEL` trong
`codebase/.env`. Secret chỉ được đọc phía server. `/api/health` công bố chế độ,
provider, model và danh sách bước live để frontend hiển thị đúng trạng thái.

## 4. Trải nghiệm sinh viên

### 4.1 Chọn ngữ cảnh

- Giữ bố cục VLearn ba cột: học liệu, slide/transcript và Tutor.
- Sinh viên được chọn tự do giữa các tài liệu, trang và đoạn transcript có sẵn.
- Nếu chưa chọn nguồn, nút gửi câu hỏi không gọi AI; giao diện hướng dẫn chọn
  ít nhất một đoạn.
- Khi đổi tài liệu, trang hoặc tập đoạn đã chọn, vòng Tutor/Micro-Check hiện tại
  được xóa để tránh dùng nhầm ngữ cảnh cũ.

### 4.2 Tutor live

- Sinh viên nhập câu hỏi tự do trong phạm vi tài liệu.
- Trong lúc chờ, thread hiển thị trạng thái `AI đang trả lời…` và khóa thao tác
  gửi trùng.
- Tutor trả lời ngắn gọn theo transcript được chọn và trả về các mã nguồn đã
  dùng.
- Frontend chạy Scope Guard trước lời gọi và Grounding Gate sau phản hồi.
- Chỉ khi Gate `pass` mới hiện nút `Kiểm tra tôi · 30 giây`.
- Gate `review` yêu cầu sinh viên đối chiếu hoặc xác nhận trang; Gate `block`
  không cho sinh Micro-Check.

### 4.3 Micro-Check live

- Bấm `Kiểm tra tôi · 30 giây` gọi `/api/question`.
- Câu hỏi yêu cầu sinh viên giải thích bằng lời của mình, chỉ dựa trên ngữ cảnh
  đã qua Gate.
- Bộ đếm 30 giây mang tính khuyến khích; hết giờ vẫn được trả lời và không bị
  tính sai.
- Không có câu hỏi bank hoặc câu trả lời điền sẵn trong đường chạy live.

### 4.4 Đánh giá live

- Câu teach-back được gửi tới `/api/classify` cùng câu hỏi, nguồn đã xác minh và
  kết quả Gate.
- Phản hồi thuộc đúng một trong bốn trạng thái:
  `understood`, `partial`, `misconception`, `insufficient`.
- UI hiển thị bằng chứng từ câu trả lời sinh viên, phần còn thiếu hoặc hiểu sai,
  độ tin cậy và đúng một bước củng cố có nguồn.
- Sinh viên có thể xem căn cứ, trả lời lại hoặc chọn `Tôi không đồng ý`. Khi
  đánh giá lại, kết quả cũ bị loại khỏi thread và trace ghi rõ correction round.

## 5. Hợp đồng API

### 5.1 `POST /api/tutor`

Input gồm câu hỏi, mã tài liệu, trang, các đoạn transcript đã chọn và mã nguồn.
Output được kiểm schema:

```json
{
  "answer": "string",
  "citations": ["source-code"],
  "model": "string",
  "latency_ms": 0
}
```

`citations` chỉ được chứa mã nguồn xuất hiện trong input. Server từ chối phản
hồi có citation lạ, rỗng hoặc không đúng schema.

### 5.2 `POST /api/question`

Input gồm ngữ cảnh đã qua Gate và tóm tắt câu trả lời Tutor. Output:

```json
{
  "question": "string",
  "model": "string",
  "latency_ms": 0
}
```

Câu hỏi phải là một câu teach-back, không phải trắc nghiệm và không bổ sung kiến
thức ngoài ngữ cảnh.

### 5.3 `POST /api/classify`

Giữ hợp đồng bốn trạng thái hiện có. Server tiếp tục kiểm các bất biến giữa
`mastery_state`, `gap`, `next_action` và nguồn trước khi trả kết quả cho UI.

## 6. Trạng thái và lỗi

Mỗi bước có trạng thái riêng: `idle`, `loading`, `success`, `error`. Lỗi không
làm mất câu hỏi, câu trả lời hoặc tập nguồn sinh viên đã chọn.

- Thiếu nguồn: chặn phía client, không gọi OpenAI.
- Scope Guard chặn: giải thích giới hạn và cho nhập câu khác.
- Timeout hoặc mất mạng: thông báo không kết nối được và nút `Thử lại`.
- Rate limit: thông báo dịch vụ đang bận và nút `Thử lại`.
- Sai key hoặc cấu hình: thông báo cấu hình AI chưa hợp lệ; không fallback.
- Phản hồi sai schema/citation: thông báo AI trả kết quả không hợp lệ; không
  hiển thị kết luận một phần.

Nút `Thử lại` chỉ gọi lại bước vừa lỗi với cùng input. Trong lúc request đang
chạy, nút gửi tương ứng bị khóa để ngăn lời gọi trùng.

Badge đầu trang chỉ được ghi live sau khi `/api/health` xác nhận provider và
model. Nếu cấu hình không hợp lệ, badge ghi `AI chưa sẵn sàng`.

## 7. Trace và bảo mật

Mỗi lời gọi ghi tên bước, chế độ `live`, model, latency, mã tài liệu, trang, mã
nguồn, trạng thái thành công/lỗi và output đã kiểm schema.

Trace không ghi:

- API key hoặc header xác thực.
- System/developer prompt.
- Toàn bộ data pack.
- Dữ liệu ngoài ngữ cảnh tối thiểu của vòng học hiện tại.

File `.env` và `data/vlearn-pack/` tiếp tục bị Git bỏ qua.

## 8. Thay đổi dự kiến

- `codebase/server.mjs`: thêm Tutor schema/prompt/route, chuẩn hóa lỗi live và
  giữ validation cho ba endpoint.
- `codebase/engine/ai-client.js`: bỏ mock khỏi đường chạy live, thêm
  `answerTutor`, retry theo từng bước và trace lỗi.
- `codebase/app.js`: nối Tutor với AI thật, quản lý loading/error/retry và xóa
  fixture demo ẩn.
- `codebase/index.html`, `codebase/app.css`: bổ sung trạng thái tải/lỗi có khả
  năng truy cập mà không thay bố cục chính.
- `codebase/test/server.mjs`: kiểm ba endpoint, schema, lỗi provider và không lộ
  secret bằng fixture mạng cục bộ.
- `codebase/test/manual-demo-ui.mjs`: kiểm không có demo controls/prefill và có
  trạng thái live/error/retry.
- `codebase/test/smoke.mjs`: giữ kiểm tra Gate, Scope Guard, bốn trạng thái và
  correction path.
- `codebase/README.md`, `spec.md`, `DEMO-5-PHUT.md`: cập nhật ranh giới AI thật,
  lệnh chạy và kịch bản thao tác như sinh viên.

## 9. Tiêu chí nghiệm thu

1. Sinh viên tự chọn tài liệu, nguồn, tự hỏi và tự trả lời; không thấy công cụ
   dành riêng cho demo.
2. Tutor, sinh câu hỏi và phân loại đều có trace `mode: live`.
3. Mọi câu trả lời Tutor có citation hợp lệ và qua Grounding Gate.
4. Thiếu nguồn không tạo lời gọi OpenAI.
5. API lỗi hiển thị rõ, giữ nguyên input và thử lại được; không sinh kết quả
   mock.
6. Cả bốn mức hiểu và correction path hoạt động đúng.
7. Test tự động hiện có và test mới đều vượt qua.
8. Một lượt smoke test live hoàn thành với key hiện có mà không lộ secret.
