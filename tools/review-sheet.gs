/**
 * @OnlyCurrentDoc
 * Review log for the Mahāsatipaṭṭhāna site. Every save in the review mode (?review) adds a row to the sheet "edits";
 * the newest row for a line and language is its current state. Nothing is overwritten, so the history stays.
 *
 * Setup (in the Google Sheet): Extensions → Apps Script → paste this file → Project Settings → Script properties:
 * KEY = the review key → Deploy → New deployment → Web app, Execute as: Me, Who has access: Anyone → send the /exec URL.
 * The site gets the URL and the key only after the old-student login (they are encrypted in js/audio-lock.js).
 */
const SHEET = 'edits';
const COLS = ['time', 'name', 'lang', 'line', 'status', 'cue', 'comment', 'action', 'client'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.getRange('A:I').setNumberFormat('@');   // plain text: keeps line ids like 1.10 from turning into numbers
    sh.appendRow(COLS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function keyOk_(k) {
  const key = PropertiesService.getScriptProperties().getProperty('KEY');
  return !!key && k === key;
}

// text as typed; a leading = + - @ would make the sheet read it as a formula
const text_ = (v, max) => {
  const s = String(v == null ? '' : v).slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
};

function doGet(e) {
  if (!keyOk_(e.parameter.key)) return out_({ error: 'key' });
  const values = sheet_().getDataRange().getValues();
  const head = values.shift();
  return out_({ rows: values.map(r => Object.fromEntries(head.map((h, i) => [h, String(r[i])]))) });
}

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return out_({ error: 'json' }); }
  if (!keyOk_(d.key)) return out_({ error: 'key' });
  if (!/^(en|ru)$/.test(d.lang) || !/^[\w.]{1,20}$/.test(String(d.line))) return out_({ error: 'fields' });
  const time = new Date().toISOString();
  const row = [time, text_(d.name, 80), d.lang, String(d.line), text_(d.status, 20), text_(d.cue, 4000),
    text_(d.comment, 4000), text_(d.action, 20), text_(d.client, 40)];
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try { sheet_().appendRow(row); } finally { lock.releaseLock(); }
  return out_({ ok: true, time });
}
