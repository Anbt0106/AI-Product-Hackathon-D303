# Eval — golden set và trace CP3

- `golden-set.json`: 24 case đã chốt, gồm 8 normal, 12 hard, 4 rare; 12 case phát triển từ chatlog bằng mã hội thoại/lượt.
- `run-eval.mjs`: chạy cùng bộ cho baseline hoặc AI live.
- `results/`: bảng đầy đủ từng case, không loại case fail.
- `traces/`: trace máy đọc được; live trace có `mode: live`, provider, model, latency.

```powershell
node eval/run-eval.mjs --mode baseline

# Sau khi điền `codebase/.env`
node eval/run-eval.mjs --mode live
```

Quality bar chốt: **≥85% toàn bộ 24 case và 100% ba bất biến cứng**. Baseline và live là hai lượt độc lập; baseline không được dùng làm bằng chứng “AI thật”. Nếu thiếu key, runner live dừng trước khi tạo artifact.

## Lượt chính thức

- Kết quả: esults/live-gemini-2026-07-30T07-38-48-056Z.md — **24/24 (100%)**.
- Trace: 	races/live-gemini-2026-07-30T07-38-48-056Z.json — **16 AI calls thật**.
- Các lượt lỗi/thấp trước đó được giữ nguyên để phúc khảo.
