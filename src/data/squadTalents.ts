// 小队徽章与天赋树 —— 训练室的数据真相点。
//
// ★ 结构从「方向 + 成本数组」改成了**节点图**(《基础徽章.md》与训练室改造计划):
//   每个徽章 = 若干条方向链(branches, 仅用于图标/配色/文案分组) + 一张节点图(nodes)。
//   节点按前置依赖逐颗点亮: requires 数组里**任一**已激活即解锁, 空数组 = 链首, 直接可点。
//   解锁/退还/花费的判定都是本文件的纯函数, UI 与 store 共用, 禁止在组件里重写这些判断。
//
// 三枚基础徽章的数值与成本在此集中定义，UI 与 store 只读取这里的结果。

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
  tier: "minor" | "major"; // 只影响节点大小, 末节点用 major
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
  locked?: boolean; // 占位徽章用(列表条显示「待开放」)
}

// ---------------------------------------------------------------------------
// 方向链展开工具
// ---------------------------------------------------------------------------
// 一条链 = 方向定义 + 成本数组。首节点 requires: [] 直接可点,
// 其余节点 requires: [上一节点 id], 形成「点亮 → 解锁下一颗」的推进关系。

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

function chain(branch: TalentBranchDef, costs: number[]): TalentNodeDef[] {
  return costs.map((cost, index) => {
    return {
      id: `${branch.id}-${index + 1}`,
      name: `${branch.name} ${ROMAN[index]}`,
      key: branch.key,
      value: 1,
      cost,
      requires: index === 0 ? [] : [`${branch.id}-${index}`],
      tier: index === costs.length - 1 ? "major" : "minor",
      desc: `${BRANCH_EFFECTS[branch.id] ?? branch.name} +1`,
    };
  });
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
// 基础徽章 —— 节点坐标由 TalentTreeRadial/talentGeometry.ts 统一负责。
// ---------------------------------------------------------------------------
const VOYAGE_BRANCHES: TalentBranchDef[] = [
  { id: "handLimit", name: "手牌扩容", key: "handLimit" },
  { id: "redraw", name: "换牌训练", key: "redraws" },
  { id: "wait", name: "待机训练", key: "waits" },
  { id: "mana", name: "费用训练", key: "mana" },
  { id: "draw", name: "抽牌训练", key: "drawCount" },
  { id: "openingHand", name: "起手训练", key: "openingHand" },
];

const VOYAGE_NODES: TalentNodeDef[] = [
  ...chain(VOYAGE_BRANCHES[0], [2]),
  ...chain(VOYAGE_BRANCHES[1], [2]),
  ...chain(VOYAGE_BRANCHES[2], [2]),
  ...chain(VOYAGE_BRANCHES[3], [6]),
  ...chain(VOYAGE_BRANCHES[4], [4]),
  ...chain(VOYAGE_BRANCHES[5], [3]),
];

const VANGUARD_BRANCHES: TalentBranchDef[] = [
  { id: "openingHand", name: "起手训练", key: "openingHand" },
  { id: "handLimit", name: "手牌扩容", key: "handLimit" },
  { id: "redraw", name: "换牌训练", key: "redraws" },
  { id: "draw", name: "抽牌训练", key: "drawCount" },
];

const VANGUARD_NODES: TalentNodeDef[] = [
  ...chain(VANGUARD_BRANCHES[0], [3, 4]),
  ...chain(VANGUARD_BRANCHES[1], [2, 3]),
  ...chain(VANGUARD_BRANCHES[2], [2]),
  ...chain(VANGUARD_BRANCHES[3], [4]),
];

const CLOCKWORK_BRANCHES: TalentBranchDef[] = [
  { id: "wait", name: "待机训练", key: "waits" },
  { id: "redraw", name: "换牌训练", key: "redraws" },
  { id: "mana", name: "费用训练", key: "mana" },
  { id: "handLimit", name: "手牌扩容", key: "handLimit" },
];

const CLOCKWORK_NODES: TalentNodeDef[] = [
  ...chain(CLOCKWORK_BRANCHES[0], [2, 3]),
  ...chain(CLOCKWORK_BRANCHES[1], [2, 3]),
  ...chain(CLOCKWORK_BRANCHES[2], [6]),
  ...chain(CLOCKWORK_BRANCHES[3], [2]),
];

export const SQUAD_BADGES: SquadBadgeDef[] = [
  {
    id: "voyage",
    name: "启程徽章",
    kicker: "基础方案",
    desc: "均衡扩展小队资源，为尚未定型的队伍提供稳妥的启程方案。",
    base: { redraws: 1, handLimit: 1 },
    requirement: null,
    branches: VOYAGE_BRANCHES,
    nodes: VOYAGE_NODES,
  },
  {
    id: "vanguard",
    name: "先手徽章",
    kicker: "起手方案",
    desc: "把关键组件带入战斗开端，强化起手与前期展开能力。",
    base: { openingHand: 1 },
    requirement: null,
    branches: VANGUARD_BRANCHES,
    nodes: VANGUARD_NODES,
  },
  {
    id: "clockwork",
    name: "守时徽章",
    kicker: "节奏方案",
    desc: "用待机与换牌调整行动时机，保持队伍节奏稳定。",
    base: { waits: 1 },
    requirement: null,
    branches: CLOCKWORK_BRANCHES,
    nodes: CLOCKWORK_NODES,
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

const SQUAD_RESOURCE_KEYS: SquadResourceKey[] = [
  "openingHand",
  "drawCount",
  "redraws",
  "waits",
  "mana",
  "handLimit",
];

// 合并多份小队资源修正：同名资源项相加，保持小队资源的唯一合成口径。
export function addSquadMods(
  base: SquadResourceMods,
  ...partials: (Partial<SquadResourceMods> | undefined)[]
): SquadResourceMods {
  const out = { ...base };
  for (const partial of partials) {
    if (!partial) continue;
    for (const key of SQUAD_RESOURCE_KEYS) out[key] += partial[key] ?? 0;
  }
  return out;
}

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
