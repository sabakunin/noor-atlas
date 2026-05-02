import React, { useMemo } from "react";
import { Text as RNText } from "react-native";
import { useTheme } from "../theme";
import { useSettings } from "../contexts/SettingsContext";
import { pickArabicFont, getArabicFontMeta } from "../theme/fonts";
import { tokenizeTajweed, tajweedPaletteFromColors } from "../services/tajweed";

export function ArabicText({
  children,
  variant = "arabic",
  color = "text",
  weight,
  align = "right",
  style,
  numberOfLines,
  fontKey,
  tajweed,
}) {
  const { colors, typography, fontsLoaded } = useTheme();
  const { arabicFont } = useSettings();
  const activeKey = fontKey ?? arabicFont;
  const variantStyle = typography[variant] ?? typography.arabic;
  const colorValue = colors[color] ?? color;
  const meta = getArabicFontMeta(activeKey);

  const fontFamily = fontsLoaded ? pickArabicFont(activeKey, weight) : undefined;
  const fontSize = (variantStyle.fontSize ?? 28) * (meta.sizeMultiplier ?? 1);
  const lineHeight = (variantStyle.lineHeight ?? 46) * (meta.lineHeightMultiplier ?? 1);

  const shouldTajweed = tajweed ?? meta.tajweed;
  const widenedText = useMemo(() => {
    if (typeof children !== "string") return children;
    if (!meta.wideWords) return children;
    return children.replace(/ +/g, "  ");
  }, [children, meta.wideWords]);
  const segments = useMemo(() => {
    if (!shouldTajweed || typeof widenedText !== "string") return null;
    return tokenizeTajweed(widenedText);
  }, [widenedText, shouldTajweed]);

  const palette = useMemo(() => tajweedPaletteFromColors(colors), [colors]);

  const baseStyle = {
    fontFamily,
    color: colorValue,
    textAlign: align,
    writingDirection: "rtl",
    letterSpacing: variantStyle.letterSpacing ?? 0,
    fontSize,
    lineHeight,
  };

  if (segments && segments.length) {
    return (
      <RNText numberOfLines={numberOfLines} style={[baseStyle, style]}>
        {segments.map((seg, idx) => (
          <RNText
            key={idx}
            style={{
              fontFamily,
              color: palette[seg.rule] ?? colorValue,
            }}
          >
            {seg.text}
          </RNText>
        ))}
      </RNText>
    );
  }

  return (
    <RNText numberOfLines={numberOfLines} style={[baseStyle, style]}>
      {widenedText}
    </RNText>
  );
}
