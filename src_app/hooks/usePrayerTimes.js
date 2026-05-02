import { useEffect, useMemo, useState } from "react";
import { calculatePrayerTimes, buildPrayerList, getNextPrayer, getCurrentPrayer } from "../services/prayerTimes";

export function usePrayerTimes({ city, methodKey, madhab }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const prayers = useMemo(() => {
    if (!city) return [];
    try {
      const timings = calculatePrayerTimes({
        lat: city.lat,
        lon: city.lon,
        methodKey,
        madhab,
        date: new Date(),
      });
      return buildPrayerList(timings);
    } catch {
      return [];
    }
  }, [city, methodKey, madhab]);

  const next = useMemo(() => (prayers.length ? getNextPrayer(prayers, now) : null), [prayers, now]);
  const current = useMemo(() => (prayers.length ? getCurrentPrayer(prayers, now) : null), [prayers, now]);

  const countdownMs = next?.date ? next.date.getTime() - now.getTime() : null;

  return { prayers, next, current, countdownMs, now };
}
