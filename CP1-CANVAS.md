# CP1 — VLearn Hiểu Đúng, Hiểu Thật

> **Tên đề tài:** VLearn Hiểu Đúng, Hiểu Thật   
> **Hướng:** A — Tính năng AI mới trên VLearn, có lớp khắc phục lỗi ngữ cảnh của Tutor  
> **Mức prototype:** Working prototype giới hạn  

## Canvas 7 dòng

1. **Chiến tuyến / Hướng:** **A — VLearn:** xây một vòng học khép kín **“đúng nguồn → giải thích có căn cứ → Kiểm tra tôi kiểm tra kiến thức → củng cố đúng lỗ hổng”**, vừa chặn lỗi mất/lấy sai ngữ cảnh slide vừa bổ sung khả năng kiểm tra hiểu thật.

2. **Ai đau / Job executor:** **Học viên đang trong buổi học, vừa bôi đen một đoạn slide và nhờ Tutor giải thích một khái niệm khó**, đang muốn biết câu trả lời có bám đúng tài liệu và mình đã thực sự hiểu đúng trước khi học tiếp.

3. **Pain một câu:** Khi hỏi về đoạn slide đang học, học viên có thể nhận câu trả lời **mất/lấy sai ngữ cảnh, thiếu grounding hoặc trích dẫn lệch trang**, rồi lại không có cách nhanh để kiểm tra mình đã hiểu đúng, nên phải tự tra lại, mất niềm tin hoặc tiếp tục học với một misconception.

4. **Bằng chứng đầu tiên:** Trong 1.261 lượt hỏi–đáp, 1.252 lượt có selected page nhưng 573 lượt không có citation; chỉ 440/1.252 lượt cite đúng trang đã chọn, còn 239 lượt chỉ cite trang khác và cần audit nội dung. Đồng thời, 27 lượt từ 26 học viên có tín hiệu chưa hiểu/cần giải thích lại nhưng chỉ 1/27 dẫn tới câu hỏi kiểm tra; toàn bộ data chỉ có 3/1.261 lượt `asked_check_question=true`, còn `misconceptions` và `follow_ups` được dùng 0 lần.

5. **Lát cắt một câu:** Với học viên vừa được giải thích một khái niệm từ đoạn slide đã qua Grounding Gate, AI đánh giá câu trả lời teach-back để quyết định `understood`, `partial`, `misconception` hay `insufficient`, rồi đưa đúng một bước củng cố kèm trích dẫn nguồn, giúp học viên xác nhận cả độ đúng của ngữ cảnh và mức hiểu trong tối đa 60 giây.

6. **Automation + willing users:** Chọn **Augment có Grounding Gate bắt buộc**: thiếu/sai nguồn thì không sinh Micro-Check; đủ nguồn thì AI chỉ đề xuất trạng thái hiểu và một bước củng cố, còn học viên được bỏ qua hoặc bấm “Tôi không đồng ý”. Lý do: kết luận nhầm “đã hiểu” hoặc củng cố từ sai ngữ cảnh có thể khiến học viên học sai. 

    Ba người đã đồng ý thử: Chưa có.

7. **Phân vai có tên:** 

    -Bùi Thọ An: Evidence & Product.

    -Phạm Nguyễn Hùng Nguyên: Context, AI & Eval - retrieval, Grounding Gate, citation validator, mastery prompt/schema.

    -Lê Tuấn Cảnh: Prototype - UI.

    -Nguyễn Văn Tuấn Anh: Validation & Demo - golden set phủ context + mastery, feedback log, changelog, slide và demo.



