const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const english = JSON.parse(fs.readFileSync(path.join(root, 'en.json'), 'utf8'));
const hebrew = JSON.parse(fs.readFileSync(path.join(root, 'he.json'), 'utf8'));
const englishPage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const hebrewPage = fs.readFileSync(path.join(root, 'he', 'index.html'), 'utf8');
const stylesheet = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'pages.yml'), 'utf8');

function idsIn(html) {
  return [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
}

function flattenStrings(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(flattenStrings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(flattenStrings);
  return [];
}

function renderedText(html) {
  return html
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/?(?:bdi|strong|span)\b[^>]*>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function assertContentIsRendered(html, content) {
  const text = renderedText(html);
  for (const value of flattenStrings(content)) {
    const normalized = value.replace(/\s+/g, ' ').trim();
    assert.ok(text.includes(normalized) || html.includes(value), `Missing content: ${value}`);
  }
}

test('both locales render their complete structured content', () => {
  assert.match(englishPage, /<html lang="en" dir="ltr">/);
  assert.match(hebrewPage, /<html lang="he" dir="rtl">/);
  assertContentIsRendered(englishPage, english);
  assertContentIsRendered(hebrewPage, hebrew);
});

test('language navigation uses stable locale URLs and marks the current page', () => {
  assert.match(englishPage, /<a href="he\/" lang="he" hreflang="he">עברית<\/a>/);
  assert.match(hebrewPage, /<a href="\.\.\/" lang="en" hreflang="en">EN<\/a>/);
  assert.equal((englishPage.match(/aria-current="page"/g) || []).length, 1);
  assert.equal((hebrewPage.match(/aria-current="page"/g) || []).length, 1);
});

test('every in-page link has a real destination', () => {
  for (const html of [englishPage, hebrewPage]) {
    const ids = new Set(idsIn(html));
    const fragments = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
    for (const fragment of fragments) assert.equal(ids.has(fragment), true, `Missing #${fragment}`);
  }
});

test('locale pages remain structurally equivalent and accessible', () => {
  assert.deepEqual(idsIn(englishPage), idsIn(hebrewPage));

  for (const html of [englishPage, hebrewPage]) {
    const ids = idsIn(html);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal((html.match(/<img\b/g) || []).length, 5);
    assert.match(html, /maly-portrait\.webp/);
    assert.match(html, /linkedin-in\.png/);
    assert.match(html, /whatsapp-mark\.png/);
    assert.match(html, /<main id="main-content">/);
    assert.match(html, /href="#main-content"/);
    assert.match(html, /rel="canonical" href="https:\/\/maly\.pinhas\.co\.uk/);
    assert.doesNotMatch(html, /rel="(?:canonical|alternate)"[^>]+my-ot\.eu/);
    assert.match(html, /hreflang="en"/);
    assert.match(html, /hreflang="he"/);
  }
});

test('contact details and professional profile are current in both languages', () => {
  for (const html of [englishPage, hebrewPage]) {
    assert.match(html, /mailto:maly@pinhas\.co\.uk/);
    assert.match(html, /https:\/\/wa\.me\/972507870635/);
    assert.match(html, /class="button button-secondary whatsapp-button" href="https:\/\/wa\.me\/972507870635"/);
    assert.match(html, /https:\/\/www\.linkedin\.com\/in\/malypinhas\//);
    assert.doesNotMatch(html, /18\+/);
    assert.doesNotMatch(html, /17\+/);
    assert.doesNotMatch(html, /—/);
    assert.doesNotMatch(html, /maly@my-ot\.eu/);
  }

  assert.match(englishPage, /Over 18 years of clinical experience/);
  assert.match(hebrewPage, /למעלה מ־18 שנות ניסיון קליני/);
  assert.match(englishPage, /Maly Pinhas, M\.Sc\./);
  assert.match(hebrewPage, /מלי פנחס, <bdi>M\.Sc\.<\/bdi>/);
  assert.equal(fs.existsSync(path.join(root, 'linkedin-in.png')), true);
  assert.equal(fs.existsSync(path.join(root, 'whatsapp-mark.png')), true);
});

test('calls to action match their destinations', () => {
  assert.match(englishPage, /<a class="button" href="#fit">Who this treatment is for<\/a>/);
  assert.match(hebrewPage, /<a class="button" href="#fit">למי הטיפול מתאים<\/a>/);

  for (const html of [englishPage, hebrewPage]) {
    assert.match(html, /<section class="challenge" id="fit"/);
    assert.match(html, /class="contact-whatsapp" href="https:\/\/wa\.me\/972507870635"><img[^>]+whatsapp-mark\.png/);
    assert.match(html, /class="footer-linkedin" href="https:\/\/www\.linkedin\.com\/in\/malypinhas\/"[^>]*><img[^>]+linkedin-in\.png/);
    assert.doesNotMatch(html, /href="#contact">(?:Check whether this is right for you|לבדיקת התאמה)<\/a>/);
  }
});

test('the site remains privacy-first and dependency-free', () => {
  for (const html of [englishPage, hebrewPage]) {
    assert.doesNotMatch(html, /<script\b/i);
    assert.doesNotMatch(html, /document\.cookie|analytics\.js|gtag\(|facebook\.net/i);
    assert.doesNotMatch(html, /<link[^>]+rel="stylesheet"[^>]+href="https?:/i);
    assert.doesNotMatch(html, /<iframe\b/i);
  }

  assert.equal(fs.existsSync(path.join(root, 'maly-portrait.jpg')), false);
  assert.equal(fs.existsSync(path.join(root, 'maly-portrait.webp')), true);
});

test('the design is responsive and respects reduced motion', () => {
  assert.match(stylesheet, /@media \(max-width: 680px\)/);
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(stylesheet, /:focus-visible/);
  assert.match(stylesheet, /\.portrait\s*\{[^}]*height:\s*auto/s);
  assert.match(stylesheet, /\.portrait-area figcaption\s*\{[^}]*width:\s*max-content[^}]*max-width:\s*none[^}]*white-space:\s*nowrap/s);
  assert.match(stylesheet, /@media \(max-width: 680px\)[\s\S]*\.portrait-area figcaption\s*\{[^}]*white-space:\s*normal/s);
  assert.match(stylesheet, /@media \(max-width: 680px\)[\s\S]*\.hero-actions\s*\{[^}]*align-items:\s*stretch[^}]*width:\s*min\(100%, 23rem\)/s);
  assert.match(stylesheet, /\.hero-actions \.button\s*\{[^}]*width:\s*100%/s);
});

test('deployment targets GitHub Pages and runs tests first', () => {
  assert.match(workflow, /actions\/configure-pages@v5/);
  assert.match(workflow, /actions\/upload-pages-artifact@v4/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /needs: test/);
  assert.match(workflow, /linkedin-in\.png/);
  assert.match(workflow, /whatsapp-mark\.png/);
  assert.doesNotMatch(workflow, /azure/i);
  assert.equal(fs.existsSync(path.join(root, 'CNAME')), false);
});
