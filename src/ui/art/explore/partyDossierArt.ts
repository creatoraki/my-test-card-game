import sceneDefault from "@/assets/队员档案/场景背景.webp";
import foregroundPlants from "@/assets/队员档案/前景植物.webp";
import slotWeapon from "@/assets/队员档案/部位剪影_武器.webp";
import slotArmor from "@/assets/队员档案/部位剪影_防具.webp";
import slotTrinket from "@/assets/队员档案/部位剪影_饰品.webp";
import type { EquipSlot } from "@/items/types";

/**
 * 探索队员档案的素材登记表。
 * 场景背景 1700×904(面板 1x 尺寸); 按角色 id 登记专属场景, 未登记的角色共用温室工坊。
 */
const SCENE_BY_CHARACTER: Partial<Record<string, string>> = {};

export function partyDossierScene(charId: string): string {
  return SCENE_BY_CHARACTER[charId] ?? sceneDefault;
}

/** 前景植物透明层 1024×640, 叠在立绘之上、左栏界面之下。 */
export const PARTY_DOSSIER_PLANTS = foregroundPlants;

/** 空装备格的冷灰金属剪影, 160×160 透明底。 */
export const PARTY_DOSSIER_SLOT_ART: Record<EquipSlot, string> = {
  weapon: slotWeapon,
  armor: slotArmor,
  trinket: slotTrinket,
};

export const PARTY_DOSSIER_ART_SOURCES: readonly string[] = [
  sceneDefault,
  foregroundPlants,
  ...Object.values(SCENE_BY_CHARACTER).filter((src): src is string => Boolean(src)),
  ...Object.values(PARTY_DOSSIER_SLOT_ART),
];
