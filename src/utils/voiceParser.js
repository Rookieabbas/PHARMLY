import Fuse from "fuse.js";

/**
 * Phonetic Soundex implementation
 */
export function soundex(str) {
  if (!str) return "";
  const s = str.toUpperCase().replace(/[^A-Z]/g, "");
  if (!s) return "";

  const codes = {
    B: 1, F: 1, P: 1, V: 1,
    C: 2, G: 2, J: 2, K: 2, Q: 2, S: 2, X: 2, Z: 2,
    D: 3, T: 3,
    L: 4,
    M: 5, N: 5,
    R: 6
  };

  let first = s[0];
  let res = first;
  let prev = codes[first] || 0;

  for (let i = 1; i < s.length && res.length < 4; i++) {
    const char = s[i];
    const code = codes[char];
    if (code !== undefined) {
      if (code !== prev) {
        res += code;
        prev = code;
      }
    } else {
      prev = 0;
    }
  }

  while (res.length < 4) res += "0";
  return res;
}

/**
 * Levenshtein distance between two strings
 */
export function levenshtein(a, b) {
  if (!a || !b) return (a || "").length + (b || "").length;
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();
  const matrix = Array.from({ length: s1.length + 1 }, () => []);
  for (let i = 0; i <= s1.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[s1.length][s2.length];
}

/**
 * Normalized string similarity (0 to 1)
 */
export function calculateSimilarity(s1, s2) {
  if (!s1 || !s2) return 0;
  const a = s1.toLowerCase().trim();
  const b = s2.toLowerCase().trim();
  if (a === b) return 1.0;

  const maxLen = Math.max(a.length, b.length);
  const minLen = Math.min(a.length, b.length);
  if (minLen === 0) return 0;

  // If length ratio is too distorted (e.g. 3 chars vs 15 chars), similarity is low
  if (minLen / maxLen < 0.4 && minLen > 3) return 0;

  const levDist = levenshtein(a, b);
  const levSim = 1 - levDist / maxLen;

  // Soundex bonus ONLY if base similarity is already decent (> 0.5)
  const isSoundexMatch = soundex(a) === soundex(b);
  const soundexBonus = (isSoundexMatch && levSim >= 0.5) ? 0.15 : 0;

  return Math.min(1.0, levSim + soundexBonus);
}

/**
 * Spoken number dictionary
 */
const NUMBER_WORDS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  hundred: 100, thousand: 1000
};

/**
 * Converts spoken numbers and colloquial pharmacy combinations
 */
export function convertSpokenNumbers(text) {
  let res = text.toLowerCase();

  const colloquialCombos = {
    "two fifty": "250",
    "two hundred fifty": "250",
    "five hundred": "500",
    "five hundred mg": "500 mg",
    "six fifty": "650",
    "six hundred fifty": "650",
    "six hundred and fifty": "650",
    "one twenty": "120",
    "one hundred twenty": "120",
    "four hundred": "400",
    "one hundred": "100",
    "three fifty": "350",
    "seven fifty": "750",
    "eight hundred": "800",
    "six five zero": "650",
    "two five zero": "250",
    "five zero zero": "500"
  };

  for (const [phrase, replacement] of Object.entries(colloquialCombos)) {
    const regex = new RegExp(`\\b${phrase}\\b`, "gi");
    res = res.replace(regex, replacement);
  }

  // Convert single digit words (e.g., "two tablets" -> "2 tablets")
  for (const [word, val] of Object.entries(NUMBER_WORDS)) {
    if (val < 100) {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      res = res.replace(regex, val.toString());
    }
  }

  return res;
}

/**
 * Normalize speech text
 */
export function normalizeSpeech(input) {
  if (!input) return "";
  let text = input.toLowerCase();

  // Separate letter-digit concatenated boundaries: "amx250" -> "amx 250", "pcm500" -> "pcm 500"
  text = text.replace(/([a-zA-Z]+)(\d+)/g, "$1 $2");
  text = text.replace(/(\d+)([a-zA-Z]+)/g, "$1 $2");

  // Remove punctuation characters
  text = text.replace(/[^a-zA-Z0-9\s]/g, " ");

  // Convert spoken number terms
  text = convertSpokenNumbers(text);

  // Normalize units
  text = text.replace(/\b(milligrams|milligram|mgs)\b/gi, "mg");
  text = text.replace(/\b(milliliters|milliliter|mls)\b/gi, "ml");

  text = text.replace(/\s+/g, " ").trim();
  return text;
}

/**
 * Standard pharmacy alias map for abbreviations and speech-to-text variances
 */
export const PHARMACY_ALIASES = {
  amx: "Amoxicillin",
  amox: "Amoxicillin",
  amoxi: "Amoxicillin",
  mox: "Amoxicillin",
  amoxicilin: "Amoxicillin",
  pcm: "Paracetamol",
  para: "Paracetamol",
  parasitamol: "Paracetamol",
  parasetamol: "Paracetamol",
  dolo: "Paracetamol",
  calpol: "Paracetamol",
  crocin: "Paracetamol",
  pacimol: "Paracetamol",
  panadol: "Paracetamol",
  az: "Azithral",
  azee: "Azithral",
  azithro: "Azithral",
  azithromycin: "Azithral",
  azithrol: "Azithral",
  ctz: "Cetirizine",
  cetzine: "Cetirizine",
  okacet: "Cetirizine",
  alerid: "Cetirizine",
  setrizine: "Cetirizine",
  cs: "Cough Syrup",
  cough: "Cough Syrup",
  syrup: "Cough Syrup",
  benadryl: "Cough Syrup",
  ascoril: "Cough Syrup",
  ibu: "Ibuprofen",
  brufen: "Ibuprofen",
  combiflam: "Ibuprofen"
};

/**
 * Command definitions ordered by longest trigger phrase first
 */
export const COMMAND_TRIGGERS = [
  { command: "check_stock", trigger: "check stock of" },
  { command: "check_stock", trigger: "check stock" },
  { command: "check_stock", trigger: "check inventory" },
  { command: "check_stock", trigger: "check availability" },
  { command: "check_stock", trigger: "how much stock" },
  { command: "check_stock", trigger: "how many left" },
  { command: "check_stock", trigger: "is it in stock" },
  { command: "check_stock", trigger: "in stock" },
  { command: "check_stock", trigger: "stock of" },
  { command: "check_stock", trigger: "stock for" },
  { command: "check_stock", trigger: "stock" },

  { command: "clear", trigger: "clear cart" },
  { command: "clear", trigger: "clear all" },
  { command: "clear", trigger: "empty cart" },
  { command: "clear", trigger: "reset cart" },
  { command: "clear", trigger: "clear" },

  { command: "bill", trigger: "generate bill" },
  { command: "bill", trigger: "create bill" },
  { command: "bill", trigger: "print bill" },
  { command: "bill", trigger: "make bill" },
  { command: "bill", trigger: "complete sale" },
  { command: "bill", trigger: "checkout" },
  { command: "bill", trigger: "bill" },

  { command: "stop", trigger: "stop listening" },
  { command: "stop", trigger: "stop mic" },
  { command: "stop", trigger: "stop recording" },
  { command: "stop", trigger: "turn off mic" },
  { command: "stop", trigger: "shut down" },
  { command: "stop", trigger: "quiet" },
  { command: "stop", trigger: "mute" },
  { command: "stop", trigger: "stop" },

  { command: "remove", trigger: "remove from cart" },
  { command: "remove", trigger: "delete from cart" },
  { command: "remove", trigger: "take out" },
  { command: "remove", trigger: "remove" },
  { command: "remove", trigger: "delete" },
  { command: "remove", trigger: "drop" },

  { command: "add", trigger: "add to the cart" },
  { command: "add", trigger: "add to cart" },
  { command: "add", trigger: "add into cart" },
  { command: "add", trigger: "put in cart" },
  { command: "add", trigger: "put into cart" },
  { command: "add", trigger: "please add" },
  { command: "add", trigger: "add" },
  { command: "add", trigger: "buy" },
  { command: "add", trigger: "include" },

  { command: "search", trigger: "search for" },
  { command: "search", trigger: "find medicine" },
  { command: "search", trigger: "look for" },
  { command: "search", trigger: "search" },
  { command: "search", trigger: "lookup" },
  { command: "search", trigger: "find" }
];

/**
 * Extracts command and strips it from speech
 */
export function extractCommand(normalizedText) {
  for (const { command, trigger } of COMMAND_TRIGGERS) {
    const regex = new RegExp(`\\b${trigger}\\b`, "i");
    if (regex.test(normalizedText)) {
      const cleaned = normalizedText.replace(regex, " ").replace(/\s+/g, " ").trim();
      return { command, cleanedText: cleaned, matchedTrigger: trigger };
    }
  }
  return { command: null, cleanedText: normalizedText, matchedTrigger: null };
}

/**
 * Extracts strength (e.g. 250, 500, 650, 10, 100) and quantity from speech
 */
export function extractStrengthAndQuantity(text) {
  let strength = null;
  let quantity = 1;

  // Check for strength with explicit mg/ml: e.g. "500 mg" or "500mg" or "250ml"
  const strengthUnitMatch = text.match(/\b(\d+)\s*(mg|ml)\b/i);
  if (strengthUnitMatch) {
    strength = strengthUnitMatch[1];
  }

  // Check for standalone strength numbers (common pharmaceutical dosages)
  if (!strength) {
    const strengthMatch = text.match(/\b(250|500|650|120|400|100|10|25|50|75|80|150)\b/);
    if (strengthMatch) {
      strength = strengthMatch[1];
    }
  }

  // Check for quantity (e.g. "2 tablets", "3 bottles", "qty 4", "quantity 2")
  const qtyMatch = text.match(/\b(?:qty|quantity|count|take)?\s*(\d+)\s*(?:tablets?|capsules?|bottles?|strips?|units?|items?)\b/i);
  if (qtyMatch && qtyMatch[1] && qtyMatch[1] !== strength) {
    const q = parseInt(qtyMatch[1], 10);
    if (q > 0 && q < 100) {
      quantity = q;
    }
  }

  return { strength, quantity };
}

/**
 * Builds searchable index of medicines from MongoDB dataset
 */
export function buildMedicineIndex(medicines = []) {
  const index = [];

  for (const med of medicines) {
    const rawName = med.name || "";
    const rawCode = med.code || "";

    // Extract numbers / strength from name or code (e.g. 500 from "Paracetamol 500mg" or "PCM500")
    const strengthMatch = rawName.match(/(\d+)/) || rawCode.match(/(\d+)/);
    const medStrength = strengthMatch ? strengthMatch[1] : null;

    // Base name without numbers/units (e.g. "Paracetamol" from "Paracetamol 500mg")
    const baseName = rawName.replace(/\d+\s*(mg|ml)?/gi, "").replace(/\s+/g, " ").trim();

    const searchTerms = new Set([
      rawName.toLowerCase(),
      baseName.toLowerCase()
    ]);

    if (rawCode) {
      searchTerms.add(rawCode.toLowerCase());
      const spacedCode = rawCode.replace(/([a-zA-Z]+)(\d+)/g, "$1 $2").toLowerCase();
      searchTerms.add(spacedCode);
      const codeLetters = rawCode.replace(/\d+/g, "").toLowerCase();
      searchTerms.add(codeLetters);
    }

    // Add aliases matching baseName
    for (const [alias, canonical] of Object.entries(PHARMACY_ALIASES)) {
      if (canonical.toLowerCase() === baseName.toLowerCase()) {
        searchTerms.add(alias);
        if (medStrength) {
          searchTerms.add(`${alias} ${medStrength}`);
        }
      }
    }

    index.push({
      medicine: med,
      rawName,
      code: rawCode,
      baseName,
      strength: medStrength,
      searchTerms: Array.from(searchTerms)
    });
  }

  // Initialize Fuse.js instance with stricter threshold to reject gibberish
  const fuse = new Fuse(index, {
    keys: ["searchTerms", "rawName", "code", "baseName"],
    threshold: 0.35, // Stricter threshold (lower = stricter)
    includeScore: true,
    minMatchCharLength: 2,
    ignoreLocation: true
  });

  return { index, fuse };
}

/**
 * Generate 1 to 4 word n-grams from a list of tokens
 */
export function generateNgrams(tokens) {
  const ngrams = [];
  const maxN = Math.min(4, tokens.length);

  for (let n = 1; n <= maxN; n++) {
    for (let i = 0; i <= tokens.length - n; i++) {
      const chunk = tokens.slice(i, i + n).join(" ");
      ngrams.push(chunk);
    }
  }

  return ngrams;
}

/**
 * Common non-medicine conversational English words that should never match a medicine
 */
const COMMON_CONVERSATIONAL_WORDS = new Set([
  "hello", "hi", "hey", "how", "are", "you", "today", "good", "morning",
  "evening", "afternoon", "what", "is", "this", "that", "there", "here",
  "like", "phrase", "test", "gibberish", "okay", "fine", "cool", "yeah",
  "yes", "no", "not", "why", "who", "when", "where", "can", "could",
  "would", "should", "will", "shall", "about", "some", "any", "more"
]);

/**
 * Main Voice Parser:
 * Normalizes input, detects commands, extracts strength/quantity,
 * performs n-gram fuzzy & phonetic matching against real MongoDB medicines.
 */
export function parseVoiceInput(rawSpeech, medicines = []) {
  if (!rawSpeech || typeof rawSpeech !== "string" || !rawSpeech.trim()) {
    return {
      command: null,
      medicine: null,
      strength: null,
      quantity: 1,
      confidence: 0,
      suggestions: [],
      rawText: rawSpeech || "",
      matchedPhrase: ""
    };
  }

  const rawText = rawSpeech.trim();
  const normalized = normalizeSpeech(rawText);

  // 1. Extract command
  const { command, cleanedText } = extractCommand(normalized);

  // If command is pure system command like "clear", "bill", "stop" without medicine:
  const strippedOfCommandWords = cleanedText.replace(/\b(cart|all|mic|listening)\b/g, "").trim();
  if (["clear", "bill", "stop"].includes(command) && (!strippedOfCommandWords || strippedOfCommandWords.length <= 2)) {
    return {
      command,
      medicine: null,
      strength: null,
      quantity: 1,
      confidence: 1.0,
      suggestions: [],
      rawText,
      matchedPhrase: command
    };
  }

  // 2. Extract strength and quantity from the text
  const { strength: extractedStrength, quantity } = extractStrengthAndQuantity(cleanedText);

  // 3. Build medicine index from MongoDB dataset
  const { index, fuse } = buildMedicineIndex(medicines);

  if (medicines.length === 0) {
    return {
      command: command || "add",
      medicine: null,
      strength: extractedStrength,
      quantity,
      confidence: 0,
      suggestions: [],
      rawText,
      matchedPhrase: ""
    };
  }

  // 4. Tokenize cleaned text and generate n-grams (1 to 4 words)
  // Filter out pure filler words: "please", "uh", "um", "the", "to", "cart", "in", "of", "a", "an", "for"
  const tokens = cleanedText
    .split(/\s+/)
    .filter((w) => !["uh", "um", "please", "the", "to", "cart", "in", "of", "a", "an", "for", "with"].includes(w));

  const ngrams = generateNgrams(tokens);
  if (!ngrams.includes(cleanedText) && cleanedText) {
    ngrams.push(cleanedText);
  }

  const candidates = [];

  for (const phrase of ngrams) {
    const trimmed = phrase.trim();
    if (!trimmed || trimmed.length < 2) continue;

    // If entire phrase consists ONLY of common conversational non-medicine words, ignore it
    const phraseWords = trimmed.split(/\s+/);
    if (phraseWords.every(w => COMMON_CONVERSATIONAL_WORDS.has(w))) {
      continue;
    }

    // A. Check Fuse.js fuzzy search
    const fuseResults = fuse.search(trimmed);
    for (const r of fuseResults) {
      const fuseScore = 1 - (r.score || 0);
      if (fuseScore >= 0.65) {
        candidates.push({
          entry: r.item,
          score: fuseScore,
          phrase: trimmed
        });
      }
    }

    // B. Check direct phonetic & alias matching against indexed terms
    for (const item of index) {
      for (const term of item.searchTerms) {
        const sim = calculateSimilarity(trimmed, term);
        if (sim >= 0.70) {
          candidates.push({
            entry: item,
            score: sim,
            phrase: trimmed
          });
        }
      }
    }
  }

  if (candidates.length === 0) {
    return {
      command: command || "add",
      medicine: null,
      strength: extractedStrength,
      quantity,
      confidence: 0,
      suggestions: [],
      rawText,
      matchedPhrase: ""
    };
  }

  // Aggregate candidate scores by medicine ID
  const medicineScoreMap = new Map();

  for (const cand of candidates) {
    const medId = cand.entry.medicine._id || cand.entry.medicine.name;
    let score = cand.score;

    // Match strength explicitly:
    // If user specified 650, medicine with 650 gets heavy boost (+0.35)
    // Medicine with 500 gets heavy penalty (-0.35)
    if (extractedStrength && cand.entry.strength) {
      if (cand.entry.strength === extractedStrength) {
        score += 0.35;
      } else {
        score -= 0.35;
      }
    }

    score = Math.min(1.0, Math.max(0, score));

    if (!medicineScoreMap.has(medId) || medicineScoreMap.get(medId).score < score) {
      medicineScoreMap.set(medId, {
        medicine: cand.entry.medicine,
        score,
        phrase: cand.phrase,
        entry: cand.entry
      });
    }
  }

  // Sort descending by score
  const sorted = Array.from(medicineScoreMap.values()).sort((a, b) => b.score - a.score);
  const bestMatch = sorted[0];

  // Suggestions: next 2 or 3 alternatives if available
  const suggestions = sorted
    .slice(1, 4)
    .filter((s) => s.score >= 0.40)
    .map((s) => s.medicine);

  const confidenceThreshold = 0.65;

  if (bestMatch && bestMatch.score >= confidenceThreshold) {
    return {
      command: command || "add",
      medicine: bestMatch.medicine,
      strength: extractedStrength || bestMatch.entry.strength,
      quantity,
      confidence: Number(bestMatch.score.toFixed(2)),
      suggestions: bestMatch.score < 0.85 ? suggestions : [],
      rawText,
      matchedPhrase: bestMatch.phrase
    };
  }

  // Low confidence: return top suggestions to tap
  return {
    command: command || "add",
    medicine: null,
    strength: extractedStrength,
    quantity,
    confidence: bestMatch ? Number(bestMatch.score.toFixed(2)) : 0,
    suggestions: sorted.slice(0, 3).map((s) => s.medicine),
    rawText,
    matchedPhrase: bestMatch ? bestMatch.phrase : ""
  };
}
