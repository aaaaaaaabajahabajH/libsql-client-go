export const colors = {
  bg: {
    primary: "#0A0A0F",
    secondary: "#0F0F1A",
    tertiary: "#141420",
    card: "#111118",
    overlay: "rgba(0,0,0,0.7)",
  },
  blue: {
    500: "#0066FF",
    400: "#1A75FF",
    300: "#4D94FF",
    neon: "#00AAFF",
    glow: "rgba(0, 102, 255, 0.4)",
  },
  orange: {
    500: "#FF6B00",
    400: "#FF7B1A",
    neon: "#FF8C00",
    glow: "rgba(255, 107, 0, 0.4)",
  },
  text: {
    primary: "#FFFFFF",
    secondary: "rgba(255, 255, 255, 0.72)",
    muted: "rgba(255, 255, 255, 0.42)",
    disabled: "rgba(255, 255, 255, 0.24)",
  },
  border: {
    default: "rgba(255,255,255,0.08)",
    active: "rgba(0, 102, 255, 0.4)",
  },
  success: "#00FF88",
  warning: "#FFB800",
  error: "#FF3B3B",
  carbon: {
    600: "#303040",
    700: "#202030",
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const typography = {
  fonts: {
    arabic: "Tajawal_400Regular",
    arabicMedium: "Tajawal_500Medium",
    arabicBold: "Tajawal_700Bold",
    arabicExtraBold: "Tajawal_800ExtraBold",
    arabicBlack: "Tajawal_900Black",
  },
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    h3: 20,
    h2: 26,
    h1: 32,
  },
} as const;
