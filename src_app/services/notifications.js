import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { getDayTimingsRange, PrayerKeys } from "./prayerTimes";
import { isoDate } from "../utils/time";
import { t } from "../i18n";

const SchedulableTypes = Notifications.SchedulableTriggerInputTypes ?? {
  DATE: "date",
  TIME_INTERVAL: "timeInterval",
};

const NAG_OFFSETS = [0, 1, 3, 5, 10, 15];

let handlerInitialized = false;

export function ensureNotificationHandler() {
  if (handlerInitialized) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  handlerInitialized = true;
}

export async function ensureAndroidChannel(soundEnabled = true, vibrationEnabled = true) {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("prayer", {
    name: "Намазы",
    importance: Notifications.AndroidImportance.HIGH,
    sound: soundEnabled ? "default" : null,
    vibrationPattern: vibrationEnabled ? [0, 200, 150, 200] : [0],
    lightColor: "#dec08a",
    enableVibrate: vibrationEnabled,
  });
}

export async function getPermissionStatus() {
  if (Platform.OS === "web") return { granted: false, status: "unsupported" };
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return { granted: status === "granted", status };
  } catch {
    return { granted: false, status: "error" };
  }
}

export async function requestNotificationPermission() {
  if (Platform.OS === "web") return { granted: false, status: "unsupported" };
  try {
    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;
    if (finalStatus !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }
    return { granted: finalStatus === "granted", status: finalStatus };
  } catch (e) {
    return { granted: false, status: "error", error: e };
  }
}

export async function scheduleAllPrayerNotifications({
  city,
  settings,
  completedToday = {},
}) {
  if (!city || !settings?.notifications?.enabled) {
    await cancelAllPrayerNotifications();
    return { scheduled: 0 };
  }

  const granted = (await getPermissionStatus()).granted;
  if (!granted) return { scheduled: 0, blocked: true };

  await ensureAndroidChannel(settings.notifications.sound, settings.notifications.vibration);
  await cancelAllPrayerNotifications();

  const days = getDayTimingsRange({
    lat: city.lat,
    lon: city.lon,
    methodKey: settings.calculationMethod,
    madhab: settings.madhab,
    days: 7,
    startDate: new Date(),
  });

  const lead = Math.max(0, settings.notifications.leadMinutes ?? 0);
  const nag = settings.notifications.nagUntilMarked !== false;
  const todayKey = isoDate(new Date());
  const now = Date.now();
  let scheduled = 0;

  for (const day of days) {
    const dayKey = isoDate(day.date);
    const isToday = dayKey === todayKey;
    const offsets = isToday && nag ? NAG_OFFSETS : [0];

    for (const key of PrayerKeys) {
      if (key === "Sunrise") continue;
      if (settings.notifications.perPrayer?.[key] === false) continue;
      if (isToday && completedToday[key]) continue;

      const prayerDate = day.timings[key];
      if (!prayerDate) continue;

      const prayerLabel = t(`prayers.${key}`);

      for (let i = 0; i < offsets.length; i += 1) {
        const offset = offsets[i];
        const isFirst = i === 0;
        const triggerDate = isFirst
          ? new Date(prayerDate.getTime() - lead * 60 * 1000)
          : new Date(prayerDate.getTime() + offset * 60 * 1000);

        if (triggerDate.getTime() <= now + 30 * 1000) continue;

        const body = isFirst
          ? lead === 0
            ? `Время намаза ${prayerLabel}`
            : `${prayerLabel} через ${lead} мин`
          : `Не забудь про ${prayerLabel} — отметь, когда совершишь`;

        try {
          await Notifications.scheduleNotificationAsync({
            identifier: `prayer-${dayKey}-${key}-r${i}`,
            content: {
              title: "Noor Atlas",
              body,
              sound: settings.notifications.sound ? "default" : undefined,
              data: { prayerKey: key, prayerTime: prayerDate.toISOString(), reminderIndex: i },
              ...(Platform.OS === "android" ? { channelId: "prayer" } : {}),
            },
            trigger: { type: SchedulableTypes.DATE, date: triggerDate },
          });
          scheduled += 1;
        } catch {
          /* ignore individual failure */
        }
      }
    }
  }

  return { scheduled };
}

export async function cancelAllPrayerNotifications() {
  if (Platform.OS === "web") return;
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    const ids = all
      .filter((n) => n.identifier?.startsWith?.("prayer-"))
      .map((n) => n.identifier);
    if (ids.length) {
      await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
    }
  } catch {
    /* ignore */
  }
}

export async function cancelPrayerReminders(date, prayerKey) {
  if (Platform.OS === "web") return;
  try {
    const dayKey = isoDate(date);
    const prefix = `prayer-${dayKey}-${prayerKey}-`;
    const all = await Notifications.getAllScheduledNotificationsAsync();
    const ids = all
      .filter((n) => n.identifier?.startsWith?.(prefix))
      .map((n) => n.identifier);
    if (ids.length) {
      await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
    }
  } catch {
    /* ignore */
  }
}

export async function scheduleTestNotification() {
  const granted = (await getPermissionStatus()).granted;
  if (!granted) return { ok: false, reason: "denied" };
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Noor Atlas",
        body: "Тестовое уведомление работает.",
        sound: "default",
        ...(Platform.OS === "android" ? { channelId: "prayer" } : {}),
      },
      trigger: { type: SchedulableTypes.TIME_INTERVAL, seconds: 5, repeats: false },
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "error", error: e };
  }
}

const PRAYER_EMOJI = {
  Fajr: "🌅",
  Dhuhr: "☀️",
  Asr: "⛅",
  Maghrib: "🌇",
  Isha: "🌙",
};

// Quran reading reminders — 5 times a day at fixed local times.
// Uses CALENDAR triggers so the OS keeps firing them daily without our app being awake.
const QURAN_REMINDER_TIMES = [
  { hour: 7, minute: 30, body: "Утреннее чтение Корана — открой суру и начни день со Слова Аллаха" },
  { hour: 12, minute: 30, body: "Дневная пауза — прочитай хотя бы один аят и подумай над его смыслом" },
  { hour: 16, minute: 0, body: "Послеобеденное чтение — продолжи с того места, где остановился" },
  { hour: 19, minute: 30, body: "Вечернее чтение — Коран освещает сердце перед сном" },
  { hour: 22, minute: 0, body: "Ночное чтение — заверши день несколькими аятами" },
];

export async function scheduleQuranReadingReminders() {
  if (Platform.OS === "web") return { ok: false };
  const granted = (await getPermissionStatus()).granted;
  if (!granted) return { ok: false, blocked: true };

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("quran", {
      name: "Чтение Корана",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
      vibrationPattern: [0, 150, 100, 150],
      lightColor: "#dec08a",
    });
  }

  await cancelQuranReadingReminders();

  let scheduled = 0;
  for (let i = 0; i < QURAN_REMINDER_TIMES.length; i += 1) {
    const t = QURAN_REMINDER_TIMES[i];
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `quran-daily-${i}`,
        content: {
          title: "Время Корана",
          body: t.body,
          sound: "default",
          ...(Platform.OS === "android" ? { channelId: "quran" } : {}),
        },
        trigger: {
          type: SchedulableTypes.CALENDAR ?? "calendar",
          hour: t.hour,
          minute: t.minute,
          repeats: true,
        },
      });
      scheduled += 1;
    } catch {
      /* fallback to daily trigger if CALENDAR unsupported */
      try {
        await Notifications.scheduleNotificationAsync({
          identifier: `quran-daily-${i}`,
          content: {
            title: "Время Корана",
            body: t.body,
            sound: "default",
            ...(Platform.OS === "android" ? { channelId: "quran" } : {}),
          },
          trigger: { hour: t.hour, minute: t.minute, repeats: true },
        });
        scheduled += 1;
      } catch {}
    }
  }
  return { ok: true, scheduled };
}

export async function cancelQuranReadingReminders() {
  if (Platform.OS === "web") return;
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    const ids = all
      .filter((n) => n.identifier?.startsWith?.("quran-daily-"))
      .map((n) => n.identifier);
    if (ids.length) await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
  } catch {
    /* ignore */
  }
}

export async function scheduleDynamicIslandTest(prayerKey = "Asr") {
  const granted = (await getPermissionStatus()).granted;
  if (!granted) return { ok: false, reason: "denied" };
  const prayerLabel = t(`prayers.${prayerKey}`) || prayerKey;
  const emoji = PRAYER_EMOJI[prayerKey] ?? "🕌";
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: `dyn-island-test-${Date.now()}`,
      content: {
        title: `${emoji} Время намаза — ${prayerLabel}`,
        subtitle: prayerLabel,
        body: `${emoji}  Совершить ${prayerLabel}. Когда выполнишь — отметь в приложении.`,
        sound: "default",
        interruptionLevel: "timeSensitive",
        categoryIdentifier: "prayer-time",
        data: { prayerKey, dynamicIsland: true },
        ...(Platform.OS === "android" ? { channelId: "prayer" } : {}),
      },
      trigger: { type: SchedulableTypes.TIME_INTERVAL, seconds: 3, repeats: false },
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "error", error: e };
  }
}
