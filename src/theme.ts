export const colors = {
  navy: "#10375C",
  navyDeep: "#071b2d",
  yellow: "#F3C623",
  yellowSoft: "#fff8dc",
  orange: "#EB8317",
  surface: "#f8fafb",
  surfaceMuted: "#eef2f5",
  white: "#ffffff",
  ink: "#10375C",
  inkMuted: "#64748b",
  inkFaint: "#94a3b8",
  line: "#e2e8f0",
  danger: "#dc2626",
  dangerSoft: "#fee2e2",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const text = {
  title: { fontSize: 24, fontWeight: "800" as const, color: colors.ink },
  heading: { fontSize: 18, fontWeight: "800" as const, color: colors.ink },
  body: { fontSize: 15, fontWeight: "400" as const, color: colors.ink },
  bodyStrong: { fontSize: 15, fontWeight: "700" as const, color: colors.ink },
  caption: { fontSize: 12, fontWeight: "600" as const, color: colors.inkMuted },
  overline: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    color: colors.inkFaint,
  },
} as const;

export const theme = { colors, spacing, radius, text } as const;
