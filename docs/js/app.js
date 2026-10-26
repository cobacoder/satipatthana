(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const SOURCES = window.SOURCES || {};
  const CUES = window.CUES || {};
  const PAGES = window.PAGES || [];
  const NPAGES = 11;

  // ---------- transliteration ----------
  const VOW = { 'अ':'a','आ':'ā','इ':'i','ई':'ī','उ':'u','ऊ':'ū','ए':'e','ओ':'o' };
  const MAT = { 'ा':'ā','ि':'i','ी':'ī','ु':'u','ू':'ū','े':'e','ो':'o' };
  const CON = { 'क':'k','ख':'kh','ग':'g','घ':'gh','ङ':'ṅ','च':'c','छ':'ch','ज':'j','झ':'jh','ञ':'ñ',
    'ट':'ṭ','ठ':'ṭh','ड':'ḍ','ढ':'ḍh','ण':'ṇ','त':'t','थ':'th','द':'d','ध':'dh','न':'n',
    'प':'p','फ':'ph','ब':'b','भ':'bh','म':'m','य':'y','र':'r','ल':'l','ळ':'ḷ','व':'v',
    'स':'s','ह':'h' };
  const DEV_DIGITS = '०१२३४५६७८९';
  const RING = String.fromCharCode(0x325), MACRON = String.fromCharCode(0x304), DOT = String.fromCharCode(0x323);

  // Pali in Devanagari → IAST (every consonant carries an inherent a)
  function devaToIast(s) {
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (CON[ch]) {
        out += CON[ch];
        const nx = s[i + 1];
        if (nx === '्') i++;
        else if (MAT[nx]) { out += MAT[nx]; i++; }
        else out += 'a';
      } else if (VOW[ch]) out += VOW[ch];
      else if (ch === 'ं') out += 'ṃ';
      else if (ch === '।' || ch === '॥') out += '.';
      else if (DEV_DIGITS.includes(ch)) out += DEV_DIGITS.indexOf(ch);
      else out += ch;
    }
    return out;
  }

  const capFirst = s => s.replace(/^([^\p{L}]*)(\p{L})/u, (m, a, b) => a + b.toUpperCase());

  // Hindi and Marathi come with a hand-made ISO 15919 transliteration: r̥ is the vowel ऋ, ṛ the flap ड़
  function toPlain(s, hi) {
    let x = s.normalize('NFC');
    if (hi) x = x.replace(/ṃ/g, 'n');
    x = x.split('r' + RING).join('ri').replace(/ṛh/g, 'rh').replace(/[śṣ]/g, 'sh').replace(/[ŚṢ]/g, 'Sh');
    return x.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC');
  }

  const CY_ONE = { a:'а',ā:'а',i:'и',ī:'и',u:'у',ū:'у',e:'е',o:'о',k:'к',g:'г',ṅ:'н',c:'ч',j:'дж',ñ:'н',
    ṭ:'т',ḍ:'д',ṇ:'н',t:'т',d:'д',n:'н',p:'п',b:'б',m:'м',y:'й',r:'р',ṛ:'р',l:'л',ḷ:'л',v:'в',s:'с',h:'х',ṃ:'м',
    ś:'ш',ṣ:'ш',z:'з',f:'ф',ḥ:'х' };
  const CY_TWO = { kh:'кх',gh:'гх',ch:'чх',jh:'джх','ṭh':'тх','ḍh':'дх',th:'тх',dh:'дх',ph:'пх',bh:'бх','ṛh':'рх',
    ['r' + RING]:'ри' };
  const CY_IOT = { a:'я',ā:'я',u:'ю',ū:'ю' };
  const VOWELS = 'aāiīuūeo';
  const isLetter = c => /\p{L}/u.test(c);

  // Variant with diacritics: long vowels, retroflexes and nasals keep their marks (ка̄йа), y is always й
  const SCI_ONE = { ...CY_ONE, ā: 'а' + MACRON, ī: 'и' + MACRON, ū: 'у' + MACRON,
    ṅ: 'н' + String.fromCharCode(0x307), ñ: 'н' + String.fromCharCode(0x303), ṭ: 'т' + DOT, ḍ: 'д' + DOT,
    ṇ: 'н' + DOT, ḷ: 'л' + DOT, ṃ: 'м' + DOT, ṣ: 'ш' + DOT, ṛ: 'р' + DOT, ḥ: 'х' + DOT };
  const SCI_TWO = { ...CY_TWO, 'ṭh': 'т' + DOT + 'х', 'ḍh': 'д' + DOT + 'х', 'ṛh': 'р' + DOT + 'х', ['r' + RING]: 'р' + RING };

  function toCyr(src, hi, sci) {
    const ONE = sci ? SCI_ONE : CY_ONE, TWO = sci ? SCI_TWO : CY_TWO;
    const s = src.normalize('NFC'), lo = s.toLowerCase();
    let out = '';
    for (let i = 0; i < s.length;) {
      const ch = lo[i], two = lo.slice(i, i + 2), prev = i ? lo[i - 1] : ' ', nx = lo[i + 1] || ' ';
      let r, len = 1;
      if (TWO[two]) { r = TWO[two]; len = 2; }
      else if (hi && (two === 'ai' || two === 'au')) { r = two === 'ai' ? 'ай' : 'ау'; len = 2; }
      else if (!sci && ch === 'ñ' && CY_IOT[nx]) { r = 'н' + CY_IOT[nx]; len = 2; }
      else if (!sci && ch === 'y' && CY_IOT[nx]) {
        const soft = isLetter(prev) && !VOWELS.includes(prev) && prev !== 'y' && prev !== 'ṃ';
        r = (soft ? 'ь' : '') + CY_IOT[nx]; len = 2;
      }
      else if (ch === 'e' && (!isLetter(prev) || VOWELS.includes(prev))) r = 'э';
      else if (!sci && hi && ch === 'ṃ') r = 'н';
      else if (ONE[ch]) r = ONE[ch];
      else r = s[i];
      if (s[i] !== lo[i]) r = r[0].toUpperCase() + r.slice(1);
      out += r; i += len;
    }
    return out.normalize('NFC');
  }

  // Syllables for the vertical boxes (pa / jā / nā / ti)
  const ASP = new Set(['kh','gh','ch','jh','ṭh','ḍh','th','dh','ph','bh']);
  function sylIast(ia) {
    const out = [];
    ia.split(/\s+/).filter(Boolean).forEach(word => {
      const tk = [];
      for (let i = 0; i < word.length;) {
        const two = word.slice(i, i + 2);
        if (ASP.has(two)) { tk.push(two); i += 2; } else { tk.push(word[i]); i++; }
      }
      const parts = [];
      let cur = '', hasV = false;
      tk.forEach((t, k) => {
        const nx = tk[k + 1] || '';
        const cons = isLetter(t) && !VOWELS.includes(t) && t !== 'ṃ';
        if (cons && hasV && nx && VOWELS.includes(nx[0])) { parts.push(cur); cur = ''; hasV = false; }
        cur += t;
        if (VOWELS.includes(t)) hasV = true;
      });
      if (cur) parts.push(cur);
      parts.forEach((p, k) => out.push({ text: p, end: k === parts.length - 1 }));
    });
    return out;
  }
  function aksharas(dev) {
    const out = [];
    dev.split(/\s+/).filter(Boolean).forEach(word => {
      const raw = word.match(/(?:[क-ह](?:्[क-ह])*[ा-ौ]?|[अ-औ])ं?|[^क-हअ-औ]+/g) || [word];
      const parts = [];
      raw.forEach(p => { if (/^[क-हअ-औ]/.test(p) || !parts.length) parts.push(p); else parts[parts.length - 1] += p; });
      parts.forEach((p, k) => out.push({ text: p, end: k === parts.length - 1 }));
    });
    return out;
  }

  // ---------- state ----------
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const SCRIPTS = ['iast', 'plain', 'cyr', 'cyrs', 'dev'];
  let script = SCRIPTS.includes(store.get('mspm-script')) ? store.get('mspm-script') : 'iast';
  let lang = ['en', 'ru'].includes(store.get('mspm-lang')) ? store.get('mspm-lang') : 'en';
  const SCRIPT_LANG = { iast: 'Latn', plain: 'Latn', cyr: 'Cyrl', cyrs: 'Cyrl', dev: 'Deva' };

  const conv = (ia, hi) => script === 'iast' ? ia : script === 'plain' ? toPlain(ia, hi) : toCyr(ia, hi, script === 'cyrs');
  function translit(dev, l, ia, cap) {
    if (script === 'dev') return dev;
    let x = l === 'pi' ? devaToIast(dev) : ia;
    if (cap) x = capFirst(x);
    return conv(x, l !== 'pi');
  }

  function renderT(el) {
    const l = el.dataset.l, dev = el.dataset.dev;
    if (el.classList.contains('vt')) {
      const parts = script === 'dev' ? aksharas(dev)
        : sylIast(devaToIast(dev)).map(p => ({ end: p.end, text: conv(p.text, false) }));
      el.replaceChildren(...parts.map(p => {
        const s = document.createElement('span');
        s.className = p.end ? 'sy we' : 'sy';
        s.textContent = p.text;
        return s;
      }));
    } else el.textContent = translit(dev, l, el.dataset.iast, el.hasAttribute('data-cap'));
    el.lang = (l === 'pi' ? 'pi-' : l + '-') + SCRIPT_LANG[script];
  }

  // ---------- building the pages from data ----------
  const UNITS = new Map();
  function mk(tag, cls, kids) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (kids != null) e.append(...[].concat(kids).filter(k => k != null));
    return e;
  }
  function numEl(n, f) {
    const s = mk('span', 'n');
    s.dataset.n = n;
    s.dataset.f = f || '%)';
    return s;
  }
  function tEl(d, l, o = {}) {
    const s = mk('span', 't');
    s.dataset.l = l;
    s.dataset.dev = d;
    if (o.ia) s.dataset.iast = o.ia;
    if (o.cap) s.dataset.cap = '';
    if (d.includes('\n')) s.classList.add('ml');
    if (o.v) s.classList.add('vt');
    return s;
  }
  function trEl(o, tag) {
    if (!o || !(o.en || o.ru)) return null;
    const s = mk(tag || 'span', 'tr');
    s.dataset.en = o.en || '';
    s.dataset.ru = o.ru || '';
    return s;
  }
  function hiEl(h, cls) {
    return mk('span', cls || 'hi', [tEl(h.d, h.l || 'hi', { ia: h.ia }), trEl(h)]);
  }
  function remember(id, tr) {
    if (UNITS.has(id)) console.warn('Duplicate line id', id);
    UNITS.set(id, tr);
  }
  function unitEl(x, inline) {
    const b = mk(inline ? 'span' : 'button', 'ln');
    if (inline) { b.setAttribute('role', 'button'); b.tabIndex = 0; } else b.type = 'button';
    b.dataset.id = x.id;
    if (x.n != null) b.append(numEl(String(x.n), x.f));
    b.append(tEl(x.d, 'pi', x));
    if (x.full) b.dataset.full = x.full;
    remember(x.id, { en: x.en, ru: x.ru });
    return b;
  }
  const fillD = (tpl, f) => tpl.replace(/\{(\w+)\}/g, (m, k) => f[k] != null ? f[k] : '');
  function fillT(tpl, forms) {
    const f = typeof forms === 'string' ? { t: forms } : forms;
    return tpl.replace(/\{(\w+)\}/g, (m, k) => k === 'T' ? capFirst(f.t) : f[k] != null ? f[k] : '');
  }
  const arrows = () => [mk('span', 'arr arr-r d-only'), mk('span', 'arr arr-d m-only')];

  const R = {
    sec(b) {
      const h = mk('h2', 'sec-h');
      if (b.n) h.append(numEl(String(b.n), '(%)'));
      h.append(b.pi ? tEl(b.pi, 'pi', { cap: 1 }) : tEl(b.hi.d, 'hi', { ia: b.hi.ia }));
      if (b.gl) h.append(mk('span', 'gl', tEl(b.gl.d, 'hi', { ia: b.gl.ia })));
      return [h, trEl(b, 'p')];
    },
    h(b) { return [mk('h2', 'big-h', tEl(b.d, 'hi', { ia: b.ia })), trEl(b, 'p')]; },
    prose(b) {
      const p = mk('p', 'prose' + (b.box ? ' box boxp' : '') + (b.center ? ' center' : ''));
      b.u.forEach((x, i) => { if (i) p.append(' '); p.append(unitEl(x, true)); });
      return p;
    },
    lines(b) {
      const d = mk('div', 'lines' + (b.box ? ' box' : '') + (b.sep ? ' stack' : '') + (b.center ? ' center' : '') + (b.indent ? ' indent' : ''));
      b.u.forEach(x => d.append(unitEl(x)));
      return d;
    },
    down() { return mk('span', 'arr arr-d solo-d'); },
    plus() { return mk('div', 'plus', '+'); },
    marks() { return mk('div', 'marks', '| | |'); },
    cap(b) { return mk('p', 'cap' + (b.left ? ' left' : ''), hiEl(b)); },
    leader(b) {
      const x = b.u;
      const btn = mk('button', 'ln leader', [tEl(x.a, 'pi', { cap: 1 }), mk('span', 'dots'), tEl(x.b, 'pi')]);
      btn.type = 'button';
      btn.dataset.id = x.id;
      btn.dataset.full = x.a + ' … ' + x.b;
      remember(x.id, { en: x.en, ru: x.ru });
      const box = mk('div', 'box leader-box', btn);
      if (b.note) box.append(hiEl(b.note, 'hi leader-note'));
      return box;
    },
    fan(b) {
      const g = mk('div', 'fan' + (b.v ? ' fan-v' : ''));
      const N = b.left.length;
      b.left.forEach((x, i) => {
        const e = unitEl(x);
        e.classList.add('fl');
        if (i === 0) e.classList.add('first');
        e.style.gridRow = i + 1;
        const a = mk('span', 'arr arr-r fa');
        a.style.gridRow = i + 1;
        g.append(e, a);
      });
      g.append(mk('span', 'arr arr-d m-only fan-d'));
      const r = mk('div', 'fr box');
      r.style.gridRow = '1 / span ' + N;
      if (b.v) { r.classList.add('vbox'); r.append(unitEl(Object.assign({ v: 1 }, b.v))); }
      else {
        if (b.right.length === N) r.classList.add('sub');
        b.right.forEach(x => r.append(unitEl(x)));
      }
      g.append(r);
      return g;
    },
    flow(b) {
      const g = mk('div', 'flow');
      if (b.cols) g.style.setProperty('--cols', b.cols);
      b.parts.forEach((p, i) => {
        if (i) g.append(...arrows());
        let e;
        if (p.para) {
          e = mk('p', 'box boxp');
          p.u.forEach((x, k) => { if (k) e.append(' '); e.append(unitEl(x, true)); });
        } else {
          e = mk('div', 'box lines' + (p.sep ? ' stack' : '') + (p.solo ? ' solo' : ''));
          p.u.forEach(x => e.append(unitEl(x)));
        }
        g.append(e);
      });
      return g;
    },
    brk(b) {
      const side = list => mk('div', 'brk', list.map(x => unitEl(x)));
      return mk('div', 'bf', [side(b.left), ...arrows(), side(b.right)]);
    },
    cols2(b) { return mk('div', 'ten', b.u.map(x => unitEl(x))); },
    chips(b) {
      const groups = mk('div', 'chips-groups');
      b.groups.forEach(g => {
        const lab = mk('div', 'chips-label', hiEl(g.label));
        if (g.count) lab.append(mk('span', 'count', numEl(g.count, '%')));
        const list = mk('div', 'chips-list', g.u.map(x => { const e = unitEl(x); e.classList.add('chip'); return e; }));
        groups.append(mk('div', 'chips-row', [lab, list]));
      });
      return mk('div', 'chips', [b.side ? hiEl(b.side, 'hi chips-side') : null, groups]);
    },
    table(b) {
      const t = mk('table', 'tbl' + (b.cls ? ' ' + b.cls : ''));
      b.rows.forEach((row, ri) => {
        const tr = mk('tr');
        row.forEach(c => {
          const cell = mk(ri === 0 || c.th ? 'th' : 'td');
          if (c.u) cell.append(unitEl(c.u));
          else if (c.hi) cell.append(hiEl(c.hi));
          else if (c.ref) {
            const r = mk('button', 'ref', [numEl(c.n, '(%)'), ' ″']);
            r.type = 'button';
            r.dataset.ref = c.ref;
            cell.append(r);
          }
          tr.append(cell);
        });
        t.append(tr);
      });
      return mk('div', 'tbl-wrap', t);
    },
    pairs(b) {
      const w = mk('div', 'pairs');
      if (b.head) w.append(mk('div', 'pairs-head', b.head.map(h => hiEl(h))));
      b.rows.forEach(r => w.append(mk('div', 'pair', [
        mk('div', 'pair-lines', r.u.map(x => unitEl(x))),
        mk('div', 'pair-label', tEl(r.label, 'pi'))
      ])));
      return w;
    },
    terms(b) {
      const grid = mk('div', 'terms-grid', b.items.map(it => mk('div', 'term', [unitEl(it.u), it.gl ? hiEl(it.gl, 'hi term-gl') : null])));
      return mk('div', 'terms', [b.lead ? hiEl(b.lead, 'hi terms-lead') : null, grid]);
    },
    matA(b) {
      // Rows are templates; choosing a column puts its term into the [ ] slots, as the brochure asks the reader to do
      const t = mk('table', 'tbl mat-tbl');
      const head = mk('tr', null, mk('th', 'corner', b.corner != null ? b.corner : '[ ]'));
      b.cols.forEach((c, ci) => {
        const e = unitEl({ id: c.id, d: c.d, en: c.h[0], ru: c.h[1] });
        e.dataset.col = ci;
        e.append(mk('span', 'cn', numEl(String(ci + 1), '%')));
        head.append(mk('th', 'colh', e));
      });
      t.append(head);
      const rowEls = [];
      b.rows.forEach((r, ri) => {
        const re = unitEl({ id: r.id, d: fillD(r.d, b.cols[0].f), en: fillT(r.en, b.cols[0].e), ru: fillT(r.ru, b.cols[0].r), n: String(ri + 1), f: '(%)' });
        rowEls.push(re);
        const tr = mk('tr', null, mk('th', 'rowh', re));
        b.cols.forEach((c, ci) => {
          const cid = b.id + '.' + (ri + 1) + '.' + (ci + 1);
          const ce = mk('button', 'ln cell', mk('span', 'cell-dot'));
          ce.type = 'button';
          ce.dataset.id = cid;
          ce.dataset.col = ci;
          ce.dataset.full = fillD(r.d, c.f).replace(/[[\]]/g, '');
          remember(cid, { en: fillT(r.en, c.e), ru: fillT(r.ru, c.r) });
          tr.append(mk('td', null, ce));
        });
        t.append(tr);
      });
      const w = mk('div', 'mat', [b.title ? hiEl(b.title, 'hi mat-title') : null, mk('div', 'tbl-wrap', t), b.note ? hiEl(b.note, 'hi mat-note') : null]);
      const select = ci => {
        rowEls.forEach((re, ri) => {
          const r = b.rows[ri], te = re.querySelector('.t');
          te.dataset.dev = fillD(r.d, b.cols[ci].f);
          renderT(te);
          UNITS.set(re.dataset.id, { en: fillT(r.en, b.cols[ci].e), ru: fillT(r.ru, b.cols[ci].r) });
        });
        t.querySelectorAll('.colh').forEach((th, i) => th.classList.toggle('sel', i === ci));
      };
      w.addEventListener('click', e => { const x = e.target.closest('[data-col]'); if (x) select(+x.dataset.col); }, true);
      t.querySelector('.colh').classList.add('sel');
      return w;
    },
    matB(b) {
      // Cells carry their own text; the chosen cell goes into the [ ] of the sentence next to the table
      const cellT = cell => fillT(b.tpl.en, { C: capFirst(cell.en), c: cell.en });
      const cellR = cell => fillT(b.tpl.ru, { C: capFirst(cell.ru), c: cell.ru });
      const first = b.rows[0].cells[0];
      const te = unitEl({ id: b.tpl.id, d: fillD(b.tpl.d, { c: first.d }), en: cellT(first), ru: cellR(first), cap: 1 });
      const t = mk('table', 'tbl matb-tbl');
      const head = mk('tr', null, mk('th', 'corner', b.corner != null ? b.corner : '[ ]'));
      b.cols.forEach((c, ci) => {
        const e = unitEl({ id: b.id + '.h' + (ci + 1), d: c.d, en: c.h[0], ru: c.h[1] });
        head.append(mk('th', 'colh', [e, c.gl ? hiEl(c.gl, 'hi gl-s') : null, mk('span', 'cn', numEl(String(ci + 1), '%'))]));
      });
      t.append(head);
      let k = 0;
      b.rows.forEach((r, ri) => {
        const tr = mk('tr', null, mk('th', 'rowh', [numEl(String(ri + 1), '(%)'), hiEl(r.label)]));
        r.cells.forEach((c, ci) => {
          k++;
          const cid = b.id + '.' + (ri + 1) + '.' + (ci + 1);
          const ce = mk('button', 'ln cell filled', [tEl(c.d, 'pi'), numEl(String(k), '%')]);
          ce.type = 'button';
          ce.dataset.id = cid;
          ce.dataset.full = fillD(b.tpl.d, { c: c.d }).replace(/[[\]]/g, '');
          ce._cell = c;
          remember(cid, { en: cellT(c), ru: cellR(c) });
          tr.append(mk('td', null, ce));
        });
        t.append(tr);
      });
      t.addEventListener('click', e => {
        const ce = e.target.closest('.cell');
        if (!ce) return;
        const tt = te.querySelector('.t');
        tt.dataset.dev = fillD(b.tpl.d, { c: ce._cell.d });
        renderT(tt);
        UNITS.set(b.tpl.id, { en: cellT(ce._cell), ru: cellR(ce._cell) });
      }, true);
      const table = [b.title ? hiEl(b.title, 'hi mat-title') : null, mk('div', 'tbl-wrap', t)];
      const sentence = mk('div', 'matb-tpl', te);
      return mk('div', 'mat', b.tplFirst ? [sentence, ...table, b.note ? hiEl(b.note, 'hi mat-note') : null]
        : [...table, sentence, b.note ? hiEl(b.note, 'hi mat-note') : null]);
    },
    ayt(b) {
      const pairs = mk('div', 'ayt-pairs', b.pairs.map(p => mk('div', 'box ayt-pair', p.map(x => unitEl(x)))));
      const vb = mk('div', 'box vbox ayt-v', unitEl(Object.assign({ v: 1 }, b.v)));
      const st = mk('div', 'box lines ayt-st', b.st.map(x => unitEl(x)));
      return mk('div', 'ayt-wrap', [b.title ? hiEl(b.title, 'hi mat-title') : null,
        mk('div', 'ayt', [pairs, ...arrows(), vb, ...arrows(), st])]);
    },
    grid6(b) {
      const t = mk('table', 'g6');
      t.append(mk('tr', null, [mk('th'), ...b.cols.map((c, i) => mk('th', 'g6-n', numEl(String(i + 1), '%')))]));
      t.append(mk('tr', null, [mk('th', 'g6-l', hiEl(b.rows[0])), ...b.cols.map(c => mk('td', null, [unitEl(c.a), c.ag ? hiEl(c.ag, 'hi gl-s') : null]))]));
      t.append(mk('tr', null, [mk('th'), ...b.cols.map(() => mk('td', 'g6-a', mk('span', 'arr arr-d')))]));
      t.append(mk('tr', null, [mk('th', 'g6-l', hiEl(b.rows[1])), ...b.cols.map(c => mk('td', null, [unitEl(c.b), c.bg ? hiEl(c.bg, 'hi gl-s') : null]))]));
      return mk('div', 'tbl-wrap', t);
    },
    supp(b) {
      const l = mk('p', 'supp-label ui');
      l.dataset.en = b.en;
      l.dataset.ru = b.ru;
      const w = mk('div', 'supp', l);
      renderBlocks(b.blocks, w);
      return w;
    }
  };
  function renderBlocks(blocks, parent) {
    blocks.forEach(b => {
      if (!R[b.t]) { console.warn('Unknown block', b.t); return; }
      [].concat(R[b.t](b)).filter(Boolean).forEach(e => parent.append(e));
    });
  }

  const main = $('pages');
  for (let n = 1; n <= NPAGES; n++) {
    const sec = mk('section', 'page');
    sec.id = 'p' + n;
    sec.dataset.page = n;
    sec.hidden = true;
    if (PAGES[n]) renderBlocks(PAGES[n].blocks, sec);
    main.append(sec);
  }

  // ---------- interface text ----------
  const UI = {
    en: {
      page: 'Page {n} of 11', pages: 'Pages',
      credit: 'Tables by Sri Bednath, Vipassana Acharya, Nepal, with every repetition of the sutta left out. Each line opens its audio explanation.',
      script: 'Script', translation: 'Language',
      playPage: 'Play page', pausePage: 'Pause',
      hint: 'Tap any line of the sutta to hear its explanation and see it translated into English and Russian. In the matrices, tap a cell to put its term into the [ ] brackets.',
      demo: 'Demo: audio not linked yet', lineOf: 'Line {n} of {N}', cell: 'Matrix cell',
      orig: 'Original page (scan)',
      note: 'Pali checked against the Chaṭṭha Saṅgāyana text of DN 22; misprints in the brochure are corrected.',
      prev: 'Previous line', next: 'Next line', play: 'Play', pause: 'Pause', close: 'Close player',
      prevPage: 'Previous page', nextPage: 'Next page',
      tIast: 'Latin with diacritics (IAST)', tPlain: 'Latin without diacritics', tCyr: 'Cyrillic', tCyrs: 'Cyrillic with diacritics', tDev: 'Original Devanagari'
    },
    ru: {
      page: 'Страница {n} из 11', pages: 'Страницы',
      credit: 'Схемы Шри Беднатха, ачарьи Випассаны из Непала, без повторов, которые есть в сутте. По каждой строке открывается аудиопояснение.',
      script: 'Письмо', translation: 'Язык',
      playPage: 'Слушать страницу', pausePage: 'Пауза',
      hint: 'Нажмите на любую строку сутты, чтобы услышать объяснение и увидеть перевод на русский и английский. В матрицах нажмите на ячейку, чтобы подставить её термин в скобки [ ].',
      demo: 'Демо: аудио ещё не подключено', lineOf: 'Строка {n} из {N}', cell: 'Ячейка матрицы',
      orig: 'Оригинал страницы (скан)',
      note: 'Текст на пали сверен с изданием Чаттха Сангаяна (DN 22); опечатки брошюры исправлены.',
      prev: 'Предыдущая строка', next: 'Следующая строка', play: 'Слушать', pause: 'Пауза', close: 'Закрыть плеер',
      prevPage: 'Предыдущая страница', nextPage: 'Следующая страница',
      tIast: 'Латиница с диакритикой (IAST)', tPlain: 'Латиница без диакритики', tCyr: 'Кириллица', tCyrs: 'Кириллица с диакритикой', tDev: 'Оригинал на деванагари'
    }
  };

  let page = 1;
  let lines = [], seq = [];

  function renderText() {
    document.body.classList.toggle('script-dev', script === 'dev');
    document.querySelectorAll('.t').forEach(renderT);
    document.querySelectorAll('.n').forEach(el => {
      const n = script === 'dev' ? el.dataset.n.replace(/\d/g, d => DEV_DIGITS[d]) : el.dataset.n;
      el.textContent = el.dataset.f.replace('%', n);
    });
    updatePlayer();
  }

  function renderLang() {
    const L = UI[lang];
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = L[el.dataset.i18n]; });
    document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = L[el.dataset.i18nTitle]; });
    document.querySelectorAll('[data-i18n-label]').forEach(el => { el.setAttribute('aria-label', L[el.dataset.i18nLabel]); });
    document.querySelectorAll('.ui').forEach(el => { el.textContent = el.dataset[lang]; });
    const order = lang === 'ru' ? ['ru', 'en'] : ['en', 'ru'];
    document.querySelectorAll('.tr').forEach(el => {
      el.replaceChildren(...order.filter(code => el.dataset[code]).map(code => {
        const s = mk('span', 'tr-l', el.dataset[code]);
        s.lang = code;
        return s;
      }));
    });
    $('page-label').textContent = L.page.replace('{n}', page);
    updatePlayer();
  }

  // ---------- pages ----------
  const pager = $('pager');
  for (let n = 1; n <= NPAGES; n++) {
    const a = mk('a', 'pg', String(n));
    a.href = '#p' + n;
    a.dataset.page = n;
    pager.append(a);
  }

  function showPage(n, scroll) {
    if (!PAGES[n] && n !== 1) n = 1;
    closePlayer();
    page = n;
    document.querySelectorAll('.page').forEach(s => { s.hidden = +s.dataset.page !== n; });
    const sec = $('p' + n);
    lines = [...sec.querySelectorAll('.ln')];
    seq = lines.filter(l => !l.classList.contains('cell'));
    pager.querySelectorAll('.pg').forEach(a => {
      if (+a.dataset.page === n) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    $('page-label').textContent = UI[lang].page.replace('{n}', n);
    $('scan').src = 'scans/page-' + String(n).padStart(2, '0') + '.jpg';
    $('scan').alt = 'Scan of page ' + n + ' of the printed brochure, in Devanagari';
    $('pg-prev').disabled = n === 1;
    $('pg-next').disabled = n === NPAGES;
    if (location.hash !== '#p' + n) history.replaceState(null, '', '#p' + n);
    if (scroll) window.scrollTo({ top: 0, behavior: 'auto' });
  }

  // ---------- player ----------
  const audio = new Audio();
  audio.preload = 'none';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ICON_PLAY = 'M4 2v12l10-6z', ICON_PAUSE = 'M3 2h3.5v12H3zM9.5 2H13v12H9.5z';

  let cur = null, playing = false, pageMode = false, t0 = 0, done = 0, dur = 0, raf = 0;

  const toSec = v => typeof v === 'number' ? v : String(v).split(':').map(Number).reduce((a, b) => a * 60 + b, 0);
  function cueFor(el) {
    const c = el && CUES[el.dataset.id];
    if (!c || !SOURCES[c[0]]) return null;
    return { src: SOURCES[c[0]], start: toSec(c[1]), end: toSec(c[2]) };
  }
  function unitText(el) {
    if (el.dataset.full) return translit(el.dataset.full, 'pi', null, true);
    return [...el.querySelectorAll('.n, .t')].map(x =>
      x.classList.contains('vt') ? translit(x.dataset.dev, 'pi') : x.textContent
    ).join(' ').replace(/\s+/g, ' ').trim();
  }
  const demoDur = el => Math.min(7, Math.max(2.5, 1.5 + unitText(el).length * 0.045));
  const fmt = s => { s = Math.max(0, s); const m = Math.floor(s / 60), r = Math.floor(s % 60); return m + ':' + String(r).padStart(2, '0'); };

  function elapsed() {
    const c = cueFor(cur);
    if (c) return Math.max(0, audio.currentTime - c.start);
    return playing ? done + (performance.now() - t0) / 1000 : done;
  }

  function mark(el) {
    lines.forEach(l => { l.classList.remove('on'); l.removeAttribute('aria-current'); });
    if (el) { el.classList.add('on'); el.setAttribute('aria-current', 'true'); }
  }

  function start(el, scroll) {
    if (!el) return;
    cancelAnimationFrame(raf);
    audio.pause();
    cur = el;
    mark(el);
    $('player').hidden = false;
    document.body.classList.add('has-player');
    if (scroll) el.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    const c = cueFor(el);
    if (c) {
      if (audio.dataset.src !== c.src) { audio.src = c.src; audio.dataset.src = c.src; }
      audio.currentTime = c.start;
      dur = c.end - c.start;
      audio.play().catch(() => {});
    } else dur = demoDur(el);
    done = 0;
    t0 = performance.now();
    playing = true;
    loop();
    updatePlayer();
  }

  function loop() {
    cancelAnimationFrame(raf);
    const step = () => {
      const e = elapsed();
      setProgress(e);
      if (e >= dur) { finished(); return; }
      if (playing) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  function pause() {
    if (!playing) return;
    if (cueFor(cur)) audio.pause(); else done = elapsed();
    playing = false;
    cancelAnimationFrame(raf);
    updatePlayer();
  }

  function resume() {
    if (playing || !cur) return;
    if (elapsed() >= dur) { start(cur, false); return; }
    if (cueFor(cur)) audio.play().catch(() => {}); else t0 = performance.now();
    playing = true;
    loop();
    updatePlayer();
  }

  // the next or previous line in reading order; matrix cells are skipped
  function neighbor(dir) {
    const i = lines.indexOf(cur);
    for (let k = i + dir; k >= 0 && k < lines.length; k += dir) if (!lines[k].classList.contains('cell')) return lines[k];
    return null;
  }

  function finished() {
    playing = false;
    audio.pause();
    setProgress(dur);
    const nx = pageMode && neighbor(1);
    if (nx) start(nx, true);
    else { pageMode = false; updatePlayer(); }
  }

  function closePlayer() {
    pause();
    pageMode = false;
    mark(null);
    cur = null;
    $('player').hidden = true;
    document.body.classList.remove('has-player');
    updatePlayer();
  }

  function setProgress(e) {
    $('pl-prog').style.width = (dur ? Math.min(100, e / dur * 100) : 0) + '%';
    $('pl-time').textContent = fmt(e) + ' / ' + fmt(dur);
  }

  function updatePlayer() {
    const L = UI[lang];
    $('pl-icon').firstElementChild.setAttribute('d', playing ? ICON_PAUSE : ICON_PLAY);
    $('pl-toggle').setAttribute('aria-label', playing ? L.pause : L.play);
    const pagePlaying = pageMode && playing;
    $('pa-label').textContent = pagePlaying ? L.pausePage : L.playPage;
    $('pa-icon').firstElementChild.setAttribute('d', pagePlaying ? ICON_PAUSE : ICON_PLAY);
    if (!cur) return;
    $('pl-text').textContent = unitText(cur);
    const tr = UNITS.get(cur.dataset.id);
    const order = lang === 'ru' ? [['ru', 'ru'], ['en', 'en']] : [['en', 'en'], ['ru', 'ru']];
    $('pl-tr').replaceChildren(...(tr ? order.filter(([code]) => tr[code]).map(([code]) => {
      const txt = mk('span', null, tr[code]);
      txt.lang = code;
      return mk('p', null, [mk('span', 'pl-tag', code.toUpperCase()), txt]);
    }) : []));
    const si = seq.indexOf(cur);
    $('pl-count').textContent = si >= 0 ? L.lineOf.replace('{n}', si + 1).replace('{N}', seq.length) : L.cell;
    $('pl-note').textContent = cueFor(cur) ? '' : L.demo;
    $('pl-prev').disabled = !neighbor(-1);
    $('pl-next').disabled = !neighbor(1);
    setProgress(elapsed());
  }

  function activate(el) {
    if (el === cur) playing ? pause() : resume();
    else start(el, false);
  }

  document.addEventListener('click', e => {
    const ref = e.target.closest('.ref');
    if (ref) {
      const target = $('p' + page).querySelector('.ln[data-id="' + ref.dataset.ref + '"]');
      if (target) { target.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' }); activate(target); }
      return;
    }
    const ln = e.target.closest('.ln');
    if (ln && main.contains(ln)) activate(ln);
  });
  main.addEventListener('keydown', e => {
    const ln = e.target.closest('span.ln');
    if (ln && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); ln.click(); }
  });
  $('pl-toggle').addEventListener('click', () => playing ? pause() : resume());
  $('pl-prev').addEventListener('click', () => start(neighbor(-1), true));
  $('pl-next').addEventListener('click', () => start(neighbor(1), true));
  $('pl-close').addEventListener('click', closePlayer);
  $('play-all').addEventListener('click', () => {
    if (pageMode && playing) pause();
    else if (pageMode && cur) resume();
    else { pageMode = true; start(seq[0], true); }
  });
  audio.addEventListener('ended', () => { if (playing) finished(); });

  if ('ResizeObserver' in window) {
    new ResizeObserver(() => {
      const h = $('player').offsetHeight;
      if (h) document.documentElement.style.setProperty('--pl-h', h + 'px');
    }).observe($('player'));
  }

  // ---------- switches and navigation ----------
  document.querySelectorAll('input[name="script"]').forEach(r => {
    r.checked = r.value === script;
    r.addEventListener('change', () => { script = r.value; store.set('mspm-script', script); renderText(); });
  });
  document.querySelectorAll('input[name="lang"]').forEach(r => {
    r.checked = r.value === lang;
    r.addEventListener('change', () => { lang = r.value; store.set('mspm-lang', lang); renderLang(); });
  });
  pager.addEventListener('click', e => {
    const a = e.target.closest('.pg');
    if (!a) return;
    e.preventDefault();
    showPage(+a.dataset.page, true);
  });
  $('pg-prev').addEventListener('click', () => showPage(page - 1, true));
  $('pg-next').addEventListener('click', () => showPage(page + 1, true));
  window.addEventListener('hashchange', () => {
    const m = location.hash.match(/^#p(\d+)$/);
    if (m && +m[1] !== page) showPage(+m[1], true);
  });

  const m = location.hash.match(/^#p(\d+)$/);
  showPage(m ? Math.min(NPAGES, Math.max(1, +m[1])) : 1, false);
  renderLang();
  renderText();
})();
