// All editions are local — they render Quranic text in different mushaf styles.
// No CDN dependency, no VPN needed, instant offline access.

export const MUSHAFS = [
  {
    id: "madinah",
    name: "Мадинский",
    short: "Мадинский",
    description: "Каноничный почерк рукописных Коранов. Шрифт Amiri.",
    pages: 604,
    accent: "#C9A86A",
    fontKey: "naskh",
    paperColor: "#FBF6E8",
    inkColor: "#1F1A12",
    style: "classic",
  },
  {
    id: "uthmani",
    name: "Османский",
    short: "Османский",
    description: "Книжный почерк KFGQPC, расширенные интервалы. Шрифт Amiri.",
    pages: 604,
    accent: "#7AB4A0",
    fontKey: "naskh",
    paperColor: "#F8F4E6",
    inkColor: "#1A1A1A",
    style: "uthmani",
  },
  {
    id: "scheherazade",
    name: "Шехерезада",
    short: "Шехерезада",
    description: "Старо-арабская типография, плотный текст. Шрифт Scheherazade New.",
    pages: 604,
    accent: "#B89968",
    fontKey: "scheherazade",
    paperColor: "#F4EFE0",
    inkColor: "#1F1A12",
    style: "scheherazade",
  },
  {
    id: "kufi",
    name: "Куфический",
    short: "Куфи",
    description: "Современная геометричная каллиграфия. Шрифт Reem Kufi.",
    pages: 604,
    accent: "#9F7CD7",
    fontKey: "kufi",
    paperColor: "#F2EFE6",
    inkColor: "#1A1320",
    style: "kufi",
  },
];

export function getMushaf(id) {
  return MUSHAFS.find((m) => m.id === id) ?? MUSHAFS[0];
}

// Approximate sura→page (1-based, [1..604]). Used for header chip + lookups.
export function approximateSuraStartPage(suraNumber) {
  return Math.max(1, Math.round(((suraNumber - 1) / 114) * 604) + 1);
}
