import assert from 'node:assert/strict';
import {
  DEBOUNCE_DELAY,
  fitWithin,
  pageElementId
} from '../engine/pdf-reader.mjs';

assert.deepEqual(fitWithin(2400, 1350, 1600), {
  width: 1600,
  height: 900,
  scale: 2 / 3
});

assert.deepEqual(fitWithin(800, 600, 1600), {
  width: 800,
  height: 600,
  scale: 1
});

assert.equal(DEBOUNCE_DELAY, 250);
assert.equal(pageElementId(12), 'pdf-page-12');
assert.throws(() => fitWithin(0, 600, 1600), /kích thước/i);

console.log('PdfReader helper tests: 5 assertions passed.');
