// Product search in English, Hindi and Hinglish.
//
// - normalizeSearchText makes spelling variants equal (पम्प = पंप, फ़ = फ,
//   १० = 10) so the query and stored names compare the same way.
// - Filler words ("wala", "ka", "के") are ignored.
// - SEARCH_GLOSSARY maps Hindi/Hinglish farm-equipment words to their English
//   catalog words and back, so "पंप" also finds products named "PUMP".
const { normalizeDigits } = require('./hindiNames');

// Nukta letters (क़ ख़ ग़ ज़ ड़ ढ़ फ़ य़) -> base letter.
const NUKTA_LETTERS = {
  'क़': 'क', 'ख़': 'ख', 'ग़': 'ग', 'ज़': 'ज',
  'ड़': 'ड', 'ढ़': 'ढ', 'फ़': 'फ', 'य़': 'य',
};

function normalizeSearchText(text) {
  let value = String(text ?? '').normalize('NFC');
  value = value.replace(/[\u200B-\u200D\uFEFF]/g, ''); // zero-width characters
  value = value.replace(/[\u0958-\u095F]/g, (letter) => NUKTA_LETTERS[letter] || letter);
  value = value.replace(/\u093C/g, ''); // standalone nukta
  value = value.replace(/\u0901/g, '\u0902'); // chandrabindu -> anusvara
  // Half nasal before a consonant of the same group -> anusvara (पम्प = पंप).
  value = value
    .replace(/\u092E\u094D(?=[\u092A\u092B\u092C\u092D])/g, '\u0902') // म् + प फ ब भ
    .replace(/\u0928\u094D(?=[\u0924\u0925\u0926\u0927\u091F\u0920\u0921\u0922])/g, '\u0902') // न् + त थ द ध ट ठ ड ढ
    .replace(/\u0923\u094D(?=[\u091F\u0920\u0921\u0922])/g, '\u0902') // ण् + ट ठ ड ढ
    .replace(/\u0919\u094D(?=[\u0915\u0916\u0917\u0918])/g, '\u0902') // ङ् + क ख ग घ
    .replace(/\u091E\u094D(?=[\u091A\u091B\u091C\u091D])/g, '\u0902'); // ञ् + च छ ज झ
  value = normalizeDigits(value);
  // "10मिमी" -> "10 मिमी"
  value = value
    .replace(/(\d)([\u0900-\u097F])/g, '$1 $2')
    .replace(/([\u0900-\u097F])(\d)/g, '$1 $2');
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

const STOP_WORDS = new Set([
  'wala', 'wali', 'wale', 'vala', 'vali', 'vale', 'ka', 'ki', 'ke', 'ko', 'se', 'aur', 'and',
  'the', 'for', 'of', 'a', 'an', 'with', 'chahiye', 'chaiye', 'dikhao', 'price', 'rate',
  'वाला', 'वाली', 'वाले', 'का', 'की', 'के', 'को', 'से', 'और', 'चाहिए', 'दिखाओ', 'दाम', 'रेट', 'कीमत',
].map(normalizeSearchText));

// Each group lists words that mean the same thing for this catalog.
const SEARCH_GLOSSARY_GROUPS = [
  ['pump', 'पंप', 'पम्प', 'motor', 'मोटर', 'moter'],
  ['submersible', 'सबमर्सिबल', 'सबमर्सीबल', 'submarsible'],
  ['openwell', 'open well', 'ओपनवेल', 'ओपन वेल'],
  ['monoblock', 'मोनोब्लॉक', 'मोनो ब्लॉक'],
  ['cable', 'wire', 'केबल', 'वायर', 'तार', 'taar'],
  ['pipe', 'पाइप', 'पाईप', 'नली', 'nali', 'paip'],
  ['column', 'कॉलम', 'कालम'],
  ['hose', 'होज़', 'होज'],
  ['panel', 'पैनल', 'पेनल', 'control panel', 'कंट्रोल पैनल'],
  ['starter', 'स्टार्टर', 'स्टाटर'],
  ['sprinkler', 'स्प्रिंकलर', 'फव्वारा', 'fuvara'],
  ['sprayer', 'स्प्रेयर', 'स्प्रे', 'spray'],
  ['elbow', 'एल्बो', 'कोहनी'],
  ['tee', 'टी'],
  ['socket', 'सॉकेट', 'सोकेट'],
  ['reducer', 'रिड्यूसर', 'रेडसर', 'रेड्यूसर'],
  ['coupler', 'कपलर', 'coupling', 'कपलिंग'],
  ['nipple', 'निप्पल', 'निपल'],
  ['union', 'यूनियन'],
  ['valve', 'वाल्व', 'वॉल्व'],
  ['bend', 'बेंड'],
  ['cap', 'कैप', 'ढक्कन'],
  ['adaptor', 'adapter', 'adopter', 'एडॉप्टर', 'अडैप्टर', 'एडाप्टर'],
  ['tank', 'टैंक', 'टंकी', 'tanki'],
  ['brass', 'ब्रास', 'पीतल'],
  ['plastic', 'प्लास्टिक'],
  ['oil', 'आयल', 'ऑयल', 'तेल'],
  ['stage', 'स्टेज'],
  ['core', 'कोर'],
  ['copper', 'कॉपर', 'तांबा'],
  ['black', 'ब्लैक', 'काला'],
  ['premium', 'प्रीमियम'],
  ['solvent', 'सॉल्वेंट', 'solution', 'सोल्यूशन'],
  ['machine', 'मशीन'],
  ['cutter', 'कटर'],
  ['jhatka', 'झटका'],
  // Units and codes
  ['mm', 'मिमी', 'मि.मी.', 'मिलीमीटर', 'millimeter'],
  ['sqmm', 'sq mm', 'वर्ग मिमी', 'स्क्वायर मिमी'],
  ['inch', 'इंच', 'inches'],
  ['ft', 'feet', 'फीट', 'फुट'],
  ['mtr', 'meter', 'metre', 'मीटर', 'मी'],
  ['ltr', 'litre', 'liter', 'लीटर', 'लिटर'],
  ['kg', 'किग्रा', 'किलो', 'kilo'],
  ['hp', 'एचपी', 'हॉर्स पावर', 'horse power'],
  ['phase', 'फेज़', 'फेज', 'फ़ेज़'],
  ['single', 'सिंगल'],
  // Brands (as usually typed in Hindi)
  ['mourya', 'मौर्य', 'मौर्या', 'मोर्या', 'maurya'],
  ['shivnath', 'शिवनाथ'],
  ['aquagolden', 'aqua golden', 'एक्वागोल्डन', 'एक्वा गोल्डन', 'अक्वागोल्डेन'],
  ['ashirvad', 'आशीर्वाद', 'आशिर्वाद', 'ashirwad'],
  ['finolex', 'फिनोलेक्स'],
  ['harit', 'हरित'],
  ['mayur', 'मयूर'],
  ['pankh', 'पंख'],
  ['green valley', 'ग्रीन वैली'],
];

// normalized word -> Set of normalized equivalents (including itself)
const GLOSSARY = new Map();
for (const group of SEARCH_GLOSSARY_GROUPS) {
  const normalized = [...new Set(group.map(normalizeSearchText))];
  for (const word of normalized) {
    const set = GLOSSARY.get(word) || new Set();
    normalized.forEach((equivalent) => set.add(equivalent));
    GLOSSARY.set(word, set);
  }
}
const MULTI_WORD_ENTRIES = [...GLOSSARY.keys()].filter((key) => key.includes(' '))
  .sort((a, b) => b.split(' ').length - a.split(' ').length);

// Latin variants this short would match almost everything; skip them.
const isUsableVariant = (variant) => /[\u0900-\u097F]/.test(variant) || variant.length >= 2 || /^\d/.test(variant);

// Returns one group of equivalent search variants per meaningful query word,
// e.g. "सबमर्सिबल पंप wala" -> [[सबमर्सिबल, submersible, ...], [पंप, pump, motor, ...]].
function buildSearchTerms(query) {
  const words = normalizeSearchText(query).split(' ').filter(Boolean);
  const groups = [];
  for (let i = 0; i < words.length; i += 1) {
    // Longest multi-word glossary phrase first ("वर्ग मिमी", "control panel").
    const phrase = MULTI_WORD_ENTRIES.find((entry) => {
      const parts = entry.split(' ');
      return parts.every((part, offset) => words[i + offset] === part);
    });
    const word = phrase || words[i];
    if (phrase) i += phrase.split(' ').length - 1;
    if (STOP_WORDS.has(word)) continue;
    const variants = [...(GLOSSARY.get(word) || new Set([word]))].filter(isUsableVariant);
    if (!variants.includes(word)) variants.unshift(word);
    groups.push([...new Set(variants)]);
  }
  return groups;
}

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// One case-insensitive pattern that matches any variant of a word group.
const groupPattern = (variants) => variants.map(escapeRegex).join('|');

module.exports = {
  normalizeSearchText,
  buildSearchTerms,
  groupPattern,
  escapeRegex,
  STOP_WORDS,
  SEARCH_GLOSSARY_GROUPS,
};
