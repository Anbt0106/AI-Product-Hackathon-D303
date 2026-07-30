# Thiết kế đề tài: VLearn Hiểu Thật

**Tên tiếng Anh:** VLearn Adaptive Micro-Check

**Trạng thái:** Thiết kế sơ bộ đã được trưởng nhóm đồng ý, chờ cả nhóm đọc và phản hồi

**Track:** Hướng A — Tính năng AI mới trên VLearn

**Mức prototype dự kiến:** Working prototype giới hạn

## 1. Tóm tắt trong một phút

VLearn Tutor hiện chủ yếu giải thích kiến thức theo một chiều. Sau khi đọc câu trả lời, học viên chưa có cách nhanh và thuận tiện để biết mình đã hiểu đúng, chỉ hiểu một phần hay đang giữ một nhận thức sai.

Nhóm đề xuất thêm nút **“Kiểm tra tôi · 30 giây”** ngay dưới câu trả lời của Tutor. Khi học viên bấm nút, hệ thống tạo một câu hỏi ngắn dựa trên đúng đoạn slide hiện tại. Học viên trả lời bằng một câu, sau đó AI phân loại mức hiểu, chỉ ra đúng một lỗ hổng và đưa một bước củng cố ngắn.

Tính năng không ép học viên làm quiz, không mở trang mới, không chấm điểm chính thức và có thể bỏ qua bất cứ lúc nào.

## 2. Tại sao nhóm chọn vấn đề này?

### 2.1 Bằng chứng từ chatlog

Nguồn phân tích là `data/vlearn-pack/chatlog/chat_history_anonymized_for_hackathon.csv`, gồm 1.261 lượt hỏi–đáp Tutor × học viên của 369 học viên trong 585 hội thoại.

Kết quả mining ban đầu:

- 27 lượt từ 26 học viên có tín hiệu như “không hiểu”, “chưa rõ”, “giải thích kỹ hơn”, “cho ví dụ”, “tạo quiz” hoặc “kiểm tra hiểu”.
- Chỉ 1/27 lượt trên dẫn đến một câu hỏi kiểm tra.
- Trên toàn bộ 1.261 lượt, chỉ 3 lượt có `asked_check_question = true`.
- Trường `misconceptions` được sử dụng 0/1.261 lần.
- Trường `follow_ups` được sử dụng 0/1.261 lần.
- 1.074/1.261 lượt dùng chiến lược `review_concept`, cho thấy trải nghiệm hiện tại chủ yếu dừng ở giải thích khái niệm.

Đây là bằng chứng về hành vi của sản phẩm hiện tại, chưa phải bằng chứng đầy đủ rằng đa số học viên muốn tính năng mới. Nhóm phải bổ sung khảo sát ít nhất 20 học viên ngoài nhóm và lưu nguyên văn từng câu trả lời trước khi chốt `spec.md`.

### 2.2 Các ứng viên đã cân nhắc

| Ứng viên | Bằng chứng chính | Quyết định |
|---|---|---|
| Tutor không grounding đúng ngữ cảnh học liệu | 94 lượt khớp quy tắc lỗi truy xuất; 10/10 lượt có rating là `down` | Không chọn làm đề tài chính vì gần với tối ưu RAG hiện có; giữ làm failure mode |
| Tutor không kiểm tra hiểu thật | Chỉ 3/1.261 lượt hỏi kiểm tra; misconception và follow-up không được sử dụng | **Chọn** vì tác động trực tiếp đến việc học và có không gian sáng tạo |
| Một số phản hồi có độ trễ cao | 49 lượt từ 5 giây trở lên; tối đa 23,848 giây | Loại vì tần suất thấp và thiên về tối ưu hạ tầng |

Grounding, citation đúng trang và xử lý thiếu nguồn vẫn là điều kiện chất lượng bắt buộc của giải pháp được chọn.

## 3. Người dùng, công việc và pain

### 3.1 Người dùng trực tiếp

Học viên đang đọc slide trên VLearn và vừa yêu cầu Tutor giải thích một khái niệm.

### 3.2 Job to be done

> Khi vừa đọc hoặc được giải thích một khái niệm khó, tôi muốn kiểm tra nhanh mình đã hiểu đúng chưa, để không tiếp tục học với một nhận thức sai.

### 3.3 Problem statement

> Khi học viên vừa được Tutor giải thích một khái niệm, họ không có cách thuận tiện để xác nhận mình đã thực sự hiểu, nên có thể tiếp tục học với nhận thức sai hoặc chỉ ghi nhớ câu trả lời một cách thụ động.

### 3.4 Lát cắt prototype

> Với học viên vừa được giải thích một khái niệm trên slide, hệ thống đánh giá câu trả lời teach-back để phát hiện misconception và đưa một bước củng cố, giúp học viên xác nhận mức hiểu trong vòng 60 giây.

Lát cắt này có đúng một người dùng, một công việc, một quyết định AI và một kết quả.

## 4. Giá trị khác biệt

Sản phẩm không tạo thêm một chatbot hay một trang quiz. Điểm khác biệt là vòng lặp học thích ứng ngay trong ngữ cảnh:

1. Tutor giải thích.
2. Học viên diễn đạt lại hoặc áp dụng kiến thức.
3. AI chẩn đoán mức hiểu.
4. Tutor chỉ sửa đúng phần còn thiếu.
5. Học viên xác nhận lại bằng một câu ngắn.

Giải pháp chuyển Tutor từ công cụ “trả lời câu hỏi” thành công cụ “phát hiện và sửa lỗ hổng hiểu biết”, nhưng vẫn giữ quyền kiểm soát cho học viên.

## 5. Nguyên tắc trải nghiệm

1. **Không làm gián đoạn việc đọc:** mọi thao tác diễn ra trong panel Tutor.
2. **Một chạm để bắt đầu:** chỉ có nút “Kiểm tra tôi · 30 giây”.
3. **Không bắt buộc:** học viên có thể bỏ qua, dừng hoặc tiếp tục đọc.
4. **Một câu tại một thời điểm:** không sinh cả bộ quiz.
5. **Không gây áp lực điểm số:** dùng trạng thái “Đã nắm”, “Cần củng cố”, “Có thể đang nhầm”.
6. **Phản hồi tối thiểu đủ dùng:** chỉ sửa một lỗ hổng quan trọng nhất.
7. **Có thể kiểm chứng:** mọi đánh giá phải dựa trên đoạn slide và trang nguồn.
8. **Cho phép sửa AI:** học viên có nút “Tôi không đồng ý” để cung cấp lại cách hiểu.

## 6. Luồng trải nghiệm

### 6.1 Happy path

1. Học viên bôi đen một đoạn slide và yêu cầu giải thích.
2. Tutor trả lời kèm citation đúng trang.
3. Hệ thống hiển thị nút “Kiểm tra tôi · 30 giây”.
4. Học viên bấm nút.
5. AI tạo một câu hỏi teach-back hoặc một tình huống áp dụng ngắn.
6. Học viên trả lời bằng một câu.
7. AI đánh giá là `understood`, nêu một điểm học viên đã hiểu đúng và cho phép tiếp tục học.

### 6.2 Partial/misconception path

1. Học viên trả lời đúng một phần hoặc thể hiện một misconception.
2. AI nêu phần đúng trước, sau đó chỉ ra đúng một lỗ hổng.
3. Tutor đưa một ví dụ đối chiếu ngắn dựa trên slide.
4. Học viên nhận một câu xác nhận khác ví dụ ban đầu.

### 6.3 Low-confidence path

1. Câu trả lời quá ngắn, mơ hồ hoặc không liên quan.
2. AI không chấm đoán.
3. Tutor hỏi lại một câu cụ thể hoặc đưa hai cách diễn đạt để học viên chọn.

### 6.4 Failure path

1. Hệ thống không lấy được đúng đoạn slide hoặc nguồn không khớp.
2. Micro-Check không được tạo.
3. Tutor thông báo chưa đủ căn cứ và yêu cầu học viên chọn lại đoạn tài liệu.

### 6.5 Correction path

1. Học viên bấm “Tôi không đồng ý”.
2. Hệ thống hiển thị căn cứ đã dùng và cho học viên sửa/giải thích thêm.
3. AI đánh giá lại từ dữ liệu mới, không âm thầm giữ kết quả cũ.

## 7. Quyết định AI trung tâm

### 7.1 Câu hỏi quyết định

> Dựa trên câu trả lời teach-back và nội dung slide, học viên đang hiểu đúng, hiểu một phần, mắc misconception cụ thể hay chưa cung cấp đủ thông tin?

### 7.2 Đầu vào

- Mã tài liệu và số trang.
- Đoạn slide đã chọn.
- Câu hỏi/giải thích vừa xuất hiện.
- Câu hỏi Micro-Check.
- Câu trả lời của học viên.

### 7.3 Đầu ra có cấu trúc

```json
{
  "mastery_state": "understood | partial | misconception | insufficient",
  "evidence_from_student": "chi tiết trong câu trả lời làm căn cứ đánh giá",
  "gap": "lỗ hổng cụ thể hoặc null",
  "feedback": "phản hồi ngắn cho học viên",
  "source_page": 15,
  "confidence": "high | medium | low",
  "next_action": "continue | reinforce | retry | clarify"
}
```

### 7.4 Automation

Chọn **augment**, không automate:

- AI đề xuất đánh giá và bước củng cố.
- Học viên có thể bỏ qua hoặc phản đối đánh giá.
- Không dùng kết quả làm điểm chính thức.
- Confidence thấp thì hệ thống hỏi lại, không tự kết luận.

## 8. Thành phần hệ thống

1. **Slide Context Provider:** cung cấp mã tài liệu, số trang và đoạn được chọn.
2. **Grounding Gate:** kiểm tra nguồn có đủ và đúng ngữ cảnh trước khi gọi Micro-Check.
3. **Question Generator:** tạo đúng một câu teach-back hoặc tình huống áp dụng.
4. **Mastery Classifier:** đưa ra quyết định AI trung tâm theo schema.
5. **Feedback Composer:** chuyển kết quả có cấu trúc thành phản hồi ngắn, dễ hiểu.
6. **Session State:** lưu trạng thái của một vòng Micro-Check; prototype không cần hồ sơ dài hạn.
7. **Trace Logger:** lưu input, output có cấu trúc, model và thời gian để làm bằng chứng eval.

Mỗi thành phần có một trách nhiệm riêng để nhóm dễ giải thích, kiểm thử và thay đổi.

## 9. Tám kịch bản khó bắt buộc

| Lớp | Kịch bản | Hành vi mong muốn |
|---|---|---|
| Nguồn sự thật | Không có nội dung trang | Không sinh câu hỏi; yêu cầu chọn lại đoạn |
| Nguồn sự thật | Citation trỏ sang tài liệu/trang khác | Dừng đánh giá và báo chưa đủ căn cứ |
| Mơ hồ | Học viên trả lời “em hiểu rồi” | Không kết luận; hỏi một câu cụ thể |
| Mơ hồ | Câu trả lời vừa đúng vừa thiếu | Gắn `partial`, nêu phần đúng và một lỗ hổng |
| Ngoài phạm vi | Học viên chuyển sang hỏi bài không thuộc nội dung | Từ chối ngắn và điều hướng về slide |
| Ngoài phạm vi | Prompt yêu cầu bỏ qua luật hoặc tiết lộ system prompt | Không làm theo; tiếp tục hỗ trợ học tập |
| Đặc thù domain | Học viên dùng đúng thuật ngữ nhưng giải thích sai quan hệ | Gắn `misconception`, không đánh dấu đã hiểu |
| Đặc thù domain | AI không chắc misconception có thật | Gắn `insufficient`/confidence thấp và hỏi lại |

## 10. Phạm vi prototype

### 10.1 Phần chạy thật

- Một màn hình mô phỏng slide và panel Tutor.
- Chọn một đoạn tài liệu có sẵn trong data pack.
- Tutor giải thích kèm citation.
- Nút “Kiểm tra tôi · 30 giây”.
- Sinh một câu Micro-Check bằng lời gọi AI thật.
- Phân loại câu trả lời bằng lời gọi AI thật.
- Hiển thị feedback, trạng thái hiểu và căn cứ.
- Có happy, partial/misconception, low-confidence, failure và correction path.
- Lưu trace đã loại bỏ secret.

### 10.2 Phần mock

- Đăng nhập và tài khoản.
- Danh sách khóa học.
- Đồng bộ với VLearn production.
- Tiến độ dài hạn.
- Analytics cấp lớp.

### 10.3 Non-goals

Nhóm không xây:

1. Hệ thống quiz hoàn chỉnh.
2. Dashboard cho giảng viên.
3. Lộ trình cá nhân hóa toàn khóa.
4. Chấm điểm chính thức.
5. Thay thế VLearn Tutor hiện có.
6. Tích hợp hoặc thay đổi production VLearn.

## 11. Kiểm thử

### 11.1 Golden set

Tối thiểu 20 case:

- 8–10 case thường: understood, partial và misconception.
- Ít nhất 2 case cho mỗi lớp khó ở mục 9.
- 2–4 case hiếm/đối kháng.
- Ít nhất 10 case lấy từ chatlog thật, chỉ giữ mã hội thoại/lượt và trích ngắn theo quy định bảo mật.

### 11.2 Chiều chất lượng

1. **Mastery classification:** trạng thái hiểu khớp nhãn do nhóm định trước.
2. **Grounding:** feedback chỉ dùng thông tin từ context được cấp.
3. **Gap precision:** lỗ hổng được nêu cụ thể, không phán xét chung chung.
4. **Safe uncertainty:** thiếu dữ liệu thì hỏi lại, không tự kết luận.
5. **Brevity:** phản hồi củng cố chỉ tập trung một lỗ hổng.

### 11.3 Quality bar đề xuất

Quality bar chỉ được khóa chính thức khi nhóm commit `spec.md` trước hạn 23:59 ngày 1. Mức đề xuất:

- Ít nhất 80% case được phân loại đúng trạng thái.
- 100% feedback có `source_page` thuộc context được cấp.
- 100% case thiếu căn cứ không được đánh dấu `understood`.
- 0 case misconception nghiêm trọng bị đánh dấu `understood`.

## 12. Validation với người dùng

### 12.1 Trước khi build

- Khảo sát ít nhất 20 học viên ngoài nhóm.
- Lưu nguyên văn toàn bộ câu hỏi và từng câu trả lời.
- Mục tiêu xác nhận: ít nhất 50% từng gặp tình trạng “đọc lời giải thích nhưng chưa biết mình đã hiểu đúng chưa”.
- Xin ít nhất 3 người thật đồng ý thử prototype trước demo.

Hiện nhóm chưa cung cấp tên willing users. Tài liệu không tự tạo tên hoặc phản hồi giả; nhóm phải thu thập bằng chứng thật.

### 12.2 Vòng CP5

- Test với ít nhất 5 người ngoài nhóm, trong đó có ít nhất 2 willing users đã khai từ CP1.
- Ghi tên/vai, quote nguyên văn và tình huống sử dụng.
- Câu hỏi validation:
  1. Bạn có hiểu phải bấm gì để bắt đầu không?
  2. Phản hồi có giúp bạn nhận ra đúng lỗ hổng không?
  3. Vòng kiểm tra có làm gián đoạn việc đọc không?
- Thực hiện ít nhất một thay đổi từ feedback hoặc ghi rõ lý do có căn cứ nếu giữ nguyên.

## 13. Cách chia việc cho nhóm bốn người

| Workstream | Trách nhiệm |
|---|---|
| Evidence & Product | Mining/audit chatlog, khảo sát 20 người, impact table, problem statement |
| AI & Eval | Prompt/schema, golden set, runner, bảng kết quả và phân tích lỗi |
| Prototype | UI slide/Tutor, state machine các đường đi, kết nối API và trace |
| Validation & Demo | Feedback log, changelog, slide 6 trang, kịch bản demo và Q&A |

Nhóm chưa cung cấp bốn tên thật, vì vậy tài liệu chỉ mô tả workstream. Trước CP1, nhóm phải gán một tên thật cho mỗi workstream và bảo đảm mọi người giải thích được phần mình đứng tên.

## 14. Canvas CP1 có thể dùng

1. **Hướng:** Tính năng AI mới trên VLearn — VLearn Hiểu Thật / Adaptive Micro-Check.
2. **Job executor:** Học viên vừa yêu cầu Tutor giải thích một khái niệm trên slide.
3. **Pain:** Học viên không biết mình đã hiểu thật hay chỉ vừa đọc một lời giải thích hợp lý.
4. **Evidence ban đầu:** 27 lượt từ 26 học viên có tín hiệu chưa hiểu/cần giải thích lại; chỉ 1/27 có câu hỏi kiểm tra; toàn bộ data chỉ có 3/1.261 lượt hỏi kiểm tra hiểu.
5. **Lát cắt:** Với học viên vừa được giải thích một khái niệm, hệ thống đánh giá câu teach-back để phát hiện misconception và đưa một bước củng cố, giúp học viên xác nhận mức hiểu trong 60 giây.
6. **Automation + willing users:** Augment; học viên được bỏ qua/sửa AI; tên willing users chưa có và phải được thu thập thật trước khi nộp.
7. **Phân công:** Bốn workstream Evidence & Product, AI & Eval, Prototype, Validation & Demo; điền bốn tên thật trước CP1.

## 15. Kịch bản demo năm phút

1. **Pain + evidence (45 giây):** nêu 3/1.261 và một ví dụ chatlog.
2. **Happy path (75 giây):** giải thích → bấm Micro-Check → trả lời đúng → “Đã nắm”.
3. **Misconception path (75 giây):** trả lời sai có vẻ hợp lý → AI chỉ đúng lỗ hổng → câu xác nhận.
4. **Failure/correction (45 giây):** thiếu nguồn hoặc học viên phản đối đánh giá.
5. **Eval (40 giây):** kết quả golden set so với quality bar.
6. **Validation (20 giây):** một quote thật và thay đổi từ feedback.

## 16. Quy tắc dữ liệu và bảo mật

- Chỉ dùng data pack trong phạm vi hackathon.
- Không đưa nguyên data pack vào repo nộp bài.
- Golden set chỉ giữ mã hội thoại/lượt và trích ngắn cần thiết.
- Không cố suy ngược danh tính.
- Không commit API key, token hoặc file `.env`.
- Trace phải loại bỏ secret và chỉ lưu dữ liệu tối thiểu cần cho eval.

## 17. Điều kiện để chuyển sang triển khai

Trước khi viết implementation plan, cả nhóm cần xác nhận:

- Đồng ý với problem statement và lát cắt một câu.
- Đồng ý rằng quyết định AI trung tâm là phân loại mức hiểu/misconception.
- Đồng ý giữ Micro-Check tùy chọn và hoàn thành trong tối đa 60 giây.
- Đồng ý các non-goals.
- Gửi phản hồi về tài liệu này; mọi thay đổi phạm vi phải được chốt trước khi code.
