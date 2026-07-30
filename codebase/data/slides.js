/* ============================================================================
 * data/slides.js — DATA GIẢ cho prototype CP2
 * ----------------------------------------------------------------------------
 * Nội dung đoạn slide là TRÍCH NGẮN từ data pack của khoá, mỗi đoạn ghi rõ mã
 * đoạn [Txx-NNN] theo quy định bảo mật dữ liệu (không dán nguyên văn dài, không
 * commit data pack). Mã tài liệu (day_code) lấy đúng giá trị quan sát được
 * trong chatlog để prototype bám ngữ cảnh thật:
 *   - Lecture_material_ms2044ey_k6uor3
 *   - day02-c301
 *   - New learning material  (placeholder day_code chiếm 794 msg — dùng làm
 *     case thiếu nội dung trang cho Grounding Gate)
 *
 * Mỗi trang có:
 *   passages[]  : các đoạn bôi đen được
 *   tutorAnswer : câu trả lời mock của Tutor + citations
 *   microCheck  : câu hỏi teach-back + keyPoints + misconceptions
 *
 * keyPoints/misconceptions là NHÃN NHÓM TỰ ĐẶT — chúng vừa là luật cho mock
 * classifier ở CP2, vừa là rubric để chấm output của AI thật ở CP3.
 * ========================================================================== */

window.VLEARN_SLIDES = [
  /* ======================================================================= */
  {
    docCode: 'Lecture_material_ms2044ey_k6uor3',
    docTitle: 'Foundation · Transformer & attention',
    pages: [
      {
        page: 12,
        heading: 'Transformer — 5 bước từ văn bản tới token kế tiếp',
        passages: [
          { id: 'p12-a', src: 'T06-126', text: 'Cơ chế hoạt động: input token → embedding để biểu diễn trong không gian vectơ → self-attention → feed forward trong mạng neural network → dự đoán token kế tiếp.' },
          { id: 'p12-b', src: 'T06-126', text: 'Từ khoá quan trọng nhất ở bước self-attention: nó học song song, nó nhìn song song.' },
          { id: 'p12-c', src: 'T06-127', text: 'Khác với RNN hay LSTM, Transformer cho phép xử lý song song: 5.000 token nhìn lẫn nhau nên không "quên" đoạn đầu.' }
        ],
        tutorAnswer: {
          text: 'Transformer đi qua 5 bước: (1) tách văn bản thành token, (2) embedding — biến mỗi token thành vectơ để tính được, (3) self-attention — các token nhìn lẫn nhau song song và tính similarity score, (4) feed forward qua mạng neural, (5) dự đoán token kế tiếp. Điểm khác RNN/LSTM nằm ở bước 3: xử lý song song thay vì tuần tự.',
          citations: [12]
        },
        microCheck: {
          question: 'Bạn hãy nói lại bằng một câu: trong 5 bước của Transformer, bước nào tạo ra khác biệt so với RNN, và khác ở chỗ nào?',
          keyPoints: [
            { id: 'buoc-attention', label: 'chỉ đúng bước self-attention', kw: ['self-attention', 'self attention', 'attention', 'bước 3', 'bước ba'] },
            { id: 'song-song', label: 'nêu được "song song"', kw: ['song song', 'parallel', 'cùng lúc', 'đồng thời'] },
            { id: 'khac-rnn', label: 'đối chiếu với xử lý tuần tự của RNN', kw: ['tuần tự', 'rnn', 'lstm', 'lần lượt', 'từng bước một'] }
          ],
          misconceptions: [
            {
              id: 'hieu-ngon-ngu',
              kw: ['hiểu ngôn ngữ', 'hiểu nghĩa như con người', 'hiểu như người', 'nó biết nghĩa'],
              gap: 'Câu trả lời cho rằng Transformer "hiểu ngôn ngữ như con người". Trang 12–18 nói khác: nó không hiểu nghĩa, nó dự đoán token có xác suất cao nhất dựa trên similarity score.',
              reinforce: 'So sánh nhanh: một người hiểu câu "nó ngồi trên bàn" bằng nghĩa; mô hình thì tính điểm tương đồng giữa token "nó" và các token còn lại rồi chọn token có điểm cao nhất.'
            },
            {
              id: 'ff-truoc-attention',
              kw: ['feed forward trước', 'feed-forward trước', 'feedforward rồi mới attention'],
              gap: 'Câu trả lời đảo thứ tự: feed forward đứng SAU self-attention, không đứng trước.',
              reinforce: 'Thứ tự trên trang 12: token → embedding → self-attention → feed forward → next token.'
            }
          ]
        }
      },
      {
        page: 15,
        heading: 'Self-attention và công thức Q–K–V',
        passages: [
          { id: 'p15-a', src: 'T06-130', text: 'Mỗi từ (token) được biểu diễn trong không gian toán học để tự nó nhìn được những từ khác, tự đánh giá similarity score — mức độ tương đồng.' },
          { id: 'p15-b', src: 'T06-130', text: 'Công thức Q, K, V với hàm softmax: Q là query — truy vấn gửi vào; K là key — cái nhãn; V là value.' },
          { id: 'p15-c', src: 'T06-132', text: 'Ví dụ "con mèo ngồi trên bàn": từ "nó" và từ "mèo" có similarity score cao nhất, nên mô hình gán "nó" với con mèo thay vì với cái bàn.' }
        ],
        tutorAnswer: {
          text: 'Self-attention cho mỗi token nhìn tất cả token còn lại trong ngữ cảnh cùng một lúc. Với mỗi cặp token, mô hình dùng Q (query) đối chiếu với K (key) để ra similarity score, rồi lấy V (value) theo trọng số đó. Trong ví dụ "con mèo ngồi trên bàn", "nó" có similarity score cao nhất với "mèo" nên được gán về con mèo, không phải cái bàn.',
          citations: [15]
        },
        microCheck: {
          question: 'Trong một câu, hãy giải thích vì sao self-attention giúp mô hình không "quên" đoạn đầu của một văn bản dài.',
          keyPoints: [
            { id: 'moi-token-nhin-het', label: 'mỗi token nhìn tất cả token khác', kw: ['mỗi token', 'tất cả', 'toàn bộ', 'các token khác', 'lẫn nhau', 'mọi token'] },
            { id: 'song-song', label: 'nêu được "song song / cùng lúc"', kw: ['song song', 'cùng lúc', 'đồng thời', 'parallel', 'một lượt'] },
            { id: 'similarity', label: 'nhắc similarity score hoặc Q–K–V', kw: ['similarity', 'tương đồng', 'điểm giống', 'softmax', 'query', 'key', 'value', 'q k v', 'qkv'] }
          ],
          misconceptions: [
            {
              id: 'tuan-tu',
              kw: ['tuần tự', 'trái sang phải', 'từng từ một', 'lần lượt từng', 'đọc lần lượt'],
              notKw: ['không tuần tự', 'khác tuần tự', 'không phải tuần tự'],
              gap: 'Câu trả lời mô tả attention như xử lý tuần tự từ trái sang phải. Trang 15 nói ngược lại: các token nhìn lẫn nhau song song — đó chính là điểm khác RNN/LSTM.',
              reinforce: 'Đọc lại đoạn [T06-127] ở trang 12: "5.000 token nhìn lẫn nhau" cùng một lượt. Nếu xử lý tuần tự thì mô hình sẽ quên đoạn đầu — đúng điểm yếu của RNN.'
            },
            {
              id: 'chi-token-gan',
              kw: ['gần nhau', 'lân cận', 'kế bên', 'xung quanh nó', 'các từ bên cạnh'],
              gap: 'Câu trả lời giới hạn attention vào các token ở gần nhau. Trang 15 nói mỗi token nhìn TẤT CẢ token trong ngữ cảnh, không chỉ token lân cận.',
              reinforce: 'Trong ví dụ "con mèo ngồi trên bàn", "nó" nằm xa "mèo" hơn "bàn" nhưng vẫn được gán về "mèo" — vì điểm tương đồng cao hơn, không vì khoảng cách gần hơn.'
            },
            {
              id: 'bo-nho',
              kw: ['bộ nhớ', 'ghi nhớ lại', 'lưu lại', 'cache', 'nhớ như con người'],
              gap: 'Câu trả lời coi attention là một loại "bộ nhớ" lưu lại nội dung. Thực chất nó tính lại quan hệ giữa các token trong context window ở mỗi lượt, không lưu trữ ký ức.',
              reinforce: 'Chính vì không có "bộ nhớ" mà context window mới là giới hạn — vượt context window thì token không còn nhìn thấy nhau nữa.'
            }
          ]
        }
      },
      {
        page: 18,
        heading: 'Token và cơ chế dự đoán next token',
        passages: [
          { id: 'p18-a', src: 'T06-134', text: 'Ví dụ "Hello World" tách thành hai token, nhưng "Xin chào Việt Nam" đôi khi thành ba token; gõ tiếng Việt thì lượng token burn cao hơn tiếng Anh.' },
          { id: 'p18-b', src: 'T06-135', text: 'LLM không đọc ký tự, cũng không đọc word by word — nó đọc token.' },
          { id: 'p18-c', src: 'T06-136', text: 'LLM không hiểu ngôn ngữ như con người; nó dự đoán token nào có xác suất cao nhất. Temperature điều chỉnh mức độ sáng tạo.' }
        ],
        tutorAnswer: {
          text: 'Đơn vị mà LLM đọc là token, không phải ký tự và cũng không phải từ. Một từ có thể tách ra nhiều token — "Hello World" là 2 token nhưng "Xin chào Việt Nam" có thể là 3, nên tiếng Việt thường tốn nhiều token hơn tiếng Anh. Ở mỗi bước, mô hình không "hiểu" nghĩa mà chọn token có xác suất cao nhất; temperature là tham số điều chỉnh độ sáng tạo của lựa chọn đó.',
          citations: [18]
        },
        microCheck: {
          question: 'Nói lại trong một câu: phát biểu "một từ tương ứng một token" đúng hay sai, và vì sao?',
          keyPoints: [
            { id: 'sai', label: 'kết luận đúng là "sai"', kw: ['sai', 'không đúng', 'không phải', 'chưa đúng'] },
            { id: 'nhieu-token', label: 'một từ có thể thành nhiều token', kw: ['nhiều token', 'nhiều hơn một', '2 token', '3 token', 'ba token', 'hai token', 'nửa token'] },
            { id: 'tieng-viet', label: 'lấy được ví dụ hoặc nêu tiếng Việt tốn token hơn', kw: ['tiếng việt', 'hello world', 'xin chào', 'tiếng anh'] }
          ],
          misconceptions: [
            {
              id: 'mot-tu-mot-token',
              kw: ['đúng', 'chính xác', 'phải rồi'],
              notKw: ['sai', 'không đúng', 'không phải', 'chưa đúng'],
              gap: 'Câu trả lời kết luận "một từ = một token" là đúng. Trang 18 nêu ví dụ ngược lại: "Xin chào Việt Nam" có thể thành ba token, và "def function" thành bốn token.',
              reinforce: 'Đây cũng là lý do hoá đơn API tiếng Việt thường cao hơn tiếng Anh với cùng một nội dung.'
            },
            {
              id: 'doc-ky-tu',
              kw: ['đọc ký tự', 'từng chữ cái', 'từng ký tự'],
              gap: 'Câu trả lời cho rằng LLM đọc theo ký tự. Trang 18 nói rõ: không đọc ký tự, không đọc word by word, mà đọc token.',
              reinforce: 'Token là đơn vị nằm giữa ký tự và từ — được sinh ra từ quá trình biểu diễn văn bản trong không gian toán học.'
            }
          ]
        }
      },
      {
        page: 21,
        heading: 'Token economy và cách tính chi phí API',
        passages: [
          { id: 'p21-a', src: 'T06-154', text: 'Mỗi lần gọi API phải trả một khoản tiền cho bên cung cấp — trong thế giới GenAI người ta gọi đó là token economy.' },
          { id: 'p21-b', src: 'T06-155', text: 'Cách tính giá: input token cộng với output token thì ra total cost. Output token lại được feed forward vào lượt sau.' }
        ],
        tutorAnswer: {
          text: 'Chi phí một lời gọi API = input token + output token. Điểm dễ bỏ sót: output token của lượt trước được feed forward trở lại thành input của lượt sau, nên hội thoại càng dài thì input token của mỗi lượt càng phình ra. Đó là lý do chi phí không tỉ lệ với số câu hỏi mà tỉ lệ với tổng token.',
          citations: [21]
        },
        microCheck: {
          question: 'Trong một câu: total cost của một lời gọi API được tính từ những gì?',
          keyPoints: [
            { id: 'input', label: 'có input token', kw: ['input', 'đầu vào', 'token vào'] },
            { id: 'output', label: 'có output token', kw: ['output', 'đầu ra', 'token ra'] },
            { id: 'feed-forward', label: 'nêu output được feed forward vào lượt sau', kw: ['feed forward', 'feed-forward', 'lượt sau', 'quay lại', 'cộng dồn', 'tích luỹ'] }
          ],
          misconceptions: [
            {
              id: 'theo-so-request',
              kw: ['số request', 'số lần gọi', 'số câu hỏi', 'mỗi câu một giá', 'tính theo lượt'],
              gap: 'Câu trả lời tính tiền theo số lần gọi. Trang 21 tính theo tổng token: input + output, không theo số request.',
              reinforce: 'Hai lời gọi cùng số lượng nhưng một lời gọi dài gấp mười lần sẽ đắt gấp khoảng mười lần.'
            },
            {
              id: 'chi-input',
              kw: ['chỉ input', 'chỉ tính đầu vào', 'chỉ tính input'],
              gap: 'Câu trả lời chỉ tính input token. Total cost gồm cả output token — và output thường đắt hơn input.',
              reinforce: 'Với các tính năng sinh văn bản dài, output token mới là phần chi phí chính.'
            }
          ]
        }
      }
    ]
  },

  /* ======================================================================= */
  {
    docCode: 'day02-c301',
    docTitle: 'Day 2 · Chỉ số thành công & mức tự động hoá',
    pages: [
      {
        page: 6,
        heading: 'Khung phát biểu bài toán',
        passages: [
          { id: 'p6-a', src: 'T02-015', text: 'Đối tượng là ai; quy trình hiện tại bình thường phải làm như thế nào; xác định các nút thắt — nếu nút thắt tồn tại thì nó đang tác động thế nào.' },
          { id: 'p6-b', src: 'T02-015', text: 'Thế nào được coi là thành công nếu giải quyết được: hiện tại mất 30 phút, sau khi giải chỉ còn 5 phút — chỉ số thành công là việc đó phải làm dưới 5 phút.' }
        ],
        tutorAnswer: {
          text: 'Khung này có bốn ô. "Nút thắt" là chỗ đang tắc trong quy trình hiện tại — nó mô tả hiện trạng. "Chỉ số thành công" là ngưỡng đo được của trạng thái SAU khi giải, phải có con số: ví dụ tổng hợp báo cáo hiện mất 30 phút, chỉ số thành công là dưới 5 phút. Nút thắt trả lời "đang đau ở đâu", chỉ số thành công trả lời "bao nhiêu thì gọi là xong".',
          citations: [6]
        },
        microCheck: {
          question: 'Nói lại một câu: "chỉ số thành công" khác "nút thắt" ở chỗ nào?',
          keyPoints: [
            { id: 'nut-that-hien-trang', label: 'nút thắt = chỗ đang tắc hiện tại', kw: ['hiện tại', 'đang tắc', 'hiện trạng', 'chỗ tắc', 'đang vướng', 'đang đau'] },
            { id: 'csn-sau-khi-giai', label: 'chỉ số thành công = trạng thái sau khi giải', kw: ['sau khi', 'mục tiêu', 'đích', 'kết quả mong muốn', 'trạng thái sau'] },
            { id: 'co-so', label: 'chỉ số thành công phải đo được bằng số', kw: ['con số', 'đo được', 'định lượng', 'phút', 'ngưỡng', '%', 'phần trăm'] }
          ],
          misconceptions: [
            {
              id: 'coi-la-mot',
              kw: ['giống nhau', 'như nhau', 'cùng là', 'không khác', 'là một'],
              gap: 'Câu trả lời coi hai ô này là một. Trang 6 tách rõ: nút thắt mô tả hiện trạng đang tắc, chỉ số thành công là ngưỡng đo được của trạng thái sau khi giải.',
              reinforce: 'Thử điền cho bài toán của nhóm bạn: nút thắt = "học viên không biết mình đã hiểu đúng chưa"; chỉ số thành công = "xác nhận được mức hiểu trong dưới 60 giây".'
            },
            {
              id: 'vanity-metric',
              kw: ['nhiều user', 'nhiều người dùng', 'lượt tải', 'số lượt truy cập', 'nhiều lượt', 'view'],
              gap: 'Câu trả lời lấy chỉ số tăng trưởng (số user, số lượt) làm chỉ số thành công. Trang 6 gắn chỉ số thành công với chính công việc của job executor — ví dụ thời gian giảm từ 30 phút xuống dưới 5 phút.',
              reinforce: 'Số user đông vẫn có thể đi kèm việc không ai hoàn thành được công việc. Chỉ số thành công phải đo được kết quả của công việc, không đo lưu lượng.'
            }
          ]
        }
      },
      {
        page: 7,
        heading: 'Thang mức tự động hoá',
        passages: [
          { id: 'p7-a', src: 'T02-016', text: 'Bước đầu tiên: có thể bài toán của bạn không cần AI — nó có thể xử lý ở mức con người — hoặc nó cần AI.' },
          { id: 'p7-b', src: 'T02-016', text: 'AI cũng có nhiều mức: chỉ xác định các quy tắc; thiết kế workflow và AI tham gia ở một số nút ở giữa; hoặc để AI giải quyết cả bài toán.' },
          { id: 'p7-c', src: 'T02-014', text: 'Thay vì đưa ngay câu trả lời "dùng AI", hãy đổi thành câu hỏi: còn cách nào khác nữa không?' }
        ],
        tutorAnswer: {
          text: 'Thang này đi từ "không cần AI" → "chỉ cần quy tắc" → "workflow có AI ở một số nút" → "AI giải cả bài toán". Chọn mức nào phụ thuộc vào chi phí khi AI sai: sai thì đắt và khó sửa thì để AI đề xuất và người quyết; sai thì rẻ và người dùng tự thấy được thì mới để AI tự làm.',
          citations: [7]
        },
        microCheck: {
          question: 'Với tính năng "AI đánh giá học viên đã hiểu đúng hay chưa", bạn chọn mức tự động hoá nào và vì sao? Trả lời trong một câu.',
          keyPoints: [
            { id: 'augment', label: 'chọn AI đề xuất, người quyết', kw: ['đề xuất', 'gợi ý', 'augment', 'người quyết', 'học viên quyết', 'không tự quyết', 'ở một số nút'] },
            { id: 'cost-of-error', label: 'nêu lý do theo chi phí khi sai', kw: ['sai thì', 'học sai', 'kiến thức sai', 'đắt', 'hậu quả', 'mất niềm tin', 'rủi ro'] },
            { id: 'quyen-bo-qua', label: 'giữ quyền bỏ qua / phản đối cho học viên', kw: ['bỏ qua', 'phản đối', 'không đồng ý', 'sửa lại', 'từ chối'] }
          ],
          misconceptions: [
            {
              id: 'automate-het',
              kw: ['để ai quyết', 'tự động hoàn toàn', 'ai chấm điểm', 'ai làm hết', 'automate hoàn toàn', 'ai tự kết luận'],
              notKw: ['không nên', 'không được', 'tránh'],
              gap: 'Câu trả lời chọn mức tự động hoá cao nhất cho một việc mà sai thì đắt. Kết luận nhầm "đã hiểu" khiến học viên tiếp tục học với kiến thức sai — chi phí sửa cao và người chịu là học viên.',
              reinforce: 'Đối chiếu trang 7: việc có cost-of-error cao thì AI chỉ đề xuất, người quyết. Với Micro-Check, học viên luôn phải bỏ qua hoặc phản đối được.'
            },
            {
              id: 'khong-can-ai',
              kw: ['không cần ai', 'không cần dùng ai', 'làm tay'],
              gap: 'Câu trả lời loại bỏ AI hoàn toàn. Trang 7 nêu bốn mức, và phần đánh giá câu trả lời tự do của học viên là chỗ quy tắc cứng không làm được.',
              reinforce: 'Quy tắc cứng chỉ so khớp từ khoá, không phát hiện được học viên dùng đúng thuật ngữ nhưng giải thích sai quan hệ.'
            }
          ]
        }
      },
      {
        page: 9,
        heading: 'Định lượng bài toán',
        passages: [
          { id: 'p9-a', src: 'T02-018', text: 'Phải định lượng hoá được: làm cái này tôi tiết kiệm bao nhiêu giờ công, nhân với giá chi phí nhân công — ít nhất phải ra được con số tiền đó thì mới đánh giá được.' },
          { id: 'p9-b', src: 'T02-018', text: 'Hoặc bao nhiêu phần trăm workload của một người trong một ngày. Không thể có con số chính xác tuyệt đối, nhưng định lượng rất quan trọng.' }
        ],
        tutorAnswer: {
          text: 'Định lượng theo hai đường. Một: số giờ công tiết kiệm được × chi phí nhân công → ra con số tiền. Hai: phần trăm workload của một người trong một ngày. Con số không cần chính xác tuyệt đối, nhưng phải có, vì không có nó thì không so sánh được các ứng viên và không thuyết phục được người ra quyết định.',
          citations: [9]
        },
        microCheck: {
          question: 'Một câu: định lượng bài toán bằng cách nào để người ra quyết định bị thuyết phục?',
          keyPoints: [
            { id: 'gio-cong', label: 'nêu giờ công tiết kiệm', kw: ['giờ công', 'thời gian', 'phút', 'giờ'] },
            { id: 'nhan-chi-phi', label: 'nhân với chi phí nhân công hoặc ra tiền', kw: ['chi phí', 'nhân công', 'tiền', 'nhân với', 'quy ra'] },
            { id: 'workload', label: 'hoặc nêu phần trăm workload', kw: ['workload', 'phần trăm', '%', 'khối lượng công việc'] }
          ],
          misconceptions: [
            {
              id: 'dinh-tinh',
              kw: ['nhanh hơn nhiều', 'tiện hơn', 'cảm thấy', 'có vẻ', 'tốt hơn hẳn'],
              notKw: ['phút', 'giờ', '%', 'con số'],
              gap: 'Câu trả lời dừng ở mô tả định tính. Trang 9 yêu cầu ra được con số: giờ công × chi phí nhân công, hoặc % workload.',
              reinforce: 'Thử áp cho nhóm bạn: mỗi lần tự tra lại tài liệu mất bao nhiêu phút × bao nhiêu lượt/tuần = bao nhiêu giờ mỗi tuần.'
            }
          ]
        }
      }
    ]
  },

  /* ======================================================================= */
  {
    docCode: 'New learning material',
    docTitle: 'New learning material (day_code placeholder — không có nội dung trang)',
    note: 'Đây là mã tài liệu chiếm nhiều lượt nhất trong chatlog nhưng không trỏ tới nội dung cụ thể. Dùng làm case thiếu nguồn cho Grounding Gate.',
    pages: [
      {
        page: 3,
        heading: '(Không lấy được nội dung trang)',
        passages: [],
        tutorAnswer: null,
        microCheck: null
      }
    ]
  }
];

/* Câu hỏi gợi ý theo trang — dùng cho nút bấm nhanh trong panel Tutor. */
window.VLEARN_SUGGESTED = {
  12: ['Giải thích 5 bước của Transformer', 'Vì sao Transformer nhanh hơn RNN?'],
  15: ['Self-attention hoạt động thế nào?', 'Q, K, V là gì?'],
  18: ['Token là gì?', 'Vì sao tiếng Việt tốn nhiều token hơn?'],
  21: ['Chi phí API tính thế nào?', 'Vì sao hội thoại dài lại đắt?'],
  6: ['Chỉ số thành công là gì?', 'Nút thắt khác chỉ số thành công thế nào?'],
  7: ['Có mấy mức tự động hoá?', 'Nên chọn mức nào cho tính năng đánh giá hiểu bài?'],
  9: ['Định lượng bài toán thế nào?', 'Vì sao phải ra con số tiền?'],
  3: ['Giải thích nội dung trang này']
};
