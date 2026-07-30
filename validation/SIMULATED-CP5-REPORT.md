# Báo cáo CP5 mô phỏng — bằng chứng kỹ thuật thật

## Phạm vi và giới hạn

Đây là **simulated technical pilot**, không phải human validation. Năm persona là năm kiểu input mô phỏng; output, model và latency là kết quả Gemini thật. Báo cáo này không có tên người dùng, quan sát hành vi hoặc quote người thật, nên **không thay thế** điều kiện ≥5 người ngoài nhóm của rubric CP5.

## Ba lượt đã giữ lại

| Lượt | Đường chạy | Kết quả | Bằng chứng | Điều học được |
|---|---|---:|---|---|
| 1 | HTTP `/api/classify` | 0/5 | `simulated-runs/simulated-pilot-2026-07-30T15-49-24-601Z.*` | Health báo live vì có key nhưng kết nối provider vẫn có thể `fetch failed`. |
| 2 | HTTP sau restart | 0/5 | `simulated-runs/simulated-pilot-2026-07-30T15-50-04-911Z.*` | Restart đơn thuần chưa chứng minh provider hoạt động. |
| 3 | `server.mjs classifyWithProvider` với CA đúng | **5/5** | `simulated-runs/simulated-pilot-direct-2026-07-30T15-51-29-742Z.*` | Năm output Gemini thật khớp đủ bốn mastery state đại diện. |

Không xóa hai lượt 0/5 vì chúng là failure có giá trị cho demo và cho quyết định sửa sản phẩm.

## Kết quả pilot live 5/5

| Case | Persona mô phỏng | Chờ | Nhận | Latency |
|---|---|---|---|---:|
| M03 | Trả lời đủ ý | understood | understood | 1.758 ms |
| M05 | Mới nắm một phần | partial | partial | 1.457 ms |
| M09 | Đúng thuật ngữ, sai quan hệ | misconception | misconception | 1.859 ms |
| M13 | Trả lời mơ hồ | insufficient | insufficient | 1.342 ms |
| M11 | Hiểu sai về token | misconception | misconception | 1.807 ms |

- Provider/model: `gemini / gemini-3.5-flash-lite`
- Output live hợp lệ: **5/5**
- Smoke test sau thay đổi: **39/39**

## Thay đổi từ pilot

### Vấn đề

Trước pilot, `/api/health` trả `mode=live` ngay khi có API key. Badge UI vì vậy ghi “AI thật” trước khi có bất kỳ lời gọi provider thành công nào. Hai lượt HTTP 0/5 chứng minh “đã cấu hình key” không đồng nghĩa “đã xác minh kết nối”.

### Đã sửa

- `AiClient` thêm trạng thái `verified`.
- Sau health live, badge ghi **“AI đã cấu hình — chưa xác minh kết nối”**.
- Chỉ sau một `classify` live thành công, badge mới ghi **“AI thật đã xác minh”**.
- Nếu live call lỗi và fallback, badge quay lại trạng thái chưa xác minh và trace vẫn giữ lỗi.

Bằng chứng code: `codebase/engine/ai-client.js`, `codebase/app.js`.

## Trạng thái tại thời điểm pilot kỹ thuật

Khi artifact này được tạo, human validation là **0/5**, quote thật **0/2** và chưa có feedback-driven usability change. Trạng thái đó được giữ để thể hiện đúng trình tự thử nghiệm, không phải trạng thái CP5 hiện tại.

Human validation sau đó đã đạt **5/5**, có hai thay đổi UI và dry run 5:08; xem `feedback-log.md`, `summary.md` và `dry-run.md`. Persona mô phỏng vẫn không được tính là người thử thật.
