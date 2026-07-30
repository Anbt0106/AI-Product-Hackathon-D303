# codebase — VLearn Hiểu Đúng, Hiểu Thật

Prototype mức **Mock có AI thật ở lõi**: flow bấm end-to-end bằng data giả; lời gọi AI thật duy nhất nằm ở **Mastery Classifier**, quyết định `understood / partial / misconception / insufficient`. Tutor và bank câu hỏi là mock có ghi rõ.

## Chạy

Mock, không cần key:

```powershell
node server.mjs
# mở http://localhost:5173
```

CP3 live bằng file môi trường:

```powershell
Copy-Item .env.example .env
# Mở codebase/.env, điền GEMINI_API_KEY rồi lưu
.\\start.ps1
```

`codebase/.env` đã bị Git bỏ qua; chỉ `.env.example` được commit. Có thể đổi sang Anthropic theo các dòng hướng dẫn trong file mẫu.

Badge nói theo bằng chứng: `CP2 · Mock — chưa gọi AI`; có key nhưng chưa gọi thành công là `CP3 · AI đã cấu hình — chưa xác minh kết nối`; chỉ sau một classify live thành công mới ghi `CP3 · AI thật đã xác minh (<model>)`.

## Đường demo chính

1. Chọn tài liệu/trang/đoạn.
2. Hỏi Tutor; Tutor mock trả lời có citation.
3. Grounding Gate pass/review/block.
4. Bấm `Kiểm tra tôi · 30 giây`.
5. Trả lời teach-back một câu.
6. `POST /api/classify` gọi AI thật nếu có credential; server validate structured output và bất biến.
7. Xem state + một bước củng cố; có thể trả lời lại/không đồng ý.
8. Mở Trace để xem `mode`, model, latency, input/output và tải JSON.

Kịch bản từng phút: `../DEMO-5-PHUT.md`.

## Phần thật / mock

| Phần | Trạng thái |
|---|---|
| UI flow, Gate, Scope Guard, trace, schema validator | Chạy thật |
| Mastery Classifier | AI thật khi badge live; fallback rule có trace |
| Tutor answer | Mock viết sẵn theo trang |
| Micro-Check question | Mock từ bank đã duyệt |
| Tài liệu, đăng nhập, tiến độ dài hạn | Mock/không build |

## Test và eval

```powershell
node test/smoke.mjs
cd ..
node eval/run-eval.mjs --mode baseline
# Sau khi đã điền codebase/.env
node eval/run-eval.mjs --mode live
```

Runner live chỉ chạy khi `/providerState` là live và sẽ ghi mọi output vào `eval/results/`, trace vào `eval/traces/`. Không có key thì thoát với lỗi, không sinh “live trace” giả.

## Cấu trúc

- `app.js`: session state + render + 8 scenario demo.
- `data/slides.js`: data giả/trích ngắn, Tutor mock, bank Micro-Check.
- `engine/context.js`: context tối thiểu.
- `engine/grounding-gate.js`: Gate pass/review/block.
- `engine/scope-guard.js`: chặn ngoài phạm vi/injection.
- `engine/question.js`: câu hỏi mock ổn định.
- `engine/mastery.js`: baseline rule/fallback.
- `engine/ai-client.js`: gọi live classifier và log fallback.
- `engine/trace.js`: trace, tự che field nhạy cảm.
- `server.mjs`: giữ key phía server, gọi Gemini/Anthropic structured output, validate verdict.

## An toàn

- Không hardcode/commit API key hoặc `.env`.
- Chỉ gửi đoạn context tối thiểu; prototype dùng data giả/trích ngắn.
- Trace che field có `key|token|secret|authorization|password`.
- `insufficient` không được `continue`; `understood` phải không có gap; mọi verdict gắn source page từ context.