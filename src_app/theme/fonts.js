import {
  Unbounded_300Light,
  Unbounded_400Regular,
  Unbounded_500Medium,
  Unbounded_600SemiBold,
  Unbounded_700Bold,
  Unbounded_800ExtraBold,
  Unbounded_900Black,
} from "@expo-google-fonts/unbounded";
import {
  Onest_400Regular,
  Onest_500Medium,
  Onest_600SemiBold,
  Onest_700Bold,
  Onest_800ExtraBold,
} from "@expo-google-fonts/onest";
import {
  Amiri_400Regular,
  Amiri_700Bold,
  Amiri_400Regular_Italic,
} from "@expo-google-fonts/amiri";
import { AmiriQuran_400Regular } from "@expo-google-fonts/amiri-quran";
import {
  ScheherazadeNew_400Regular,
  ScheherazadeNew_500Medium,
  ScheherazadeNew_600SemiBold,
  ScheherazadeNew_700Bold,
} from "@expo-google-fonts/scheherazade-new";
import {
  ReemKufi_400Regular,
  ReemKufi_500Medium,
  ReemKufi_600SemiBold,
  ReemKufi_700Bold,
} from "@expo-google-fonts/reem-kufi";

export const FONT_ASSETS = {
  Unbounded_300Light,
  Unbounded_400Regular,
  Unbounded_500Medium,
  Unbounded_600SemiBold,
  Unbounded_700Bold,
  Unbounded_800ExtraBold,
  Unbounded_900Black,
  Onest_400Regular,
  Onest_500Medium,
  Onest_600SemiBold,
  Onest_700Bold,
  Onest_800ExtraBold,
  Amiri_400Regular,
  Amiri_700Bold,
  Amiri_400Regular_Italic,
  AmiriQuran_400Regular,
  ScheherazadeNew_400Regular,
  ScheherazadeNew_500Medium,
  ScheherazadeNew_600SemiBold,
  ScheherazadeNew_700Bold,
  ReemKufi_400Regular,
  ReemKufi_500Medium,
  ReemKufi_600SemiBold,
  ReemKufi_700Bold,
};

export const FontFamily = {
  displayLight: "Unbounded_300Light",
  displayRegular: "Unbounded_400Regular",
  displayMedium: "Unbounded_500Medium",
  display: "Unbounded_600SemiBold",
  displayBold: "Unbounded_700Bold",
  displayExtra: "Unbounded_800ExtraBold",
  displayBlack: "Unbounded_900Black",
  displayItalic: "Onest_500Medium",
  body: "Onest_400Regular",
  bodyMedium: "Onest_500Medium",
  bodySemibold: "Onest_600SemiBold",
  bodyBold: "Onest_700Bold",
  bodyExtra: "Onest_800ExtraBold",
  arabic: "Amiri_400Regular",
  arabicBold: "Amiri_700Bold",
  arabicItalic: "Amiri_400Regular_Italic",
};

export const ARABIC_FONTS = {
  naskh: {
    id: "naskh",
    label: "Насх — классический",
    description: "Каноничный почерк рукописных Коранов",
    sample: "بِسْمِ ٱللَّٰهِ",
    regular: "Amiri_400Regular",
    bold: "Amiri_700Bold",
    sizeMultiplier: 1.06,
    lineHeightMultiplier: 1.36,
    wideWords: true,
  },
  mushaf: {
    id: "mushaf",
    label: "Мусхаф — стиль Корана",
    description: "Книжный почерк, как в печатных Коранах",
    sample: "بِسْمِ ٱللَّٰهِ",
    regular: "AmiriQuran_400Regular",
    bold: "AmiriQuran_400Regular",
    sizeMultiplier: 1.08,
    lineHeightMultiplier: 1.5,
    wideWords: true,
    tajweed: true,
  },
  kufi: {
    id: "kufi",
    label: "Куфи — модерн",
    description: "Геометричная каллиграфия, современный взгляд",
    sample: "بِسْمِ ٱللَّٰهِ",
    regular: "ReemKufi_500Medium",
    bold: "ReemKufi_700Bold",
    sizeMultiplier: 0.98,
    lineHeightMultiplier: 1.22,
    wideWords: true,
  },
  scheherazade: {
    id: "scheherazade",
    label: "Шехерезада — арабика",
    description: "Старо-арабская книжная типография",
    sample: "بِسْمِ ٱللَّٰهِ",
    regular: "ScheherazadeNew_400Regular",
    bold: "ScheherazadeNew_700Bold",
    sizeMultiplier: 1.16,
    lineHeightMultiplier: 1.44,
    wideWords: true,
  },
};

export function pickArabicFont(arabicFontKey, weight) {
  const font = ARABIC_FONTS[arabicFontKey] ?? ARABIC_FONTS.naskh;
  return weight === "700" || weight === "bold" ? font.bold : font.regular;
}

export function getArabicFontMeta(arabicFontKey) {
  return ARABIC_FONTS[arabicFontKey] ?? ARABIC_FONTS.naskh;
}

export function pickFont(variant, weight) {
  if (variant === "arabic" || variant === "arabicLarge" || variant === "arabicHero") {
    return weight === "700" || weight === "bold" ? FontFamily.arabicBold : FontFamily.arabic;
  }
  if (variant === "display") {
    if (weight === "900") return FontFamily.displayBlack;
    if (weight === "800") return FontFamily.displayExtra;
    if (weight === "700") return FontFamily.displayBold;
    if (weight === "500") return FontFamily.displayMedium;
    if (weight === "400") return FontFamily.displayRegular;
    if (weight === "300") return FontFamily.displayLight;
    return FontFamily.display;
  }
  if (variant === "h1") {
    if (weight === "800") return FontFamily.displayExtra;
    if (weight === "700") return FontFamily.displayBold;
    if (weight === "500") return FontFamily.displayMedium;
    return FontFamily.display;
  }
  if (variant === "h2" || variant === "h3") {
    if (weight === "700") return FontFamily.bodyBold;
    if (weight === "600") return FontFamily.bodySemibold;
    return FontFamily.bodySemibold;
  }
  if (variant === "italic") return FontFamily.displayItalic;
  if (weight === "800") return FontFamily.bodyExtra;
  if (weight === "700") return FontFamily.bodyBold;
  if (weight === "600") return FontFamily.bodySemibold;
  if (weight === "500") return FontFamily.bodyMedium;
  return FontFamily.body;
}
