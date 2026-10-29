// Review mode (?review): checking and correcting the audio fragment of every line, together with other reviewers.
// Each save adds a row to a shared Google Sheet (tools/review-sheet.gs); the newest row for a line and language is
// its current state, and the history stays. Until the sheet is linked, saves stay in this browser.
// Any line can be brought back to the automatic marking from the transcripts (js/audio-auto.js).
// The interface follows the site's language switch, which also picks the recording under review.
(() => {
  'use strict';
  const M = window.MSPM, CUES = window.CUES, AUTO = window.CUES_AUTO || { en: {}, ru: {} };
  if (!M) return;
  const BASE = JSON.parse(JSON.stringify(CUES));            // what the site plays now, before review edits
  const $ = id => document.getElementById(id);
  const mk = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const btn = (text, cls, onClick, label) => {
    const b = mk('button', cls || 'rv-b', text);
    b.type = 'button';
    if (label) b.setAttribute('aria-label', label);
    if (onClick) b.addEventListener('click', onClick);
    return b;
  };
  const store = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  // 'm:ss.s', 'h:mm:ss' or seconds; anything else is NaN
  const toSec = v => {
    const parts = String(v).trim().replace(',', '.').split(':');
    if (parts.length > 3 || parts.some(x => !/^\d+(\.\d+)?$/.test(x))) return NaN;
    return parts.map(Number).reduce((a, b) => a * 60 + b, 0);
  };
  const fmt = s => {
    s = Math.max(0, Math.round(s * 10) / 10);
    const m = Math.floor(s / 60), r = s - m * 60;
    return m + ':' + (r < 10 ? '0' : '') + r.toFixed(1);
  };
  const dur = s => { s = Math.round(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const pieces = c => !c ? [] : (Array.isArray(c[0]) ? c : [c]).map(p => p.slice());
  const pack = ps => ps.length === 1 ? ps[0] : ps;
  const same = (a, b) => JSON.stringify(pieces(a)) === JSON.stringify(pieces(b));
  const lang = () => M.state().lang;

  // ---------- the words of the interface ----------
  const UI = {
    ru: {
      status: { '': 'Не проверено', ok: 'Верно', fix: 'Нужна правка', none: 'Пояснения нет' },
      day: n => 'день ' + n,
      days: { 'day7-qa1': 'день 7, вопросы', 'day8-qa2': 'день 8, вопросы', 'day9-closing': 'день 9, заключение' },
      locale: 'ru',
      num: x => String(x).replace('.', ','),
      title: 'Проверка таймкодов',
      loginHint: 'Войдите как старый студент, чтобы слушать и сохранять.',
      login: 'Войти',
      you: 'Вы: ', noName: 'Имя не указано', change: 'изменить', setName: 'указать',
      askName: 'Как подписать ваши правки? Имя увидят другие проверяющие.',
      progress: (l, done, n, fix) => `${l}: проверено ${done} из ${n}` + (fix ? `, нужна правка ${fix}` : ''),
      fetching: 'Загружаю правки…', updated: 'Обновлено ', refresh: 'обновить',
      localOnly: 'Таблица ещё не подключена: правки сохраняются только в этом браузере.',
      loadErr: 'Не удалось загрузить правки из таблицы.',
      saving: 'Сохраняю…', saved: 'Сохранено.',
      saveErr: 'Не сохранилось. Проверьте интернет и нажмите «Сохранить» ещё раз.',
      of: ' из ', loading: 'запись загружается…',
      paused: (w, at) => `${w}: пауза на ${at}. «Начало здесь» и «конец здесь» возьмут это место.`,
      playing: (w, at) => `${w}: слушаю ${at}`, until: t => ` (до ${t})`,
      cont: '▶ продолжить', pause: '❚❚ пауза', piece: 'Кусок', pieceLc: 'кусок',
      scrub: 'Место во всей записи дня',
      back10: ['−10 с', 'На 10 секунд назад'], fwd10: ['+10 с', 'На 10 секунд вперёд'], close: 'закрыть',
      card: 'Проверка строки', discarded: 'Изменения отменены.',
      start: 'Начало', end: 'Конец', ofPiece: (what, i) => `${what} куска ${i}`,
      later: 'позже на', earlier: 'раньше на', sec: 'с',
      around: '▶ стык', aroundL: isStart => 'Послушать вокруг ' + (isStart ? 'начала' : 'конца'),
      before: ['▶ до начала', 'Послушать 30 секунд до начала'],
      after: ['▶ после конца', 'Слушать дальше конца, без остановки'],
      startHere: 'начало здесь', endHere: 'конец здесь',
      hereNone: 'Сначала включите этот кусок («▶ стык» или весь фрагмент), потом нажмите в нужный момент.',
      hereWait: 'Запись ещё загружается. Нажмите, когда услышите нужное место.',
      line: id => id === '0' ? 'Строка 0 (название)' : 'Строка ' + id,
      rec: { en: 'английская запись', ru: 'русская запись' },
      closeCard: 'Закрыть проверку', loginCard: 'Чтобы слушать и править, войдите как старый студент.',
      statusL: 'Состояние строки', recOf: i => 'Запись куска ' + i,
      whole: ['▶ кусок целиком', i => `Послушать кусок ${i} от начала до конца`],
      remove: ['убрать', i => 'Убрать кусок ' + i],
      noAudio: 'У строки нет аудио.', add: '+ добавить кусок',
      comment: 'Комментарий: что не так, что добавить, замечание о переводе',
      save: 'Сохранить', fragment: '▶ весь фрагмент', discard: 'отменить изменения',
      autoBack: 'вернуть автоматическую разметку',
      autoMsg: 'Возвращена автоматическая разметка. Нажмите «Сохранить», чтобы она стала общей.',
      history: n => `история (${n})`,
      unsaved: 'Есть несохранённые изменения.', unsavedAuto: ' (автоматическая разметка)', unsavedRevert: ' (версия из истории)',
      savedAt: (when, who) => `Сохранено ${when}, ${who}`, noname: 'без имени',
      notChecked: 'Автоматическая разметка, ещё не проверялась.',
      count: n => ' · кусков: ' + n, auto: ' · автоматическая', quote: c => ' · «' + c + '»', restore: 'вернуть',
      // notes from the automatic marking
      long01: 'Фрагмент длится 24 минуты: вся история Первого собора и Ананды. Оставить целиком или сократить? Начало третьего дня (EN 0:11–4:13, RU 0:06–1:47) продолжает историю соборов — можно добавить.',
      long02: '15 минут: 2,5 минуты о месте беседы и 13 минут рассказа о стране Куру. Оставить целиком или сократить?',
      short05: 'Отдельного объяснения нет: сейчас 5 секунд перехода к беседе.',
      day1_20: 'В первом дне есть короткое упоминание ātāpī sampajāno satimā (EN 39:35–40:08, RU 23:27) — можно добавить первым куском.',
      twoDays: 'Два дня подряд: краткий разбор из второго дня и подробный из третьего. Оставить оба или только подробный?',
      pair: (a, b) => `Вдох и выдох объясняются вместе: у строк ${a} и ${b} общий фрагмент.`
    },
    en: {
      status: { '': 'Not checked', ok: 'Correct', fix: 'Needs a fix', none: 'No explanation' },
      day: n => 'day ' + n,
      days: { 'day7-qa1': 'day 7, questions', 'day8-qa2': 'day 8, questions', 'day9-closing': 'day 9, closing' },
      locale: 'en-GB',
      num: x => String(x),
      title: 'Timecode review',
      loginHint: 'Log in as an old student to listen and save.',
      login: 'Log in',
      you: 'You: ', noName: 'No name yet', change: 'change', setName: 'set',
      askName: 'How should your edits be signed? Other reviewers will see the name.',
      progress: (l, done, n, fix) => `${l}: ${done} of ${n} checked` + (fix ? `, ${fix} need a fix` : ''),
      fetching: 'Loading edits…', updated: 'Updated ', refresh: 'refresh',
      localOnly: 'The sheet is not linked yet: edits are kept in this browser only.',
      loadErr: 'Could not load the edits from the sheet.',
      saving: 'Saving…', saved: 'Saved.',
      saveErr: 'Not saved. Check the connection and press Save again.',
      of: ' of ', loading: 'the recording is loading…',
      paused: (w, at) => `${w}: paused at ${at}. “Start here” and “end here” will take this spot.`,
      playing: (w, at) => `${w}: listening at ${at}`, until: t => ` (until ${t})`,
      cont: '▶ continue', pause: '❚❚ pause', piece: 'Piece', pieceLc: 'piece',
      scrub: 'Position in the whole recording of the day',
      back10: ['−10 s', '10 seconds back'], fwd10: ['+10 s', '10 seconds forward'], close: 'close',
      card: 'Line review', discarded: 'Changes discarded.',
      start: 'Start', end: 'End', ofPiece: (what, i) => `${what} of piece ${i}`,
      later: 'later by', earlier: 'earlier by', sec: 's',
      around: '▶ around', aroundL: isStart => 'Listen around the ' + (isStart ? 'start' : 'end'),
      before: ['▶ before the start', 'Listen to 30 seconds before the start'],
      after: ['▶ past the end', 'Listen on past the end, without stopping'],
      startHere: 'start here', endHere: 'end here',
      hereNone: 'First play this piece (“▶ around” or the whole fragment), then press at the right moment.',
      hereWait: 'The recording is still loading. Press when you hear the right spot.',
      line: id => id === '0' ? 'Line 0 (the title)' : 'Line ' + id,
      rec: { en: 'English recording', ru: 'Russian recording' },
      closeCard: 'Close the review', loginCard: 'To listen and edit, log in as an old student.',
      statusL: 'Line status', recOf: i => 'Recording of piece ' + i,
      whole: ['▶ whole piece', i => `Listen to piece ${i} from start to end`],
      remove: ['remove', i => 'Remove piece ' + i],
      noAudio: 'This line has no audio.', add: '+ add a piece',
      comment: 'Comment: what is wrong, what to add, a note on the translation',
      save: 'Save', fragment: '▶ whole fragment', discard: 'discard changes',
      autoBack: 'back to the automatic marking',
      autoMsg: 'The automatic marking is back. Press Save to make it shared.',
      history: n => `history (${n})`,
      unsaved: 'There are unsaved changes.', unsavedAuto: ' (automatic marking)', unsavedRevert: ' (a version from the history)',
      savedAt: (when, who) => `Saved ${when}, ${who}`, noname: 'no name',
      notChecked: 'Automatic marking, not checked yet.',
      count: n => ' · pieces: ' + n, auto: ' · automatic', quote: c => ' · “' + c + '”', restore: 'restore',
      long01: 'This fragment is 24 minutes long: the whole story of the First Council and Ānanda. Keep it all or shorten it? The start of day 3 (EN 0:11–4:13, RU 0:06–1:47) continues the story of the councils — it could be added.',
      long02: '15 minutes: 2.5 minutes on the place of the discourse and 13 minutes on the Kuru country. Keep it all or shorten it?',
      short05: 'There is no separate explanation: for now, 5 seconds leading into the discourse.',
      day1_20: 'Day 1 has a short mention of ātāpī sampajāno satimā (EN 39:35–40:08, RU 23:27) — it could be added as the first piece.',
      twoDays: 'Two days in a row: the short explanation from day 2 and the detailed one from day 3. Keep both or only the detailed one?',
      pair: (a, b) => `Breathing in and out are explained together: lines ${a} and ${b} share one fragment.`
    }
  };
  const T = () => UI[lang()] || UI.en;
  const DAYS = ['day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7-qa1', 'day8-qa2', 'day9-closing'];
  const dayName = d => T().days[d] || T().day(d.slice(3));
  const when = iso => new Date(iso).toLocaleString(T().locale, { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });

  // notes from the automatic marking for both recordings; `first` marks a line to check first (Russian recording only)
  function bothNotes(t) {
    const n = { '1.01': t.long01, '1.02': t.long02, '1.05': t.short05 };
    for (let k = 12; k <= 22; k++) n['1.' + k] = t.twoDays;
    n['1.20'] += ' ' + t.day1_20;
    for (const [a, b] of [['1.31', '1.32'], ['1.37', '1.38'], ['1.39', '1.40']]) n[a] = n[b] = t.pair(a, b);
    return n;
  }
  const BOTH = { ru: bothNotes(UI.ru), en: bothNotes(UI.en) };
  const NOTES = {
    en: {},
    ru: {
      '0': { first: 1, text: 'Распознавание потеряло начало (0:03–0:30); начало фрагмента поставлено по записи.' },
      '1.06': { first: 1, text: 'Проверить первым: распознавание потеряло около минуты русской речи, начало второго куска (46:20.6) поставлено по паузе.' },
      '1.23': { first: 1, text: 'Распознавание потеряло русскую речь на 17:55–18:06, конец поставлен по паузе.' },
      '1.24': { first: 1, text: 'Распознавание потеряло русскую речь на 17:55–18:06, фрагмент поставлен по паузам.' }
    }
  };
  const notesFor = (l, id) => [NOTES[l][id], BOTH[l][id] && { text: BOTH[l][id] }].filter(Boolean);

  // ---------- state ----------
  const client = store.get('mspm-review-client') || Math.random().toString(36).slice(2, 10);
  store.set('mspm-review-client', client);
  let name = store.get('mspm-review-name') || '';
  let rows = [];                       // saved rows, oldest first
  const latest = {};                   // 'lang|line' → newest row
  const drafts = {};                   // 'lang|line' → unsaved { pieces, status, comment, action }
  let backend = null, loadedAt = null, loadFailed = false, busy = false, fetching = false;
  let open = null;                     // { lang, id, el } of the card
  const LOCAL = 'mspm-review-local';
  const key = (l, id) => l + '|' + id;

  // The sheet turns text that looks like a number or a date into one: 1.07 became 1 July, 1.20 became 1.2.
  // So a line id goes there as L1.07 and other text with a leading apostrophe (the sheet keeps it as text);
  // rows saved before that are read back as their line.
  const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
  function lineOf(v) {
    v = String(v).replace(/^L/, '');
    if (/^\d+\.\d$/.test(v)) return v + '0';
    const m = v.match(/^\w{3} (\w{3}) (\d{2}) \d{4}/);
    return m && MONTHS[m[1]] ? +m[2] + '.' + String(MONTHS[m[1]]).padStart(2, '0') : v;
  }
  const asText = v => v ? "'" + v : '';

  const savedCue = (l, id) => {
    const r = latest[key(l, id)];
    if (r) { try { return JSON.parse(r.cue || '[]'); } catch (e) {} }
    return pieces(BASE[l] && BASE[l][id]);
  };
  // what the player plays for a line: the draft, else the newest saved version
  function apply(l, id) {
    const d = drafts[key(l, id)], ps = d ? d.pieces : savedCue(l, id);
    CUES[l] = CUES[l] || {};
    if (ps.length) CUES[l][id] = pack(ps); else delete CUES[l][id];
  }
  function reindex() {
    for (const k in latest) delete latest[k];
    for (const r of rows) latest[key(r.lang, r.line)] = r;
    const ids = new Set([...Object.keys(latest), ...Object.keys(drafts)]);
    for (const l in BASE) for (const id in BASE[l]) ids.add(key(l, id));
    ids.forEach(k => { const [l, id] = k.split('|'); apply(l, id); });
  }

  // ---------- the shared sheet ----------
  async function load() {
    const links = M.links();
    backend = links && links.review || null;
    if (!links) { paint(); return; }
    fetching = true;
    paint();
    try {
      if (backend) {
        const res = await fetch(backend.url + '?key=' + encodeURIComponent(backend.key) + '&t=' + Date.now());
        const d = await res.json();
        if (d.error) throw new Error(d.error);
        rows = d.rows.map(r => ({ ...r, line: lineOf(r.line) }));
      } else rows = JSON.parse(store.get(LOCAL) || '[]');
      loadFailed = false;
      loadedAt = new Date();
    } catch (e) {
      loadFailed = true;
    }
    fetching = false;
    reindex();
    paint();
    if (open) renderCard();
  }

  async function save() {
    const d = drafts[key(open.lang, open.id)];
    if (!d || busy) return;
    if (!name) {
      const n = prompt(T().askName, '');
      if (!n || !n.trim()) return;
      name = n.trim().slice(0, 80);
      store.set('mspm-review-name', name);
      paint();
    }
    const row = { name, lang: open.lang, line: open.id, status: d.status, cue: JSON.stringify(d.pieces),
      comment: d.comment, action: d.action || 'edit', client };
    busy = true;
    message(T().saving);
    try {
      if (backend) {
        const sent = { key: backend.key, name: asText(row.name), lang: row.lang, line: 'L' + row.line, status: asText(row.status),
          cue: asText(row.cue), comment: asText(row.comment), action: asText(row.action), client: asText(row.client) };
        const res = await fetch(backend.url, { method: 'POST', body: JSON.stringify(sent) });
        const r = await res.json();
        if (!r.ok) throw new Error(r.error || 'save');
        row.time = r.time;
      } else {
        row.time = new Date().toISOString();
        const local = JSON.parse(store.get(LOCAL) || '[]');
        local.push(row);
        store.set(LOCAL, JSON.stringify(local));
      }
      rows.push(row);
      delete drafts[key(open.lang, open.id)];
      reindex();
      paint();
      renderCard();
      message(T().saved);
    } catch (e) {
      message(T().saveErr, true);
    } finally {
      busy = false;
    }
  }

  // ---------- the bar at the top: who, progress, sync ----------
  const bar = mk('div', 'rv-bar');
  document.querySelector('.sheet').prepend(bar);
  document.body.classList.add('rv');

  function progress(l) {
    let done = 0, fix = 0;
    const ids = M.lines().map(el => el.dataset.id);
    ids.forEach(id => {
      const r = latest[key(l, id)];
      if (r && (r.status === 'ok' || r.status === 'none')) done++;
      if (r && r.status === 'fix') fix++;
    });
    return T().progress(l.toUpperCase(), done, ids.length, fix);
  }

  function paint() {
    const l = lang(), t = T();
    M.lines().forEach(el => {
      const id = el.dataset.id, r = latest[key(l, id)], note = NOTES[l][id];
      if (r && r.status) el.dataset.rv = r.status; else delete el.dataset.rv;
      if (drafts[key(l, id)]) el.dataset.rvDraft = ''; else delete el.dataset.rvDraft;
      if (note && note.first && !(r && r.status)) el.dataset.rvFlag = ''; else delete el.dataset.rvFlag;
    });
    bar.replaceChildren();
    bar.append(mk('b', null, t.title));
    if (!M.links()) {
      bar.append(mk('span', null, t.loginHint), btn(t.login, 'rv-b', () => M.login()));
      return;
    }
    const who = mk('span', null, (name ? t.you + name : t.noName) + ' ');
    who.append(btn(name ? t.change : t.setName, 'rv-link', () => {
      const n = prompt(T().askName, name);
      if (n && n.trim()) { name = n.trim().slice(0, 80); store.set('mspm-review-name', name); paint(); }
    }));
    bar.append(who, mk('span', null, progress('en')), mk('span', null, progress('ru')));
    const sync = mk('span', loadFailed ? 'rv-err' : null,
      fetching ? t.fetching : loadFailed ? t.loadErr : backend
        ? t.updated + (loadedAt ? loadedAt.toLocaleTimeString(t.locale, { hour: '2-digit', minute: '2-digit' }) : '…')
        : t.localOnly);
    sync.append(' ', btn(t.refresh, 'rv-link', load));
    bar.append(sync);
  }

  // ---------- listening to one piece, or around and beyond its edges ----------
  // A separate player, so the line's own player keeps its place. Its line in the card shows where it is.
  const ear = new Audio();
  ear.preload = 'none';
  let earFrom = 0, earStop = Infinity, earPiece = null, earAt = 0;
  let earEl = null, earText = null, earBtn = null, earScrub = null, earMarks = null, earThumb = null, scrubbing = false;
  ear.addEventListener('timeupdate', () => { if (ear.currentTime >= earStop) ear.pause(); earShow(); });
  for (const ev of ['playing', 'pause', 'waiting', 'loadedmetadata']) ear.addEventListener(ev, earShow);
  const piecesNow = () => { const d = drafts[key(open.lang, open.id)]; return d ? d.pieces : savedCue(open.lang, open.id); };
  function earShow() {
    if (!earEl) return;
    earEl.hidden = !earPiece;
    if (!earPiece || scrubbing) return;
    earAt = Date.now();
    const t = T(), ready = ear.readyState >= 1 && ear.currentTime >= earFrom - 0.5;
    const at = ready ? fmt(ear.currentTime) + (isFinite(ear.duration) ? t.of + dur(ear.duration) : '') : t.loading;
    const where = earWhere(ready ? ear.currentTime : earFrom);
    earText.textContent = ear.paused && ready ? t.paused(where, at)
      : t.playing(where, at) + (isFinite(earStop) ? t.until(fmt(earStop)) : '');
    earBtn.textContent = ear.paused ? t.cont : t.pause;
    drawScrub(ready ? ear.currentTime : earFrom);
  }
  // «День 2, кусок 1» / “Day 2, piece 1” while inside a piece of the line, just the day elsewhere in the recording
  const pieceAt = t => piecesNow().findIndex(p => p[0] === earPiece.day && t >= toSec(p[1]) - 0.5 && t <= toSec(p[2]) + 0.5);
  function earWhere(t) {
    const j = pieceAt(t), d = dayName(earPiece.day);
    return d[0].toUpperCase() + d.slice(1) + (j >= 0 ? ', ' + T().pieceLc + ' ' + (j + 1) : '');
  }
  // the whole recording of the day: the line's pieces in it, and where the listening is
  function drawScrub(t) {
    const total = ear.duration;
    earScrub.hidden = !(total > 0 && isFinite(total));
    if (earScrub.hidden) return;
    const pct = x => Math.min(100, Math.max(0, x / total * 100)) + '%';
    earThumb.style.left = pct(t);
    earMarks.replaceChildren();
    const inside = pieceAt(t);
    piecesNow().forEach((p, j) => {
      if (p[0] !== earPiece.day) return;
      const m = mk('span', 'rv-mark' + (j === inside ? ' cur' : ''));
      m.style.left = pct(toSec(p[1]));
      m.style.width = (toSec(p[2]) - toSec(p[1])) / total * 100 + '%';
      m.title = T().piece + ' ' + (j + 1);
      earMarks.append(m);
    });
    earScrub.setAttribute('aria-valuemax', Math.round(total));
    earScrub.setAttribute('aria-valuenow', Math.round(t));
    earScrub.setAttribute('aria-valuetext', fmt(t) + T().of + dur(total));
  }
  // moving by hand: listening goes on from there with no stop
  function seekEar(t) {
    if (!(ear.duration > 0)) return;
    t = Math.max(0, Math.min(ear.duration - 0.5, t));
    earStop = Infinity;
    earFrom = t;
    ear.currentTime = t;
    earShow();
  }
  function listen(p, i, from, to = Infinity) {
    const src = M.links()[open.lang][p[0]];
    if (!src) return;
    M.pause();
    earPiece = { i, day: p[0] };
    earFrom = Math.max(0, from);
    earStop = to;
    if (ear.dataset.src !== src || ear.error) { ear.src = src; ear.dataset.src = src; }
    const go = () => { ear.currentTime = earFrom; };
    if (ear.readyState >= 1) go(); else ear.addEventListener('loadedmetadata', go, { once: true });
    ear.play().catch(() => {});
    earShow();
  }
  // the moment the reviewer is hearing in the recording of piece p (whichever piece the listening started from):
  // where the pause is, or a little before the tap while it plays (reaction time); 'wait' while it is still loading
  function hereTime(p, i) {
    const src = M.links()[open.lang][p[0]], st = M.state();
    if (ear.dataset.src === src && earPiece && earPiece.day === p[0] && Date.now() - earAt < 600000) {
      if (ear.readyState < 1 || ear.currentTime < earFrom - 0.5) return 'wait';
      return ear.paused ? ear.currentTime : ear.currentTime - 0.3;
    }
    if (st.el === open.el && st.cue && st.part === i && st.src === src) return st.time > 0 ? st.time - 0.3 : 'wait';
    return null;
  }

  // ---------- the card of a line ----------
  const cardEl = mk('section', 'rv-card');
  cardEl.hidden = true;
  document.body.append(cardEl);
  let msgEl = null;
  function message(text, err) { if (msgEl) { msgEl.textContent = text; msgEl.classList.toggle('rv-err', !!err); } }

  function draftOf() {
    const k = key(open.lang, open.id);
    if (!drafts[k]) {
      const r = latest[k];
      drafts[k] = { pieces: savedCue(open.lang, open.id), status: r ? r.status : '', comment: r ? r.comment : '', action: 'edit' };
    }
    return drafts[k];
  }
  function changed(action) {
    draftOf().action = action || 'edit';
    apply(open.lang, open.id);
    paint();
    renderCard();
  }
  function discard() {
    delete drafts[key(open.lang, open.id)];
    apply(open.lang, open.id);
    paint();
    renderCard();
    message(T().discarded);
  }

  function edgeRow(p, i, which) {
    const t = T(), isStart = which === 1, what = isStart ? t.start : t.end, row = mk('div', 'rv-edge');
    row.append(mk('span', 'rv-lbl', what));
    const input = mk('input', 'rv-time');
    input.value = p[which];
    input.inputMode = 'decimal';
    input.setAttribute('aria-label', t.ofPiece(what, i + 1));
    const set = x => {
      const s = toSec(p[1]), e = toSec(p[2]);
      if (!isFinite(x)) { input.value = p[which]; return; }
      x = isStart ? Math.min(Math.max(0, x), e - 0.5) : Math.max(x, s + 0.5);
      draftOf().pieces[i][which] = fmt(x);
      changed();
    };
    input.addEventListener('change', () => set(toSec(input.value)));
    row.append(input);
    for (const dt of [-2, -0.5, 0.5, 2]) {
      row.append(btn((dt > 0 ? '+' : '−') + t.num(Math.abs(dt)), 'rv-b rv-n', () => set(toSec(p[which]) + dt),
        `${what} ${dt > 0 ? t.later : t.earlier} ${t.num(Math.abs(dt))} ${t.sec}`));
    }
    const at = toSec(p[which]);
    row.append(btn(t.around, 'rv-b', () => listen(p, i, isStart ? at - 4 : at - 3, isStart ? at + 3 : at + 4), t.aroundL(isStart)));
    row.append(isStart
      ? btn(t.before[0], 'rv-b', () => listen(p, i, at - 30, at + 3), t.before[1])
      : btn(t.after[0], 'rv-b', () => listen(p, i, at - 3), t.after[1]));
    row.append(btn(isStart ? t.startHere : t.endHere, 'rv-b', () => {
      const h = hereTime(p, i);
      if (h == null) { message(T().hereNone, true); return; }
      if (h === 'wait') { message(T().hereWait, true); return; }
      set(h);
    }));
    return row;
  }

  function renderCard() {
    if (!open) { cardEl.hidden = true; document.body.classList.remove('rv-open'); return; }
    const t = T(), k = key(open.lang, open.id), d = drafts[k], r = latest[k];
    const ps = d ? d.pieces : savedCue(open.lang, open.id);
    const status = d ? d.status : r ? r.status : '';
    const comment = d ? d.comment : r ? r.comment : '';
    cardEl.replaceChildren();
    cardEl.hidden = false;
    cardEl.setAttribute('aria-label', t.card);
    document.body.classList.add('rv-open');

    const head = mk('div', 'rv-head');
    const title = mk('div');
    title.append(mk('b', null, t.line(open.id) + ' · ' + t.rec[open.lang]));
    title.append(mk('div', 'rv-pali', M.text(open.el)));
    head.append(title, btn('×', 'rv-x', () => { open = null; renderCard(); }, t.closeCard));
    cardEl.append(head);
    if (!M.links()) {
      cardEl.append(mk('p', 'rv-note', t.loginCard), btn(t.login, 'rv-b rv-main', () => M.login()));
      return;
    }

    notesFor(open.lang, open.id).forEach(n => cardEl.append(mk('p', 'rv-note' + (n.first ? ' rv-first' : ''), n.text)));

    const st = mk('div', 'rv-status');
    st.setAttribute('role', 'radiogroup');
    st.setAttribute('aria-label', t.statusL);
    for (const v of ['', 'ok', 'fix', 'none']) {
      const b = btn(t.status[v], 'rv-b rv-st', () => { draftOf().status = v; changed(); });
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(status === v));
      b.dataset.v = v;
      st.append(b);
    }
    cardEl.append(st);

    earEl = mk('div', 'rv-ear');
    earText = mk('span', 'rv-ear-text');
    earBtn = btn('', 'rv-b', () => {
      if (!ear.paused) { ear.pause(); return; }
      if (ear.currentTime >= earStop - 0.1) earStop = Infinity;     // stopped at the end of what was asked: go on past it
      ear.play().catch(() => {});
    });
    earScrub = mk('div', 'rv-scrub');
    earScrub.setAttribute('role', 'slider');
    earScrub.setAttribute('aria-label', t.scrub);
    earScrub.setAttribute('aria-valuemin', '0');
    earScrub.tabIndex = 0;
    const track = mk('span', 'rv-track');
    earMarks = mk('span');
    earThumb = mk('span', 'rv-thumb');
    track.append(earMarks, earThumb);
    earScrub.append(track);
    const atPointer = ev => {
      const box = track.getBoundingClientRect();
      return Math.max(0, Math.min(1, (ev.clientX - box.left) / box.width)) * ear.duration;
    };
    const preview = ev => { const x = atPointer(ev); drawScrub(x); earText.textContent = `${earWhere(x)}: → ${fmt(x)}`; };
    earScrub.addEventListener('pointerdown', ev => {
      if (!(ear.duration > 0)) return;
      scrubbing = true;
      earScrub.setPointerCapture(ev.pointerId);
      preview(ev);
    });
    earScrub.addEventListener('pointermove', ev => { if (scrubbing) preview(ev); });
    earScrub.addEventListener('pointerup', ev => { if (!scrubbing) return; scrubbing = false; seekEar(atPointer(ev)); });
    earScrub.addEventListener('pointercancel', () => { scrubbing = false; earShow(); });
    earScrub.addEventListener('keydown', ev => {
      const step = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, PageDown: -60, PageUp: 60 }[ev.key];
      if (step == null) return;
      ev.preventDefault();
      seekEar(ear.currentTime + step);
    });
    earEl.append(earText, earBtn,
      btn(t.back10[0], 'rv-b rv-n', () => seekEar(ear.currentTime - 10), t.back10[1]),
      btn(t.fwd10[0], 'rv-b rv-n', () => seekEar(ear.currentTime + 10), t.fwd10[1]),
      btn(t.close, 'rv-link', () => { ear.pause(); earPiece = null; earShow(); }),
      earScrub);
    cardEl.append(earEl);
    earShow();

    const list = mk('div', 'rv-pieces');
    ps.forEach((p, i) => {
      const box = mk('div', 'rv-piece');
      const ph = mk('div', 'rv-ph');
      ph.append(mk('b', null, t.piece + ' ' + (i + 1)));
      const sel = mk('select', 'rv-day');
      sel.setAttribute('aria-label', t.recOf(i + 1));
      DAYS.filter(dd => M.links()[open.lang][dd]).forEach(dd => {
        const o = mk('option', null, dayName(dd));
        o.value = dd;
        o.selected = dd === p[0];
        sel.append(o);
      });
      sel.addEventListener('change', () => { draftOf().pieces[i][0] = sel.value; changed(); });
      ph.append(sel, mk('span', 'rv-len', dur(toSec(p[2]) - toSec(p[1]))));
      ph.append(btn(t.whole[0], 'rv-b', () => listen(p, i, toSec(p[1]), toSec(p[2])), t.whole[1](i + 1)));
      ph.append(btn(t.remove[0], 'rv-link', () => { draftOf().pieces.splice(i, 1); changed(); }, t.remove[1](i + 1)));
      box.append(ph, edgeRow(p, i, 1), edgeRow(p, i, 2));
      list.append(box);
    });
    if (!ps.length) list.append(mk('p', 'rv-note', t.noAudio));
    list.append(btn(t.add, 'rv-link', () => {
      const last = ps[ps.length - 1], s = last ? toSec(last[2]) : 0;
      draftOf().pieces.push([last ? last[0] : 'day2', fmt(s), fmt(s + 30)]);
      changed();
    }));
    cardEl.append(list);

    const ta = mk('textarea', 'rv-comment');
    ta.rows = 2;
    ta.placeholder = t.comment;
    ta.value = comment;
    ta.addEventListener('input', () => {
      draftOf().comment = ta.value;
      paint();
      saveBtn.disabled = false;
    });
    cardEl.append(ta);

    const acts = mk('div', 'rv-actions');
    const saveBtn = btn(t.save, 'rv-b rv-main', save);
    saveBtn.disabled = !d;
    acts.append(saveBtn, btn(t.fragment, 'rv-b', () => { ear.pause(); M.replay(); }));
    if (d) acts.append(btn(t.discard, 'rv-link', discard));
    const auto = pieces(AUTO[open.lang] && AUTO[open.lang][open.id]);
    if (!same(ps, auto)) {
      acts.append(btn(t.autoBack, 'rv-link', () => {
        draftOf().pieces = auto.map(p => p.slice());
        changed('auto');
        message(T().autoMsg);
      }));
    }
    const mine = rows.filter(x => x.lang === open.lang && x.line === open.id).reverse();
    const histBtn = btn(t.history(mine.length), 'rv-link');
    if (mine.length) acts.append(histBtn);
    cardEl.append(acts);

    msgEl = mk('p', 'rv-msg');
    msgEl.setAttribute('aria-live', 'polite');
    msgEl.textContent = d ? t.unsaved + (d.action === 'auto' ? t.unsavedAuto : d.action === 'revert' ? t.unsavedRevert : '')
      : r ? t.savedAt(when(r.time), r.name || t.noname) : t.notChecked;
    cardEl.append(msgEl);

    const hist = mk('ol', 'rv-hist');
    hist.hidden = true;
    mine.forEach(x => {
      const li = mk('li');
      let n = 0;
      try { n = JSON.parse(x.cue || '[]').length; } catch (e) {}
      li.append(mk('span', null, when(x.time) + ' · ' + (x.name || t.noname) + ' · ' + (t.status[x.status] || t.status[''])
        + t.count(n) + (x.action === 'auto' ? t.auto : '') + (x.comment ? t.quote(x.comment) : '')));
      li.append(btn(t.restore, 'rv-link', () => {
        const dd = draftOf();
        try { dd.pieces = JSON.parse(x.cue || '[]'); } catch (e) { return; }
        dd.status = x.status;
        dd.comment = x.comment;
        changed('revert');
      }));
      hist.append(li);
    });
    histBtn.addEventListener('click', () => { hist.hidden = !hist.hidden; });
    cardEl.append(hist);
    document.documentElement.style.setProperty('--rv-h', cardEl.offsetHeight + 'px');
  }

  // ---------- wiring ----------
  M.onSelect = el => {
    ear.pause();
    earPiece = null;
    open = { lang: lang(), id: el.dataset.id, el };
    renderCard();
  };
  M.onLogin = load;
  document.querySelectorAll('input[name="lang"]').forEach(r => r.addEventListener('change', () => {
    if (open) { ear.pause(); earPiece = null; open.lang = lang(); renderCard(); }
    paint();
  }));
  new MutationObserver(() => { if ($('player').hidden && open) { open = null; renderCard(); } })
    .observe($('player'), { attributes: true, attributeFilter: ['hidden'] });
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => document.documentElement.style.setProperty('--rv-h', (cardEl.hidden ? 0 : cardEl.offsetHeight) + 'px')).observe(cardEl);
  }
  window.addEventListener('beforeunload', e => { if (Object.keys(drafts).length) { e.preventDefault(); e.returnValue = ''; } });
  window.addEventListener('focus', () => { if (backend && !busy && (!loadedAt || Date.now() - loadedAt > 30000)) load(); });
  setInterval(() => { if (backend && !busy && !document.hidden) load(); }, 120000);

  // ---------- styles ----------
  const css = mk('style');
  css.textContent = `
:root { --rv-ok: #2F7A3E; --rv-fix: var(--err); }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --rv-ok: #7BC88A; } }
:root[data-theme="dark"] { --rv-ok: #7BC88A; }
.rv-bar { position: sticky; top: 0; z-index: 15; display: flex; flex-wrap: wrap; gap: .3rem 1rem; align-items: center;
  margin: 0 0 1rem; padding: .5rem .75rem; background: var(--bar); color: var(--bar-fg); font: .8125rem/1.4 var(--f-ui); }
.rv-bar b { color: var(--bar-accent); }
.rv-bar .rv-link, .rv-bar .rv-b { color: inherit; }
.rv-err { color: var(--err); }
.rv-bar .rv-err { color: #F08A6E; }
body.rv .ln[data-rv="ok"] { box-shadow: inset 4px 0 0 var(--rv-ok); }
body.rv .ln[data-rv="fix"] { box-shadow: inset 4px 0 0 var(--rv-fix); }
body.rv .ln[data-rv="none"] { box-shadow: inset 4px 0 0 var(--muted); }
body.rv .ln[data-rv-draft] { outline: 1px dashed var(--ochre); outline-offset: -1px; }
body.rv .ln[data-rv-flag]::after { content: "⚑"; color: var(--rv-fix); font: .75em var(--f-ui); margin-left: .35em; }
body.has-player.rv-open { padding-bottom: calc(var(--pl-h) + var(--rv-h, 0px) + 28px); }
body.rv-open .ln { scroll-margin-bottom: calc(var(--pl-h) + var(--rv-h, 0px) + 20px); }
.rv-card { position: fixed; left: 0; right: 0; bottom: var(--pl-h); z-index: 19; max-height: calc(100vh - var(--pl-h) - 64px);
  overflow-y: auto; background: var(--sheet); color: var(--ink); border-top: var(--lw) solid var(--rule);
  font: .875rem/1.4 var(--f-ui); padding: .75rem max(16px, calc((100vw - 920px) / 2)); display: grid; gap: .6rem;
  box-shadow: 0 -6px 18px rgba(0,0,0,.12); }
.rv-head { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
.rv-pali { font: 1rem/1.35 var(--f-text); margin-top: .2rem; }
.script-dev .rv-pali { font-family: var(--f-deva); }
.rv-note { margin: 0; color: var(--muted); font-size: .8125rem; }
.rv-note.rv-first { color: var(--rv-fix); }
.rv-status { display: flex; flex-wrap: wrap; gap: .3rem; }
.rv-b { all: unset; box-sizing: border-box; cursor: pointer; padding: .3rem .55rem; border: 1px solid var(--hair); border-radius: 4px;
  font: .8125rem/1.2 var(--f-ui); color: var(--ink); background: var(--paper); white-space: nowrap; }
.rv-b:hover { background: var(--hover); }
.rv-b:focus-visible, .rv-link:focus-visible, .rv-x:focus-visible { outline: 2px solid var(--ochre); outline-offset: 1px; }
.rv-b:disabled { opacity: .45; cursor: default; }
.rv-st[aria-checked="true"] { background: var(--ink); color: var(--sheet); border-color: var(--ink); }
.rv-st[aria-checked="true"][data-v="ok"] { background: var(--rv-ok); border-color: var(--rv-ok); color: #fff; }
.rv-st[aria-checked="true"][data-v="fix"] { background: var(--rv-fix); border-color: var(--rv-fix); color: #fff; }
.rv-main { background: var(--bar-accent); color: var(--bar-on-accent); border-color: var(--bar-accent); font-weight: 600; }
.rv-main:hover { background: var(--bar-accent); filter: brightness(1.06); }
.rv-n { min-width: 2.6rem; text-align: center; font-variant-numeric: tabular-nums; }
.rv-link { all: unset; cursor: pointer; color: var(--ochre); text-decoration: underline; text-underline-offset: 2px; font: .8125rem var(--f-ui); }
.rv-x { all: unset; cursor: pointer; font-size: 1.4rem; line-height: 1; padding: 0 .3rem; color: var(--muted); }
.rv-ear { position: sticky; top: -.75rem; z-index: 1; display: flex; flex-wrap: wrap; gap: .4rem .8rem; align-items: center;
  padding: .4rem .6rem; border-radius: 6px; background: var(--hover); font-variant-numeric: tabular-nums; }
.rv-ear[hidden] { display: none; }
.rv-ear-text { flex: 1 1 16rem; }
.rv-scrub { flex-basis: 100%; padding: 8px 7px; cursor: pointer; touch-action: none; border-radius: 4px; }
.rv-scrub[hidden] { display: none; }
.rv-scrub:focus-visible { outline: none; }
.rv-scrub .rv-track { position: relative; display: block; height: 6px; border-radius: 3px; background: var(--hair); }
.rv-mark { position: absolute; top: 0; bottom: 0; min-width: 3px; border-radius: 3px; background: color-mix(in srgb, var(--ochre) 40%, transparent); }
.rv-mark.cur { background: var(--ochre); }
.rv-thumb { position: absolute; top: 50%; left: 0; width: 14px; height: 14px; margin: -7px 0 0 -7px; border-radius: 50%;
  background: var(--ink); box-shadow: 0 0 0 2px var(--hover); }
.rv-scrub:focus-visible .rv-thumb { box-shadow: 0 0 0 5px color-mix(in srgb, var(--ochre) 40%, transparent); }
.rv-pieces { display: grid; gap: .5rem; justify-items: start; }
.rv-piece { display: grid; gap: .35rem; width: 100%; padding: .5rem .6rem; border: 1px solid var(--hair); border-radius: 6px; box-sizing: border-box; }
.rv-ph { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }
.rv-len { color: var(--muted); font-variant-numeric: tabular-nums; }
.rv-edge { display: flex; flex-wrap: wrap; gap: .3rem; align-items: center; }
.rv-lbl { min-width: 3.6rem; color: var(--muted); }
.rv-time { width: 5.2rem; padding: .3rem .4rem; border: 1px solid var(--hair); border-radius: 4px; font: .875rem var(--f-ui);
  font-variant-numeric: tabular-nums; background: var(--sheet); color: var(--ink); }
.rv-day { padding: .25rem .3rem; border: 1px solid var(--hair); border-radius: 4px; background: var(--sheet); color: var(--ink); font: .8125rem var(--f-ui); }
.rv-comment { width: 100%; box-sizing: border-box; padding: .4rem .5rem; border: 1px solid var(--hair); border-radius: 4px;
  font: .875rem/1.4 var(--f-ui); background: var(--sheet); color: var(--ink); resize: vertical; }
.rv-actions { display: flex; flex-wrap: wrap; gap: .4rem .9rem; align-items: center; }
.rv-msg { margin: 0; color: var(--muted); font-size: .8125rem; }
.rv-hist { margin: 0; padding-left: 1.2rem; display: grid; gap: .3rem; font-size: .8125rem; }
.rv-hist li span { margin-right: .5rem; }
@media (max-width: 700px) { .rv-card { max-height: 52vh; } .rv-lbl { min-width: 100%; } }
`;
  document.head.append(css);

  paint();
  load();
})();
