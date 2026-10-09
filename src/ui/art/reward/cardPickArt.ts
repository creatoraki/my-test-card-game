// 卡牌三选一面板的美术引用。
// 两张都是可选素材: 用 glob 加载, 文件未放入时为 undefined, 面板照常显示。
//   · 面板内景: 未放入时回退为锻造师事件背景(已在事件档案素材里预加载, 这里不再重复登记)。
//   · 全息卡牌投影: 未放入时只是少一层装饰。
// 素材规格与提示词见 docs/卡牌三选一面板还原方案.md「美术素材清单」。
import { EVENT_DOSSIER_ART } from "@/ui/art/explore/eventDossierArt";

const sceneModules = import.meta.glob<string>(
  "../../../assets/卡牌三选一/面板内景.webp",
  { eager: true, import: "default" },
);
const hologramModules = import.meta.glob<string>(
  "../../../assets/卡牌三选一/全息卡牌投影.webp",
  { eager: true, import: "default" },
);

const sceneArt: string | undefined = Object.values(sceneModules)[0];

/** 是否已有三选一专属的面板内景(有则少压暗, 回退的锻造师背景需要压得更狠)。 */
export const CARD_PICK_HAS_SCENE = Boolean(sceneArt);
export const CARD_PICK_PANEL_ART: string = sceneArt ?? EVENT_DOSSIER_ART.blacksmith;
export const CARD_PICK_HOLOGRAM_ART: string | undefined = Object.values(hologramModules)[0];

export const CARD_PICK_ART_SOURCES: readonly string[] = [sceneArt, CARD_PICK_HOLOGRAM_ART].filter(
  (src): src is string => Boolean(src),
);
