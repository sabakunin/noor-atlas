import React, { useEffect, useRef } from "react";
import { View, Animated, Easing, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../theme";
import { Text } from "./Text";
import { PressScale } from "./motion/PressScale";

export function AudioBar({
  visible,
  title,
  subtitle,
  isPlaying,
  isLoading,
  onPlayPause,
  onPrev,
  onNext,
  onClose,
  bottomOffset = 0,
}) {
  const { colors, spacing, radius } = useTheme();
  const slide = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: visible ? 1 : 0,
      stiffness: 200, damping: 22, mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  useEffect(() => {
    if (isPlaying) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
    pulse.stopAnimation();
    pulse.setValue(0);
  }, [isPlaying, pulse]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={{
        position: "absolute", left: spacing.md, right: spacing.md,
        bottom: bottomOffset + spacing.md,
        transform: [{
          translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [120, 0] }),
        }],
        opacity: slide,
      }}
    >
      <View
        style={{
          flexDirection: "row", alignItems: "center", gap: spacing.sm,
          paddingVertical: 10, paddingHorizontal: spacing.md,
          borderRadius: radius.lg,
          backgroundColor: colors.card,
          borderWidth: 1, borderColor: colors.line,
          shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 6 },
          elevation: 10,
        }}
      >
        <Animated.View
          style={{
            width: 38, height: 38, borderRadius: 999,
            alignItems: "center", justifyContent: "center",
            backgroundColor: colors.gold,
            transform: [{
              scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }),
            }],
            shadowColor: colors.gold,
            shadowOpacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.0, 0.55] }),
            shadowRadius: 12,
          }}
        >
          <MaterialCommunityIcons name={isPlaying ? "waveform" : "music"} size={20} color={colors.textInverse} />
        </Animated.View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="bodySm" color="text" weight="700" numberOfLines={1}>{title}</Text>
          {subtitle ? (
            <Text variant="caption" color="muted" numberOfLines={1} style={{ marginTop: 1 }}>{subtitle}</Text>
          ) : null}
        </View>

        <PressScale onPress={onPrev} haptic="selection" scale={0.92} fullWidth={false}
          style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 999 }}>
          <MaterialCommunityIcons name="skip-previous" size={22} color={colors.text} />
        </PressScale>

        <PressScale onPress={onPlayPause} haptic="medium" scale={0.92} fullWidth={false}
          style={{
            width: 42, height: 42, borderRadius: 999,
            alignItems: "center", justifyContent: "center",
            backgroundColor: colors.text,
          }}>
          <MaterialCommunityIcons
            name={isLoading ? "dots-horizontal" : isPlaying ? "pause" : "play"}
            size={22}
            color={colors.bg}
          />
        </PressScale>

        <PressScale onPress={onNext} haptic="selection" scale={0.92} fullWidth={false}
          style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 999 }}>
          <MaterialCommunityIcons name="skip-next" size={22} color={colors.text} />
        </PressScale>

        <PressScale onPress={onClose} haptic="light" scale={0.9} fullWidth={false}
          style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: colors.cardElevated }}>
          <MaterialCommunityIcons name="close" size={16} color={colors.muted} />
        </PressScale>
      </View>
    </Animated.View>
  );
}
