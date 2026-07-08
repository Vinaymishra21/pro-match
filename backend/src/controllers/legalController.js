// Serves the Terms of Service and Privacy Policy as public, mobile-friendly
// HTML pages (from the Markdown in src/legal/). These URLs double as the
// store-submission privacy/terms links, so they must stay public (no auth).
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const LEGAL_DIR = path.join(__dirname, '..', 'legal');

// Render once, then cache in memory (the docs don't change between deploys).
const cache = {};

function pageShell(title, bodyHtml) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="index, follow" />
<title>${title} · Wovnn</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #faf6f0;
    color: #231a2f;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.65;
    -webkit-text-size-adjust: 100%;
  }
  .wrap { max-width: 720px; margin: 0 auto; padding: 28px 20px 72px; }
  .brand { display: flex; align-items: center; gap: 10px; padding: 6px 0 18px; border-bottom: 1px solid #e8e0d8; margin-bottom: 24px; }
  .brand .dot { width: 26px; height: 26px; border-radius: 8px; background: linear-gradient(135deg, #E8415A, #C0305F); }
  .brand .name { font-weight: 800; font-size: 18px; letter-spacing: -0.02em; }
  h1 { font-size: 26px; line-height: 1.25; letter-spacing: -0.02em; margin: 8px 0 6px; }
  h2 { font-size: 19px; margin: 30px 0 8px; letter-spacing: -0.01em; }
  h3 { font-size: 16px; margin: 22px 0 6px; }
  p, li { font-size: 15.5px; }
  a { color: #C42B48; }
  ul, ol { padding-left: 22px; }
  li { margin: 4px 0; }
  hr { border: none; border-top: 1px solid #e8e0d8; margin: 28px 0; }
  blockquote {
    margin: 18px 0; padding: 12px 16px; border-left: 3px solid #E8415A;
    background: #fbeff0; border-radius: 8px; color: #5a4a55;
  }
  strong { font-weight: 700; }
  code { background: #efe7df; padding: 1px 5px; border-radius: 4px; font-size: 90%; }
  footer { margin-top: 40px; padding-top: 18px; border-top: 1px solid #e8e0d8; color: #8a7f88; font-size: 13px; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="brand"><span class="dot"></span><span class="name">Wovnn</span></div>
    ${bodyHtml}
    <footer>Wovnn · Questions? <a href="mailto:wovnnsupport@gmail.com">wovnnsupport@gmail.com</a></footer>
  </div>
</body>
</html>`;
}

function renderDoc(fileBase, title) {
  if (!cache[fileBase]) {
    const md = fs.readFileSync(path.join(LEGAL_DIR, `${fileBase}.md`), 'utf8');
    cache[fileBase] = pageShell(title, marked.parse(md));
  }
  return cache[fileBase];
}

function serve(fileBase, title) {
  return (_req, res) => {
    try {
      res.set('Content-Type', 'text/html; charset=utf-8');
      res.send(renderDoc(fileBase, title));
    } catch (err) {
      res.status(500).send('Unable to load this document. Please contact wovnnsupport@gmail.com.');
    }
  };
}

module.exports = {
  terms: serve('terms-of-service', 'Terms of Service'),
  privacy: serve('privacy-policy', 'Privacy Policy')
};
