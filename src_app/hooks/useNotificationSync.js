import { useEffect } from "react";
import { scheduleAllPrayerNotifications, ensureNotificationHandler } from "../services/notifications";
import { getDayStats } from "../services/statistics";

export function useNotificationSync({ city, settings, hydrated }) {
  useEffect(() => {
    ensureNotificationHandler();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!city) return;
    let cancelled = false;
    (async () => {
      const completedToday = await getDayStats(new Date());
      if (cancelled) return;
      scheduleAllPrayerNotifications({ city, settings, completedToday }).catch(() => undefined);
    })();
    return () => {
      cancelled = true;
    };
  }, [
    hydrated,
    city,
    settings?.calculationMethod,
    settings?.madhab,
    settings?.notifications?.enabled,
    settings?.notifications?.sound,
    settings?.notifications?.vibration,
    settings?.notifications?.leadMinutes,
    settings?.notifications?.nagUntilMarked,
    settings?.notifications?.perPrayer?.Fajr,
    settings?.notifications?.perPrayer?.Dhuhr,
    settings?.notifications?.perPrayer?.Asr,
    settings?.notifications?.perPrayer?.Maghrib,
    settings?.notifications?.perPrayer?.Isha,
  ]);
}
