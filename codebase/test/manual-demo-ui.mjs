import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const app = readFileSync(join(ROOT, 'app.js'), 'utf8');

assert.doesNotMatch(html, /data-scenario|Demo console|tình huống kiểm thử/i);
assert.doesNotMatch(app, /SCENARIOS|runScenario|data-scenario/);

assert.match(html, /data-doc="Lecture_material_ms2039d0_hnxpxy"/);
assert.match(html, /data-doc="Lecture_material_day02_hackathon"/);
assert.match(html, /VLearn Tutor/);
assert.match(html, /Hiểu Đúng, Hiểu Thật/);
assert.match(app, /Kiểm tra tôi · 30 giây/);
assert.match(app, /selectDefaultContext/);

console.log('Manual demo UI contract: 8 assertions passed.');
