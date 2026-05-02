import React from "react";
import { View, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../theme";
import { Text } from "./Text";
import { PressScale } from "./motion/PressScale";

export function Button({ title, onPress, variant = "primary", icon, loading, disabled, style, fullWidth = true }) {
  const { colors, spacing, radius } = useTheme();
  const minHeight = 52;
  const isBlocked = loading || disabled;

  if (variant === "primary") {
    return (
      <PressScale
        onPress={isBlocked ? undefined : onPress}
        disabled={isBlocked}
        scale={0.975}
        haptic="light"
        fullWidth={fullWidth}
        style={[{ borderRadius: radius.md, opacity: disabled ? 0.5 : 1 }, style]}
      >
        <LinearGradient
          colors={colors.goldGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            minHeight,
            borderRadius: radius.md,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.24)",
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 1,
              left: 1,
              right: 1,
              height: "46%",
              borderRadius: radius.md - 1,
              backgroundColor: "rgba(255,255,255,0.12)",
            }}
          />
          {loading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <>
              {icon ? <View style={{ marginRight: 6 }}>{icon}</View> : null}
              <Text variant="body" color="textInverse" weight="700">
                {title}
              </Text>
            </>
          )}
        </LinearGradient>
      </PressScale>
    );
  }

  const subtle = variant === "ghost";
  return (
    <PressScale
      onPress={isBlocked ? undefined : onPress}
      disabled={isBlocked}
      scale={0.978}
      haptic="selection"
      fullWidth={fullWidth}
      style={[
        {
          minHeight,
          borderRadius: radius.md,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          backgroundColor: subtle ? colors.activeGradient[0] : colors.card,
          borderWidth: 1,
          borderColor: subtle ? colors.line : colors.lineStrong,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <>
          {icon ? <View style={{ marginRight: 8 }}>{icon}</View> : null}
          <Text variant="body" color="text" weight="600">
            {title}
          </Text>
        </>
      )}
    </PressScale>
  );
}
