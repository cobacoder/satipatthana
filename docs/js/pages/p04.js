(() => {
  // the nine ways of observing sensations: kind of sensation × with or without attachment
  const KIND = [
    ['सुखं', 'a pleasant sensation', 'приятное ощущение'],
    ['दुक्खं', 'an unpleasant sensation', 'неприятное ощущение'],
    ['अदुक्खमसुखं', 'a sensation neither unpleasant nor pleasant', 'ощущение ни неприятное, ни приятное']
  ];
  const AMISA = [
    ['', '', ''],
    ['सामिसं ', ' with attachment', ' с привязанностью'],
    ['निरामिसं ', ' without attachment', ' без привязанности']
  ];
  const order = [[0, 0], [1, 0], [2, 0], [0, 1], [0, 2], [1, 1], [1, 2], [2, 1], [2, 2]];
  const nine = order.map(([k, a], i) => {
    const [kd, ke, kr] = KIND[k], [ad, ae, ar] = AMISA[a];
    return u('4.' + String(i + 3).padStart(2, '0'),
      `${a ? ad + 'वा ' + kd : kd + ' वा'} वेदनं वेदयमानो ‘${ad}${kd} वेदनं वेदयामी’ति पजानाति।`,
      `experiencing ${ke}${ae}, he understands properly: ‘I am experiencing ${ke}${ae}.’`,
      `испытывая ${kr}${ar}, он ясно знает: «Я испытываю ${kr}${ar}».`,
      { n: i + 1, f: '(%)' });
  });

  PAGE(4, [
    sec(9, 'वेदनानुपस्सना', hi('(= वेदनानुपश्यना)', '(= vedanānupaśyanā)'), 'Observation of sensations', 'Наблюдение ощущений'),
    { t: 'lines', box: 1, center: 1, u: [
      u('4.01', '“कथञ्च पन, भिक्खवे, भिक्खु वेदनासु वेदनानुपस्सी विहरति?', '“And how, monks, does a monk dwell observing sensations in sensations?', '«Как же, монахи, монах пребывает, наблюдая ощущения в ощущениях?', { cap: 1 }),
      u('4.02', 'इध, भिक्खवे, भिक्खु', 'Here, monks, a monk,', 'Здесь, монахи, монах,', { cap: 1 })
    ] },
    { t: 'lines', u: nine },
    { t: 'cap', ...hi('(नौ प्रकार से वेदनानुपश्यना किया जाता है।)', '(nau prakār se vedanānupaśyanā kiyā jātā hai.)',
      '(Observation of sensations is practised in nine ways.)', '(Наблюдение ощущений выполняется девятью способами.)') },
    { t: 'table', cls: 'vt-tbl', rows: [
      [{ hi: hi('वेदना के भेद:', 'vedanā ke bhed:', 'kinds of sensation:', 'виды ощущений:') },
        { u: u('4.12', 'सुखं', 'pleasant', 'приятное', { n: 1, f: '(%)' }) },
        { u: u('4.13', 'दुक्खं', 'unpleasant', 'неприятное', { n: 2, f: '(%)' }) },
        { u: u('4.14', 'अदुक्खमसुखं', 'neither unpleasant nor pleasant', 'ни неприятное, ни приятное', { n: 3, f: '(%)' }) }],
      [{ th: 1, u: u('4.15', 'सामिसं', 'with attachment', 'с привязанностью') }, { ref: '4.06', n: '4' }, { ref: '4.08', n: '6' }, { ref: '4.10', n: '8' }],
      [{ th: 1, u: u('4.16', 'निरामिसं', 'without attachment', 'без привязанности') }, { ref: '4.07', n: '5' }, { ref: '4.09', n: '7' }, { ref: '4.11', n: '9' }]
    ] },
    { t: 'marks' },
    { t: 'prose', box: 1, u: refrain(4, 17, 'vedana') },
    supp('Added in the Word file · two terms', 'Добавлено в файле Word · два термина', [
      { t: 'cap', left: 1, ...hi('सामिष = आसक्ति से', 'sāmiṣ = āsakti se', 'sāmisa: with attachment', 'самиса: с привязанностью') },
      { t: 'cap', left: 1, ...hi('निरामिष = वैराग्य भाव से', 'nirāmiṣ = vairāgya bhāv se', 'nirāmisa: without attachment, in a spirit of detachment', 'нирамиса: без привязанности, с отрешённостью') }
    ])
  ]);
})();
