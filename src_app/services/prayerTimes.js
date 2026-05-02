import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from "adhan";

const PRAYER_KEYS = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

function resolveMethodParams(methodKey) {
  const factory = CalculationMethod[methodKey];
  if (typeof factory === "function") return factory();
  return CalculationMethod.MuslimWorldLeague();
}

export function calculatePrayerTimes({ lat, lon, date = new Date(), methodKey = "MuslimWorldLeague", madhab = "shafi" }) {
  const params = resolveMethodParams(methodKey);
  params.madhab = madhab === "hanafi" ? Madhab.Hanafi : Madhab.Shafi;
  const coords = new Coordinates(lat, lon);
  const prayerTimes = new PrayerTimes(coords, date, params);
  return PRAYER_KEYS.reduce((acc, key) => {
    const lowerKey = key.charAt(0).toLowerCase() + key.slice(1);
    acc[key] = prayerTimes[lowerKey];
    return acc;
  }, {});
}

export function buildPrayerList(timings) {
  return PRAYER_KEYS.map((key) => ({
    key,
    date: timings[key],
  }));
}

export function getNextPrayer(prayerList, now = new Date()) {
  const upcoming = prayerList.find((p) => p.date && p.date.getTime() > now.getTime());
  if (upcoming) return { ...upcoming, isTomorrow: false };
  const first = prayerList[0];
  if (!first || !first.date) return null;
  const tomorrow = new Date(first.date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { ...first, date: tomorrow, isTomorrow: true };
}

export function getCurrentPrayer(prayerList, now = new Date()) {
  let current = null;
  for (const p of prayerList) {
    if (p.date && p.date.getTime() <= now.getTime()) {
      current = p;
    } else {
      break;
    }
  }
  return current;
}

export function getDayTimingsRange({ lat, lon, methodKey, madhab, days = 7, startDate = new Date() }) {
  const result = [];
  for (let i = 0; i < days; i += 1) {
    const day = new Date(startDate);
    day.setDate(day.getDate() + i);
    day.setHours(0, 0, 0, 0);
    const timings = calculatePrayerTimes({ lat, lon, date: day, methodKey, madhab });
    result.push({ date: day, timings });
  }
  return result;
}

export const PrayerKeys = PRAYER_KEYS;
