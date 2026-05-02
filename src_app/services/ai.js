import { getItem, StorageKeys } from "./storage";

const DEFAULT_GEMINI_KEY = "AIzaSyBXGg2OztNKiNRCvdHEDhvtZIMMnQExwY4";
const PRIMARY_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-2.5-flash-lite";

let _customKey = null;
let _customKeyLoaded = false;

export function setCustomGeminiKey(key) {
  const trimmed = typeof key === "string" ? key.trim() : "";
  _customKey = trimmed.length > 0 ? trimmed : null;
  _customKeyLoaded = true;
}

async function activeKey() {
  if (!_customKeyLoaded) {
    const stored = await getItem(StorageKeys.geminiApiKey, null);
    _customKey = typeof stored === "string" && stored.trim() ? stored.trim() : null;
    _customKeyLoaded = true;
  }
  return _customKey || DEFAULT_GEMINI_KEY;
}

function buildUrl(model, key) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
}

const SYSTEM_PROMPT = `Ты — короткий помощник по смыслу аятов в приложении Noor Atlas для русскоязычных мусульман. Говоришь по-братски, тепло, без академизма. Опирайся на классический тафсир (Ибн Касир, ас-Саади, ат-Табари). Никогда не выдумывай хадисы и цитаты.

Объём ответа — строго 2–3 коротких предложения. Только самая суть: о чём аят и какая практическая мысль. Без контекста ниспослания, без разбора слов, без морализаторства. Не повторяй сам аят и не пересказывай его.

Без markdown, без списков, без эмодзи, без заголовков. Просто связный текст.

В конце отдельной строкой: «И Аллах знает лучше.»`;

const cache = new Map();

const RETRY_DELAYS_MS = [4000, 8000, 16000, 32000];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function geminiCallOnce(model, key, body) {
  try {
    const res = await fetch(buildUrl(model, key), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, status: res.status, body: text };
    }
    const data = await res.json();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, network: e?.message || "network" };
  }
}

async function geminiFetch(body, { preferFast = false } = {}) {
  const key = await activeKey();
  let lastErr = null;
  let usedFallback = preferFast;
  let model = preferFast ? FALLBACK_MODEL : PRIMARY_MODEL;
  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt += 1) {
    const r = await geminiCallOnce(model, key, body);
    if (r.ok) return r;
    lastErr = r;
    const transient = r.status === 429 || r.status === 500 || r.status === 503 || r.network;
    if (!transient) return r;
    if (r.status === 429 && !usedFallback) {
      model = FALLBACK_MODEL;
      usedFallback = true;
    }
    if (attempt < RETRY_DELAYS_MS.length - 1) {
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }
  return { ok: false, retried: true, ...(lastErr || {}) };
}

function cacheKey(suraNumber, ayahNumber) {
  return `${suraNumber}:${ayahNumber}`;
}

export function getCachedExplanation(suraNumber, ayahNumber) {
  return cache.get(cacheKey(suraNumber, ayahNumber)) ?? null;
}

export async function explainAyah({ suraNumber, ayahNumber, arabic, translation, suraName }) {
  const key = cacheKey(suraNumber, ayahNumber);
  if (cache.has(key)) return { ok: true, text: cache.get(key), cached: true };

  const userPrompt = `Сура «${suraName}» (${suraNumber}), аят ${ayahNumber}.

Арабский: ${arabic}

Перевод (Кулиев): ${translation}

Объясни этот аят кратко и по делу.`;

  const result = await geminiFetch({
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 350,
      topP: 0.9,
      thinkingConfig: { thinkingBudget: 0 },
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ],
  });
  if (!result.ok) {
    return { ok: false, error: result.status ? `HTTP ${result.status}` : (result.network || "network"), detail: (result.body || "").slice(0, 200) };
  }
  const parts = result.data?.candidates?.[0]?.content?.parts;
  const text = parts?.map((p) => p.text).filter(Boolean).join("\n").trim();
  if (!text) return { ok: false, error: "Пустой ответ от модели" };
  cache.set(key, text);
  return { ok: true, text };
}

export function clearAiCache() {
  cache.clear();
}

const SURA_PROMPT = `Ты — короткий помощник по сурам Корана в приложении Noor Atlas для русскоязычных мусульман. Говоришь по-братски, тепло, без академизма.

На вход — имя суры. Объём — строго 3–4 коротких предложения. Нужно: о чём сура в целом и какая главная мысль / урок. Без перечисления аятов, без длинной истории ниспослания.

Без markdown, без списков, без эмодзи, без заголовков. Просто связный текст.

В конце отдельной строкой: «И Аллах знает лучше.»`;

export async function explainSura({ suraNumber, suraName, translation, revelation, ayahCount }) {
  const key = `sura:${suraNumber}`;
  if (cache.has(key)) return { ok: true, text: cache.get(key), cached: true };

  const userPrompt = `Сура «${suraName}» (${suraNumber}). Перевод названия: ${translation}. Откровение: ${revelation}. Аятов: ${ayahCount}.

Расскажи кратко и тепло, о чём эта сура.`;

  const result = await geminiFetch({
    systemInstruction: { parts: [{ text: SURA_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 450,
      topP: 0.9,
      thinkingConfig: { thinkingBudget: 0 },
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ],
  });
  if (!result.ok) {
    return { ok: false, error: result.status ? `HTTP ${result.status}` : (result.network || "network") };
  }
  const parts = result.data?.candidates?.[0]?.content?.parts;
  const text = parts?.map((p) => p.text).filter(Boolean).join("\n").trim();
  if (!text) return { ok: false, error: "Пустой ответ от модели" };
  cache.set(key, text);
  return { ok: true, text };
}

export function getCachedSuraExplanation(suraNumber) {
  return cache.get(`sura:${suraNumber}`) ?? null;
}

const RECITE_PROMPT = `Ты — экзаменатор хифза в мечети. Уровень суровости — как у муаллима, который слушал хафизов десятилетиями. Никакой жалости, никакого «ну в целом похоже».

ВХОД: эталонный арабский текст аята с полными огласовками + аудиозапись пользователя.

ПРАВИЛО ПО УМОЛЧАНИЮ: слово НЕ засчитано. Для зачёта ты должен ПОЛОЖИТЕЛЬНО услышать это слово в аудио. Если в аудио тишина, шум, посторонний звук, бормотание, мычание, обрывок без огласовки или непонятный звук — это НЕ зачёт.

Слово засчитывается ТОЛЬКО при выполнении ВСЕХ условий одновременно:
1. Все буквы услышаны и произнесены правильно. Подмены типа ع↔ا, ح↔ه↔خ, ق↔ك, ص↔س↔ث, ض↔د↔ظ, ط↔ت, ذ↔ز — мгновенный незачёт.
2. Огласовки точные. فَعَلَ ≠ فَعِلَ ≠ فَعُلَ. مَلِك ≠ مُلْك. Фатха/кясра/дамма не перепутаны нигде.
3. Мадд выдержан до конца: краткая гласная — короткая (1 хараака), мадд табийи (alef/waw/ya мадд) — 2 хараака, мадд муттасыль/мунфасыль/лязим — 4–6 хараака. Если хафиз тянет короткую — незачёт. Если режет долгую — незачёт.
4. Ташдид (شدّة) реально слышен — двойная артикуляция, удерживание согласной. Без удвоения — незачёт.
5. Сукун — мгновенная остановка без призвука. Если человек добавил «эээ» / «ыы» / гласную после сукуна — незачёт.
6. Таджвид: гунна на ن/م + ташдид (~2 хараака), идгам/иклаб/ихфа на нунах саакин и танвинах, калькаля на ق ط ب ج د в сукуне (отскок), мадд там где обязателен. Нарушение слышимого правила — незачёт.
7. Хамза — чёткий гортанный смыкающий удар, не размытый.
8. Качалка/распев в стиле «как-нибудь дочитать» — незачёт.

ЕСЛИ СОМНЕНИЕ — НЕ ЗАСЧИТЫВАЙ. Уровень — как у муаллима, который не пропускает ни единой ошибки. Лучше отказать 100 раз и потом подтвердить, чем пропустить ошибку.

Ты НЕ ДОЛЖЕН угадывать. Ты НЕ ДОЛЖЕН добавлять слово в matched, если в аудио его нет. Если человек прочитал только первые 2 слова из 10 — matched содержит максимум те 2 слова и ничего больше.

ВХОДНОЕ ПОЛЕ "alreadyMatched" — индексы слов, уже засчитанных на прошлых чанках. Эти индексы нужно ВКЛЮЧИТЬ в ответ как часть matched (они уже подтверждены). Сверх них добавляй только новые слова, которые ты ТОЧНО услышал в текущем аудио и они ТОЧНО соответствуют эталону.

Тишина, музыка, посторонний шум, не-арабская речь, бормотание, неразборчивое чтение → matched = alreadyMatched (без добавлений), errors = [], comment = "Не слышу чёткого чтения".

Верни СТРОГО валидный JSON без markdown, без префиксов, без бэктиков:
{"matched":[<все индексы правильно прочитанных слов, 0-based, отсортированные по возрастанию>],"errors":[{"i":<индекс>,"hint":"<короткая ошибка по-русски: 'кясра вместо фатхи' / 'нет ташдида' / 'мадд недотянут' / 'буква ع вместо ا' и т.п."}],"comment":"<короткая фраза пользователю по-русски: что услышал, на что обратить внимание>"}`;

export async function checkRecitation({ arabicReference, audioBase64, mimeType = "audio/m4a", alreadyMatched = [] }) {
  const wordCount = arabicReference.split(/\s+/).filter(Boolean).length;
  const audioBytes = Math.floor((audioBase64?.length || 0) * 0.75);
  // Heuristic: m4a/mp4 typically ~12-16 KB/s. < 4 KB ≈ < 0.3s real audio → almost certainly silence.
  if (audioBytes < 4000) {
    return {
      ok: true,
      matched: [...alreadyMatched],
      errors: [],
      comment: "Не слышу чёткого чтения",
    };
  }
  const userPrompt = `Эталон аята (с огласовками):\n${arabicReference}\n\nКоличество слов в эталоне: ${wordCount} (индексы 0..${wordCount - 1}).\nalreadyMatched: ${JSON.stringify(alreadyMatched)}\n\nСверь чтение СТРОЖАЙШЕ. Не выходи за индексы 0..${wordCount - 1}. Не добавляй слова, которых не слышишь.`;
  const result = await geminiFetch({
    systemInstruction: { parts: [{ text: RECITE_PROMPT }] },
    contents: [
      {
        role: "user",
        parts: [
          { text: userPrompt },
          { inlineData: { mimeType, data: audioBase64 } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
      topP: 0.1,
      maxOutputTokens: 600,
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: "application/json",
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ],
  }, { preferFast: true });
  if (!result.ok) {
    return { ok: false, error: result.status ? `HTTP ${result.status}` : (result.network || "network"), detail: (result.body || "").slice(0, 200) };
  }
  const parts = result.data?.candidates?.[0]?.content?.parts;
  const raw = parts?.map((p) => p.text).filter(Boolean).join("").trim() ?? "";
  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      try { parsed = JSON.parse(m[0]); } catch {}
    }
  }
  if (!parsed || !Array.isArray(parsed.matched)) {
    return { ok: false, error: "Не разобрал ответ модели", raw };
  }
  const filteredMatched = parsed.matched
    .filter((n) => Number.isInteger(n) && n >= 0 && n < wordCount);
  const dedupMatched = Array.from(new Set([...alreadyMatched, ...filteredMatched])).sort((a, b) => a - b);
  return {
    ok: true,
    matched: dedupMatched,
    errors: Array.isArray(parsed.errors) ? parsed.errors.filter((e) => Number.isInteger(e?.i) && e.i >= 0 && e.i < wordCount) : [],
    comment: parsed.comment ?? "",
  };
}
