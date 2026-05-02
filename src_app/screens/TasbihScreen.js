import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, View, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Screen } from "../components/Screen";
import { Text } from "../components/Text";
import { ArabicText } from "../components/ArabicText";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { SegmentedControl } from "../components/SegmentedControl";
import { FadeSlideIn } from "../components/motion/FadeSlideIn";
import { useTheme } from "../theme";
import { useSettings } from "../contexts/SettingsContext";
import { getItem, setItem, StorageKeys } from "../services/storage";
import { t } from "../i18n";

const OPTIONS = [
  { key: "subhanallah", arabic: "سُبْحَانَ ٱللَّٰهِ", short: "СубханАллах", color: "gold" },
  { key: "alhamdulillah", arabic: "ٱلْحَمْدُ لِلَّٰهِ", short: "Альхамдулиллях", color: "teal" },
  { key: "allahuakbar", arabic: "ٱللَّٰهُ أَكْبَرُ", short: "АллахуАкбар", color: "goldDeep" },
];

const EMPTY_COUNTS = { subhanallah: 0, alhamdulillah: 0, allahuakbar: 0 };

export function TasbihScreen() {
  const { colors, spacing, radius } = useTheme();
  const { uiHaptics } = useSettings();
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [mode, setMode] = useState("subhanallah");
  const [hydrated, setHydrated] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const storedCounts = await getItem(StorageKeys.tasbihCount, null);
      const storedMode = await getItem(StorageKeys.tasbihMode, "subhanallah");
      if (storedCounts && typeof storedCounts === "object") {
        setCounts({ ...EMPTY_COUNTS, ...storedCounts });
      } else if (typeof storedCounts === "number" || typeof storedCounts === "string") {
        const legacy = Number(storedCounts) || 0;
        setCounts({ ...EMPTY_COUNTS, [storedMode || "subhanallah"]: legacy });
      }
      setMode(storedMode || "subhanallah");
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setItem(StorageKeys.tasbihCount, counts);
  }, [counts, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    setItem(StorageKeys.tasbihMode, mode);
  }, [mode, hydrated]);

  const count = counts[mode] ?? 0;

  function handleTap() {
    setCounts((prev) => {
      const next = (prev[mode] ?? 0) + 1;
      if (uiHaptics !== false) {
        import("expo-haptics")
          .then((Haptics) => {
            if (next % 33 === 0) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          })
          .catch(() => {});
      }
      return { ...prev, [mode]: next };
    });
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.985,
        duration: 90,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        stiffness: 320,
        damping: 22,
        mass: 0.55,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function handleReset() {
    setCounts((prev) => ({ ...prev, [mode]: 0 }));
    if (uiHaptics !== false) {
      import("expo-haptics")
        .then((Haptics) => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}))
        .catch(() => {});
    }
  }

  const cycles = Math.floor(count / 33);
  const positionInCycle = count % 33;
  const progress = positionInCycle / 33;
  const currentOption = OPTIONS.find((o) => o.key === mode) ?? OPTIONS[0];

  return (
    <Screen scroll={false}>
      <FadeSlideIn delay={40}>
        <View style={{ marginBottom: spacing.lg }}>
          <Text variant="caption" color="muted" style={{ letterSpacing: 1.4, textTransform: "uppercase" }}>
            {t("tabs.tasbih")}
          </Text>
          <Text variant="display" color="text" serif weight="700" style={{ marginTop: 4 }}>
            {t("tasbih.title")}
          </Text>
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={100}>
        <View style={{ marginBottom: spacing.lg }}>
          <SegmentedControl
            value={mode}
            onChange={setMode}
            options={OPTIONS.map((o) => ({ value: o.key, label: o.short }))}
          />
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={160} style={{ flex: 1 }}>
        <Pressable onPress={handleTap} style={{ flex: 1 }}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
            <Card padding="xl" style={{ flex: 1, alignItems: "center", justifyContent: "flex-start", paddingVertical: 32, paddingHorizontal: spacing.lg }}>
              <Text
                variant="caption"
                color="muted"
                style={{ letterSpacing: 2, textTransform: "uppercase", marginBottom: spacing.md }}
              >
                {currentOption.short}
              </Text>

              <View style={{ alignItems: "center", paddingHorizontal: spacing.md, marginBottom: spacing.lg }}>
                <ArabicText
                  variant="arabicLarge"
                  color={currentOption.color}
                  weight="700"
                  align="center"
                  style={{ lineHeight: 72 }}
                >
                  {currentOption.arabic}
                </ArabicText>
              </View>

              <LinearGradient
                colors={colors.goldGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 140,
                  height: 6,
                  borderRadius: 999,
                  marginBottom: spacing.md,
                  opacity: 0.22,
                }}
              />

              <Text
                serif
                color="text"
                style={{
                  fontSize: 96,
                  lineHeight: 104,
                  fontWeight: "800",
                  letterSpacing: -3,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {count}
              </Text>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: spacing.md }}>
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.line,
                    backgroundColor: colors.cardElevated,
                  }}
                >
                  <Text variant="caption" color="muted" weight="600">
                    {cycles} x 33 + {positionInCycle}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  width: "100%",
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: colors.bgSoft,
                  overflow: "hidden",
                  marginTop: spacing.lg,
                }}
              >
                <Animated.View style={{ height: "100%" }}>
                  <LinearGradient
                    colors={colors.goldGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      width: `${Math.max(progress * 100, 8)}%`,
                      height: "100%",
                      borderRadius: 999,
                    }}
                  />
                </Animated.View>
              </View>
            </Card>
          </Animated.View>
        </Pressable>
      </FadeSlideIn>

      <FadeSlideIn delay={200}>
        <Text variant="caption" color="muted" align="center" style={{ marginTop: spacing.md, letterSpacing: 1.2 }}>
          Тапни в любую точку карточки, чтобы прибавить зикр
        </Text>
      </FadeSlideIn>

      <FadeSlideIn delay={260}>
        <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, marginBottom: 110 }}>
          <Button
            title={t("tasbih.reset")}
            onPress={handleReset}
            variant="ghost"
            icon={<MaterialCommunityIcons name="restart" size={18} color={colors.text} />}
          />
        </View>
      </FadeSlideIn>
    </Screen>
  );
}
