import React from "react";
import { View } from "react-native";
import { useTheme } from "../theme";
import { PressScale } from "./motion/PressScale";

export function Card({ children, onPress, style, padding = "lg", elevated = false, scale = 0.985, haptic = "selection" }) {
  const { colors, spacing, radius, elevation } = useTheme();
  const padValue = typeof padding === "number" ? padding : spacing[padding];
  const baseStyle = {
    backgroundColor: elevated ? colors.cardStrong : colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: elevated ? colors.lineStrong : colors.line,
    padding: padValue,
    ...(elevated ? elevation.card : null),
  };

  if (onPress) {
    return (
      <PressScale
        onPress={onPress}
        scale={scale}
        haptic={haptic}
        style={[baseStyle, style]}
      >
        {children}
      </PressScale>
    );
  }

  return <View style={[baseStyle, style]}>{children}</View>;
}
