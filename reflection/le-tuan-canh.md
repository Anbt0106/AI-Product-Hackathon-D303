# Reflection cá nhân — Lê Tuấn Cảnh

- **Mã học viên:** 2A202601127
- **Vai trò:** Prototype & UI

## Phần tôi phụ trách

Tôi phụ trách làm flow chính bấm được end-to-end trước khi tối ưu giao diện. Flow gồm chọn đoạn slide, hỏi Tutor, chạy Grounding Gate, mở Micro-Check, gửi teach-back, xem mastery state, xem căn cứ/trace và sửa hoặc phản đối verdict.

Các phần tôi cần chịu trách nhiệm giải thích nằm trong:

- `codebase/index.html` và `codebase/app.js`;
- `codebase/engine/context.js`;
- `codebase/engine/grounding-gate.js`;
- `codebase/engine/scope-guard.js`;
- `codebase/engine/trace.js`;
- các scenario và smoke test trong `codebase/test/smoke.mjs`.

UI phải nói đúng phần nào là mock và phần nào là AI thật. Nếu server không có credential hoặc live call lỗi, badge và trace phải hiện fallback, không được giả vờ đang dùng AI.

## AI đã hỗ trợ tôi như thế nào

AI hỗ trợ tạo skeleton HTML/CSS/JavaScript, đề xuất state machine, scenario demo và test. Tôi phải tự kiểm từng nút có đi tiếp được không, state cũ có bị xóa khi correction không, Gate block có thực sự ngăn Micro-Check không và trace có che field nhạy cảm không.

Tôi không để AI quyết định toàn bộ flow. Những bước có thể xác định bằng luật — Grounding Gate, Scope Guard và validator — được giữ deterministic để dễ giải thích và test.

## Case fail và bài học

Thiết kế Gate ban đầu chỉ có `pass` và `block`. Tuy nhiên, dữ liệu có 239 lượt chỉ cite trang khác. Nhóm chưa audit nội dung của toàn bộ 239 lượt, nên tự động block và gọi chúng là sai sẽ vượt quá bằng chứng.

Tôi cùng nhóm thêm trạng thái `review`: UI hiển thị trang được cite và trang đang chọn, không sinh Micro-Check, rồi chuyển quyền quyết định cho học viên. Smoke test khóa hành vi này lại.

Bài học của tôi là **failure state không chỉ là màn báo lỗi**. Nó là một quyết định sản phẩm về lúc hệ thống phải dừng, lúc nào cần hỏi lại và lúc nào trả quyền kiểm soát cho người dùng. Flow tốt phải đi được cả happy path, failure và correction.

## Nếu làm tiếp

Tôi sẽ test UI trên màn hình nhỏ, thêm trạng thái loading/retry rõ hơn, đo vị trí người dùng bị kẹt trong user test và cải thiện accessibility cho badge, focus và bàn phím.

## Tôi phải tự giải thích được khi bị hỏi

1. Vì sao Gate có ba trạng thái thay vì hai?
2. Điều gì xảy ra khi citation thiếu hoặc trỏ tài liệu khác?
3. “Tôi không đồng ý” xóa verdict cũ và ghi trace thế nào?
4. Làm sao UI chứng minh đang live, mock hay fallback?
