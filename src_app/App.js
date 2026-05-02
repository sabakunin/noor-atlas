import React, { useEffect, useState } from "react";
import { View, Animated, Easing, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useTheme } from "./theme";
import { SettingsProvider, useSettings } from "./contexts/SettingsContext";
import { defaultCity } from "./data/cities";
import { ensureNotificationHandler, scheduleQuranReadingReminders, cancelQuranReadingReminders } from "./services/notifications";
import { getItem, StorageKeys } from "./services/storage";
import { useNotificationSync } from "./hooks/useNotificationSync";
import { SplashScreen } from "./screens/SplashScreen";
import { PermissionGateScreen } from "./screens/PermissionGateScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { QiblaScreen } from "./screens/QiblaScreen";
import { TasbihScreen } from "./screens/TasbihScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { StatisticsScreen } from "./screens/StatisticsScreen";
import { QuranScreen } from "./screens/QuranScreen";
import { SuraScreen } from "./screens/SuraScreen";
import { MushafScreen } from "./screens/MushafScreen";
import { BookmarksScreen } from "./screens/BookmarksScreen";
import { VoiceCheckScreen } from "./screens/VoiceCheckScreen";
import { AyahDailyModal } from "./screens/AyahDailyModal";
import { DuaScreen } from "./screens/DuaScreen";
import { CityPickerScreen } from "./screens/CityPickerScreen";
import { AboutScreen } from "./screens/AboutScreen";
import { BottomTabs } from "./components/BottomTabs";
import { getCurrentCoords, getLocationPermissionStatus, reverseGeocode } from "./services/location";
import { findCityByCoords } from "./data/cities";

ensureNotificationHandler();
const TAB_ORDER = ["home", "qibla", "quran", "tasbih", "profile"];

function AppShell() {
  const settings = useSettings();
  const { colors, fontsLoaded } = useTheme();
  const [bootDone, setBootDone] = useState(false);
  const [permissionsChecked, setPermissionsChecked] = useState(false);
  const [permissionGateVisible, setPermissionGateVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [displayTab, setDisplayTab] = useState("home");
  const [tabDirection, setTabDirection] = useState(1);
  const [modal, setModal] = useState(null);
  const [suraModal, setSuraModal] = useState(null);

  function openSura(suraNumber, startAyah, opts) {
    setSuraModal({ suraNumber, startAyah, autoPlay: !!opts?.autoPlay });
  }
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const tabAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const done = await getItem(StorageKeys.permissionsDone, null);
      if (cancelled) return;
      setPermissionGateVisible(!done);
      setPermissionsChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setBootDone(true), 1300);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!bootDone || !permissionsChecked) return;
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [bootDone, permissionsChecked, fadeAnim]);

  useEffect(() => {
    if (activeTab === displayTab) return;
    const currentIndex = TAB_ORDER.indexOf(displayTab);
    const nextIndex = TAB_ORDER.indexOf(activeTab);
    setTabDirection(nextIndex >= currentIndex ? 1 : -1);
    setDisplayTab(activeTab);
    tabAnim.setValue(0);
    Animated.spring(tabAnim, {
      toValue: 1,
      stiffness: 200,
      damping: 24,
      mass: 0.85,
      useNativeDriver: true,
    }).start();
  }, [activeTab, displayTab, tabAnim]);

  useEffect(() => {
    if (!settings.hydrated) return;
    if (!settings.city) {
      settings.setCity(defaultCity);
    }
  }, [settings.hydrated, settings.city, settings]);

  useEffect(() => {
    if (!settings.hydrated) return;
    if (permissionGateVisible) return;
    if (Platform.OS === "web") return;
    (async () => {
      try {
        const perm = await getLocationPermissionStatus();
        if (!perm.granted) return;
        const coords = await getCurrentCoords();
        const matched = findCityByCoords(coords.lat, coords.lon, 0.8);
        if (matched && (!settings.city || settings.city.id !== matched.id)) {
          settings.setCity(matched);
          return;
        }
        if (!matched) {
          const reverse = await reverseGeocode(coords.lat, coords.lon);
          if (reverse?.city) {
            settings.setCity({
              id: `gps-${reverse.city}`,
              title: reverse.city,
              country: reverse.country ?? "—",
              lat: coords.lat,
              lon: coords.lon,
            });
          }
        }
      } catch {
        /* keep stored/default city */
      }
    })();
  }, [settings.hydrated, permissionGateVisible]);

  useNotificationSync({ city: settings.city, settings, hydrated: settings.hydrated });

  useEffect(() => {
    if (!settings.hydrated || Platform.OS === "web") return;
    if (settings.quranReminders) {
      scheduleQuranReadingReminders().catch(() => {});
    } else {
      cancelQuranReadingReminders().catch(() => {});
    }
  }, [settings.hydrated, settings.quranReminders]);

  if (!bootDone || !permissionsChecked || !settings.hydrated || !fontsLoaded) {
    return <SplashScreen />;
  }

  if (permissionGateVisible) {
    return (
      <PermissionGateScreen
        onDone={() => setPermissionGateVisible(false)}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Animated.View
        style={{
          flex: 1,
          opacity: Animated.multiply(fadeAnim, tabAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.6, 1],
          })),
          transform: [
            {
              translateX: tabAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [28 * tabDirection, 0],
              }),
            },
          ],
        }}
      >
        {displayTab === "home" ? (
          <HomeScreen
            onOpenAyah={() => setModal("ayah")}
            onOpenDua={() => setModal("dua")}
            onOpenCity={() => setModal("city")}
          />
        ) : null}
        {displayTab === "qibla" ? <QiblaScreen /> : null}
        {displayTab === "quran" ? (
          <QuranScreen
            onOpenSura={openSura}
            onOpenVoiceCheck={() => setModal("voiceCheck")}
            onOpenMushaf={() => setModal("mushaf")}
            onOpenBookmarks={() => setModal("bookmarks")}
          />
        ) : null}
        {displayTab === "tasbih" ? <TasbihScreen /> : null}
        {displayTab === "profile" ? (
          <ProfileScreen
            onOpenSettings={() => setModal("settings")}
            onOpenStatistics={() => setModal("stats")}
            onOpenAbout={() => setModal("about")}
            onOpenCity={() => setModal("city")}
          />
        ) : null}
      </Animated.View>

      <BottomTabs active={activeTab} onChange={setActiveTab} />

      <SettingsScreen
        visible={modal === "settings"}
        onClose={() => setModal(null)}
        onOpenVoiceCheck={() => setModal("voiceCheck")}
      />
      <StatisticsScreen visible={modal === "stats"} onClose={() => setModal(null)} />
      <AyahDailyModal visible={modal === "ayah"} onClose={() => setModal(null)} />
      <DuaScreen visible={modal === "dua"} onClose={() => setModal(null)} />
      <CityPickerScreen visible={modal === "city"} onClose={() => setModal(null)} />
      <AboutScreen visible={modal === "about"} onClose={() => setModal(null)} />
      <SuraScreen
        visible={!!suraModal}
        suraNumber={suraModal?.suraNumber}
        startAyah={suraModal?.startAyah}
        autoPlay={suraModal?.autoPlay}
        onClose={() => setSuraModal(null)}
      />
      <MushafScreen visible={modal === "mushaf"} onClose={() => setModal(null)} />
      <BookmarksScreen
        visible={modal === "bookmarks"}
        onClose={() => setModal(null)}
        onOpenAyah={(suraN, ayahN) => openSura(suraN, ayahN)}
      />
      <VoiceCheckScreen visible={modal === "voiceCheck"} onClose={() => setModal(null)} />
    </View>
  );
}

function ThemedRoot() {
  const { themeMode } = useSettings();
  return (
    <ThemeProvider mode={themeMode}>
      <StatusBar style="auto" />
      <AppShell />
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <ThemedRoot />
    </SettingsProvider>
  );
}
