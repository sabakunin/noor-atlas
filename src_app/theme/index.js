import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Appearance } from "react-native";
import { useFonts } from "expo-font";
import { getPalette } from "./palettes";
import { spacing, radius, typography, elevation, motion } from "./tokens";
import { FONT_ASSETS, FontFamily, pickFont } from "./fonts";

const ThemeContext = createContext(null);

export function ThemeProvider({ children, mode = "system" }) {
  const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme() ?? "dark");
  const [fontsLoaded] = useFonts(FONT_ASSETS);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme ?? "dark");
    });
    return () => sub.remove();
  }, []);

  const resolvedScheme = mode === "system" ? systemScheme : mode;
  const palette = getPalette(resolvedScheme);

  const value = useMemo(
    () => ({
      mode,
      scheme: resolvedScheme,
      colors: palette,
      spacing,
      radius,
      typography,
      elevation,
      motion,
      fonts: FontFamily,
      pickFont,
      fontsLoaded,
    }),
    [mode, resolvedScheme, palette, fontsLoaded]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
