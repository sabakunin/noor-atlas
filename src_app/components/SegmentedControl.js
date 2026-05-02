import React from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../theme";
import { Text } from "./Text";
import { PressScale } from "./motion/PressScale";

export function SegmentedControl({ options, value, onChange, fullWidth = true }) {
  const { colors, spacing, radius } = useTheme();
  const count = Math.max(options.length, 1);
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: 4,
        alignSelf: fullWidth ? "stretch" : "flex-start",
        shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <PressScale
            key={opt.value}
            onPress={() => onChange(opt.value)}
            scale={0.985}
            haptic="selection"
            wrapperStyle={{ flex: 1 }}
            style={{
              minHeight: 54,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.sm,
              borderRadius: radius.md,
              backgroundColor: "transparent",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {active ? (
              <LinearGradient
                colors={[colors.cardStrong, colors.cardElevated]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  borderRadius: radius.md,
                }}
              />
            ) : null}
            <Text
              variant="bodySm"
              color={active ? "text" : "muted"}
              weight={active ? "600" : "500"}
              align="center"
              numberOfLines={count > 2 ? 2 : 1}
              style={{ paddingHorizontal: 4 }}
            >
              {opt.label}
            </Text>
          </PressScale>
        );
      })}
    </View>
  );
}
