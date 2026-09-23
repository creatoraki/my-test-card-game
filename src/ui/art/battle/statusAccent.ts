// 状态详情浮层的主题色: 徽章光环、标题下划线、数字高亮、沙漏都取这一色。
// 新增状态在此登记一次; 未登记的按增益/减益回退。

import type { StatusKind } from "@/engine";

export const STATUS_ACCENT: Record<string, string> = {
  // 通用
  shield: "#7fb8ff",
  // 增益
  starlight: "#ffe38a",
  ironwall: "#8fb6d8",
  strength: "#ff8a5c",
  overload: "#ffb13c",
  rashomon: "#c79bff",
  sharp: "#e6f1ff",
  chargedShell: "#5ad6ff",
  retortWall: "#58e0c8",
  bountyHunter: "#f2c14e",
  insight: "#9fdcff",
  tequila: "#ffc857",
  taunt: "#ff6b5a",
  regen: "#6dffb0",
  thorns: "#9ad65a",
  vitality: "#6dffb0",
  cactusCounterattack: "#9ad65a",
  insurance: "#6fc3ff",
  echo: "#8fa8ff",
  feignInjury: "#ff9fb2",
  deductible: "#7ee0d2",
  salvageArmor: "#b8c4cf",
  escort: "#6fd2ff",
  conductiveFilm: "#7ae8ff",
  thornCrown: "#b6e05a",
  halfDraw: "#f2c66d",
  agaveBloom: "#ff9ad5",
  debuffImmune: "#9fdcff",
  rootNetwork: "#8fd46a",
  zenithStar: "#ffe38a",
  gravityLens: "#a78bff",
  drift: "#8fd8ff",
  mirrorMoon: "#cfe0ff",
  ironCloak: "#8fb6d8",
  windCut: "#7ff0d8",
  zanshin: "#ff7a7a",
  zanshinFocus: "#ff9a9a",
  yachiyo: "#ffb0d0",
  // 减益
  poison: "#7dff4a",
  burn: "#ff7a3c",
  flammable: "#ff9a4a",
  scorched: "#ff5a3a",
  static: "#b58cff",
  jam: "#b58cff",
  stun: "#ffd84a",
  weak: "#b0a4c8",
  attackDown: "#b0a4c8",
  vulnerable: "#ff5d6c",
  armorBreak: "#ff5d6c",  pierce: "#ff8a4a",
};

const KIND_ACCENT: Record<StatusKind, string> = {
  buff: "#5fd8ff",
  debuff: "#ff6a6a",
};

export function statusAccentOf(id: string, kind: StatusKind = "buff"): string {
  return STATUS_ACCENT[id] ?? KIND_ACCENT[kind];
}
