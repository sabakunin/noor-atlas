import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getItem(key, fallback = null) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  } catch {
    return fallback;
  }
}

export async function setItem(key, value) {
  try {
    const payload = typeof value === "string" ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key, payload);
    return true;
  } catch {
    return false;
  }
}

export async function removeItem(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export async function multiRemove(keys) {
  try {
    await AsyncStorage.multiRemove(keys);
  } catch {
    /* ignore */
  }
}

export async function clearByPrefix(prefix) {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const targets = allKeys.filter((k) => k.startsWith(prefix));
    if (targets.length) await AsyncStorage.multiRemove(targets);
  } catch {
    /* ignore */
  }
}

export const StorageKeys = {
  settings: "noor:settings",
  permissionsDone: "noor:permissions-done",
  tasbihCount: "noor:tasbih-count",
  tasbihMode: "noor:tasbih-mode",
  ayahIndex: "noor:ayah-index",
  duaIndex: "noor:dua-index",
  city: "noor:city",
  statsPrefix: "noor:stats:",
  bookmarks: "noor:quran:bookmarks",
  lastRead: "noor:quran:last-read",
  preferredQari: "noor:quran:qari",
  preferredMushaf: "noor:quran:mushaf",
  geminiApiKey: "noor:ai:gemini-key",
  quranReminders: "noor:quran:reminders-on",
};
