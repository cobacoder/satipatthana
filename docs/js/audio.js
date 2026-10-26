// Audio for the explanations.
// SOURCES: id → audio file in docs/audio/, e.g. 'talk-1': 'audio/talk-1.mp3'
// CUES: line id → [source id, start, end], times as 'm:ss' or 'h:mm:ss', e.g. '1.06': ['talk-1', '12:04.5', '12:41']
// Line ids are shown in the page source (data-id) and in js/pages/*.js. Lines without a cue play in demo mode.
window.SOURCES = {};
window.CUES = {};
