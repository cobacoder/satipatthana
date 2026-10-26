PAGE(6, [
  { t: 'matA', id: '6.n', corner: '',
    title: hi('५ × ५ मेट्रिक्स', '5 × 5 meṭriks', '5 × 5 matrix', 'матрица 5 × 5'),
    // forms of each hindrance: a accusative, n nominative before ’ti, ti the ending after it, g genitive, ag ending of anuppanna-/uppanna-/pahīna-
    cols: [
      { id: '6.01', d: 'कामच्छन्दं', h: ['sensual desire', 'чувственное желание'], f: { a: 'कामच्छन्दं', n: 'कामच्छन्दो', ti: 'ति', g: 'कामच्छन्दस्स', ag: 'स्स' }, e: 'sensual desire', r: 'чувственное желание' },
      { id: '6.02', d: 'ब्यापादं', h: ['ill will', 'недоброжелательность'], f: { a: 'ब्यापादं', n: 'ब्यापादो', ti: 'ति', g: 'ब्यापादस्स', ag: 'स्स' }, e: 'ill will', r: 'недоброжелательность' },
      { id: '6.03', d: 'थिनमिद्धं', h: ['sloth and torpor', 'вялость и сонливость'], f: { a: 'थिनमिद्धं', n: 'थिनमिद्ध', ti: 'न्ति', g: 'थिनमिद्धस्स', ag: 'स्स' }, e: 'sloth and torpor', r: 'вялость и сонливость' },
      { id: '6.04', d: 'उद्धच्चकुक्कुच्चं', h: ['agitation and remorse', 'беспокойство и сожаление'], f: { a: 'उद्धच्चकुक्कुच्चं', n: 'उद्धच्चकुक्कुच्च', ti: 'न्ति', g: 'उद्धच्चकुक्कुच्चस्स', ag: 'स्स' }, e: 'agitation and remorse', r: 'беспокойство и сожаление' },
      { id: '6.05', d: 'विचिकिच्छं', h: ['doubt', 'сомнение'], f: { a: 'विचिकिच्छं', n: 'विचिकिच्छा', ti: 'ति', g: 'विचिकिच्छाय', ag: 'ाय' }, e: 'doubt', r: 'сомнение' }
    ],
    rows: [
      { id: '6.06', d: 'सन्तं वा अज्झत्तं [{a}] ‘अत्थि मे अज्झत्तं [{n}]’{ti} पजानाति।',
        en: 'When there is {t} in him, he understands properly: ‘There is {t} in me.’', ru: 'Когда в нём присутствует {t}, он ясно знает: «Во мне присутствует {t}».' },
      { id: '6.07', d: 'असन्तं वा अज्झत्तं [{a}] ‘नत्थि मे अज्झत्तं [{n}]’{ti} पजानाति।',
        en: 'When there is no {t} in him, he understands properly: ‘There is no {t} in me.’', ru: 'Когда в нём не присутствует {t}, он ясно знает: «Во мне не присутствует {t}».' },
      { id: '6.08', d: 'यथा च अनुप्पन्न{ag} [{g}] उप्पादो होति तञ्च पजानाति।',
        en: 'He understands properly how {t} that has not yet arisen arises.', ru: 'Он ясно знает, как возникает ещё не возникшее состояние: {t}.' },
      { id: '6.09', d: 'यथा च उप्पन्न{ag} [{g}] पहानं होति तञ्च पजानाति।',
        en: 'He understands properly how {t} that has arisen is eradicated.', ru: 'Он ясно знает, как устраняется возникшее состояние: {t}.' },
      { id: '6.10', d: 'यथा च पहीन{ag} [{g}] आयतिं अनुप्पादो होति तञ्च पजानाति।',
        en: 'He understands properly how {t}, once eradicated, does not arise again in the future.', ru: 'Он ясно знает, как устранённое состояние больше не возникает в будущем: {t}.' }
    ],
    note: hi('[ ] ब्रैकेट के भीतर “कामच्छन्दं” के बदले में बाकी के नीवरण रखकर पाँच-पाँच तरह से नीवरण पर्व का पाठ करना चाहिए।',
      '[ ] braiket ke bhītar “kāmacchandaṃ” ke badle meṃ bākī ke nīvaraṇ rakhkar pāṃc-pāṃc tarah se nīvaraṇ parv kā pāṭh karnā cāhie.',
      'Put each of the other hindrances in place of “kāmacchandaṃ” inside the [ ] brackets, and recite the section on the hindrances in five ways for each.',
      'Подставляйте в скобки [ ] вместо «камаччхандам» остальные помехи и читайте раздел о помехах пятью способами для каждой.') },
  { t: 'marks' },
  { t: 'prose', box: 1, u: refrain(6, 11, 'dhamma', { d: ' पञ्चसु नीवरणेसु', en: ' with respect to the five hindrances', ru: ' в отношении пяти помех' }) },
  { t: 'marks' },
  { t: 'cap', ...hi('(धम्मानुपश्यना के बाकी के पर्व के अन्त में भी यही बोल और चार बार आएगा।)', '(dhammānupaśyanā ke bākī ke parv ke ant meṃ bhī yahī bol aur cār bār āegā.)',
    '(The same words come four more times, at the end of the remaining sections on mental contents.)',
    '(Эти же слова прозвучат ещё четыре раза, в конце остальных разделов о содержании ума.)') },

  sec(12, 'धम्मानुपस्सना खन्धपब्बं', hi('(= धर्मानुपश्यना – स्कंधपर्व)', '(= dharmānupaśyanā – skaṃdhparv)'),
    'Observation of mental contents: the section on the aggregates', 'Наблюдение содержания ума: раздел о совокупностях'),
  { t: 'lines', box: 1, center: 1, u: [
    u('6.22', '“पुन चपरं, भिक्खवे, भिक्खु धम्मेसु धम्मानुपस्सी विहरति पञ्चसु उपादानक्खन्धेसु।',
      '“Furthermore, monks, a monk dwells observing mental contents in mental contents with respect to the five aggregates of clinging.',
      '«И далее, монахи, монах пребывает, наблюдая содержание ума в содержании ума в отношении пяти совокупностей привязанности.', { cap: 1 }),
    u('6.23', 'कथञ्च पन, भिक्खवे, भिक्खु धम्मेसु धम्मानुपस्सी विहरति पञ्चसु उपादानक्खन्धेसु?',
      'And how, monks, does a monk dwell observing mental contents in mental contents with respect to the five aggregates of clinging?',
      'Как же, монахи, монах пребывает, наблюдая содержание ума в содержании ума в отношении пяти совокупностей привязанности?', { cap: 1 }),
    u('6.24', 'इध, भिक्खवे, भिक्खु –', 'Here, monks, a monk:', 'Здесь, монахи, монах:', { cap: 1 })
  ] },
  { t: 'terms',
    lead: hi('(पञ्चक्खन्ध = पंचस्कंध = स्कंध पाँच हैं, जैसे –', '(pañcakkhandh = paṃcaskaṃdh = skaṃdh pāṃc haiṃ, jaise –', '(the five aggregates; there are five, namely:', '(пять совокупностей, а именно:'),
    items: [
      { u: u('6.25', 'रूप', 'material form', 'материальная форма', { n: 1, f: '(%)' }) },
      { u: u('6.26', 'वेदना', 'sensation', 'ощущение', { n: 2, f: '(%)' }) },
      { u: u('6.27', 'सञ्ञा', 'perception', 'восприятие', { n: 3, f: '(%)' }), gl: hi('संज्ञा', 'saṃjñā') },
      { u: u('6.28', 'सङ्खार', 'mental formations', 'формирования ума', { n: 4, f: '(%)' }), gl: hi('संस्कार', 'saṃskār') },
      { u: u('6.29', 'विञ्ञाण', 'consciousness', 'сознание', { n: 5, f: '(%)' }), gl: hi('विज्ञान)', 'vijñān)') }
    ] },
  { t: 'matA', id: '6.k', corner: '',
    title: hi('३ × ५ मेट्रिक्स', '3 × 5 meṭriks', '3 × 5 matrix', 'матрица 3 × 5'),
    cols: [
      { id: '6.30', d: 'रूप', h: ['material form', 'материальная форма'], f: { n: 'रूपं', g: 'रूपस्स' }, e: 'material form', r: { t: 'материальная форма', g: 'материальной формы' } },
      { id: '6.31', d: 'वेदना', h: ['sensation', 'ощущение'], f: { n: 'वेदना', g: 'वेदनाय' }, e: 'sensation', r: { t: 'ощущение', g: 'ощущения' } },
      { id: '6.32', d: 'सञ्ञा', h: ['perception', 'восприятие'], f: { n: 'सञ्ञा', g: 'सञ्ञाय' }, e: 'perception', r: { t: 'восприятие', g: 'восприятия' } },
      { id: '6.33', d: 'सङ्खार', h: ['mental formations', 'формирования ума'], f: { n: 'सङ्खारा', g: 'सङ्खारानं' }, e: 'mental formations', r: { t: 'формирования ума', g: 'формирований ума' } },
      { id: '6.34', d: 'विञ्ञाण', h: ['consciousness', 'сознание'], f: { n: 'विञ्ञाणं', g: 'विञ्ञाणस्स' }, e: 'consciousness', r: { t: 'сознание', g: 'сознания' } }
    ],
    rows: [
      { id: '6.35', d: '‘इति [{n}],', en: '‘Such is {t};', ru: '«Вот {t};' },
      { id: '6.36', d: 'इति [{g}] समुदयो,', en: 'such is the arising of {t};', ru: 'вот возникновение: {t};' },
      { id: '6.37', d: 'इति [{g}] अत्थङ्गमो’ति।', en: 'such is the passing away of {t}.’', ru: 'вот исчезновение: {t}».' }
    ],
    note: hi('[ ] ब्रैकेट के भीतर “रूपं” के बदले में बाकी के स्कंध रखकर तीन-तीन तरह से पाठ करना चाहिए।',
      '[ ] braiket ke bhītar “rūpaṃ” ke badle meṃ bākī ke skaṃdh rakhkar tīn-tīn tarah se pāṭh karnā cāhie.',
      'Put each of the other aggregates in place of “rūpaṃ” inside the [ ] brackets, and recite in three ways for each.',
      'Подставляйте в скобки [ ] вместо «рупам» остальные совокупности и читайте тремя способами для каждой.') },
  { t: 'marks' },
  leader('6.38', 'dhamma', 'इति अज्झत्तं वा', 'धम्मेसु धम्मानुपस्सी विहरति पञ्चसु उपादानक्खन्धेसु।',
    { en: ' with respect to the five aggregates of clinging', ru: ' в отношении пяти совокупностей привязанности' })
]);
