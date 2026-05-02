const QALQALAH_LETTERS = new Set(["ق", "ط", "ب", "ج", "د"]);
const MADD_LETTERS = new Set(["ا", "و", "ي", "ى", "ٰ"]);
const GHUNNA_LETTERS = new Set(["ن", "م"]);

const SHADDA = "ّ";
const SUKUN = "ْ";
const MADDA = "ٓ";
const SUPERSCRIPT_ALIF = "ٰ";
const FATHATAN = "ً";
const KASRATAN = "ٍ";
const DAMMATAN = "ٌ";
const FATHA = "َ";
const KASRA = "ِ";
const DAMMA = "ُ";
const HAMZA_ABOVE = "ٔ";
const HAMZA_BELOW = "ٕ";

const SILENT_ALIF_AT_END = ["ا"];

const DIACRITICS = new Set([
  SHADDA,
  SUKUN,
  MADDA,
  FATHA,
  KASRA,
  DAMMA,
  FATHATAN,
  KASRATAN,
  DAMMATAN,
  HAMZA_ABOVE,
  HAMZA_BELOW,
  SUPERSCRIPT_ALIF,
]);

export const TAJWEED_RULES = {
  default: "default",
  ghunna: "ghunna",
  madd: "madd",
  qalqalah: "qalqalah",
  silent: "silent",
};

function isWhitespace(ch) {
  return /\s/.test(ch);
}

function isDiacritic(ch) {
  return DIACRITICS.has(ch);
}

function lookAheadDiacritics(chars, i) {
  const out = [];
  let j = i + 1;
  while (j < chars.length && isDiacritic(chars[j])) {
    out.push(chars[j]);
    j += 1;
  }
  return out;
}

function classifyChar(chars, i) {
  const ch = chars[i];
  if (!ch || isWhitespace(ch)) return TAJWEED_RULES.default;

  const ahead = lookAheadDiacritics(chars, i);
  const next = chars[i + 1] ?? "";
  const prev = chars[i - 1] ?? "";

  if (GHUNNA_LETTERS.has(ch) && ahead.includes(SHADDA)) {
    return TAJWEED_RULES.ghunna;
  }

  if (MADD_LETTERS.has(ch)) {
    if (ahead.includes(MADDA)) return TAJWEED_RULES.madd;
    if (next === MADDA) return TAJWEED_RULES.madd;
    if (ch === SUPERSCRIPT_ALIF) return TAJWEED_RULES.madd;
    const prevDiacritic = isDiacritic(prev) ? prev : "";
    if (
      (ch === "ا" && prevDiacritic === FATHA) ||
      (ch === "و" && prevDiacritic === DAMMA) ||
      (ch === "ي" && prevDiacritic === KASRA)
    ) {
      const after = chars[i + 1];
      if (!after || isWhitespace(after) || (!isDiacritic(after) && after !== SHADDA)) {
        return TAJWEED_RULES.madd;
      }
    }
  }

  if (QALQALAH_LETTERS.has(ch) && ahead.includes(SUKUN)) {
    return TAJWEED_RULES.qalqalah;
  }

  if (ch === "ا") {
    const after = chars[i + 1];
    if (!after || isWhitespace(after)) {
      const beforeDiacritic = isDiacritic(prev) ? prev : "";
      if (beforeDiacritic === FATHATAN) return TAJWEED_RULES.silent;
    }
  }

  return TAJWEED_RULES.default;
}

export function tokenizeTajweed(text) {
  if (!text) return [];
  const chars = Array.from(text);
  const segments = [];
  let current = { text: "", rule: TAJWEED_RULES.default };

  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i];

    if (isDiacritic(ch)) {
      current.text += ch;
      continue;
    }

    const rule = classifyChar(chars, i);

    if (rule === current.rule) {
      current.text += ch;
    } else {
      if (current.text) segments.push(current);
      current = { text: ch, rule };
    }
  }

  if (current.text) segments.push(current);
  return segments;
}

export function tajweedPaletteFromColors(colors) {
  return {
    [TAJWEED_RULES.default]: colors.text,
    [TAJWEED_RULES.ghunna]: colors.teal,
    [TAJWEED_RULES.madd]: colors.danger,
    [TAJWEED_RULES.qalqalah]: colors.gold,
    [TAJWEED_RULES.silent]: colors.mutedSoft,
  };
}

export const TAJWEED_LEGEND = [
  { rule: TAJWEED_RULES.madd, label: "Мадд", note: "удлинить" },
  { rule: TAJWEED_RULES.ghunna, label: "Гунна", note: "в нос" },
  { rule: TAJWEED_RULES.qalqalah, label: "Калькаля", note: "звонкая" },
  { rule: TAJWEED_RULES.silent, label: "Скрытая", note: "не читать" },
];
