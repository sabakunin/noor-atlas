export function formatTime(date) {
  if (!date) return "--:--";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "--:--";
  return new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(d);
}

export function formatLongDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    weekday: "long",
  }).format(d);
}

export function formatShortDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(d);
}

export function formatCountdown(targetDate) {
  if (!targetDate) return "--:--:--";
  const diff = targetDate - new Date();
  if (diff <= 0) return "00:00:00";
  const totalSeconds = Math.floor(diff / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function isoDate(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfWeek(date = new Date()) {
  const d = startOfDay(date);
  const dow = d.getDay() || 7;
  d.setDate(d.getDate() - dow + 1);
  return d;
}
