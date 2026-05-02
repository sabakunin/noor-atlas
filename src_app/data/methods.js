export const calculationMethods = [
  {
    key: "MuslimWorldLeague",
    title: "Muslim World League",
    subtitle: "Универсальный метод, рекомендуется для большинства регионов",
  },
  {
    key: "Egyptian",
    title: "Egyptian General Authority",
    subtitle: "Используется в Африке, Сирии, Ливане, Малайзии",
  },
  {
    key: "Karachi",
    title: "University of Islamic Sciences, Karachi",
    subtitle: "Пакистан, Бангладеш, Индия, Афганистан",
  },
  {
    key: "UmmAlQura",
    title: "Umm Al-Qura University, Makkah",
    subtitle: "Саудовская Аравия и для Хаджа",
  },
  {
    key: "Dubai",
    title: "Dubai",
    subtitle: "ОАЭ",
  },
  {
    key: "Qatar",
    title: "Qatar",
    subtitle: "Катар",
  },
  {
    key: "Kuwait",
    title: "Kuwait",
    subtitle: "Кувейт",
  },
  {
    key: "MoonsightingCommittee",
    title: "Moonsighting Committee",
    subtitle: "С учётом сезонных корректировок",
  },
  {
    key: "Singapore",
    title: "Majlis Ugama Islam Singapura",
    subtitle: "Сингапур",
  },
  {
    key: "Turkey",
    title: "Diyanet İşleri Başkanlığı",
    subtitle: "Турция",
  },
  {
    key: "Tehran",
    title: "Institute of Geophysics, Tehran",
    subtitle: "Иран, шиитский метод",
  },
  {
    key: "NorthAmerica",
    title: "ISNA — Северная Америка",
    subtitle: "США и Канада",
  },
];

export function getMethodMeta(key) {
  return calculationMethods.find((m) => m.key === key) ?? calculationMethods[0];
}
