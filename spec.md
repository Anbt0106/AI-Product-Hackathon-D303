# AI SPEC — VLearn Hiểu Đúng, Hiểu Thật · Nhóm D303

Hướng: [x] A — VLearn · Loại: [x] Tính năng mới

## §1. User & Job

- **Job executor + workflow:** học viên đang trong buổi học → chọn đoạn slide khó → hỏi Tutor → đọc giải thích → cần biết nguồn có đúng và mình có thật sự hiểu trước khi học tiếp.
- **Core JTBD:** Khi vừa được giải thích một khái niệm khó, tôi muốn kiểm tra nhanh mình có hiểu đúng hay không để sửa đúng lỗ hổng trước khi học tiếp.
- **Problem statement:** Học viên có thể nhận giải thích mất/lấy sai ngữ cảnh hoặc trích dẫn lệch, rồi không có bước kiểm tra mức hiểu nên có thể tiếp tục học với misconception.
- **Evidence từ mining chatlog:** 1.261 lượt hỏi–đáp; 1.252 lượt có selected page nhưng 573 lượt không có citation; 440/1.252 cite đúng trang, 239 lượt chỉ cite trang khác cần audit. Có 27 lượt từ 26 học viên mang tín hiệu chưa hiểu/cần giải thích lại nhưng chỉ 1/27 dẫn tới câu hỏi kiểm tra; toàn bộ data chỉ có 3/1.261 lượt `asked_check_question=true`; `misconceptions` và `follow_ups` không được dùng.
- **Nguồn:** `data/vlearn-pack/chatlog/DATA_DICTIONARY.md`; các ví dụ ngắn trong golden set chỉ giữ mã `Cxxxx/Txxxx`, không sao chép data pack dài.

## §2. Impact & quyết định chọn

| Ứng viên | Bao nhiêu người/lượt | Tần suất/tổn thất | Khả thi trong 1,5 ngày | Quyết định |
|---|---:|---|---|---|
| Grounding Gate + teach-back 60 giây | 1.252 lượt có selected page; 27 lượt có tín hiệu chưa hiểu | Sai nguồn hoặc tưởng đã hiểu có thể làm học sai | Cao: 1 context, 1 classifier, 4 state | **Chọn** |
| Chỉ sửa citation của Tutor | 573 lượt thiếu citation; 239 lượt cite trang khác | Tăng khả năng kiểm nguồn nhưng chưa biết học viên hiểu chưa | Cao | Loại: giải nửa pain |
| Sinh quiz tự động cho mọi trang | mọi lượt học | Phủ rộng nhưng lỗi câu hỏi/căn cứ khó kiểm trong thời gian ngắn | Trung bình | Loại: scope rộng, cost-of-error cao |

Chọn lát cắt đầu vì nó nối hai bằng chứng thành một vòng khép kín: chỉ kiểm tra hiểu sau khi nguồn đã qua Gate.

## §3. Giải pháp tương tự đã nghiên cứu

- **Khanmigo:** đáng học ở cách hỏi gợi mở; đáng né việc kéo hội thoại dài khi user chỉ cần xác nhận nhanh. Lát cắt này giới hạn một câu teach-back và một bước củng cố.
- **Quiz/flashcard generator phổ biến:** đáng học ở thao tác nhanh; đáng né sinh hàng loạt trước khi kiểm nguồn. Lát cắt này đặt Grounding Gate trước Micro-Check.

## §4. Thiết kế

- **Lát cắt một câu:** Với học viên vừa được giải thích một khái niệm từ đoạn slide đã qua Grounding Gate, AI đánh giá câu teach-back để quyết định `understood`, `partial`, `misconception` hay `insufficient`, rồi đưa đúng một bước củng cố có nguồn trong tối đa 60 giây.
- **Non-goals:** không thay LMS/VLearn production; không chấm điểm chính thức; không đồng bộ tiến độ dài hạn; không sinh cả bộ quiz; không trả lời logistics; không giữ bộ nhớ sau reload.
- **Mức prototype:** **Mock có AI thật ở lõi**.

| Thành phần | Thật hay mock | Bằng chứng/file |
|---|---|---|
| Chọn tài liệu/trang/đoạn, 7 bước UI | Thật | `codebase/index.html`, `codebase/app.js` |
| Grounding Gate, Scope Guard | Thật, luật xác định | `codebase/engine/grounding-gate.js`, `scope-guard.js` |
| **Mastery Classifier — quyết định trung tâm** | **AI thật khi server có key**; fallback rule phải ghi trace | `codebase/server.mjs`, `engine/ai-client.js` |
| Tutor giải thích | **Mock**, văn bản viết sẵn theo trang | `codebase/data/slides.js` |
| Câu Micro-Check | **Mock**, bank đã duyệt để input eval ổn định | `codebase/engine/question.js` |
| Tài liệu, đăng nhập, danh sách khoá | **Mock/data giả** | `codebase/data/slides.js` |
| Trace và eval | Thật | `codebase/engine/trace.js`, `eval/` |

- **Đường gọi live duy nhất trong demo:** `Gửi câu trả lời` → `AiClient.classify()` → `POST /api/classify` → Gemini/Anthropic structured output → server kiểm schema + bất biến → UI hiển thị state. Badge phải ghi `CP3 · AI thật ở Mastery (<model>)`; nếu lỗi, badge/trace ghi fallback, không giả vờ live.
- **Automation:** **Augment**. AI đề xuất state và bước củng cố; học viên được bỏ qua, trả lời lại hoặc “Tôi không đồng ý”. Sai `understood` có thể khiến học viên tiếp tục với kiến thức sai, nên không tự động chấm điểm/khóa tiến độ.

### §4b. Nguyên tắc đã áp dụng

| Nguyên tắc | Áp cụ thể vào đâu trong prototype |
|---|---|
| G1 — nói rõ khả năng | Panel Tutor nói chỉ dựa trên đoạn đang chọn |
| G2 — nói rõ độ tin cậy | Badge mock/live và trạng thái Gate pass/review/block |
| G8 — gạt bỏ dễ | Nút “Bỏ qua”; hết 30 giây vẫn trả lời được |
| G9 — sửa dễ | “Trả lời lại” và “Tôi không đồng ý” bỏ verdict cũ |
| G10 — thu hẹp khi nghi ngờ | `insufficient` khi mơ hồ/không khớp, không đoán |
| G11 — giải thích vì sao | “Xem căn cứ AI đã dùng” + trace JSON |

## §5. Kiểu lỗi — 4 lớp chỗ khó

| Tình huống | Lớp | Hành vi mong muốn | Case |
|---|---|---|---|
| Trang không có nội dung | ① Nguồn | block, không sinh Micro-Check | G01 |
| Citation trỏ trang khác | ① Nguồn | review, chuyển quyền quyết định | G02 |
| Citation rỗng/khác tài liệu | ① Nguồn | block | G03–G04 |
| “Em hiểu rồi”/“OK ạ” | ② Mơ hồ | insufficient, hỏi lại | M13–M14 |
| Câu dài nhưng không chạm ý | ② Mơ hồ | insufficient, không gắn partial | M15–M16 |
| Hỏi lịch thi/chấm điểm | ③ Thẩm quyền | từ chối ngắn, điều hướng về slide | S01–S02 |
| Yêu cầu lộ prompt/API key | ③ Thẩm quyền | không làm theo, không tạo Micro-Check | S03–S04 |
| Đúng thuật ngữ nhưng sai quan hệ | ④ Domain | misconception, không bao giờ understood | M09–M12 |

## §6. Bốn đường đi của trải nghiệm

- **Happy:** chọn trang 15 → hỏi → Gate pass → “Kiểm tra tôi” → trả lời đúng → `understood` → tiếp tục.
- **Low-confidence:** trả lời “Em hiểu rồi” → `insufficient` → một câu hỏi lại cụ thể.
- **Failure:** trang rỗng/citation thiếu → Gate block, không gọi classifier.
- **Correction:** bấm “Tôi không đồng ý” → xem căn cứ → verdict cũ bị bỏ → trả lời và đánh giá lại.
- **Ngoài phạm vi:** Scope Guard từ chối logistics/injection trước Tutor.
- **Đặc thù domain:** câu có “self-attention/similarity” nhưng nói xử lý tuần tự vẫn là `misconception`.

## §7. Kiểm thử

- **Golden set:** `eval/golden-set.json`, 24 case: 8 normal, 12 hard, 4 rare; mỗi lớp khó ≥2; 12 case phát triển từ chatlog thật bằng mã hội thoại/lượt.
- **Chiều đo:** đúng state/reason; đúng Gate/Scope; đủ schema; state–action hợp lệ; verdict có source page; không vi phạm ba bất biến cứng.
- **Quality bar chốt:** **đạt khi ≥85% toàn bộ 24 case, và 100% ba bất biến cứng**.

| Lượt | Model | Kết quả | AI call thật | Trạng thái |
|---|---|---:|---:|---|
| Baseline lượt 1 | `rule-based-baseline-v1` | 24/24 = 100% | 0 | Baseline, không phải CP3 live |
| Live thử 1–2 | Gemini | 8/24 = 33,3% | 0 | TLS của Node chưa tin CA mạng; giữ artifact lỗi |
| Live thử 3 | Gemini | 8/24 = 33,3% | 0 | Payload `responseFormat` không tương thích endpoint; giữ artifact lỗi |
| Live lượt 4 | Gemini | 17/24 = 70,8% | 16 gọi / 13 response hợp lệ | Prompt thiếu rubric và state→action; chưa đạt bar |
| **Live chính thức** | `gemini-3.5-flash-lite` | **24/24 = 100%** | **16** | **Đạt quality bar 85%** |

Kết quả đầy đủ: `eval/results/`; trace: `eval/traces/`.

## §8. Phân công & kế hoạch

- Bùi Thọ An — Evidence & Product.
- Phạm Nguyễn Hùng Nguyên — Context, AI & Eval.
- Lê Tuấn Cảnh — Prototype/UI.
- Nguyễn Văn Tuấn Anh — Validation & Demo.
- Willing users: **chưa có tên; phải bổ sung ≥3 trước CP5**.
- Multi-prototype: chọn phương án “Micro-Check do người dùng bấm” thay vì tự bật sau mọi câu trả lời; giữ quyền kiểm soát và tránh làm gián đoạn học.

## §9. Changelog

| Thời điểm | Đổi gì | Vì sao |
|---|---|---|
| CP2 | Gate từ 2 thành 3 trạng thái, thêm `review` | 239 lượt cite trang khác chưa đủ bằng chứng để block |
| CP2 | `partial` bắt buộc có ≥1 ý đúng | Không tuyên bố mức hiểu khi chưa có bằng chứng |
| CP2 | Thêm Scope Guard | Chặn ngoài phạm vi trước khi Tutor trả lời |
| CP3 | Chỉ Mastery Classifier gọi AI thật; câu hỏi giữ bank mock | Giữ input demo/eval ổn định, đúng quyết định trung tâm |
| CP3 | Đổi Gemini mặc định khỏi model 2.0 đã tắt; dùng auth header và structured output hiện hành | Tránh endpoint live fail do model/payload cũ |
| CP3 | Server tự validate schema + state/action | Structured JSON không bảo đảm đúng bất biến nghiệp vụ |
| CP3 | Cấp rubric ý đúng/quan hệ sai cho classifier | Lượt live 70,8% cho thấy model tự suy diễn thiếu ý thành misconception và không bám nhãn đo |
| CP3 | Giữ toàn bộ lượt lỗi và lượt dưới bar | Kết quả đo phải trung thực, phúc khảo được |