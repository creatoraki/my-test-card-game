// 卡牌三选一面板的美术引用。
// 面板内景是可选素材: 用 glob 加载, 文件未放入时回退为锻造师事件背景(已在事件档案素材里预加载, 这里不再重复登记)。
// 素材规格与提示词见 docs/卡牌三选一面板还原方案.md「美术素材清单」。
import { EVENT_DOSSIER_ART } from "@/ui/art/explore/eventDossierArt";

const sceneModules = import.meta.glob<string>(
  "../../../assets/卡牌三选一/面板内景.webp",
  { eager: true, import: "default" },
);

const sceneArt: string | undefined = Object.values(sceneModules)[0];

/** 是否已有三选一专属的面板内景(有则少压暗, 回退的锻造师背景需要压得更狠)。 */
export const CARD_PICK_HAS_SCENE = Boolean(sceneArt);
export const CARD_PICK_PANEL_ART: string = sceneArt ?? EVENT_DOSSIER_ART.blacksmith;

export const CARD_PICK_ART_SOURCES: readonly string[] = sceneArt ? [sceneArt] : [];
