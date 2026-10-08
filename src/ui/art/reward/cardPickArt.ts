// 卡牌三选一面板的美术引用。
// 面板内底图复用锻造师事件背景(已在事件档案素材里预加载, 这里不再重复登记)。
// 全息卡牌投影是可选素材: 用 glob 加载, 文件未放入时为 undefined, 面板照常显示、只是少一层装饰。
import { EVENT_DOSSIER_ART } from "@/ui/art/explore/eventDossierArt";

const hologramModules = import.meta.glob<string>(
  "../../../assets/卡牌三选一/全息卡牌投影.webp",
  { eager: true, import: "default" },
);

export const CARD_PICK_PANEL_ART: string = EVENT_DOSSIER_ART.blacksmith;
export const CARD_PICK_HOLOGRAM_ART: string | undefined = Object.values(hologramModules)[0];

export const CARD_PICK_ART_SOURCES: readonly string[] = CARD_PICK_HOLOGRAM_ART ? [CARD_PICK_HOLOGRAM_ART] : [];
