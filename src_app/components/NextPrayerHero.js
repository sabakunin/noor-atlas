import React, { useEffect, useRef } from "react";
import { Animated, View, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../theme";
import { Text } from "./Text";
import { ArabicText } from "./ArabicText";
import { t } from "../i18n";
import { formatTime, formatCountdown } from "../utils/time";

export function NextPrayerHero({ next, countdownMs, city, hijri }) {
  const { colors, spacing, radius } = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });

  const label = next ? t(`prayers.${next.key}`) : t("common.loading");
  const arabic = next ? t(`prayersArabic.${next.key}`) : "";
  const time = next?.date ? formatTime(next.date) : "--:--";
  const countdown = countdownMs != null ? formatCountdown(next.date) : "--:--:--";

  return (
    <View
      style={{
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.line,
        overflow: "hidden",
        marginBottom: spacing.lg,
      }}
    >
      <LinearGradient
        colors={[colors.cardStrong, colors.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: 999,
          backgroundColor: colors.gold,
          opacity: glowOpacity,
          transform: [{ scale: 0.5 }],
        }}
      />

      <View style={{ padding: spacing.xl }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MaterialCommunityIcons name="map-marker" size={16} color={colors.gold} />
            <Text variant="caption" color="muted" style={{ letterSpacing: 1.4, textTransform: "uppercase" }}>
              {city?.title ?? t("home.locationLoading")}
            </Text>
          </View>
          {hijri ? (
            <Text variant="caption" color="muted" style={{ letterSpacing: 1.2 }}>
              {hijri}
            </Text>
          ) : null}
        </View>

        <Text variant="bodySm" color="muted" style={{ marginTop: spacing.lg }}>
          {t("home.nextPrayer")}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 6 }}>
          <View>
            <Text variant="display" color="text" serif weight="700">
              {label}
            </Text>
            <ArabicText variant="arabic" color="muted" tajweed={false} style={{ marginTop: 4 }}>
              {arabic}
            </ArabicText>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text variant="h1" color="gold" weight="700" serif>
              {time}
            </Text>
          </View>
        </View>

        <View
          style={{
            marginTop: spacing.lg,
            padding: spacing.md,
            borderRadius: radius.md,
            backgroundColor: colors.cardElevated,
            borderWidth: 1,
            borderColor: colors.line,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.card,
              }}
            >
              <MaterialCommunityIcons name="clock-outline" size={18} color={colors.gold} />
            </View>
            <Text variant="bodySm" color="muted">
              {t("home.in")}
            </Text>
          </View>
          <Text variant="h2" color="text" weight="700" serif>
            {countdown}
          </Text>
        </View>
      </View>
    </View>
  );
}
