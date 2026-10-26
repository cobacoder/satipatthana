(() => {
  const factor = (id, d, en, ru) => ({ id, d, h: [en, ru], f: { x: d }, e: en, r: ru });

  PAGE(8, [
    sec(14, 'धम्मानुपस्सना बोज्झङ्गपब्बं', hi('(= धर्मानुपश्यना – बोध्यंगपर्व)', '(= dharmānupaśyanā – bodhyaṃgparv)'),
      'Observation of mental contents: the section on the factors of awakening', 'Наблюдение содержания ума: раздел о факторах пробуждения'),
    { t: 'lines', box: 1, center: 1, u: [
      u('8.01', '“पुन चपरं, भिक्खवे, भिक्खु धम्मेसु धम्मानुपस्सी विहरति सत्तसु बोज्झङ्गेसु।',
        '“Furthermore, monks, a monk dwells observing mental contents in mental contents with respect to the seven factors of awakening.',
        '«И далее, монахи, монах пребывает, наблюдая содержание ума в содержании ума в отношении семи факторов пробуждения.', { cap: 1 }),
      u('8.02', 'कथञ्च पन, भिक्खवे, भिक्खु धम्मेसु धम्मानुपस्सी विहरति सत्तसु बोज्झङ्गेसु?',
        'And how, monks, does a monk dwell observing mental contents in mental contents with respect to the seven factors of awakening?',
        'Как же, монахи, монах пребывает, наблюдая содержание ума в содержании ума в отношении семи факторов пробуждения?', { cap: 1 }),
      u('8.03', 'इध, भिक्खवे, भिक्खु', 'Here, monks, a monk:', 'Здесь, монахи, монах:', { cap: 1 })
    ] },
    { t: 'cap', left: 1, ...hi('बोधि के अंग होने से = बोध्यंग। बोधि के सात अंग होते हैं: (१) सति (= स्मृति; जागरूकता) (२) धम्मविचय (= धर्म को विचयन करके, टुकड़े करके जानना) (३) वीरिय (= वीर्य; परिश्रम; पराक्रम) (४) पीति (= प्रीति; आनंद) (५) पस्सद्धि (= प्रश्रब्धि; प्रशांति) (६) समाधि (= चित्त एकाग्रता) (७) उपेक्खा (= उपेक्षा, समता)।',
      'bodhi ke aṃg hone se = bodhyaṃg. bodhi ke sāt aṃg hote haiṃ: (1) sati (= smr̥ti; jāgrūktā) (2) dhammavicay (= dharm ko vicayan karke, ṭukṛe karke jānnā) (3) vīriya (= vīrya; pariśram; parākram) (4) pīti (= prīti; ānaṃd) (5) passaddhi (= praśrabdhi; praśāṃti) (6) samādhi (= citt ekāgratā) (7) upekkhā (= upekṣā, samtā).',
      'Being limbs of bodhi, awakening, they are called bojjhaṅga. Awakening has seven limbs: (1) sati (= awareness, wakefulness); (2) dhammavicaya (= knowing the dhamma by investigating it, taking it apart piece by piece); (3) vīriya (= effort, exertion, courage); (4) pīti (= rapture, joy); (5) passaddhi (= tranquillity, calm); (6) samādhi (= one-pointedness of mind); (7) upekkhā (= equanimity, evenness).',
      'Поскольку это части бодхи, пробуждения, их называют боджджханга. У пробуждения семь частей: (1) сати (= осознанность, бодрствование); (2) дхаммавичая (= познание дхаммы через исследование, разбирая её по частям); (3) вирия (= усилие, старание, мужество); (4) пити (= восторг, радость); (5) пассаддхи (= безмятежность, покой); (6) самадхи (= однонаправленность ума); (7) упеккха (= невозмутимость, ровность).') },
    { t: 'matA', id: '8.m',
      title: hi('४ × ७ मेट्रिक्स', '4 × 7 meṭriks', '4 × 7 matrix', 'матрица 4 × 7'),
      cols: [
        factor('8.04', 'सति', 'awareness', 'осознанность'),
        factor('8.05', 'धम्मविचय', 'investigation of dhamma', 'исследование дхаммы'),
        factor('8.06', 'वीरिय', 'effort', 'усилие'),
        factor('8.07', 'पीति', 'rapture', 'восторг'),
        factor('8.08', 'पस्सद्धि', 'tranquillity', 'безмятежность'),
        factor('8.09', 'समाधि', 'concentration', 'сосредоточение'),
        factor('8.10', 'उपेक्खा', 'equanimity', 'невозмутимость')
      ],
      rows: [
        { id: '8.11', d: 'सन्तं वा अज्झत्तं [{x}]सम्बोज्झङ्गं ‘अत्थि मे अज्झत्तं [{x}]सम्बोज्झङ्गो’ति पजानाति।',
          en: 'When the awakening factor of {t} is present in him, he understands properly: ‘The awakening factor of {t} is present in me.’',
          ru: 'Когда в нём присутствует фактор пробуждения «{t}», он ясно знает: «Во мне присутствует фактор пробуждения „{t}“».' },
        { id: '8.12', d: 'असन्तं वा अज्झत्तं [{x}]सम्बोज्झङ्गं ‘नत्थि मे अज्झत्तं [{x}]सम्बोज्झङ्गो’ति पजानाति।',
          en: 'When the awakening factor of {t} is not present in him, he understands properly: ‘The awakening factor of {t} is not present in me.’',
          ru: 'Когда в нём нет фактора пробуждения «{t}», он ясно знает: «Во мне нет фактора пробуждения „{t}“».' },
        { id: '8.13', d: 'यथा च अनुप्पन्नस्स [{x}]सम्बोज्झङ्गस्स उप्पादो होति तञ्च पजानाति।',
          en: 'He understands properly how the awakening factor of {t} that has not yet arisen arises.',
          ru: 'Он ясно знает, как возникает ещё не возникший фактор пробуждения «{t}».' },
        { id: '8.14', d: 'यथा च उप्पन्नस्स [{x}]सम्बोज्झङ्गस्स भावनाय पारिपूरी होति तञ्च पजानाति।',
          en: 'He understands properly how the awakening factor of {t} that has arisen is brought to perfection by development.',
          ru: 'Он ясно знает, как возникший фактор пробуждения «{t}» развитием доводится до полноты.' }
      ],
      note: hi('([ ] ब्रैकेट के भीतर “सति” के बदले में बाकी के बोध्यंग को रखकर चार-चार तरह से सात बोध्यंग का पाठ करना चाहिए।)',
        '([ ] braiket ke bhītar “sati” ke badle meṃ bākī ke bodhyaṃg ko rakhkar cār-cār tarah se sāt bodhyaṃg kā pāṭh karnā cāhie.)',
        '(Put each of the other factors of awakening in place of “sati” inside the [ ] brackets, and recite the seven factors of awakening in four ways for each.)',
        '(Подставляйте в скобки [ ] вместо «сати» остальные факторы пробуждения и читайте семь факторов пробуждения четырьмя способами для каждого.)') },
    { t: 'marks' },
    leader('8.15', 'dhamma', 'इति अज्झत्तं वा', 'धम्मानुपस्सी विहरति सत्तसु बोज्झङ्गेसु।',
      { en: ' with respect to the seven factors of awakening', ru: ' в отношении семи факторов пробуждения' }),

    sec(15, 'धम्मानुपस्सना सच्चपब्बं', hi('(= धर्मानुपश्यना – सत्यपर्व)', '(= dharmānupaśyanā – satyaparv)'),
      'Observation of mental contents: the section on the truths', 'Наблюдение содержания ума: раздел об истинах'),
    { t: 'lines', box: 1, center: 1, u: [
      u('8.16', '“पुन चपरं, भिक्खवे, भिक्खु धम्मेसु धम्मानुपस्सी विहरति चतूसु अरियसच्चेसु।',
        '“Furthermore, monks, a monk dwells observing mental contents in mental contents with respect to the four noble truths.',
        '«И далее, монахи, монах пребывает, наблюдая содержание ума в содержании ума в отношении четырёх благородных истин.', { cap: 1 }),
      u('8.17', 'कथञ्च पन, भिक्खवे, भिक्खु धम्मेसु धम्मानुपस्सी विहरति चतूसु अरियसच्चेसु?',
        'And how, monks, does a monk dwell observing mental contents in mental contents with respect to the four noble truths?',
        'Как же, монахи, монах пребывает, наблюдая содержание ума в содержании ума в отношении четырёх благородных истин?', { cap: 1 }),
      u('8.18', 'इध, भिक्खवे, भिक्खु', 'Here, monks, a monk', 'Здесь, монахи, монах', { cap: 1 })
    ] },
    { t: 'lines', u: [
      u('8.19', '‘इदं दुक्ख’न्ति यथाभूतं पजानाति।', 'understands properly, as it really is: ‘This is suffering’;', 'ясно знает, как оно есть на самом деле: «Это страдание»;', { n: 1, f: '(%)' }),
      u('8.20', '‘अयं दुक्खसमुदयो’ति यथाभूतं पजानाति।', 'he understands properly, as it really is: ‘This is the arising of suffering’;', 'он ясно знает, как оно есть на самом деле: «Это возникновение страдания»;', { n: 2, f: '(%)' }),
      u('8.21', '‘अयं दुक्खनिरोधो’ति यथाभूतं पजानाति।', 'he understands properly, as it really is: ‘This is the cessation of suffering’;', 'он ясно знает, как оно есть на самом деле: «Это прекращение страдания»;', { n: 3, f: '(%)' }),
      u('8.22', '‘अयं दुक्खनिरोधगामिनी पटिपदा’ति यथाभूतं पजानाति।', 'he understands properly, as it really is: ‘This is the path leading to the cessation of suffering.’', 'он ясно знает, как оно есть на самом деле: «Это путь, ведущий к прекращению страдания».', { n: 4, f: '(%)' })
    ] }
  ]);
})();
