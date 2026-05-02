import React from "react";
import { Text as RNText } from "react-native";
import { useTheme } from "../theme";

export function Text({
  children,
  variant = "body",
  color = "text",
  weight,
  align,
  style,
  numberOfLines,
  italic = false,
  font,
  serif = false,
}) {
  const { colors, typography, pickFont, fontsLoaded, fonts } = useTheme();
  const variantStyle = typography[variant] ?? typography.body;
  const colorValue = colors[color] ?? color;

  const resolvedWeight =
    weight ??
    (variant === "display" || variant === "h1"
      ? "700"
      : variant === "h2" || variant === "h3"
      ? "600"
      : variant === "caption"
      ? "600"
      : "400");

  const fontVariant =
    serif && !variant.startsWith("arabic") && !["display", "h1", "h2", "h3", "italic"].includes(variant)
      ? "display"
      : variant;

  const fontFamily = fontsLoaded
    ? font ?? (italic ? fonts.displayItalic : pickFont(fontVariant, resolvedWeight))
    : undefined;

  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[
        {
          fontFamily,
          color: colorValue,
          textAlign: align ?? "left",
          ...variantStyle,
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
