import { EVENT_DOSSIER_ART, type DossierArtKind } from "@/ui/art/eventDossierArt";

/** 事件档案主题: 插图 + 主题色(--k, 驱动边框、标签、标题渐变与装饰线)。 */
export type DossierThemeId = DossierArtKind;

export interface DossierTheme {
  art: string;
  accent: string;
}

const THEME_ACCENTS: Record<DossierThemeId, string> = {
  supply: "#0ff0f4",
  danger: "#ff5a4e",
  medical: "#5ef2b4",
  mineral: "#a48cff",
  shrine: "#f5c46b",
  terminal: "#4da6ff",
};

export const DOSSIER_THEMES = Object.fromEntries(
  (Object.keys(THEME_ACCENTS) as DossierThemeId[]).map((id) => [id, { art: EVENT_DOSSIER_ART[id], accent: THEME_ACCENTS[id] }]),
) as Record<DossierThemeId, DossierTheme>;

export const DOSSIER_ACCENT = THEME_ACCENTS.supply;
