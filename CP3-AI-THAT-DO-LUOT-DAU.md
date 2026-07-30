# CP3 — AI thật + đo lượt đầu

## Trạng thái: ĐẠT

- Flow CP2: **39/39 smoke test đạt**, 8 scenario bấm được.
- Golden set: **24 case**, đủ 4 lớp khó; 12 case phát triển từ chatlog.
- AI thật: **Gemini `gemini-3.5-flash-lite` ở Mastery Classifier**.
- Lượt live chính thức: **24/24 = 100%**, vượt quality bar 85%.
- Trace chính thức: `eval/traces/live-gemini-2026-07-30T07-38-48-056Z.json` — **16 lời gọi live**, có model và latency, không có key.
- Bảng kết quả: `eval/results/live-gemini-2026-07-30T07-38-48-056Z.md`.

## Lịch sử đo được giữ nguyên

| Lượt | Kết quả | Nguyên nhân/điều chỉnh |
|---|---:|---|
| 1–2 | 8/24, 0 AI response | Node chưa tin CA của lớp Avast Web Shield; không phải lỗi key |
| 3 | 8/24, 0 response hợp lệ | Payload `responseFormat` không khớp `generateContent`; đổi sang `responseMimeType + responseJsonSchema` |
| 4 | 17/24, 13 response hợp lệ | Prompt chưa cấp rubric ý đúng/quan hệ sai; model suy diễn sai ở partial và vi phạm state→action |
| Chính thức | **24/24, 16/16 live** | Cấp rubric đã chốt, giữ nguyên golden labels và quality bar |

Không xoá các artifact lượt lỗi/thấp: rubric yêu cầu ghi nhận đầy đủ, trung thực.

## Kiểm khi demo

1. Điền key trong `codebase/.env` (file đã bị Git bỏ qua).
2. Chạy `codebase/start.ps1` trên máy có Avast Web Shield, hoặc `node server.mjs` nếu Node đã tin CA mạng.
3. Badge ghi `CP3 · AI thật ở Mastery (gemini-3.5-flash-lite)`.
4. Scenario “Đang nhầm” phải tạo trace `mastery_classify`, `mode: live`.
5. Không commit `.env` và không dùng `git add -f`.