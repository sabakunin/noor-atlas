const HIJRI_MONTHS = [
  "Мухаррам",
  "Сафар",
  "Раби аль-авваль",
  "Раби ас-сани",
  "Джумада аль-уля",
  "Джумада ас-сани",
  "Раджаб",
  "Шаабан",
  "Рамадан",
  "Шавваль",
  "Зуль-када",
  "Зуль-хиджа",
];

export function toHijri(date = new Date()) {
  if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
    try {
      const fmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      });
      const parts = fmt.formatToParts(date);
      const obj = {};
      for (const p of parts) {
        if (p.type === "day") obj.day = parseInt(p.value, 10);
        else if (p.type === "month") obj.month = parseInt(p.value, 10);
        else if (p.type === "year") obj.year = parseInt(p.value, 10);
      }
      if (obj.day && obj.month && obj.year) {
        return {
          day: obj.day,
          month: obj.month,
          year: obj.year,
          monthName: HIJRI_MONTHS[obj.month - 1] ?? `${obj.month}`,
        };
      }
    } catch {
      /* fall through */
    }
  }
  return calculateHijriUmmAlQura(date);
}

function calculateHijriUmmAlQura(date) {
  const jd = gregorianToJulian(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const islamicEpoch = 1948439.5;
  const days = jd - islamicEpoch;
  const cycles = Math.floor(days / 10631);
  const remainingDaysInCycle = days - cycles * 10631;

  let yearInCycle = 0;
  let dayPointer = remainingDaysInCycle;
  while (true) {
    const yearLength = isHijriLeap(yearInCycle + 1) ? 355 : 354;
    if (dayPointer < yearLength) break;
    dayPointer -= yearLength;
    yearInCycle += 1;
  }

  const year = cycles * 30 + yearInCycle + 1;

  let month = 1;
  while (month <= 12) {
    const monthLength = month % 2 === 1 ? 30 : month === 12 && isHijriLeap(yearInCycle + 1) ? 30 : 29;
    if (dayPointer < monthLength) break;
    dayPointer -= monthLength;
    month += 1;
  }

  const day = Math.floor(dayPointer) + 1;
  return {
    day,
    month,
    year,
    monthName: HIJRI_MONTHS[month - 1] ?? `${month}`,
  };
}

function gregorianToJulian(y, m, d) {
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
}

function isHijriLeap(yearInCycle) {
  const leapYears = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
  return leapYears.includes(yearInCycle);
}

export function formatHijri(date = new Date()) {
  const h = toHijri(date);
  return `${h.day} ${h.monthName} ${h.year}`;
}
