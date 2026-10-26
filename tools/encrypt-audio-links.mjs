// Encrypts the list of recording links so the site can show it only after login.
// Usage: AUDIO_LOGIN=… AUDIO_PASSWORD=… node tools/encrypt-audio-links.mjs [links.json] [out.js]
// links.json: { "base": "https://…/", "en": { "day1": "<uuid>", … }, "ru": { … } } (kept in private/, outside git)
// out.js:     window.AUDIO_LOCK = { … } — only salt, iv and ciphertext; safe to publish
import fs from 'node:fs';
import crypto from 'node:crypto';

const [src = 'private/dhamma-recordings.json', out = 'docs/js/audio-lock.js'] = process.argv.slice(2);
const login = process.env.AUDIO_LOGIN, password = process.env.AUDIO_PASSWORD;
if (!login || !password) {
  console.error('Set AUDIO_LOGIN and AUDIO_PASSWORD');
  process.exit(1);
}

const list = JSON.parse(fs.readFileSync(src, 'utf8'));
const links = {};
for (const lang of ['en', 'ru']) {
  links[lang] = {};
  for (const [day, uuid] of Object.entries(list[lang] || {})) links[lang][day] = list.base + uuid + '.mp3';
}

// Same derivation as the browser: PBKDF2-SHA-256 over "login:password", then AES-256-GCM
const ITER = 250000;
const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(login.trim().toLowerCase() + ':' + password, salt, ITER, 32, 'sha256');
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const data = Buffer.concat([cipher.update(JSON.stringify(links), 'utf8'), cipher.final(), cipher.getAuthTag()]);

const lock = { v: 1, iter: ITER, salt: salt.toString('base64'), iv: iv.toString('base64'), data: data.toString('base64') };
fs.writeFileSync(out, '// Encrypted list of recording links (see tools/encrypt-audio-links.mjs)\nwindow.AUDIO_LOCK = ' + JSON.stringify(lock) + ';\n');

// round trip, so a broken file is never written silently
const d = crypto.createDecipheriv('aes-256-gcm', key, iv);
d.setAuthTag(data.subarray(data.length - 16));
const back = JSON.parse(Buffer.concat([d.update(data.subarray(0, data.length - 16)), d.final()]).toString('utf8'));
console.log('Wrote', out, '·', Object.keys(back.en).length, 'EN and', Object.keys(back.ru).length, 'RU links');
