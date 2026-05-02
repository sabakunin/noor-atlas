function pad(num, width) {
  return String(num).padStart(width, "0");
}

export const QARIS = [
  {
    id: "Alafasy_128kbps",
    name: "Мишари бин Рашид аль-Афаси",
    short: "аль-Афаси",
    accent: "Кувейт",
  },
  {
    id: "Husary_128kbps",
    name: "Махмуд Халиль аль-Хусари",
    short: "аль-Хусари",
    accent: "Египет",
  },
  {
    id: "Abdul_Basit_Murattal_192kbps",
    name: "Абдуль-Басит Абдус-Самад",
    short: "Абдуль-Басит",
    accent: "Египет, мураттал",
  },
  {
    id: "Minshawy_Murattal_128kbps",
    name: "Мухаммад Сиддик аль-Миншави",
    short: "аль-Миншави",
    accent: "Египет, мураттал",
  },
];

export function getQari(id) {
  return QARIS.find((q) => q.id === id) ?? QARIS[0];
}

export function getAyahAudioUrl(suraNumber, ayahNumber, qariId = QARIS[0].id) {
  const q = getQari(qariId).id;
  return `https://everyayah.com/data/${q}/${pad(suraNumber, 3)}${pad(ayahNumber, 3)}.mp3`;
}

export function buildSuraQueue(suraNumber, ayahCount, qariId = QARIS[0].id) {
  const items = [];
  for (let i = 1; i <= ayahCount; i += 1) {
    items.push({
      suraNumber,
      ayahNumber: i,
      url: getAyahAudioUrl(suraNumber, i, qariId),
    });
  }
  return items;
}
