import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../app.css', import.meta.url), 'utf8');

assert.match(app, /AI đã trả lời xong\. Bạn đã thật sự hiểu\?/);
assert.match(app, /Teach-back một câu để kiểm tra, không tính điểm\./);
assert.match(app, /partial: 'Có ý đúng nhưng còn thiếu ít nhất một ý quan trọng\.'/);
assert.match(app, /misconception: 'Có chi tiết đúng nhưng đang hiểu sai/);
assert.match(app, /insufficient: 'Chưa đủ bằng chứng để đánh giá/);
assert.match(app, /Điểm cần sửa:/);
assert.match(app, /Vì sao chưa đủ:/);
assert.match(css, /border-left: 4px solid var\(--brand\)/);
assert.match(css, /\.btn-check[^}]*padding: 10px 17px/s);

console.log('CP5 feedback UI: CTA nổi bật và giải nghĩa mastery — đạt');
