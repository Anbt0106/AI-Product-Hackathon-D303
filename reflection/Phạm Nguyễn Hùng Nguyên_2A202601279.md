# Reflection cá nhân — Phạm Nguyễn Hùng Nguyên

- **Mã học viên:** 2A202601279
- **Vai trò:** Context, AI & Eval

## Phần tôi phụ trách

Tôi phụ trách biến quyết định trung tâm của sản phẩm thành một bài toán AI có thể đo được: từ đoạn slide, câu Micro-Check và câu teach-back của học viên, classifier phải chọn đúng một trong bốn trạng thái `understood`, `partial`, `misconception`, `insufficient`.

Các phần tôi cần chịu trách nhiệm giải thích gồm:

- context tối thiểu và schema của Mastery Classifier;
- đường gọi `AiClient.classify()` → `POST /api/classify` → Gemini;
- kiểm tra schema và quan hệ state → action ở server;
- golden set 24 case và runner trong `eval/`;
- kết quả, trace và nguyên nhân của các lượt live chưa đạt.

Bằng chứng chính nằm ở `codebase/server.mjs`, `codebase/engine/ai-client.js`, `eval/golden-set.json`, `eval/run-eval.mjs`, `eval/results/` và `eval/traces/`.

## AI đã hỗ trợ tôi như thế nào

AI hỗ trợ đề xuất schema, prompt, test case và phân tích output lỗi. Tôi không coi structured output là bằng chứng rằng kết quả chắc chắn hợp lệ. Phần tôi phải tự kiểm là enum, field bắt buộc, bất biến nghiệp vụ, trace và đối chiếu từng case với expected cố định.

Tôi cũng phải giữ ranh giới rõ: Tutor và câu Micro-Check vẫn là mock; lời gọi AI thật duy nhất nằm ở quyết định mastery. API key chỉ nằm trong `.env`, không nằm trong code hoặc trace.

## Case fail và bài học

Lượt live quan trọng nhất để tôi học là **17/24, thấp hơn quality bar 85%**. Trong 16 case mastery chỉ có 13 output live hợp lệ; ba output `insufficient` bị server từ chối vì model không đi với `next_action=clarify`. Một số câu đúng nhưng thiếu ý bị model đẩy sang `misconception`, cho thấy model tự suy diễn khác với nhãn mà nhóm muốn đo.

Nhóm không hạ quality bar và không xóa lượt fail. Chúng tôi bổ sung rubric về ý đúng, quan hệ sai và state → action; server tiếp tục kiểm bất biến thay vì tin JSON của model. Lượt sau đạt 24/24 với 16/16 output live hợp lệ.

Bài học của tôi là **prompt tốt không thay thế validator và eval**. Kết quả 24/24 chỉ chứng minh hệ thống đạt trên bộ 24 case đã chốt, không chứng minh model đúng 100% ngoài thực tế.

## Nếu làm tiếp

Tôi sẽ mở rộng golden set bằng câu cụt, typo, trộn Anh–Việt và domain mới; đồng thời đo calibration giữa confidence, độ đúng thực tế và mức tin của người dùng.

