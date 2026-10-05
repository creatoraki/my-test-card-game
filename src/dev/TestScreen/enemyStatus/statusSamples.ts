const images = import.meta.glob<string>(
  "../../../../处理后的WebP素材/BUFF/BUFF_*.png",
  { eager: true, query: "?url", import: "default" },
);

export interface StatusSample {
  src: string;
  name: string;
  kind: "buff" | "debuff";
  stacks: number;
}

// 名称和分类仅用于视觉演示，不绑定正式战斗状态。
const names = [
  "星环眩晕", "精神恍惚", "重击震荡", "奥术涡流",
  "岩石震荡", "虚空漩涡", "精神警告", "迷乱",
  "破碎", "星辉守护", "回旋", "信号紊乱",
  "机械失灵", "冰晶环绕", "头晕", "赤红震荡",
];
const buffNumbers = new Set([4, 10, 11, 14]);

export const statusSamples: StatusSample[] = Object.entries(images)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, src], index) => ({
    src,
    name: names[index] ?? "状态效果",
    kind: buffNumbers.has(index + 1) ? "buff" : "debuff",
    stacks: [1, 2, 3, 5][index % 4],
  }));

export const enemySamples = [
  { id: "scrap-bot", name: "废品机器人", scale: 1, hp: 86, maxHp: 120, statuses: statusSamples.slice(0, 2) },
  { id: "pole-bot", name: "电线杆机器人", scale: 1, hp: 152, maxHp: 180, statuses: statusSamples.slice(2, 8) },
  { id: "radio-bot", name: "收音机机器人", scale: 0.7, hp: 48, maxHp: 100, statuses: statusSamples.slice(8, 16) },
];
