/**
 * Blue eclipse palette — use semantic tokens in UI; raw shades when layering.
 */
export const eclipse = {
  deepest: "#0F0E47",
  surface: "#272757",
  accent: "#505081",
  lavender: "#8686AC",
} as const;

export const themeColors = {
  light: {
    background: "#EDECF5",
    surface: "#FFFFFF",
    text: eclipse.deepest,
    textMuted: eclipse.accent,
    border: "#C5C5DA",
    primary: eclipse.surface,
    onPrimary: "#FFFFFF",
    link: eclipse.accent,
    fieldBg: "#FFFFFF",
    error: "#b91c1c",
  },
  dark: {
    background: eclipse.deepest,
    surface: eclipse.surface,
    text: "#F0F0FA",
    textMuted: eclipse.lavender,
    border: eclipse.accent,
    primary: eclipse.accent,
    onPrimary: "#FFFFFF",
    link: eclipse.lavender,
    fieldBg: eclipse.surface,
    error: "#f87171",
  },
} as const;
