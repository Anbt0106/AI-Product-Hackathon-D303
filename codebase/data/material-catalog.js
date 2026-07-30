/*
 * Catalog cục bộ cho demo VLearn.
 *
 * Chỉ giữ metadata và trích đoạn ngắn có mã nguồn từ data pack. Toàn bộ PDF và
 * transcript gốc nằm trong data/vlearn-pack/ (bị Git bỏ qua) và không được đưa
 * vào repo nộp bài.
 */
window.VLEARN_SLIDES = [
  {
    docCode: 'Lecture_material_ms2039d0_hnxpxy',
    materialId: 'material_ms2039d0_hnxpxy',
    docTitle: 'day01_302.pdf',
    courseCode: 'COMP2010',
    day: 'Day01',
    pageCount: 29,
    pdfUrl: 'data/vlearn-pack/slides/d1-slide-hackathon.pdf',
    transcript: 'transcript-06-clean.md',
    note: 'AI & LLM Foundation · bản hackathon',
    pages: [
      {
        page: 15,
        heading: 'Self-attention và công thức Q–K–V',
        passages: [
          {
            id: 'p15-a',
            src: 'T06-130',
            text: 'Mỗi token được biểu diễn trong không gian toán học để nhìn các token khác và tự đánh giá similarity score.'
          },
          {
            id: 'p15-b',
            src: 'T06-130',
            text: 'Q là query, K là key và V là value; softmax biến điểm tương đồng thành trọng số.'
          },
          {
            id: 'p15-c',
            src: 'T06-132',
            text: 'Trong ví dụ “con mèo ngồi trên bàn”, token “nó” có điểm tương đồng cao nhất với “mèo”.'
          }
        ],
        tutorAnswer: {
          text: 'Self-attention cho mỗi token đối chiếu với các token còn lại trong cùng ngữ cảnh. Q đối chiếu K để tạo điểm tương đồng, rồi dùng điểm đó làm trọng số cho V. Vì việc đối chiếu diễn ra song song trên toàn ngữ cảnh nên mô hình không phải đọc tuần tự như RNN.',
          citations: [15],
          confidence: 0.91
        },
        microCheck: {
          question: 'Trong một câu, hãy giải thích vì sao self-attention giúp mô hình không “quên” đoạn đầu của văn bản dài.',
          keyPoints: [
            { id: 'moi-token-nhin-het', label: 'mỗi token nhìn tất cả token khác', kw: ['mỗi token', 'tất cả', 'toàn bộ', 'các token khác', 'lẫn nhau', 'mọi token'] },
            { id: 'song-song', label: 'xử lý song song hoặc cùng lúc', kw: ['song song', 'cùng lúc', 'đồng thời', 'parallel', 'một lượt'] },
            { id: 'similarity', label: 'dùng similarity score hoặc Q–K–V', kw: ['similarity', 'tương đồng', 'điểm giống', 'softmax', 'query', 'key', 'value', 'q k v', 'qkv'] }
          ],
          misconceptions: [
            {
              id: 'tuan-tu',
              kw: ['tuần tự', 'trái sang phải', 'từng từ một', 'lần lượt từng', 'đọc lần lượt'],
              notKw: ['không tuần tự', 'khác tuần tự', 'không phải tuần tự'],
              gap: 'Bạn đang mô tả attention như xử lý tuần tự. Nguồn cho biết các token nhìn lẫn nhau song song.',
              reinforce: 'Hãy đối chiếu lại: RNN xử lý lần lượt, còn self-attention so sánh các token trong cùng một lượt.'
            },
            {
              id: 'chi-token-gan',
              kw: ['gần nhau', 'lân cận', 'kế bên', 'các từ bên cạnh'],
              gap: 'Self-attention không chỉ nhìn token ở gần; nó xét các token trong toàn ngữ cảnh.',
              reinforce: 'Trong ví dụ, “nó” liên hệ với “mèo” theo điểm tương đồng, không theo khoảng cách.'
            },
            {
              id: 'bo-nho',
              kw: ['bộ nhớ', 'ghi nhớ lại', 'lưu lại', 'cache', 'nhớ như con người'],
              gap: 'Attention không phải bộ nhớ lưu ký ức; nó tính quan hệ token trong context window.',
              reinforce: 'Nếu token nằm ngoài context window thì chúng không còn nhìn thấy nhau.'
            }
          ]
        }
      },
      {
        page: 18,
        heading: 'Token và cơ chế dự đoán next token',
        passages: [
          {
            id: 'p18-a',
            src: 'T06-134',
            text: '“Hello World” có thể tách thành hai token, còn “Xin chào Việt Nam” có thể thành ba token; tiếng Việt thường dùng nhiều token hơn.'
          },
          {
            id: 'p18-b',
            src: 'T06-135',
            text: 'LLM không đọc ký tự hay đọc word by word; đơn vị đầu vào của nó là token.'
          }
        ],
        tutorAnswer: {
          text: 'LLM đọc token, không đọc từng từ theo cách con người nhìn câu. Một từ có thể được tách thành nhiều token, vì vậy phát biểu “một từ bằng một token” không đúng.',
          citations: [18],
          confidence: 0.94
        },
        microCheck: {
          question: 'Nói lại trong một câu: phát biểu “một từ tương ứng một token” đúng hay sai, và vì sao?',
          keyPoints: [
            { id: 'sai', label: 'kết luận là sai', kw: ['sai', 'không đúng', 'không phải', 'chưa đúng'] },
            { id: 'nhieu-token', label: 'một từ có thể thành nhiều token', kw: ['nhiều token', 'nhiều hơn một', '2 token', '3 token', 'ba token', 'hai token'] },
            { id: 'tieng-viet', label: 'có ví dụ hoặc nhắc tiếng Việt', kw: ['tiếng việt', 'hello world', 'xin chào', 'tiếng anh'] }
          ],
          misconceptions: [
            {
              id: 'mot-tu-mot-token',
              kw: ['đúng', 'chính xác', 'phải rồi'],
              notKw: ['sai', 'không đúng', 'không phải', 'chưa đúng'],
              gap: 'Một từ không luôn tương ứng đúng một token.',
              reinforce: 'Hãy dùng ví dụ “Xin chào Việt Nam” để kiểm tra lại kết luận.'
            },
            {
              id: 'doc-ky-tu',
              kw: ['đọc ký tự', 'từng chữ cái', 'từng ký tự'],
              gap: 'LLM đọc token chứ không đọc từng ký tự.',
              reinforce: 'Token là đơn vị được tokenizer tạo ra từ văn bản.'
            }
          ]
        }
      }
    ]
  },
  {
    docCode: 'Lecture_material_day02_hackathon',
    materialId: 'material_day02_hackathon',
    docTitle: 'day02_302.pdf',
    courseCode: 'COMP2010',
    day: 'Day02',
    pageCount: 29,
    pdfUrl: 'data/vlearn-pack/slides/d2-slide-hackathon.pdf',
    transcript: 'transcript-01-clean.md',
    note: 'Xác định bài toán cho AI · bản hackathon',
    pages: [
      {
        page: 6,
        heading: 'Nút thắt và chỉ số thành công',
        passages: [
          {
            id: 'p6-b',
            src: 'T02-015',
            text: 'Nút thắt mô tả chỗ đang tắc trong hiện trạng; chỉ số thành công là ngưỡng đo được sau khi giải quyết.'
          }
        ],
        tutorAnswer: {
          text: 'Nút thắt trả lời “quy trình đang đau ở đâu”, còn chỉ số thành công trả lời “đạt bao nhiêu thì gọi là xong”. Ví dụ hiện mất 30 phút là hiện trạng; dưới 5 phút là ngưỡng thành công.',
          citations: [6],
          confidence: 0.9
        },
        microCheck: {
          question: 'Nói lại một câu: “chỉ số thành công” khác “nút thắt” ở chỗ nào?',
          keyPoints: [
            { id: 'nut-that-hien-trang', label: 'nút thắt là hiện trạng', kw: ['hiện tại', 'đang tắc', 'hiện trạng', 'chỗ tắc', 'đang vướng', 'đang đau'] },
            { id: 'csn-sau-khi-giai', label: 'chỉ số thành công là mục tiêu sau khi giải', kw: ['sau khi', 'mục tiêu', 'đích', 'kết quả mong muốn', 'trạng thái sau'] },
            { id: 'co-so', label: 'chỉ số phải đo được', kw: ['con số', 'đo được', 'định lượng', 'phút', 'ngưỡng', '%', 'phần trăm'] }
          ],
          misconceptions: [
            {
              id: 'coi-la-mot',
              kw: ['giống nhau', 'như nhau', 'cùng là', 'không khác', 'là một'],
              gap: 'Nút thắt và chỉ số thành công là hai phần khác nhau.',
              reinforce: 'Một bên mô tả hiện trạng, một bên mô tả ngưỡng kết quả sau cải tiến.'
            }
          ]
        }
      },
      {
        page: 7,
        heading: 'Thang mức tự động hoá',
        passages: [
          {
            id: 'p7-a',
            src: 'T02-016',
            text: 'Bài toán có thể không cần AI, chỉ cần quy tắc, dùng AI ở một số nút hoặc để AI giải toàn bộ.'
          }
        ],
        tutorAnswer: {
          text: 'Mức tự động hoá nên phụ thuộc vào chi phí khi AI sai. Với đánh giá hiểu bài, AI nên đề xuất và học viên vẫn có quyền sửa, thử lại hoặc không đồng ý.',
          citations: [7],
          confidence: 0.88
        },
        microCheck: {
          question: 'Với tính năng đánh giá học viên hiểu đúng chưa, bạn chọn mức tự động hoá nào và vì sao?',
          keyPoints: [
            { id: 'augment', label: 'AI đề xuất, người quyết', kw: ['đề xuất', 'gợi ý', 'augment', 'người quyết', 'học viên quyết', 'không tự quyết', 'ở một số nút'] },
            { id: 'cost-of-error', label: 'lý do theo chi phí khi sai', kw: ['sai thì', 'học sai', 'kiến thức sai', 'đắt', 'hậu quả', 'mất niềm tin', 'rủi ro'] },
            { id: 'quyen-bo-qua', label: 'giữ quyền phản đối hoặc bỏ qua', kw: ['bỏ qua', 'phản đối', 'không đồng ý', 'sửa lại', 'từ chối'] }
          ],
          misconceptions: [
            {
              id: 'automate-het',
              kw: ['để ai quyết', 'tự động hoàn toàn', 'ai chấm điểm', 'ai làm hết', 'automate hoàn toàn', 'ai tự kết luận'],
              notKw: ['không nên', 'không được', 'tránh'],
              gap: 'Tự động hoàn toàn là mức quá cao cho quyết định có chi phí sai lớn.',
              reinforce: 'Giữ AI ở vai trò đề xuất và để học viên quyết định bước tiếp theo.'
            }
          ]
        }
      }
    ]
  },
  {
    docCode: 'New learning material',
    docTitle: 'New learning material',
    courseCode: 'COMP2010',
    day: 'Khác',
    pageCount: 3,
    pdfUrl: null,
    note: 'Fixture thiếu nguồn để kiểm thử Grounding Gate.',
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

window.VLEARN_SUGGESTED = {
  15: ['Self-attention hoạt động thế nào?', 'Q, K, V là gì?'],
  18: ['Token là gì?', 'Vì sao tiếng Việt tốn nhiều token hơn?'],
  6: ['Nút thắt khác chỉ số thành công thế nào?'],
  7: ['Nên chọn mức tự động hoá nào cho Micro-Check?'],
  3: ['Giải thích nội dung trang này']
};
