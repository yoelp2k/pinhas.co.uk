const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'cbt/index.html'), 'utf8');

test('CBT flyer preserves the agreed offer and working contact destinations', () => {
  assert.match(page, /<html lang="he" dir="rtl">/);
  for (const text of ['18+', 'כ־20 שנות ניסיון', 'שנה ב׳', 'אוניברסיטת בר־אילן ותל השומר', 'בהדרכה מקצועית', 'לרוב 10 עד 12 מפגשים ומעלה', 'מחיר מוזל', 'https://wa.me/972507870635', 'tel:+972507870635', 'mailto:maly.pinhas@gmail.com']) assert.ok(page.includes(text), text);
  assert.equal((page.match(/<li>/g) || []).length, 4);
  assert.doesNotMatch(page, /<script\b|<iframe\b|href="https?:[^\"]+\.css/i);
});

test('CBT local assets exist and the page is included in deployment', () => {
  for (const match of page.matchAll(/(?:src|href)="([^"#:]+)"/g)) {
    if (/^(https?:|mailto:|tel:)/.test(match[1])) continue;
    assert.ok(fs.existsSync(path.resolve(root, 'cbt', match[1])), match[1]);
  }
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8');
  assert.match(workflow, /cp cbt\/index\.html cbt\/style\.css _site\/cbt\//);
});
