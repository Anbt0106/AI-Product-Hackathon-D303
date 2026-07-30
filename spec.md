# AI SPEC — VLearn Hiểu Đúng, Hiểu Thật · Nhóm D303

Hướng: [x] A — VLearn · Loại: [x] Tính năng mới

## §1. User & Job

- **Job executor + workflow:** học viên đang trong buổi học → chọn đoạn slide khó → hỏi Tutor → đọc giải thích → cần biết nguồn có đúng và mình có thật sự hiểu trước khi học tiếp.
- **Core JTBD:** Khi vừa được giải thích một khái niệm khó, tôi muốn kiểm tra nhanh mình có hiểu đúng hay không để sửa đúng lỗ hổng trước khi học tiếp.
- **Problem statement:** Học viên có thể nhận giải thích mất/lấy sai ngữ cảnh hoặc trích dẫn lệch, rồi không có bước kiểm tra mức hiểu nên có thể tiếp tục học với misconception.
- **Evidence B — con số mạnh nhất:** trong 1.252 lượt có selected page, **573 lượt (45,8%)** không có citation; **440/1.252 (35,1%)** cite đúng trang và **239/1.252 (19,1%)** chỉ cite trang khác cần review. Trên toàn bộ 1.261 lượt, Tutor chỉ hỏi kiểm tra hiểu **3 lần (0,24%)**; `misconceptions` và `follow_ups` được dùng **0 lần**.
- **Phương pháp đếm:** ghép message Student–Tutor bằng `turn_id`; nhận diện selected page từ tiền tố `(Trang N, đoạn được chọn: ...)`; chia citation thành `[]`, chứa đúng `N`, hoặc chỉ chứa trang khác. Chỉ đếm `asked_check_question`, `misconceptions`, `follow_ups` trên dòng Tutor để không nhân đôi. Script tái lập: `evidence/mining-selected-page.ps1`; báo cáo: `evidence/mining-report.md`.
- **≥5 ví dụ nguyên văn có thể kiểm lại:** `C0007/T0020` “Giải thích đoạn bôi đen ở Trang 15.”; `C0015/T0811` “Designt Pattern ReAct là gì có lưu ý gì về nó?”; `C0021/T0769` “giải thích nghĩa chi tiết của trang 4”; `C0029/T0524` “bạn đọc được nội dung slide ko, giải thích cho mình slide 44”; `C0030/T1261` “giải thích kỹ cơ chế transformer”. Cả năm lượt đều có selected page nhưng `citations=[]`.
- **Ví dụ nối trực tiếp với pain “chưa hiểu”:** `C0456/T1220` “không hiểu gì”; `C0389/T0902` “sự khác nhau giữa ML và DL chưa rõ lắm”; `C0472/T0500` “Tôi chưa hiểu tại sao, giải thích kỹ hơn”. Cả ba lượt đều có `asked_check_question=false`: Tutor trả lời nhưng không đóng vòng bằng một bước kiểm tra hiểu.
- **Nguồn:** `data/vlearn-pack/chatlog/chat_history_anonymized_for_hackathon.csv` và `data/vlearn-pack/chatlog/DATA_DICTIONARY.md`. Quote chỉ giữ đoạn ngắn và mã ẩn danh, không suy ngược người dùng.

## §2. Impact & quyết định chọn

| Ứng viên | Quy mô từ evidence | Tần suất | Tốn gì mỗi lần / hậu quả | Khả thi trong 1,5 ngày | Quyết định |
|---|---:|---|---|---|---|
| Grounding Gate + teach-back 60 giây | 1.252 lượt đủ điều kiện có selected page | 1.252/1.261 lượt là exposure tiềm năng; không suy diễn rằng cả 1.252 lượt đều cần teach-back | Nếu nguồn lệch hoặc hiểu sai mà vẫn học tiếp: học sai kiến thức và phải quay lại kiểm | Cao: 1 context, 1 classifier, 4 state | **Chọn** |
| Chỉ sửa citation của Tutor | 573 lượt thiếu citation; 239 lượt chỉ cite trang khác | 45,8% lượt selected-page thiếu citation | Học viên tự kiểm nguồn dễ hơn nhưng vẫn không biết mình hiểu đúng chưa | Cao | Loại: chỉ giải nửa pain |
| Sinh quiz tự động cho mọi trang | Có thể chạm mọi lượt học nhưng chưa có evidence nhu cầu riêng | Mỗi trang/mỗi lượt | Câu hỏi sai hoặc không grounded làm học viên học lệch; chi phí kiểm duyệt lớn | Trung bình | Loại: scope rộng, cost-of-error cao |

Chọn **Grounding Gate + teach-back** vì đây là ứng viên duy nhất khép kín hai rủi ro đã đo: kiểm nguồn trước, rồi mới dùng AI kiểm tra mức hiểu. Hai phương án bị loại hoặc chỉ giải nửa pain, hoặc chưa có evidence đủ mạnh cho phạm vi rộng.

## §3. Giải pháp tương tự đã nghiên cứu

Đây là desk research để học pattern, không được tính là validation với user.

- **Khanmigo:** flow ưu tiên câu hỏi gợi mở để học viên tự suy luận. Đáng học: không đưa kết luận ngay. Đáng né: hội thoại có thể dài khi người học chỉ cần xác nhận nhanh. Nhóm khác ở việc giới hạn đúng một câu teach-back và một bước củng cố trong 60 giây.
- **NotebookLM:** flow trả lời dựa trên nguồn và đặt citation cạnh nội dung. Đáng học: cho người dùng tự kiểm căn cứ. Đáng né: citation đúng chưa chứng minh người đọc đã hiểu đúng. Nhóm thêm Grounding Gate trước Micro-Check và một quyết định mastery sau teach-back.

## §4. Thiết kế

- **Lát cắt một câu:** Với học viên vừa được giải thích một khái niệm từ đoạn slide đã qua Grounding Gate, **`gemini-3.5-flash-lite`** đánh giá câu teach-back để quyết định `understood`, `partial`, `misconception` hay `insufficient`, rồi hệ thống đưa đúng một bước củng cố có nguồn trong tối đa 60 giây.
- **Non-goals:** không thay LMS/VLearn production; không chấm điểm chính thức; không đồng bộ tiến độ dài hạn; không sinh cả bộ quiz; không trả lời logistics; không giữ bộ nhớ sau reload.
- **Mức prototype:** **Live Student Demo** — ba bước sinh/đánh giá dùng Gemini thật; Grounding Gate và Scope Guard là luật xác định; không fallback sang câu trả lời mock khi AI lỗi.

| Thành phần | Thật hay mock | Bằng chứng/file |
|---|---|---|
| Chọn tài liệu/trang/đoạn, 7 bước UI | Thật | `codebase/index.html`, `codebase/app.js` |
| Grounding Gate, Scope Guard | Thật, luật xác định | `codebase/engine/grounding-gate.js`, `scope-guard.js` |
| **Mastery Classifier — quyết định trung tâm** | **AI thật (Gemini multimodal live)** | `codebase/server.mjs`, `engine/ai-client.js` |
| **Tutor giải thích** | **AI thật (Gemini multimodal live)** theo toàn trang | `codebase/server.mjs`, `engine/ai-client.js` |
| **Câu Micro-Check** | **AI thật (Gemini multimodal live)** sau khi qua Gate | `codebase/server.mjs`, `engine/ai-client.js` |
| Tài liệu, danh sách khoá | Data catalog từ PDF thật | `codebase/data/material-catalog.js` |
| Trace và eval | Thật | `codebase/engine/trace.js`, `eval/` |

- **Ba đường gọi live trong demo:** câu hỏi học viên → `POST /api/tutor`; Gate pass → `POST /api/question`; gửi teach-back → `POST /api/classify`. Cả ba dùng Gemini `gemini-3.5-flash-lite` với context đúng trang; server kiểm payload/output và trace giữ model, latency, input/output. Badge chỉ có `AI chưa sẵn sàng` hoặc model live; nếu API lỗi, UI báo lỗi và cho thử lại, **không fallback mock**.
- **Automation:** **Augment**. AI đề xuất state và bước củng cố, nhưng học viên được bỏ qua, trả lời lại hoặc “Tôi không đồng ý”. Cost-of-error của một `understood` sai là học viên tiếp tục với kiến thức sai; vì vậy prototype không tự động chấm điểm, khóa tiến độ hay ghi mastery chính thức.

### §4b. Nguyên tắc đã áp dụng

| Nguyên tắc | Áp cụ thể vào đâu trong prototype |
|---|---|
| G1 — nói rõ khả năng | Panel Tutor nói chỉ dựa trên đoạn đang chọn |
| G2 — nói rõ trạng thái và giới hạn | Badge phân biệt `AI chưa sẵn sàng` với model live; Gate pass/review/block cho biết mức căn cứ. Badge không phải xác suất đúng đã calibration. |
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
- **Chiều chất lượng và định nghĩa pass/fail:**

| Chiều | Một case được tính đạt khi |
|---|---|
| Mastery state | `actual.mastery_state` bằng đúng `expected.mastery_state` trong golden set. |
| Grounding/Scope | `gate_status + reason` hoặc `scope_kind` bằng đúng expected. |
| Schema | Có đủ field bắt buộc, đúng enum/type; JSON lỗi hoặc thiếu field là fail. |
| State → action | `understood→continue`, `partial/misconception→reinforce`, `insufficient→clarify`; lệch là fail. |
| Căn cứ | Mọi verdict mastery có `source_page` thuộc context của case; thiếu hoặc sai trang là fail. |
| Bất biến cứng | Không case domain-misconception nào thành `understood`; `insufficient` không được `continue`; verdict luôn có source page đúng context. Chỉ một vi phạm cũng làm cả lượt không đạt quality bar. |

Runner `eval/run-eval.mjs` chấm các điều kiện này tự động từ expected cố định trong `eval/golden-set.json`; cùng một output artifact sẽ cho cùng kết quả chấm. Hai lần gọi model live vẫn có thể sinh output khác nhau, nên mỗi lượt đều phải lưu result và trace riêng.
- **Quality bar chốt:** **đạt khi ≥85% toàn bộ 24 case, và 100% ba bất biến cứng**.

| Lượt | Model | Kết quả | Mastery attempts / output live hợp lệ | Trạng thái |
|---|---|---:|---:|---|
| Baseline lượt 1 | `rule-based-baseline-v1` | 24/24 = 100% | 0 / 0 | Baseline, không phải CP3 live |
| Live thử 1–2 | `gemini-3.5-flash-lite` | 8/24 = 33,3% | 16 / 0 | TLS của Node chưa tin CA mạng; chỉ 8 case Gate/Scope xác định đạt |
| Live thử 3 | `gemini-3.5-flash-lite` | 8/24 = 33,3% | 16 / 0 | Payload `responseFormat` không tương thích endpoint; chỉ 8 case Gate/Scope xác định đạt |
| Live lượt 4 | `gemini-3.5-flash-lite` | 17/24 = 70,8% | 16 / 13 | Ba output `insufficient` bị server từ chối vì vi phạm state→action; giữ artifact lỗi |
| **Live chính thức** | `gemini-3.5-flash-lite` | **24/24 = 100%** | **16 / 16** | **Đạt quality bar 85%** |

Kết quả đầy đủ: `eval/results/`; trace: `eval/traces/`. Lượt dưới bar: `eval/results/live-gemini-2026-07-30T07-37-10-238Z.md`; lượt chính thức: `eval/results/live-gemini-2026-07-30T07-38-48-056Z.md`; trace chính thức: `eval/traces/live-gemini-2026-07-30T07-38-48-056Z.json`.

## §8. Phân công & kế hoạch

- **Bùi Thọ An — spec, evidence & product:** chịu trách nhiệm phương pháp mining, impact và bảo vệ quyết định lát cắt.
- **Phạm Nguyễn Hùng Nguyên — prompt, AI & eval:** chịu trách nhiệm context, classifier, golden set, runner và phân tích failure.
- **Lê Tuấn Cảnh — code & prototype/UI:** chịu trách nhiệm flow end-to-end, Gate/Scope, correction và trace UI.
- **Nguyễn Văn Tuấn Anh — validation & demo:** mời người thử, điều phối task, ghi log nguyên văn, tổng hợp feedback và bấm giờ dry run.
- **Willing users — kết quả CP5:** **5/5 người ngoài nhóm nói sẽ dùng thật**, vượt chuẩn tối thiểu 3; danh sách, vai trò và quote nằm trong `validation/feedback-log.md`.
- **Validation CP5 — kết quả:** **5/5 người ngoài nhóm đã thử**, **4/5 tự hoàn thành không cần trợ giúp**, **5/5 tin hoặc khá tin kết quả**, **5/5 nói sẽ dùng thật**. Ba trên năm người cần phản hồi mastery ngắn/rõ hơn; một người bị chặn vì không thấy CTA Micro-Check. Log và phương pháp tổng hợp: `validation/feedback-log.md`, `validation/summary.md`.
- **Multi-prototype:** trục khác biệt là **chủ động tự bật** so với **do người dùng bấm**. Nhóm chọn “Micro-Check do người dùng bấm” vì giữ quyền kiểm soát và tránh làm gián đoạn học; phương án tự bật bị loại. Bằng chứng hai phương án và quyết định: `CP2-PROTOTYPE-BAM-DUOC.md`.

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
| 2026-07-30 | Nâng cấp Live Student Demo: 3 bước Gemini multimodal live (Tutor, Micro-Check, Classify) | Trải nghiệm sinh viên tự do, đọc cả chữ và ảnh đúng trang, loại bỏ mock fallback |
| CP4 | Bổ sung script mining, phương pháp đếm và 5 ví dụ có mã lượt | Evidence B phải tái lập được, không chỉ nêu nhận xét |
| CP4 | Viết pass/fail kiểm chứng được cho từng chiều eval | Người khác chạy/chấm cùng artifact phải ra cùng kết quả |
| CP4 | Ghi rõ model, owner validation và đúng ba câu hỏi user test | Khớp template và checklist trước khi khóa spec |
| CP4 | Nối evidence với ba lượt “chưa hiểu”, làm rõ exposure và attempts/output live | Tránh suy rộng 1.252 lượt thành nhu cầu teach-back và tránh nhập nhằng số AI call |
| CP5 mô phỏng | Badge tách “đã cấu hình” khỏi “AI thật đã xác minh” | Hai pilot HTTP 0/5 cho thấy có key chưa chứng minh kết nối provider; pilot direct-live sau đó đạt 5/5 |
| CP5 rà soát | Ghi rõ human validation 0/5 và willing users 0/3 | Không biến persona mô phỏng hoặc output AI thành bằng chứng người dùng thật |
| CP5 human validation | Test 5 người ngoài nhóm; 4/5 tự hoàn thành, 5/5 tin/khá tin, 5/5 willing | Chứng minh flow có giá trị nhưng CTA và mastery labels cần rõ hơn |
| CP5 feedback fix | Làm nổi bật CTA “Kiểm tra tôi”; thêm định nghĩa state và nhãn lý do | Lan không thấy CTA; Minh, Huy và Phương cần kết quả ngắn/rõ hơn |
| CP5 dry run | Đi hết các đường demo trong 5:08 | Form phải chọn “Rồi, nhưng quá giờ”; rút ít nhất 8 giây trước demo |
