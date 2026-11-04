// AEGIS website: put the real AEGIS logo (shield above the wordmark) at the top left of every page.
// Safe to run twice. Run from the aegis-website folder (the one with index.html):  node patch-logo.js
// Uses the logo-full.png your site already has (the same picture as the home page hero).
// Undo: git checkout -- .   (then delete logo.css)
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
const die = (m) => { console.log('\nSTOPPED. Nothing was changed.\n' + m + '\n'); process.exit(1); };
const files = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
if (!files.length || !files.includes('index.html')) die('Run this from inside the aegis-website folder (the one that has index.html).');

const BRAND = /(<header class="hdr"><div class="wrap">)<a class="brand" href="\/"><img src="\/logo-mark\.png"[^>]*><span>AEGIS<small>PROP TECH<\/small><\/span><\/a>/g;
const NEWBRAND = '$1<a class="brand brandfull" href="/" aria-label="AEGIS PROP TECH home"><img src="/logo-full.png" alt="AEGIS PROP TECH" width="81" height="46"></a>';
const CSS = '/* AEGIS-LOGOFULL: real logo at the top left */\n.hdr .brandfull{display:flex;align-items:center}\n.hdr .brandfull img{height:46px;width:auto;display:block}\n@media(max-width:480px){.hdr .brandfull img{height:42px}}\n';
const LINK = '<link rel="stylesheet" href="/logo.css">';

const out = {}; const done = []; const skipped = [];
for (const f of files) {
  const raw = fs.readFileSync(path.join(ROOT, f), 'utf8');
  if (raw.includes('brandfull')) { done.push(f); continue; }
  const n = (raw.match(BRAND) || []).length;
  if (n === 0) { skipped.push(f); continue; }
  if (n > 1) die(f + ' has the top-left logo more than once. Send ' + f + ' to Claude.');
  if (!raw.includes('</head>')) die(f + ' has no </head>. Send ' + f + ' to Claude.');
  let t = raw.replace(BRAND, NEWBRAND);
  if (!t.includes(LINK)) t = t.replace('</head>', LINK + '\n</head>');
  out[f] = t;
}
if (!Object.keys(out).length) {
  console.log('\nNothing to change.' + (done.length ? ' Already done on: ' + done.join(', ') : '') + (skipped.length ? '\nNot touched (no top-left logo found): ' + skipped.join(', ') : '') + '\n');
  process.exit(0);
}
fs.writeFileSync(path.join(ROOT, 'logo.css'), CSS);
for (const f in out) fs.writeFileSync(path.join(ROOT, f), out[f]);
console.log('\nDone. Real logo now at the top left on: ' + Object.keys(out).join(', '));
if (done.length) console.log('Already had it: ' + done.join(', '));
if (skipped.length) console.log('Not touched (no top-left logo found): ' + skipped.join(', '));
console.log('\nNext: commit and push (git add -A, git commit, git push) so Vercel updates the site.\n');
