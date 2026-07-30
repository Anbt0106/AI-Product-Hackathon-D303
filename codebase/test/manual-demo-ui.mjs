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
assert.match(app, /answerTutor/);
assert.match(app, /retryFailedStep/);
assert.match(app, /data-action="retry-ai"/);
assert.match(app, /AI đang trả lời/);
assert.match(app, /Không thể tự chuyển sang mock/);
assert.match(html, /aria-live="polite"/);
assert.doesNotMatch(app, /classifyMock|generateMock|_fallback/);
assert.doesNotMatch(app, /ARCHIVED_FIXTURES|archivedFixture|prefill|forceCrossPage|shiftCitations/);
assert.doesNotMatch(app, /happy:\s*\{|misconception:\s*\{|no-source:\s*\{|cross-page:\s*\{/);

console.log('Manual demo UI contract: 17 assertions passed.');
