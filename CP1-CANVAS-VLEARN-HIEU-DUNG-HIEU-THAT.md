# CP1 — Canvas 7 dòng · VLearn Hiểu Đúng, Hiểu Thật

> **Tên đề tài:** VLearn Hiểu Đúng, Hiểu Thật / VLearn Grounded Adaptive Micro-Check  
> **Hướng:** A — Tính năng AI mới trên VLearn, có lớp khắc phục lỗi ngữ cảnh của Tutor  
> **Mức prototype:** Working prototype giới hạn  
> **Trạng thái:** Bản Canvas CP1 chính thức; phải điền tên thật ở dòng 6–7 trước khi nộp

## Canvas 7 dòng

1. **Chiến tuyến / Hướng:** **A — VLearn:** xây một vòng học khép kín **“đúng nguồn → giải thích có căn cứ → Kiểm tra tôi · 30 giây → củng cố đúng lỗ hổng”**, vừa chặn lỗi mất/lấy sai ngữ cảnh slide vừa bổ sung khả năng kiểm tra hiểu thật.

2. **Ai đau / Job executor:** **Học viên đang trong buổi học, vừa bôi đen một đoạn slide và nhờ Tutor giải thích một khái niệm khó**, đang muốn biết câu trả lời có bám đúng tài liệu và mình đã thực sự hiểu đúng trước khi học tiếp.

3. **Pain một câu:** Khi hỏi về đoạn slide đang học, học viên có thể nhận câu trả lời **mất/lấy sai ngữ cảnh, thiếu grounding hoặc trích dẫn lệch trang**, rồi lại không có cách nhanh để kiểm tra mình đã hiểu đúng, nên phải tự tra lại, mất niềm tin hoặc tiếp tục học với một misconception.

4. **Bằng chứng đầu tiên:** Trong 1.261 lượt hỏi–đáp, **1.252 lượt có selected page nhưng 573 lượt không có citation; chỉ 440/1.252 lượt cite đúng trang đã chọn, còn 239 lượt chỉ cite trang khác và cần audit nội dung**. Đồng thời, **27 lượt từ 26 học viên có tín hiệu chưa hiểu/cần giải thích lại nhưng chỉ 1/27 dẫn tới câu hỏi kiểm tra**; toàn bộ data chỉ có **3/1.261 lượt `asked_check_question=true`**, còn `misconceptions` và `follow_ups` được dùng **0 lần**.

5. **Lát cắt một câu:** **Với học viên vừa được giải thích một khái niệm từ đoạn slide đã qua Grounding Gate, AI đánh giá câu trả lời teach-back để quyết định `understood`, `partial`, `misconception` hay `insufficient`, rồi đưa đúng một bước củng cố kèm trích dẫn nguồn, giúp học viên xác nhận cả độ đúng của ngữ cảnh và mức hiểu trong tối đa 60 giây.**

6. **Automation + willing users:** Chọn **Augment có Grounding Gate bắt buộc**: thiếu/sai nguồn thì không sinh Micro-Check; đủ nguồn thì AI chỉ đề xuất trạng thái hiểu và một bước củng cố, còn học viên được bỏ qua hoặc bấm “Tôi không đồng ý”. Lý do: kết luận nhầm “đã hiểu” hoặc củng cố từ sai ngữ cảnh có thể khiến học viên học sai. Ba người đã đồng ý thử: **[Willing user 1 — tên/vai] · [Willing user 2 — tên/vai] · [Willing user 3 — tên/vai]**.

7. **Phân vai có tên:** **[Tên TV1] — Evidence & Product:** audit 4 pain, khảo sát, JTBD/impact/spec · **[Tên TV2] — Context, AI & Eval:** retrieval, Grounding Gate, citation validator, mastery prompt/schema · **[Tên TV3] — Prototype:** UI slide–Tutor–Micro-Check, failure/correction path, API và trace · **[Tên TV4] — Validation & Demo:** golden set phủ context + mastery, feedback log, changelog, slide và demo.

---

## Bốn pain point trong cùng một chiến tuyến

| Ưu tiên | Pain point | Sức mạnh evidence | Impact | Vai trò trong lát cắt |
|---:|---|---|---|---|
| 1 | Mất/lấy sai ngữ cảnh slide | Mạnh | Rất cao | **Lỗi gốc cần chặn bằng Grounding Gate** |
| 2 | Không kiểm tra hiểu thật | Mạnh về hành vi | Rất cao | **Quyết định AI trung tâm và điểm sáng tạo** |
| 3 | Thiếu grounding/trích dẫn | Khá | Cao | Điều kiện chất lượng của pain 1 |
| 4 | Trích dẫn lệch trang | Cần audit | Cao | Biểu hiện/risk case của pain 1; không mặc định mọi cross-page citation đều sai |

Nhóm vẫn build **một tính năng**, không phải bốn tính năng rời rạc:

- Grounding Gate bảo đảm đúng nguồn trước khi tạo Micro-Check.
- Citation giúp học viên tự kiểm chứng.
- Mastery classification là quyết định AI trung tâm.
- Một bước củng cố khép kín job “hiểu đúng trước khi học tiếp”.

## Kiểm tra theo rubric CP1

| Điều kiện TA kiểm | Trạng thái | Ghi chú |
|---|---|---|
| Lát cắt có 1 user | **Đạt** | Học viên vừa hỏi từ đoạn slide |
| Có 1 công việc | **Đạt** | Xác nhận mình hiểu đúng trước khi học tiếp |
| Có 1 quyết định AI trung tâm | **Đạt** | Phân loại mastery state; Grounding Gate là điều kiện đầu vào |
| Có 1 kết quả | **Đạt** | Một bước củng cố có nguồn trong tối đa 60 giây |
| Có evidence ban đầu | **Đạt ở mức CP1** | Có số đếm; trước `spec.md` cần phương pháp mining, ≥5 ví dụ và khảo sát nhu cầu |
| Automation theo cost-of-error | **Đạt** | Chặn sai nguồn; AI chỉ augment quyết định của học viên |
| ≥3 willing users | **Chưa có tên** | Phải thay ba placeholder bằng tên/vai thật |
| Phân công đủ tên | **Chưa có tên** | Phải thay `[Tên TV1]`–`[Tên TV4]` bằng tên/mã học viên |

## Bản trình bày CP1 trong 30 giây

> Nhóm chọn Hướng A — VLearn Hiểu Đúng, Hiểu Thật. Học viên hiện gặp hai rủi ro nối tiếp: Tutor có thể lấy sai hoặc thiếu ngữ cảnh slide, và sau câu trả lời gần như không kiểm tra học viên đã hiểu thật chưa. Trong 1.252 lượt có selected page, 573 lượt không có citation; toàn bộ 1.261 lượt chỉ có 3 lần hỏi kiểm tra hiểu. Vì vậy nhóm làm một vòng có điều kiện: Grounding Gate xác minh đúng nguồn, sau đó nút “Kiểm tra tôi · 30 giây” yêu cầu học viên teach-back; AI phân loại mức hiểu và chỉ sửa đúng một lỗ hổng có trích dẫn. Nếu nguồn không đủ, Micro-Check không được tạo; nếu học viên không đồng ý, họ luôn có quyền sửa hoặc bỏ qua.

## Hai việc bắt buộc trước khi nộp

1. Điền tên/mã học viên của 4 thành viên và tên/vai của ít nhất 3 willing users.
2. Audit các trường hợp cite trang khác trước khi gọi đó là lỗi; không khẳng định mọi cross-page citation đều sai.
