export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 56,
  "5xl": 80,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  "2xl": 40,
  full: 999,
};

export const typography = {
  display: { fontSize: 38, lineHeight: 44, letterSpacing: -1.2 },
  h1: { fontSize: 26, lineHeight: 32, letterSpacing: -0.6 },
  h2: { fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  h3: { fontSize: 16, lineHeight: 22, letterSpacing: -0.1 },
  body: { fontSize: 15, lineHeight: 22, letterSpacing: 0 },
  bodySm: { fontSize: 13, lineHeight: 19, letterSpacing: 0.05 },
  caption: { fontSize: 10.5, lineHeight: 14, letterSpacing: 1.6 },
  arabic: { fontSize: 28, lineHeight: 46, letterSpacing: 0 },
  arabicLarge: { fontSize: 38, lineHeight: 70 },
  arabicHero: { fontSize: 48, lineHeight: 84 },
  italic: { fontSize: 15, lineHeight: 22, letterSpacing: 0 },
};

export const elevation = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 6,
  },
  hero: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.32,
    shadowRadius: 38,
    elevation: 14,
  },
  glow: {
    shadowColor: "#e3c585",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 0,
  },
  none: {
    shadowOpacity: 0,
    elevation: 0,
  },
};

export const motion = {
  fast: 180,
  base: 280,
  slow: 480,
  pageStagger: 60,
  spring: {
    soft: { stiffness: 180, damping: 22, mass: 0.8 },
    snappy: { stiffness: 320, damping: 22, mass: 0.6 },
    bouncy: { stiffness: 220, damping: 14, mass: 0.7 },
  },
};
