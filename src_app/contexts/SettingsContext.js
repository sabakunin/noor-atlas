import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getItem, setItem, StorageKeys } from "../services/storage";
import { setCustomGeminiKey } from "../services/ai";

const DEFAULT_SETTINGS = {
  themeMode: "system",
  language: "ru",
  uiHaptics: true,
  arabicFont: "naskh",
  quranDisplay: {
    showArabic: true,
    showTranslation: true,
    showTransliteration: true,
    showTajweed: true,
  },
  calculationMethod: "MuslimWorldLeague",
  madhab: "shafi",
  notifications: {
    enabled: true,
    sound: true,
    vibration: true,
    leadMinutes: 0,
    nagUntilMarked: true,
    perPrayer: {
      Fajr: true,
      Dhuhr: true,
      Asr: true,
      Maghrib: true,
      Isha: true,
    },
  },
  city: null,
  beta: {
    voiceCheck: true,
  },
  geminiApiKey: "",
  quranReminders: false,
};

const SettingsContext = createContext(null);

function mergeDeep(base, override) {
  if (!override) return base;
  const result = { ...base };
  for (const key of Object.keys(override)) {
    const value = override[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = mergeDeep(base[key] ?? {}, value);
    } else if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const stored = await getItem(StorageKeys.settings);
      if (alive && stored) {
        // Force-enable voice check for everyone (was previously a beta toggle some users disabled)
        const migrated = { ...stored, beta: { ...(stored.beta || {}), voiceCheck: true } };
        setSettings((current) => mergeDeep(current, migrated));
      }
      if (alive) setHydrated(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setItem(StorageKeys.settings, settings);
  }, [settings, hydrated]);

  useEffect(() => {
    setCustomGeminiKey(settings.geminiApiKey || "");
    if (hydrated) setItem(StorageKeys.geminiApiKey, settings.geminiApiKey || "");
  }, [settings.geminiApiKey, hydrated]);

  const updateSettings = useCallback((patch) => {
    setSettings((current) => mergeDeep(current, patch));
  }, []);

  const setTheme = useCallback((themeMode) => updateSettings({ themeMode }), [updateSettings]);
  const setUiHaptics = useCallback((uiHaptics) => updateSettings({ uiHaptics }), [updateSettings]);
  const setArabicFont = useCallback((arabicFont) => updateSettings({ arabicFont }), [updateSettings]);
  const setQuranDisplay = useCallback(
    (patch) => updateSettings({ quranDisplay: patch }),
    [updateSettings]
  );
  const setMethod = useCallback((calculationMethod) => updateSettings({ calculationMethod }), [updateSettings]);
  const setMadhab = useCallback((madhab) => updateSettings({ madhab }), [updateSettings]);
  const setCity = useCallback((city) => updateSettings({ city }), [updateSettings]);
  const setNotifications = useCallback(
    (patch) => updateSettings({ notifications: patch }),
    [updateSettings]
  );
  const setBeta = useCallback(
    (patch) => updateSettings({ beta: patch }),
    [updateSettings]
  );
  const setGeminiApiKey = useCallback(
    (key) => updateSettings({ geminiApiKey: key ?? "" }),
    [updateSettings]
  );
  const setQuranReminders = useCallback(
    (on) => updateSettings({ quranReminders: !!on }),
    [updateSettings]
  );

  const value = useMemo(
    () => ({
      ...settings,
      hydrated,
      updateSettings,
      setTheme,
      setUiHaptics,
      setArabicFont,
      setQuranDisplay,
      setMethod,
      setMadhab,
      setCity,
      setNotifications,
      setBeta,
      setGeminiApiKey,
      setQuranReminders,
    }),
    [settings, hydrated, updateSettings, setTheme, setUiHaptics, setArabicFont, setQuranDisplay, setMethod, setMadhab, setCity, setNotifications, setBeta, setGeminiApiKey, setQuranReminders]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
