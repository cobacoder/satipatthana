// Audio explanations: talks from the Satipaṭṭhāna course on discourses.dhamma.org.
// The links themselves are encrypted in js/audio-lock.js and open after the old-student login
// (made by tools/encrypt-audio-links.mjs).
// CUES: language → line id → [day, start, end]. Days: day1 … day6, day7-qa1, day8-qa2, day9-closing.
// Times as 'm:ss' or 'h:mm:ss', e.g. '1.06': ['day1', '12:04.5', '12:41'].
// Line ids are in js/pages/*.js. A line without a cue in the chosen language plays in demo mode.
window.CUES = {
  en: {},
  ru: {}
};
