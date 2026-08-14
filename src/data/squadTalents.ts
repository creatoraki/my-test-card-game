// 小队徽章与天赋树 —— 训练室的数据真相点。
//
// ★ 结构从「方向 + 成本数组」改成了**节点图**(《初心者徽章.md》与训练室改造计划):
//   每个徽章 = 若干条方向链(branches, 仅用于图标/配色/文案分组) + 一张手写坐标的节点图(nodes)。
//   节点按前置依赖逐颗点亮: requires 数组里**任一**已激活即解锁, 空数组 = 链首, 直接可点。
//   解锁/退还/花费的判定都是本文件的纯函数, UI 与 store 共用, 禁止在组件里重写这些判断。
//
// 数值与平衡沿用《初心者徽章.md》既有配置(22 个节点、成本不变), 本次只改了结构与表现。

import type { SquadResourceMods } from "../engine/types";

export type SquadResourceKey =
  | "openingHand"
  | "drawCount"
  | "redraws"
  | "waits"
  | "mana"
  | "handLimit";

export type { SquadResourceMods };

// ---------------------------------------------------------------------------
// 节点与徽章定义
// ---------------------------------------------------------------------------

export interface TalentNodeDef {
  id: string; // 如 "handLimit-1"
  name: string; // "手牌扩容 I"
  key: SquadResourceKey;
  value: number; // 该节点提供的修正(沿用 perNode, 均为 1)
  cost: number; // 沿用现有 costs 数组的对应项
  requires: string[]; // 满足其一即可解锁; 空数组 = 链首, 直接可点
  x: number;
  y: number; // 树面板内的设计 px 坐标
  tier: "minor" | "major"; // 只影响节点大小/外观, 末节点用 major
  desc: string;
}

// 仅用于图标、配色与文案分组; 节点 id 约定为 `${branch.id}-${序号}`, 由 chain() 保证。
export interface TalentBranchDef {
  id: string;
  name: string;
  key: SquadResourceKey;
}

export interface SquadBadgeDef {
  id: string;
  name: string;
  kicker: string;
  desc: string;
  base: Partial<SquadResourceMods>;
  requirement: string | null;
  branches: TalentBranchDef[];
  nodes: TalentNodeDef[];
  canvas: { width: number; height: number }; // 树面板设计 px 尺寸
  locked?: boolean; // 占位徽章用(列表条显示「待开放」)
}

// ---------------------------------------------------------------------------
// 方向链展开工具
// ---------------------------------------------------------------------------
// 一条链 = 方向定义 + 成本数组 + 一串坐标。首节点 requires: [] 直接可点,
// 其余节点 requires: [上一节点 id], 形成「点亮 → 解锁下一颗」的推进关系。
// 坐标只负责表现, 不参与任何规则判定。

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

function chain(
  branch: TalentBranchDef,
  costs: number[],
  points: Array<[number, number]>,
): TalentNodeDef[] {
  return costs.map((cost, index) => {
    const [x, y] = points[index];
    return {
      id: `${branch.id}-${index + 1}`,
      name: `${branch.name} ${ROMAN[index]}`,
      key: branch.key,
      value: 1,
      cost,
      requires: index === 0 ? [] : [`${branch.id}-${index}`],
      x,
      y,
      tier: index === costs.length - 1 ? "major" : "minor",
      desc: `${BRANCH_EFFECTS[branch.id] ?? branch.name} +1`,
    };
  });
}

// 扇形半环布局: 以画布下方的徽章核心为原点, 0° 向右, 逆时针为上。
const FAN_ORIGIN = { x: 670, y: 540 };

function fan(angleDeg: number, radii: number[]): Array<[number, number]> {
  const angle = (angleDeg * Math.PI) / 180;
  return radii.map((radius) => [
    FAN_ORIGIN.x + Math.cos(angle) * radius,
    FAN_ORIGIN.y - Math.sin(angle) * radius,
  ]);
}

const BRANCH_EFFECTS: Record<string, string> = {
  handLimit: "手牌上限",
  redraw: "每回合换牌次数",
  wait: "每回合待机次数",
  mana: "每回合费用上限",
  draw: "每回合抽牌数",
  openingHand: "初始手牌数量",
};

// ---------------------------------------------------------------------------
// 初心者徽章 —— 六条链共 22 个节点, 成本严格沿用既有值
// ---------------------------------------------------------------------------
// 画布 1340×580, 徽章核心位于下方, 六条链向上呈扇面展开。
const NOVICE_CANVAS = { width: 1340, height: 580 };

const NOVICE_BRANCHES: TalentBranchDef[] = [
  { id: "handLimit", name: "手牌扩容", key: "handLimit" },
  { id: "redraw", name: "换牌训练", key: "redraws" },
  { id: "wait", name: "待机训练", key: "waits" },
  { id: "mana", name: "费用训练", key: "mana" },
  { id: "draw", name: "抽牌训练", key: "drawCount" },
  { id: "openingHand", name: "起手训练", key: "openingHand" },
];

// ⚠ 成本数组与《初心者徽章.md》的训练方向表一一对应, 不要在这里改数值。
const NOVICE_NODES: TalentNodeDef[] = [
  ...chain(NOVICE_BRANCHES[0], [1, 3, 5], fan(12, [225, 370, 565])),
  ...chain(NOVICE_BRANCHES[1], [1, 2, 3], fan(35, [165, 340, 515])),
  ...chain(NOVICE_BRANCHES[2], [1, 1, 2, 2, 2], fan(68, [150, 245, 339, 430, 521])),
  ...chain(NOVICE_BRANCHES[3], [5, 5, 5, 8, 8], fan(112, [150, 245, 339, 430, 521])),
  ...chain(NOVICE_BRANCHES[4], [3, 4, 5], fan(145, [165, 340, 515])),
  ...chain(NOVICE_BRANCHES[5], [1, 2, 3], fan(168, [225, 370, 565])),
];

export const SQUAD_BADGES: SquadBadgeDef[] = [
  {
    id: "novice",
    name: "初心者徽章",
    kicker: "NOVICE BADGE",
    desc: "为尚未定型的小队提供一套可自由分配的基础训练方案。",
    base: { openingHand: 1 },
    requirement: null,
    branches: NOVICE_BRANCHES,
    nodes: NOVICE_NODES,
    canvas: NOVICE_CANVAS,
  },
  // 以下徽章只有列表条占位(「待开放」), 尚无天赋树内容 —— 名称与适配方向见《队伍属性养成.md》§3.3。
  {
    id: "rush",
    name: "疾行徽章",
    kicker: "RUSH BADGE",
    desc: "以速度换取压制: 抽牌数提高, 手牌上限略受限制。",
    base: {},
    requirement: "速攻 / 抽牌类卡牌达到一定数量",
    branches: [],
    nodes: [],
    canvas: { width: 0, height: 0 },
    locked: true,
  },
  {
    id: "reload",
    name: "重载徽章",
    kicker: "RELOAD BADGE",
    desc: "为高费牌组蓄能: 费用上限提高, 抽牌与换牌效率受限制。",
    base: {},
    requirement: "2~3 费与高倍率卡牌达到一定数量",
    branches: [],
    nodes: [],
    canvas: { width: 0, height: 0 },
    locked: true,
  },
  {
    id: "reserve",
    name: "储备徽章",
    kicker: "RESERVE BADGE",
    desc: "囤积与回收手牌: 手牌上限提高, 基础抽牌速度较慢。",
    base: {},
    requirement: "弃牌 / 回收类卡牌达到一定数量",
    branches: [],
    nodes: [],
    canvas: { width: 0, height: 0 },
    locked: true,
  },
  {
    id: "observer",
    name: "观测徽章",
    kicker: "OBSERVER BADGE",
    desc: "读透对手的时刻: 待机次数提高, 直接费用爆发较弱。",
    base: {},
    requirement: "待机 / 延迟触发类卡牌达到一定数量",
    branches: [],
    nodes: [],
    canvas: { width: 0, height: 0 },
    locked: true,
  },
  {
    id: "balance",
    name: "均衡徽章",
    kicker: "BALANCE BADGE",
    desc: "混合牌组的均衡方案: 不提供明显的初始偏向。",
    base: {},
    requirement: "无特殊要求",
    branches: [],
    nodes: [],
    canvas: { width: 0, height: 0 },
    locked: true,
  },
];

// ---------------------------------------------------------------------------
// 纯函数 —— UI 与 store 共用的唯一判定入口
// ---------------------------------------------------------------------------

export function getBadge(id: string): SquadBadgeDef | undefined {
  return SQUAD_BADGES.find((badge) => badge.id === id);
}

export function getNode(badge: SquadBadgeDef, id: string): TalentNodeDef | undefined {
  return badge.nodes.find((node) => node.id === id);
}

// 从链首到目标节点的依赖路径(含自身), 多前置时沿第一条 requires 回溯。
export function pathTo(badge: SquadBadgeDef, id: string): TalentNodeDef[] {
  const path: TalentNodeDef[] = [];
  const visited = new Set<string>();
  let node = getNode(badge, id);

  while (node && !visited.has(node.id)) {
    path.unshift(node);
    visited.add(node.id);
    node = node.requires[0] ? getNode(badge, node.requires[0]) : undefined;
  }

  return path;
}

// 点亮到目标节点还需的训练点 = 路径上尚未激活节点的成本总和。
export function costToReach(badge: SquadBadgeDef, activated: string[], id: string): number {
  const activatedSet = new Set(activated);
  return pathTo(badge, id).reduce(
    (sum, node) => sum + (activatedSet.has(node.id) ? 0 : node.cost),
    0,
  );
}

// 某条方向链的节点(按 chain 生成顺序)。节点 id 约定为 `${branch.id}-${序号}`。
export function branchNodesOf(badge: SquadBadgeDef, branchId: string): TalentNodeDef[] {
  return badge.nodes.filter((node) => node.id.startsWith(`${branchId}-`));
}

// 节点是否已解锁: 无前置(链首)恒可点; 有前置时满足其一即可。
export function isUnlocked(activated: string[], node: TalentNodeDef): boolean {
  return node.requires.length === 0 || node.requires.some((id) => activated.includes(id));
}

// 能否激活: 未激活 + 前置满足 + 剩余训练点够付。
export function canActivate(
  badge: SquadBadgeDef,
  activated: string[],
  id: string,
  remaining: number,
): boolean {
  const node = getNode(badge, id);
  if (!node || activated.includes(id) || !isUnlocked(activated, node)) return false;
  return remaining >= node.cost;
}

// 能否退还: 已激活, 且把它移除后其余每个已激活节点仍满足 isUnlocked。
// ★ 通用写法: 从集合里摘掉再全量校验依赖 —— 同时覆盖链式与将来的多前置结构。
export function canRefund(badge: SquadBadgeDef, activated: string[], id: string): boolean {
  if (!activated.includes(id)) return false;
  const rest = activated.filter((nodeId) => nodeId !== id);
  return badge.nodes
    .filter((node) => rest.includes(node.id))
    .every((node) => isUnlocked(rest, node));
}

// 已激活节点的成本求和(本徽章内)。
export function spentPoints(badge: SquadBadgeDef, activated: string[]): number {
  return activated.reduce((sum, id) => sum + (getNode(badge, id)?.cost ?? 0), 0);
}

const ZERO_SQUAD_MODS: SquadResourceMods = {
  openingHand: 0,
  drawCount: 0,
  redraws: 0,
  waits: 0,
  mana: 0,
  handLimit: 0,
};

// 最终小队资源修正 = 徽章基础加成 + 已激活节点按 key 累加 value。
export function squadModsOf(
  badgeId: string | null,
  activated: string[],
): SquadResourceMods {
  const badge = badgeId ? getBadge(badgeId) : undefined;
  if (!badge) return { ...ZERO_SQUAD_MODS };

  const mods = { ...ZERO_SQUAD_MODS, ...badge.base };
  for (const id of activated) {
    const node = getNode(badge, id);
    if (node) mods[node.key] += node.value;
  }
  return mods;
}
