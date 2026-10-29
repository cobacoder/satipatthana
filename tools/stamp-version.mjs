// Puts a version (a hash of the scripts) into the script links of docs/index.html, so a browser takes the new files
// right after a release instead of its cached copies (GitHub Pages lets them be cached for 10 minutes).
// app.js passes the same version on to the scripts it loads itself. Run before each commit:
//   node tools/stamp-version.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const docs = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs');
const files = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.js')) files.push(p);
  }
})(path.join(docs, 'js'));

const hash = crypto.createHash('sha1');
for (const f of files) hash.update(path.relative(docs, f) + '\n').update(fs.readFileSync(f));
const v = hash.digest('hex').slice(0, 8);

const index = path.join(docs, 'index.html');
const html = fs.readFileSync(index, 'utf8');
let n = 0;
const out = html.replace(/(<script src="js\/[^"?]+\.js)(\?v=[0-9a-f]+)?"/g, (m, src) => { n++; return `${src}?v=${v}"`; });
fs.writeFileSync(index, out);
console.log(`version ${v} · ${n} script links · ${files.length} files hashed`);
