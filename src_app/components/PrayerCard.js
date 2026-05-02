import React, { useEffect, useRef } from "react";
import { Animated, View, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../theme";
import { Text } from "./Text";
import { ArabicText } from "./ArabicText";
import { PressScale } from "./motion/PressScale";
import { t } from "../i18n";
import { formatTime } from "../utils/time";

const ICON_MAP = {
  Fajr: "weather-sunset-up",
  Sunrise: "white-balance-sunny",
  Dhuhr: "weather-sunny",
  Asr: "weather-partly-cloudy",
  Maghrib: "weather-sunset-down",
  Isha: "moon-waning-crescent",
};

function CheckBubble({ completed, success, lineStrong, textInverse }) {
  const scale = useRef(new Animated.Value(completed ? 1 : 0)).current;
  const fill = useRef(new Animated.Value(completed ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      stiffness: 280,
      damping: 18,
      mass: 0.6,
      useNativeDriver: true,
    }).start();
    Animated.timing(fill, {
      toValue: completed ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [completed, scale, fill]);

  const checkScale = fill.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0.4, 1] });

  return (
    <Animated.View
      style={{
        marginTop: 6,
        width: 26,
        height: 26,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: completed ? success : lineStrong,
        backgroundColor: completed ? success : "transparent",
        alignItems: "center",
        justifyContent: "center",
        transform: [{ scale }],
      }}
    >
      <Animated.View style={{ transform: [{ scale: checkScale }] }}>
        <MaterialCommunityIcons name="check" size={16} color={textInverse} />
      </Animated.View>
    </Animated.View>
  );
}

export function PrayerCard({ prayerKey, time, active = false, completed = false, onToggle, isPast }) {
  const { colors, spacing, radius } = useTheme();
  const label = t(`prayers.${prayerKey}`);
  const arabic = t(`prayersArabic.${prayerKey}`);
  const icon = ICON_MAP[prayerKey] ?? "circle-outline";
  const trackable = prayerKey !== "Sunrise" && isPast;

  const inner = (
    <>
      {active ? (
        <LinearGradient
          colors={colors.activeGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
      ) : null}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: spacing.base,
          gap: spacing.md,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.md,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: active ? colors.cardStrong : colors.cardElevated,
            borderWidth: 1,
            borderColor: active ? colors.gold : colors.line,
          }}
        >
          <MaterialCommunityIcons name={icon} size={22} color={active ? colors.gold : colors.muted} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text
              variant="h2"
              color="text"
              weight={active ? "700" : "600"}
              serif
              style={{ fontSize: 22, lineHeight: 28 }}
            >
              {label}
            </Text>
            {active ? (
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999,
                  backgroundColor: colors.gold,
                }}
              >
                <Text variant="caption" color="textInverse" weight="700" style={{ letterSpacing: 0.6 }}>
                  СЕЙЧАС
                </Text>
              </View>
            ) : null}
          </View>
          <ArabicText variant="arabic" color="muted" tajweed={false} style={{ marginTop: 2, fontSize: 18, lineHeight: 26 }}>
            {arabic}
          </ArabicText>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text variant="h2" color="text" weight="700" serif>
            {formatTime(time)}
          </Text>
          {trackable ? (
            <CheckBubble
              completed={completed}
              success={colors.success}
              lineStrong={colors.lineStrong}
              textInverse={colors.textInverse}
            />
          ) : null}
        </View>
      </View>
    </>
  );

  const baseStyle = {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: active ? colors.gold : colors.line,
    backgroundColor: active ? "transparent" : colors.card,
    overflow: "hidden",
  };

  if (trackable && onToggle) {
    return (
      <PressScale
        onPress={onToggle}
        scale={0.985}
        haptic="selection"
        style={baseStyle}
      >
        {inner}
      </PressScale>
    );
  }

  return <View style={baseStyle}>{inner}</View>;
}
