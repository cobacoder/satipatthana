// Content helpers shared by the page files in js/pages/. Each page file calls PAGE(n, blocks).
// Block types and their fields are drawn by js/app.js (see the R object there).
window.PAGES = [];
function PAGE(n, blocks) { window.PAGES[n] = { n, blocks }; }

// A clickable line of Pali: id, Devanagari, English, Russian, options
// (n: number, f: number format such as '(%)', cap: capitalise in Latin and Cyrillic)
function u(id, d, en, ru, o) { return Object.assign({ id, d, en, ru }, o); }

// Hindi (or Marathi, l = 'mr') with its hand-made ISO 15919 transliteration and translations
function hi(d, ia, en, ru, l) { return { d, ia, en, ru, l }; }

function sec(n, pi, gl, en, ru) { return { t: 'sec', n, pi, gl, en, ru }; }
function supp(en, ru, blocks) { return { t: 'supp', en, ru, blocks }; }

// The closing refrain of a section, sentence by sentence (DN 22 repeats it after every section)
const OBJ = {
  kaya: { x: 'काये कायानुपस्सी', y: 'कायस्मिं', z: '‘अत्थि कायो’ति',
    en: ['body in body', 'in the body', '‘This is body’'], ru: ['тело в теле', 'в теле', '«Это тело»'] },
  vedana: { x: 'वेदनासु वेदनानुपस्सी', y: 'वेदनासु', z: '‘अत्थि वेदना’ति',
    en: ['sensations in sensations', 'in sensations', '‘These are sensations’'], ru: ['ощущения в ощущениях', 'в ощущениях', '«Это ощущения»'] },
  citta: { x: 'चित्ते चित्तानुपस्सी', y: 'चित्तस्मिं', z: '‘अत्थि चित्त’न्ति',
    en: ['mind in mind', 'in the mind', '‘This is mind’'], ru: ['ум в уме', 'в уме', '«Это ум»'] },
  dhamma: { x: 'धम्मेसु धम्मानुपस्सी', y: 'धम्मेसु', z: '‘अत्थि धम्मा’ति',
    en: ['mental contents in mental contents', 'in mental contents', '‘These are mental contents’'],
    ru: ['содержание ума в содержании ума', 'в содержании ума', '«Это содержание ума»'] }
};
function refrain(p, from, key, tail) {
  const o = OBJ[key], e = o.en, r = o.ru, t = tail || { d: '', en: '', ru: '' };
  const id = k => p + '.' + String(from + k).padStart(2, '0');
  return [
    u(id(0), 'इति अज्झत्तं वा ' + o.x + ' विहरति,', `And so he dwells observing ${e[0]} internally,`, `Так он пребывает, наблюдая ${r[0]} внутри,`, { cap: 1 }),
    u(id(1), 'बहिद्धा वा ' + o.x + ' विहरति,', `or he dwells observing ${e[0]} externally,`, `или пребывает, наблюдая ${r[0]} снаружи,`),
    u(id(2), 'अज्झत्तबहिद्धा वा ' + o.x + ' विहरति।', `or he dwells observing ${e[0]} both internally and externally.`, `или пребывает, наблюдая ${r[0]} и внутри, и снаружи.`),
    u(id(3), 'समुदयधम्मानुपस्सी वा ' + o.y + ' विहरति,', `He dwells observing the phenomenon of arising ${e[1]},`, `Он пребывает, наблюдая явление возникновения ${r[1]},`, { cap: 1 }),
    u(id(4), 'वयधम्मानुपस्सी वा ' + o.y + ' विहरति,', `or the phenomenon of passing away ${e[1]},`, `или явление исчезновения ${r[1]},`),
    u(id(5), 'समुदयवयधम्मानुपस्सी वा ' + o.y + ' विहरति।', `or the phenomenon of arising and passing away ${e[1]}.`, `или явление возникновения и исчезновения ${r[1]}.`),
    u(id(6), o.z + ' वा पनस्स सति पच्चुपट्ठिता होति', `Or else his awareness is established: ${e[2]},`, `Или же в нём устанавливается осознанность: ${r[2]},`, { cap: 1 }),
    u(id(7), 'यावदेव ञाणमत्ताय पटिस्सतिमत्ताय,', 'just to the extent of mere understanding and mere awareness,', 'лишь в той мере, что нужна для чистого понимания и чистой осознанности,'),
    u(id(8), 'अनिस्सितो च विहरति,', 'and he dwells detached,', 'и он пребывает отстранённым,'),
    u(id(9), 'न च किञ्चि लोके उपादियति।', 'not clinging to anything in the world.', 'ни за что в мире не цепляясь.'),
    u(id(10), 'एवम्पि खो, भिक्खवे, भिक्खु ' + o.x + ' विहरति' + t.d + '।', `This too, monks, is how a monk dwells observing ${e[0]}${t.en}.`, `Вот так, монахи, монах пребывает, наблюдая ${r[0]}${t.ru}.`, { cap: 1 })
  ];
}

// "Iti ajjhattaṃ vā ........ viharati": the brochure's short form of the refrain
function leader(id, key, a, b, tail, note) {
  const o = OBJ[key], t = tail || { en: '', ru: '' };
  return {
    t: 'leader', note,
    u: { id, a, b,
      en: `“And so he dwells observing ${o.en[0]} internally … observing ${o.en[0]}${t.en}.” The full refrain, said again here.`,
      ru: `«Так он пребывает, наблюдая ${o.ru[0]} внутри… наблюдая ${o.ru[0]}${t.ru}». Полный рефрен, который читается здесь снова.` }
  };
}

// The 10 × 6 matrix of what is dear and pleasing in the world (pages 9 and 10)
const SIX_COLS = [
  { d: 'चक्खु', gl: hi('(= चक्षु)', '(= cakṣu)'), h: ['eye', 'глаз'] },
  { d: 'सोत', gl: hi('(श्रोत = कान)', '(śrot = kān)'), h: ['ear', 'ухо'] },
  { d: 'घान', gl: hi('(घ्राण = नाक)', '(ghrāṇ = nāk)'), h: ['nose', 'нос'] },
  { d: 'जिव्हा', gl: hi('(= जीभ)', '(= jībh)'), h: ['tongue', 'язык'] },
  { d: 'काय', gl: hi('(= शरीर)', '(= śarīr)'), h: ['body', 'тело'] },
  { d: 'मन', gl: hi('(= चित्त)', '(= citt)'), h: ['mind', 'ум'] }
];
function sixtyRows() {
  const sense = ['चक्खु', 'सोतं', 'घानं', 'जिव्हा', 'कायो', 'मनो'];
  const stem = ['चक्खु', 'सोत', 'घान', 'जिव्हा', 'काय', 'मनो'];
  const obj = ['रूपा', 'सद्दा', 'गन्धा', 'रसा', 'फोट्ठब्बा', 'धम्मा'];
  const ostem = ['रूप', 'सद्द', 'गन्ध', 'रस', 'फोट्ठब्ब', 'धम्म'];
  const sEn = ['the eye', 'the ear', 'the nose', 'the tongue', 'the body', 'the mind'];
  const stEn = ['eye', 'ear', 'nose', 'tongue', 'body', 'mind'];
  const oEn = ['visible forms', 'sounds', 'smells', 'tastes', 'touches', 'mental objects'];
  const sRu = ['глаз', 'ухо', 'нос', 'язык', 'тело', 'ум'];
  const sRuG = ['глаза', 'уха', 'носа', 'языка', 'тела', 'ума'];
  const oRu = ['видимые формы', 'звуки', 'запахи', 'вкусы', 'прикосновения', 'объекты ума'];
  const oRuG = ['видимых форм', 'звуков', 'запахов', 'вкусов', 'прикосновений', 'объектов ума'];
  const oRuP = ['о видимых формах', 'о звуках', 'о запахах', 'о вкусах', 'о прикосновениях', 'об объектах ума'];
  const rows = [
    [hi('६ इंद्रिय', '6 iṃdriya', '6 sense organs', '6 органов чувств'), i => sense[i] + ' लोके', i => sEn[i], i => sRu[i]],
    [hi('६ विषय', '6 viṣay', '6 sense objects', '6 объектов чувств'), i => obj[i] + ' लोके', i => oEn[i], i => oRu[i]],
    [hi('६ विज्ञान', '6 vijñān', '6 kinds of consciousness', '6 видов сознания'), i => stem[i] + 'विञ्ञाणं लोके', i => stEn[i] + '-consciousness', i => 'сознание ' + sRuG[i]],
    [hi('६ संस्पर्श', '6 saṃsparś', '6 contacts', '6 контактов'), i => stem[i] + 'सम्फस्सो लोके', i => stEn[i] + '-contact', i => 'контакт ' + sRuG[i]],
    [hi('६ संस्पर्श द्वारा उत्पन्न वेदना', '6 saṃsparś dvārā utpann vedanā', '6 sensations born of contact', '6 ощущений, рождённых контактом'),
      i => stem[i] + 'सम्फस्सजा वेदना लोके', i => 'sensation born of ' + stEn[i] + '-contact', i => 'ощущение, рождённое контактом ' + sRuG[i]],
    [hi('६ संज्ञा', '6 saṃjñā', '6 perceptions', '6 восприятий'), i => ostem[i] + 'सञ्ञा लोके', i => 'perception of ' + oEn[i], i => 'восприятие ' + oRuG[i]],
    [hi('६ सञ्चेतना', '6 sañcetnā', '6 volitions', '6 намерений'), i => ostem[i] + 'सञ्चेतना लोके', i => 'volition regarding ' + oEn[i], i => 'намерение в отношении ' + oRuG[i]],
    [hi('६ तृष्णा', '6 tr̥ṣṇā', '6 cravings', '6 видов жажды'), i => ostem[i] + 'तण्हा लोके', i => 'craving for ' + oEn[i], i => 'жажда ' + oRuG[i]],
    [hi('६ वितर्क (आलंबन)', '6 vitark (ālaṃban)', '6 thoughts (turning the mind to an object)', '6 мыслей (обращение ума к объекту)'), i => ostem[i] + 'वितक्को लोके', i => 'thinking of ' + oEn[i], i => 'мысль ' + oRuP[i]],
    [hi('६ विचार (विचरण)', '6 vicār (vicaraṇ)', '6 reflections (staying with the object)', '6 обдумываний (пребывание с объектом)'), i => ostem[i] + 'विचारो लोके', i => 'reflection on ' + oEn[i], i => 'обдумывание ' + oRuG[i]]
  ];
  return rows.map(([label, d, en, ru]) => ({ label, cells: [0, 1, 2, 3, 4, 5].map(i => ({ d: d(i), en: en(i), ru: ru(i) })) }));
}
