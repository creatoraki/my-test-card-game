import type { PickupKind, PickupSpawn, PlayerState } from "../types";

export const PICKUP_RANGE = 180;

export interface PickupInfo {
  name: string;
  desc: string;
  accent: string;
}

export const PICKUP_KINDS: readonly PickupKind[] = ["seedPod", "dewFlask", "sporeLamp", "geneCase", "bioCore"];

export const PICKUP_INFO: Record<PickupKind, PickupInfo> = {
  seedPod: { name: "休眠种子舱", desc: "低温封存的原生种子，外壳仍在缓慢呼吸发光。", accent: "#3fe0e6" },
  dewFlask: { name: "凝露净化瓶", desc: "收集穹顶冷凝水并过滤后的纯净水样。", accent: "#7fd8ff" },
  sporeLamp: { name: "孢灯菌簇", desc: "会随气流明灭的发光菌，常用于夜间照明。", accent: "#b6f06a" },
  geneCase: { name: "基因样本匣", desc: "记录着一整片雨林谱系的样本存储匣。", accent: "#f2c46b" },
  bioCore: { name: "生质培养芯", desc: "维持方舟循环的培养核心，内部液体仍在流动。", accent: "#6cf0b0" },
};

/** 以角色胸口与物件中心的距离判定是否可拾取。 */
export function inPickupRange(player: PlayerState, item: PickupSpawn): boolean {
  return Math.hypot(player.x - item.x, player.y - 70 - (item.y - 45)) <= PICKUP_RANGE;
}
