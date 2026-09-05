const axios = require('axios');

const cache = new Map();

async function transliterateToHindi(text) {
  const input = (text || '').trim();
  if (!input) return input;

  if (cache.has(input)) {
    return cache.get(input);
  }

  // Extract numbers and their positions to preserve them during transliteration
  // Numbers should remain as regular digits (1, 2, 3...) not Devanagari numerals (१, २, ३...)
  const numberPlaceholders = [];
  let textWithoutNumbers = input;
  const numberRegex = /\d+/g;
  let match;
  let offset = 0;

  while ((match = numberRegex.exec(input)) !== null) {
    numberPlaceholders.push({
      number: match[0],
      index: match.index - offset,
    });
    textWithoutNumbers = textWithoutNumbers.replace(match[0], `__NUM_PLACEHOLDER_${numberPlaceholders.length - 1}__`);
    offset += match[0].length - `__NUM_PLACEHOLDER_${numberPlaceholders.length - 1}__`.length;
  }

  const url = `https://inputtools.google.com/request?text=${encodeURIComponent(textWithoutNumbers)}&itc=hi-t-i0-und&num=1`;

  try {
    const response = await axios.get(url, { timeout: 5000 });
    const data = response.data;

    // Expected format: ["SUCCESS",[["text",["result1","result2"]]]]
    if (
      Array.isArray(data) &&
      data[0] === 'SUCCESS' &&
      Array.isArray(data[1]) &&
      Array.isArray(data[1][0]) &&
      Array.isArray(data[1][0][1]) &&
      typeof data[1][0][1][0] === 'string'
    ) {
      let result = data[1][0][1][0].trim();
      
      // Restore the original numbers (not Devanagari numerals)
      numberPlaceholders.forEach((placeholder, index) => {
        result = result.replace(
          `__NUM_PLACEHOLDER_${index}__`,
          placeholder.number
        );
      });

      if (result) {
        cache.set(input, result);
        return result;
      }
    }
  } catch (error) {
    // Fall through to return original text.
  }

  return input;
}

module.exports = {
  transliterateToHindi,
};

