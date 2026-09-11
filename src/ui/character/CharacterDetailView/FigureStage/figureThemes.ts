import type { CSSProperties } from "react";

interface FigureTheme {
  /** 场景底色、主光色、辅助光色；只影响背景，不给人物图片染色。 */
  base: string;
  primary: string;
  secondary: string;
}

export const FIGURE_THEMES: Record<string, FigureTheme> = {
  swordsman: { base: "#0b1c36", primary: "#66caff", secondary: "#346ac2" },
  prophet: { base: "#1c1238", primary: "#bb94ff", secondary: "#6650c5" },
  botanist: { base: "#0c2925", primary: "#9ce1a2", secondary: "#258b84" },
  alchemist: { base: "#30182e", primary: "#ffa6ce", secondary: "#aa598b" },
  actuary: { base: "#2d2516", primary: "#f5d38d", secondary: "#ad803c" },
};

/** 未登记角色沿用其角色色，之后可在上表单独精调。 */
export function figureThemeStyle(characterId: string, characterColor: string): CSSProperties {
  const theme = FIGURE_THEMES[characterId] ?? {
    base: "#101c2d", primary: characterColor, secondary: characterColor,
  };
  return {
    "--figure-base": theme.base,
    "--figure-primary": theme.primary,
    "--figure-secondary": theme.secondary,
  } as CSSProperties;
}
