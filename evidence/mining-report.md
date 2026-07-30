# Evidence B — selected-page grounding và kiểm tra mức hiểu

## Con số mạnh nhất

Trong **1.252** lượt học viên có chọn trang/đoạn, **573 lượt (45,8%)** nhận câu trả lời không có citation. Chỉ **440/1.252 (35,1%)** cite lại đúng trang đang chọn; **239/1.252 (19,1%)** chỉ cite trang khác nên cần review thay vì tự kết luận sai. Trên toàn bộ 1.261 lượt, Tutor chỉ chủ động hỏi kiểm tra hiểu **3 lần (0,24%)**; hai field `misconceptions` và `follow_ups` được dùng **0 lần**.

## Phương pháp đếm để kiểm chứng

Chạy:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\evidence\mining-selected-page.ps1
```

Script ghép mỗi message `role=student` với message `role=tutor` bằng `turn_id`; nhận diện selected page từ tiền tố `(Trang N, đoạn được chọn: ...)`; sau đó chia `citations` thành ba nhóm: `[]`, chứa đúng `N`, hoặc chỉ chứa trang khác. `asked_check_question`, `misconceptions` và `follow_ups` chỉ đếm trên dòng Tutor để mỗi lượt không bị nhân đôi.

Nguồn: `data/vlearn-pack/chatlog/chat_history_anonymized_for_hackathon.csv`; định nghĩa field: `data/vlearn-pack/chatlog/DATA_DICTIONARY.md`.

## Năm ví dụ nguyên văn đã ẩn danh

Các lượt dưới đều có selected page nhưng `citations=[]`:

1. `C0007/T0020`: “Giải thích đoạn bôi đen ở Trang 15.”
2. `C0015/T0811`: “Designt Pattern ReAct là gì có lưu ý gì về nó?”
3. `C0021/T0769`: “giải thích nghĩa chi tiết của trang 4”
4. `C0029/T0524`: “bạn đọc được nội dung slide ko, giải thích cho mình slide 44”
5. `C0030/T1261`: “giải thích kỹ cơ chế transformer”

Các quote được rút ngắn từ input nguyên văn, giữ lỗi chính tả/cách viết; mã hội thoại và lượt cho phép mở CSV kiểm lại mà không lộ danh tính.
## Ví dụ nối trực tiếp với pain chưa hiểu

Ba lượt dưới có `asked_check_question=false`: Tutor trả lời nhưng không đóng vòng bằng một bước kiểm tra hiểu.

1. `C0456/T1220`: “không hiểu gì”
2. `C0389/T0902`: “sự khác nhau giữa ML và DL chưa rõ lắm”
3. `C0472/T0500`: “Tôi chưa hiểu tại sao, giải thích kỹ hơn”
