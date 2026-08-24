import type { CSSProperties } from "react";

export interface BadgeTheme {
  hue: string;
  deep: string;
  ink: string;
}

export const BADGE_THEMES: Record<string, BadgeTheme> = {
  novice: { hue: "#ffc21a", deep: "#a86b00", ink: "#ffe9a8" },
  rush: { hue: "#4fd1ff", deep: "#0a6f9c", ink: "#c8efff" },
  reload: { hue: "#ff6a2a", deep: "#a33200", ink: "#ffd0b8" },
  reserve: { hue: "#2ee6a0", deep: "#0a7a55", ink: "#bdf7e0" },
  observer: { hue: "#a86bff", deep: "#5a2ea8", ink: "#ded0ff" },
  balance: { hue: "#cfe0f5", deep: "#5f7288", ink: "#eef4fb" },
};

const FALLBACK: BadgeTheme = BADGE_THEMES.novice;

export function getBadgeTheme(badgeId: string): BadgeTheme {
  return BADGE_THEMES[badgeId] ?? FALLBACK;
}

export function badgeThemeVars(badgeId: string): CSSProperties {
  const theme = getBadgeTheme(badgeId);
  return {
    "--badge-hue": theme.hue,
    "--badge-deep": theme.deep,
    "--badge-ink": theme.ink,
  } as CSSProperties;
}