// Review mode (?review): checking and correcting the audio fragment of every line, together with other reviewers.
// Each save adds a row to a shared Google Sheet (tools/review-sheet.gs); the newest row for a line and language is
// its current state, and the history stays. Until the sheet is linked, saves stay in this browser.
// Any line can be brought back to the automatic marking from the transcripts (js/audio-auto.js).
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

  const STATUS = [['', 'Не проверено'], ['ok', 'Верно'], ['fix', 'Нужна правка'], ['none', 'Пояснения нет']];
  const STATUS_TEXT = Object.fromEntries(STATUS);
  const DAYS = ['day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7-qa1', 'day8-qa2', 'day9-closing'];
  const dayName = d => ({ 'day7-qa1': 'день 7, вопросы', 'day8-qa2': 'день 8, вопросы', 'day9-closing': 'день 9, заключение' }[d]
    || 'день ' + d.slice(3));

  // notes from the automatic marking; `first` marks a line to check first
  const BOTH = {
    '1.01': 'Фрагмент длится 24 минуты: вся история Первого собора и Ананды. Оставить целиком или сократить? Начало третьего дня (EN 0:11–4:13, RU 0:06–1:47) продолжает историю соборов — можно добавить.',
    '1.02': '15 минут: 2,5 минуты о месте беседы и 13 минут рассказа о стране Куру. Оставить целиком или сократить?',
    '1.05': 'Отдельного объяснения нет: сейчас 5 секунд перехода к беседе.',
    '1.20': 'В первом дне есть короткое упоминание ātāpī sampajāno satimā (EN 39:35–40:08, RU 23:27) — можно добавить первым куском.'
  };
  for (let n = 12; n <= 22; n++) {
    const id = '1.' + n;
    BOTH[id] = 'Два дня подряд: краткий разбор из второго дня и подробный из третьего. Оставить оба или только подробный?'
      + (BOTH[id] ? ' ' + BOTH[id] : '');
  }
  for (const [a, b] of [['1.31', '1.32'], ['1.37', '1.38'], ['1.39', '1.40']]) {
    BOTH[a] = BOTH[b] = `Вдох и выдох объясняются вместе: у строк ${a} и ${b} общий фрагмент.`;
  }
  const NOTES = {
    en: {},
    ru: {
      '0': { first: 1, text: 'Распознавание потеряло начало (0:03–0:30); начало фрагмента поставлено по записи.' },
      '1.06': { first: 1, text: 'Проверить первым: распознавание потеряло около минуты русской речи, начало второго куска (46:20.6) поставлено по паузе.' },
      '1.23': { first: 1, text: 'Распознавание потеряло русскую речь на 17:55–18:06, конец поставлен по паузе.' },
      '1.24': { first: 1, text: 'Распознавание потеряло русскую речь на 17:55–18:06, фрагмент поставлен по паузам.' }
    }
  };
  const notesFor = (l, id) => [NOTES[l][id], BOTH[id] && { text: BOTH[id] }].filter(Boolean);

  // ---------- state ----------
  const client = store.get('mspm-review-client') || Math.random().toString(36).slice(2, 10);
  store.set('mspm-review-client', client);
  let name = store.get('mspm-review-name') || '';
  let rows = [];                       // saved rows, oldest first
  const latest = {};                   // 'lang|line' → newest row
  const drafts = {};                   // 'lang|line' → unsaved { pieces, status, comment, action }
  let backend = null, loadedAt = null, loadErr = '', busy = false, fetching = false;
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
      loadErr = '';
      loadedAt = new Date();
    } catch (e) {
      loadErr = 'Не удалось загрузить правки из таблицы.';
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
      const n = prompt('Как подписать ваши правки? Имя увидят другие проверяющие.', '');
      if (!n || !n.trim()) return;
      name = n.trim().slice(0, 80);
      store.set('mspm-review-name', name);
      paint();
    }
    const row = { name, lang: open.lang, line: open.id, status: d.status, cue: JSON.stringify(d.pieces),
      comment: d.comment, action: d.action || 'edit', client };
    busy = true;
    message('Сохраняю…');
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
      message('Сохранено.');
    } catch (e) {
      message('Не сохранилось. Проверьте интернет и нажмите «Сохранить» ещё раз.', true);
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
    return `${l.toUpperCase()}: проверено ${done} из ${ids.length}` + (fix ? `, нужна правка ${fix}` : '');
  }

  function paint() {
    const l = lang();
    M.lines().forEach(el => {
      const id = el.dataset.id, r = latest[key(l, id)], note = NOTES[l][id];
      if (r && r.status) el.dataset.rv = r.status; else delete el.dataset.rv;
      if (drafts[key(l, id)]) el.dataset.rvDraft = ''; else delete el.dataset.rvDraft;
      if (note && note.first && !(r && r.status)) el.dataset.rvFlag = ''; else delete el.dataset.rvFlag;
    });
    bar.replaceChildren();
    bar.append(mk('b', null, 'Проверка таймкодов'));
    if (!M.links()) {
      bar.append(mk('span', null, 'Войдите как старый студент, чтобы слушать и сохранять.'), btn('Войти', 'rv-b', () => M.login()));
      return;
    }
    const who = mk('span', null, name ? 'Вы: ' + name + ' ' : 'Имя не указано ');
    who.append(btn(name ? 'изменить' : 'указать', 'rv-link', () => {
      const n = prompt('Как подписать ваши правки?', name);
      if (n && n.trim()) { name = n.trim().slice(0, 80); store.set('mspm-review-name', name); paint(); }
    }));
    bar.append(who, mk('span', null, progress('en')), mk('span', null, progress('ru')));
    const sync = mk('span', loadErr ? 'rv-err' : null,
      fetching ? 'Загружаю правки…' : loadErr || (backend ? 'Обновлено ' + (loadedAt ? loadedAt.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) : '…')
        : 'Таблица ещё не подключена: правки сохраняются только в этом браузере.'));
    sync.append(' ', btn('обновить', 'rv-link', load));
    bar.append(sync);
  }

  // ---------- listening around a boundary ----------
  const ear = new Audio();
  ear.preload = 'none';
  let earFrom = 0, earStop = 0, earPiece = null, earAt = 0;
  ear.addEventListener('timeupdate', () => { if (ear.currentTime >= earStop) ear.pause(); });
  ear.addEventListener('playing', () => message(`Слушаю ${fmt(earFrom)} → ${fmt(earStop)}`));
  function listen(p, i, from, to) {
    const src = M.links()[open.lang][p[0]];
    if (!src) return;
    M.pause();
    earPiece = { i, day: p[0] };
    earAt = Date.now();
    earFrom = Math.max(0, from);
    earStop = to;
    if (ear.dataset.src !== src) { ear.src = src; ear.dataset.src = src; }
    const go = () => { ear.currentTime = Math.max(0, from); };
    if (ear.readyState >= 1) go(); else ear.addEventListener('loadedmetadata', go, { once: true });
    ear.play().catch(() => {});
    message(`Слушаю ${fmt(from)} → ${fmt(to)}` + (ear.readyState < 1 ? ' (запись загружается)' : ''));
  }
  // the moment the reviewer is hearing in the recording of piece p, a little before the tap (reaction time);
  // 'wait' while that recording is still loading
  function hereTime(p, i) {
    const src = M.links()[open.lang][p[0]], st = M.state();
    if (ear.dataset.src === src && earPiece && earPiece.i === i && earPiece.day === p[0] && Date.now() - earAt < 60000) {
      if (ear.readyState < 1 || ear.currentTime < earFrom - 0.5) return 'wait';
      return ear.currentTime - 0.3;
    }
    if (st.el === open.el && st.cue && st.part === i && st.src === src) return st.time > 0 ? st.time - 0.3 : 'wait';
    return null;
  }

  // ---------- the card of a line ----------
  const cardEl = mk('section', 'rv-card');
  cardEl.hidden = true;
  cardEl.setAttribute('aria-label', 'Проверка строки');
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
    message('Изменения отменены.');
  }

  function edgeRow(p, i, which) {
    const isStart = which === 1, row = mk('div', 'rv-edge');
    row.append(mk('span', 'rv-lbl', isStart ? 'Начало' : 'Конец'));
    const input = mk('input', 'rv-time');
    input.value = p[which];
    input.inputMode = 'decimal';
    input.setAttribute('aria-label', (isStart ? 'Начало' : 'Конец') + ' куска ' + (i + 1));
    const set = t => {
      const s = toSec(p[1]), e = toSec(p[2]);
      if (!isFinite(t)) { input.value = p[which]; return; }
      t = isStart ? Math.min(Math.max(0, t), e - 0.5) : Math.max(t, s + 0.5);
      draftOf().pieces[i][which] = fmt(t);
      changed();
    };
    input.addEventListener('change', () => set(toSec(input.value)));
    row.append(input);
    for (const dt of [-2, -0.5, 0.5, 2]) {
      row.append(btn((dt > 0 ? '+' : '−') + String(Math.abs(dt)).replace('.', ','), 'rv-b rv-n',
        () => set(toSec(p[which]) + dt), (isStart ? 'Начало' : 'Конец') + (dt > 0 ? ' позже на ' : ' раньше на ') + Math.abs(dt) + ' с'));
    }
    const t = toSec(p[which]);
    row.append(btn('▶ стык', 'rv-b', () => listen(p, i, isStart ? t - 4 : t - 3, isStart ? t + 3 : t + 4),
      'Послушать вокруг ' + (isStart ? 'начала' : 'конца')));
    row.append(btn(isStart ? 'начало здесь' : 'конец здесь', 'rv-b', () => {
      const h = hereTime(p, i);
      if (h == null) { message('Сначала включите этот кусок («▶ стык» или весь фрагмент), потом нажмите в нужный момент.', true); return; }
      if (h === 'wait') { message('Запись ещё загружается. Нажмите, когда услышите нужное место.', true); return; }
      set(h);
    }));
    return row;
  }

  function renderCard() {
    if (!open) { cardEl.hidden = true; document.body.classList.remove('rv-open'); return; }
    const k = key(open.lang, open.id), d = drafts[k], r = latest[k];
    const ps = d ? d.pieces : savedCue(open.lang, open.id);
    const status = d ? d.status : r ? r.status : '';
    const comment = d ? d.comment : r ? r.comment : '';
    cardEl.replaceChildren();
    cardEl.hidden = false;
    document.body.classList.add('rv-open');

    const head = mk('div', 'rv-head');
    const title = mk('div');
    title.append(mk('b', null, (open.id === '0' ? 'Строка 0 (название)' : 'Строка ' + open.id) + ' · ' + (open.lang === 'en' ? 'английская запись' : 'русская запись')));
    title.append(mk('div', 'rv-pali', M.text(open.el)));
    head.append(title, btn('×', 'rv-x', () => { open = null; renderCard(); }, 'Закрыть проверку'));
    cardEl.append(head);
    if (!M.links()) {
      cardEl.append(mk('p', 'rv-note', 'Чтобы слушать и править, войдите как старый студент.'), btn('Войти', 'rv-b rv-main', () => M.login()));
      return;
    }

    notesFor(open.lang, open.id).forEach(n => cardEl.append(mk('p', 'rv-note' + (n.first ? ' rv-first' : ''), n.text)));

    const st = mk('div', 'rv-status');
    st.setAttribute('role', 'radiogroup');
    st.setAttribute('aria-label', 'Состояние строки');
    STATUS.forEach(([v, text]) => {
      const b = btn(text, 'rv-b rv-st', () => { draftOf().status = v; changed(); });
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(status === v));
      b.dataset.v = v;
      st.append(b);
    });
    cardEl.append(st);

    const list = mk('div', 'rv-pieces');
    ps.forEach((p, i) => {
      const box = mk('div', 'rv-piece');
      const ph = mk('div', 'rv-ph');
      ph.append(mk('b', null, 'Кусок ' + (i + 1)));
      const sel = mk('select', 'rv-day');
      sel.setAttribute('aria-label', 'Запись куска ' + (i + 1));
      DAYS.filter(dd => M.links()[open.lang][dd]).forEach(dd => {
        const o = mk('option', null, dayName(dd));
        o.value = dd;
        o.selected = dd === p[0];
        sel.append(o);
      });
      sel.addEventListener('change', () => { draftOf().pieces[i][0] = sel.value; changed(); });
      ph.append(sel, mk('span', 'rv-len', dur(toSec(p[2]) - toSec(p[1]))));
      ph.append(btn('убрать', 'rv-link', () => { draftOf().pieces.splice(i, 1); changed(); }, 'Убрать кусок ' + (i + 1)));
      box.append(ph, edgeRow(p, i, 1), edgeRow(p, i, 2));
      list.append(box);
    });
    if (!ps.length) list.append(mk('p', 'rv-note', 'У строки нет аудио.'));
    list.append(btn('+ добавить кусок', 'rv-link', () => {
      const last = ps[ps.length - 1], s = last ? toSec(last[2]) : 0;
      draftOf().pieces.push([last ? last[0] : 'day2', fmt(s), fmt(s + 30)]);
      changed();
    }));
    cardEl.append(list);

    const ta = mk('textarea', 'rv-comment');
    ta.rows = 2;
    ta.placeholder = 'Комментарий: что не так, что добавить, замечание о переводе';
    ta.value = comment;
    ta.addEventListener('input', () => {
      const dd = draftOf();
      dd.comment = ta.value;
      paint();
      saveBtn.disabled = false;
    });
    cardEl.append(ta);

    const acts = mk('div', 'rv-actions');
    const saveBtn = btn('Сохранить', 'rv-b rv-main', save);
    saveBtn.disabled = !d;
    acts.append(saveBtn, btn('▶ весь фрагмент', 'rv-b', () => { ear.pause(); M.replay(); }));
    if (d) acts.append(btn('отменить изменения', 'rv-link', discard));
    const auto = pieces(AUTO[open.lang] && AUTO[open.lang][open.id]);
    if (!same(ps, auto)) {
      acts.append(btn('вернуть автоматическую разметку', 'rv-link', () => {
        draftOf().pieces = auto.map(p => p.slice());
        changed('auto');
        message('Возвращена автоматическая разметка. Нажмите «Сохранить», чтобы она стала общей.');
      }));
    }
    const mine = rows.filter(x => x.lang === open.lang && x.line === open.id).reverse();
    const histBtn = btn('история (' + mine.length + ')', 'rv-link');
    if (mine.length) acts.append(histBtn);
    cardEl.append(acts);

    msgEl = mk('p', 'rv-msg');
    msgEl.setAttribute('aria-live', 'polite');
    msgEl.textContent = d ? 'Есть несохранённые изменения.' + (d.action === 'auto' ? ' (автоматическая разметка)' : d.action === 'revert' ? ' (версия из истории)' : '')
      : r ? 'Сохранено ' + new Date(r.time).toLocaleString('ru', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }) + ', ' + (r.name || 'без имени')
        : 'Автоматическая разметка, ещё не проверялась.';
    cardEl.append(msgEl);

    const hist = mk('ol', 'rv-hist');
    hist.hidden = true;
    mine.forEach(x => {
      const li = mk('li');
      let n = 0;
      try { n = JSON.parse(x.cue || '[]').length; } catch (e) {}
      li.append(mk('span', null, new Date(x.time).toLocaleString('ru', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })
        + ' · ' + (x.name || 'без имени') + ' · ' + (STATUS_TEXT[x.status] || 'Не проверено') + ' · кусков: ' + n
        + (x.action === 'auto' ? ' · автоматическая' : '') + (x.comment ? ' · «' + x.comment + '»' : '')));
      li.append(btn('вернуть', 'rv-link', () => {
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
    open = { lang: lang(), id: el.dataset.id, el };
    renderCard();
  };
  M.onLogin = load;
  document.querySelectorAll('input[name="lang"]').forEach(r => r.addEventListener('change', () => {
    if (open) { open.lang = lang(); renderCard(); }
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
