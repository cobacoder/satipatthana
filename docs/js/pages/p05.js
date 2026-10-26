(() => {
  // sixteen states of mind in eight pairs
  const PAIRS = [
    ['सरागं', 'a mind with craving', 'ум с влечением', 'वीतरागं', 'a mind free from craving', 'ум без влечения'],
    ['सदोसं', 'a mind with aversion', 'ум с неприязнью', 'वीतदोसं', 'a mind free from aversion', 'ум без неприязни'],
    ['समोहं', 'a mind with delusion', 'ум с заблуждением', 'वीतमोहं', 'a mind free from delusion', 'ум без заблуждения'],
    ['सङ्खित्तं', 'a collected mind', 'собранный ум', 'विक्खित्तं', 'a scattered mind', 'рассеянный ум'],
    ['महग्गतं', 'an expanded mind', 'расширенный ум', 'अमहग्गतं', 'an unexpanded mind', 'нерасширенный ум'],
    ['सउत्तरं', 'a surpassable mind', 'превосходимый ум', 'अनुत्तरं', 'an unsurpassable mind', 'непревзойдённый ум'],
    ['समाहितं', 'a concentrated mind', 'сосредоточенный ум', 'असमाहितं', 'an unconcentrated mind', 'несосредоточенный ум'],
    ['विमुत्तं', 'a freed mind', 'освобождённый ум', 'अविमुत्तं', 'an unfreed mind', 'неосвобождённый ум']
  ];
  let k = 0;
  const line = (d, en, ru) => {
    k++;
    return u('5.' + String(k + 2).padStart(2, '0'), `${d} वा चित्तं ‘${d} चित्त’न्ति पजानाति।`,
      `${en[0].toUpperCase() + en.slice(1)}, he understands properly as ‘${en}’.`,
      `${ru[0].toUpperCase() + ru.slice(1)} он ясно знает как «${ru}».`, { n: k, f: '(%)' });
  };
  const rows = PAIRS.map(p => ({ u: [line(p[0], p[1], p[2]), line(p[3], p[4], p[5])], label: `${p[0]} – ${p[3]}` }));

  PAGE(5, [
    sec(10, 'चित्तानुपस्सना', hi('(= चित्तानुपश्यना)', '(= cittānupaśyanā)'), 'Observation of mind', 'Наблюдение ума'),
    { t: 'lines', box: 1, center: 1, u: [
      u('5.01', '“कथञ्च पन, भिक्खवे, भिक्खु चित्ते चित्तानुपस्सी विहरति?', '“And how, monks, does a monk dwell observing mind in mind?', '«Как же, монахи, монах пребывает, наблюдая ум в уме?', { cap: 1 }),
      u('5.02', 'इध, भिक्खवे, भिक्खु', 'Here, monks, a monk:', 'Здесь, монахи, монах:', { cap: 1 })
    ] },
    { t: 'pairs',
      head: [hi('(सोलह प्रकार के चित्त के आठ जोड़े हैं।)', '(solah prakār ke citt ke āṭh joṛe haiṃ.)', '(The sixteen kinds of mind form eight pairs.)', '(Шестнадцать видов ума образуют восемь пар.)'),
        hi('(आठ जोड़े)', '(āṭh joṛe)', '(eight pairs)', '(восемь пар)')],
      rows },
    { t: 'marks' },
    { t: 'prose', box: 1, u: refrain(5, 19, 'citta') },

    sec(11, 'धम्मानुपस्सना नीवरणपब्बं', hi('(= धर्मानुपश्यना – नीवरणपर्व)', '(= dharmānupaśyanā – nīvaraṇparv)'),
      'Observation of mental contents: the section on the hindrances', 'Наблюдение содержания ума: раздел о помехах'),
    { t: 'lines', box: 1, u: [
      u('5.30', '“कथञ्च पन, भिक्खवे, भिक्खु धम्मेसु धम्मानुपस्सी विहरति?', '“And how, monks, does a monk dwell observing mental contents in mental contents?', '«Как же, монахи, монах пребывает, наблюдая содержание ума в содержании ума?', { cap: 1 }),
      u('5.31', 'इध, भिक्खवे, भिक्खु धम्मेसु धम्मानुपस्सी विहरति पञ्चसु नीवरणेसु।', 'Here, monks, a monk dwells observing mental contents in mental contents with respect to the five hindrances.', 'Здесь, монахи, монах пребывает, наблюдая содержание ума в содержании ума в отношении пяти помех.', { cap: 1 }),
      u('5.32', 'कथञ्च पन, भिक्खवे, भिक्खु धम्मेसु धम्मानुपस्सी विहरति पञ्चसु नीवरणेसु?', 'And how, monks, does a monk dwell observing mental contents in mental contents with respect to the five hindrances?', 'Как же, монахи, монах пребывает, наблюдая содержание ума в содержании ума в отношении пяти помех?', { cap: 1 }),
      u('5.33', 'इध, भिक्खवे, भिक्खु', 'Here, monks, a monk:', 'Здесь, монахи, монах:', { cap: 1 })
    ] },
    { t: 'terms',
      lead: hi('(पञ्च नीवरण = पाँच नीवरण =', '(pañc nīvaraṇ = pāṃc nīvaraṇ =', '(the five hindrances:', '(пять помех:'),
      items: [
        { u: u('5.34', 'कामच्छन्द', 'sensual desire', 'чувственное желание', { n: 1, f: '(%)' }), gl: hi('कामना की इच्छा', 'kāmnā kī icchā', 'longing for what is desired', 'тяга к желаемому') },
        { u: u('5.35', 'ब्यापाद', 'ill will', 'недоброжелательность', { n: 2, f: '(%)' }), gl: hi('द्रोह-दुर्भावना', 'droh-durbhāvnā', 'hostility, ill feeling', 'враждебность, недобрые чувства') },
        { u: u('5.36', 'थिनमिद्ध', 'sloth and torpor', 'вялость и сонливость', { n: 3, f: '(%)' }), gl: hi('आलस्य', 'ālasya', 'laziness', 'лень') },
        { u: u('5.37', 'उद्धच्चकुक्कुच्च', 'agitation and remorse', 'беспокойство и сожаление', { n: 4, f: '(%)' }), gl: hi('उद्वेग-खेद', 'udveg-khed', 'restlessness and regret', 'тревога и досада') },
        { u: u('5.38', 'विचिकिच्छा', 'doubt', 'сомнение', { n: 5, f: '(%)' }), gl: hi('संदेह)', 'saṃdeh)', 'doubt)', 'сомнение)') }
      ] }
  ]);
})();
