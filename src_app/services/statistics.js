import { getItem, setItem, StorageKeys } from "./storage";
import { isoDate, startOfWeek, addDays } from "../utils/time";

const TRACKED_PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

function key(date) {
  return `${StorageKeys.statsPrefix}${isoDate(date)}`;
}

export async function getDayStats(date = new Date()) {
  const stored = await getItem(key(date), null);
  if (!stored) {
    return TRACKED_PRAYERS.reduce((acc, k) => {
      acc[k] = false;
      return acc;
    }, {});
  }
  return TRACKED_PRAYERS.reduce((acc, k) => {
    acc[k] = stored[k] === true;
    return acc;
  }, {});
}

export async function setPrayerStatus(date, prayerKey, completed) {
  if (!TRACKED_PRAYERS.includes(prayerKey)) return;
  const current = await getDayStats(date);
  current[prayerKey] = !!completed;
  await setItem(key(date), current);
}

export async function togglePrayerStatus(date, prayerKey) {
  const current = await getDayStats(date);
  await setPrayerStatus(date, prayerKey, !current[prayerKey]);
  return !current[prayerKey];
}

export async function getWeekStats(weekStart = startOfWeek()) {
  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const date = addDays(weekStart, i);
    const stats = await getDayStats(date);
    days.push({ date, stats });
  }
  return days;
}

export async function getMonthSummary(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  let completed = 0;
  for (let d = 1; d <= totalDays; d += 1) {
    const dayDate = new Date(year, month, d);
    if (dayDate > new Date()) break;
    const stats = await getDayStats(dayDate);
    completed += TRACKED_PRAYERS.reduce((acc, k) => acc + (stats[k] ? 1 : 0), 0);
  }
  const possible = TRACKED_PRAYERS.length * Math.min(date.getDate(), totalDays);
  return { completed, possible, percent: possible ? Math.round((completed / possible) * 100) : 0 };
}

export async function getCurrentStreak() {
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i += 1) {
    const stats = await getDayStats(cursor);
    const hasAny = TRACKED_PRAYERS.some((k) => stats[k]);
    if (!hasAny) {
      if (i === 0) {
        cursor = addDays(cursor, -1);
        continue;
      }
      break;
    }
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export const TrackedPrayers = TRACKED_PRAYERS;
