import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Screen } from "../components/Screen";
import { Text } from "../components/Text";
import { Card } from "../components/Card";
import { NextPrayerHero } from "../components/NextPrayerHero";
import { PrayerCard } from "../components/PrayerCard";
import { AyahCard } from "../components/AyahCard";
import { HijriDateBar } from "../components/HijriDateBar";
import { SectionHeader } from "../components/SectionHeader";
import { FadeSlideIn } from "../components/motion/FadeSlideIn";
import { useTheme } from "../theme";
import { useSettings } from "../contexts/SettingsContext";
import { usePrayerTimes } from "../hooks/usePrayerTimes";
import { formatLongDate } from "../utils/time";
import { formatHijri } from "../utils/dates";
import { getAyahForToday } from "../data/ayahs";
import { getDuaForToday } from "../data/duas";
import { getHadithForToday } from "../data/hadiths";
import { getDayStats, setPrayerStatus, TrackedPrayers } from "../services/statistics";
import { cancelPrayerReminders, scheduleAllPrayerNotifications } from "../services/notifications";
import { t } from "../i18n";

export function HomeScreen({ onOpenAyah, onOpenDua, onOpenCity }) {
  const { colors, spacing, radius } = useTheme();
  const settings = useSettings();
  const { city, calculationMethod, madhab, uiHaptics } = settings;
  const { prayers, next, current, countdownMs } = usePrayerTimes({ city, methodKey: calculationMethod, madhab });
  const [stats, setStats] = useState({});

  const ayah = useMemo(() => getAyahForToday(), []);
  const dua = useMemo(() => getDuaForToday(), []);
  const hadith = useMemo(() => getHadithForToday(), []);
  const todayLong = useMemo(() => formatLongDate(new Date()), []);
  const hijri = useMemo(() => formatHijri(new Date()), []);

  const refreshStats = useCallback(async () => {
    const today = await getDayStats(new Date());
    setStats(today);
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  function handleToggle(key) {
    const newState = !stats[key];
    setStats((prev) => ({ ...prev, [key]: newState }));
    if (uiHaptics !== false) {
      import("expo-haptics")
        .then((H) => H.selectionAsync?.().catch?.(() => {}))
        .catch(() => {});
    }
    (async () => {
      try {
        await setPrayerStatus(new Date(), key, newState);
        if (newState) {
          cancelPrayerReminders(new Date(), key).catch(() => undefined);
        } else if (city) {
          const today = await getDayStats(new Date());
          scheduleAllPrayerNotifications({ city, settings, completedToday: today }).catch(() => undefined);
        }
      } catch (e) {
        console.warn("toggle prayer failed:", e);
        setStats((prev) => ({ ...prev, [key]: !newState }));
      }
    })();
  }

  const completedToday = TrackedPrayers.reduce((acc, k) => acc + (stats[k] ? 1 : 0), 0);

  return (
    <Screen>
      <FadeSlideIn delay={20}>
        <HijriDateBar gregorian={todayLong} hijri={hijri} />
      </FadeSlideIn>

      <FadeSlideIn delay={80}>
        <NextPrayerHero
          next={next}
          countdownMs={countdownMs}
          city={city}
          hijri={hijri}
        />
      </FadeSlideIn>

      <FadeSlideIn delay={140}>
        <SectionHeader
          title={t("home.schedule")}
          eyebrow={t("home.today")}
          right={
            <Text variant="bodySm" color="muted">
              {t("statistics.of", completedToday, TrackedPrayers.length)}
            </Text>
          }
        />
      </FadeSlideIn>

      <FadeSlideIn delay={180}>
        <View style={{ gap: spacing.sm, marginBottom: spacing.xl }}>
          {prayers.length === 0 ? (
            <Card>
              <Text variant="body" color="muted" align="center">
                {t("common.loading")}
              </Text>
            </Card>
          ) : (
            prayers.map((p) => {
              const isPast = p.date && p.date < new Date();
              const isActive = current?.key === p.key;
              return (
                <PrayerCard
                  key={p.key}
                  prayerKey={p.key}
                  time={p.date}
                  active={isActive}
                  completed={stats[p.key] === true}
                  onToggle={() => handleToggle(p.key)}
                  isPast={isPast}
                />
              );
            })
          )}
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={220}>
        <SectionHeader title={t("home.ayahOfDay")} eyebrow="Quran" />
        <View style={{ marginBottom: spacing.lg }}>
          <AyahCard ayah={ayah} onPress={onOpenAyah} />
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={260}>
        <SectionHeader title={t("home.duaOfDay")} eyebrow="Dua" />
        <View style={{ marginBottom: spacing.lg }}>
          <Card onPress={onOpenDua} padding="lg">
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: radius.md,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.cardElevated,
                }}
              >
                <MaterialCommunityIcons name="hands-pray" size={20} color={colors.gold} />
              </View>
              <Text variant="h3" color="text" weight="600" style={{ flex: 1 }}>
                {dua.title}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
            </View>
            <Text variant="body" color="muted" numberOfLines={2}>
              {dua.translation}
            </Text>
          </Card>
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={300}>
        <SectionHeader title="Хадис дня" eyebrow="Hadith" />
        <Card padding="lg">
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: radius.md,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.cardElevated,
              }}
            >
              <MaterialCommunityIcons name="book-open-variant" size={18} color={colors.gold} />
            </View>
            <Text variant="h3" color="text" weight="600" style={{ flex: 1 }}>
              {hadith.title}
            </Text>
          </View>
          <Text variant="body" color="text" style={{ lineHeight: 24 }}>
            «{hadith.body}»
          </Text>
          {hadith.narrator ? (
            <Text variant="bodySm" color="muted" style={{ marginTop: 10 }}>
              Передал {hadith.narrator}
            </Text>
          ) : null}
          {hadith.source ? (
            <Text variant="caption" color="mutedSoft" style={{ marginTop: 4, letterSpacing: 0.5 }}>
              {hadith.source}
            </Text>
          ) : null}
        </Card>
      </FadeSlideIn>

      <FadeSlideIn delay={340}>
        <Card onPress={onOpenCity} padding="md" style={{ marginTop: spacing.xl }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <MaterialCommunityIcons name="map-marker-outline" size={18} color={colors.gold} />
              <Text variant="bodySm" color="text">
                {city?.title ?? "—"}, {city?.country ?? ""}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.muted} />
          </View>
        </Card>
      </FadeSlideIn>
    </Screen>
  );
}
