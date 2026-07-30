import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const window = {};
const source = readFileSync(join(ROOT, 'engine/page-context.js'), 'utf8');
new Function('window', source)(window);

const PageContext = window.PageContext;

assert.equal(PageContext.chooseActivePage([
  { pageNumber: 5, ratio: 0.35, center: 300 },
  { pageNumber: 6, ratio: 0.80, center: 520 }
], 500), 6);

assert.equal(PageContext.chooseActivePage([
  { pageNumber: 6, ratio: 0.50, center: 300 },
  { pageNumber: 7, ratio: 0.50, center: 480 }
], 500), 7);

assert.equal(PageContext.chooseActivePage([], 500), null);
assert.equal(PageContext.sourceId('day02', 6), 'day02:page-6');

const text = 'Nút thắt và chỉ số thành công';
const frozen = PageContext.freeze({
  documentCode: 'day02',
  documentTitle: 'Xác định bài toán AI',
  pageNumber: 6,
  pageCount: 29,
  text,
  imageDataUrl: 'data:image/jpeg;base64,AAAA',
  imageBytes: 4,
  width: 1200,
  height: 675
});

assert.equal(Object.isFrozen(frozen), true);
assert.equal(frozen.sourceId, 'day02:page-6');
assert.deepEqual(PageContext.safeTrace(frozen), {
  document_code: 'day02',
  page: 6,
  source_id: 'day02:page-6',
  text_length: text.length,
  image_bytes: 4,
  width: 1200,
  height: 675
});
assert.equal('imageDataUrl' in PageContext.safeTrace(frozen), false);

assert.throws(() => PageContext.freeze({
  documentCode: 'day02',
  pageNumber: 30,
  pageCount: 29,
  text: '',
  imageDataUrl: 'data:image/jpeg;base64,AAAA',
  imageBytes: 4,
  width: 1200,
  height: 675
}), /trang/i);

assert.throws(() => PageContext.freeze({
  documentCode: 'day02',
  pageNumber: 6,
  pageCount: 29,
  text: '',
  imageDataUrl: 'data:text/plain;base64,AAAA',
  imageBytes: 4,
  width: 1200,
  height: 675
}), /ảnh/i);

console.log('PageContext tests: 10 assertions passed.');
