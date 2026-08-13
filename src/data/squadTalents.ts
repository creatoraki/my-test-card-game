import type { SquadResourceMods } from "../engine/types";

export type SquadResourceKey =
  | "openingHand"
  | "drawCount"
  | "redraws"
  | "waits"
  | "mana"
  | "handLimit";

export type { SquadResourceMods };

export interface TalentTrackDef {
  id: string;
  name: string;
  key: SquadResourceKey;
  perNode: number;
  costs: number[];
  desc: string;
}

export interface SquadBadgeDef {
  id: string;
  name: string;
  kicker: string;
  desc: string;
  base: Partial<SquadResourceMods>;
  requirement: string | null;
  tracks: TalentTrackDef[];
}

const NOVICE_TRACKS: TalentTrackDef[] = [
  {
    id: "handLimit",
    name: "手牌扩容",
    key: "handLimit",
    perNode: 1,
    costs: [1, 3, 5],
    desc: "每节点 +1 手牌上限",
  },
  {
    id: "redraw",
    name: "换牌训练",
    key: "redraws",
    perNode: 1,
    costs: [1, 2, 3],
    desc: "每节点 +1 每回合换牌次数",
  },
  {
    id: "wait",
    name: "待机训练",
    key: "waits",
    perNode: 1,
    costs: [1, 1, 2, 2, 2],
    desc: "每节点 +1 每回合待机次数",
  },
  {
    id: "mana",
    name: "费用训练",
    key: "mana",
    perNode: 1,
    costs: [5, 5, 5, 8, 8],
    desc: "每节点 +1 每回合费用上限",
  },
  {
    id: "draw",
    name: "抽牌训练",
    key: "drawCount",
    perNode: 1,
    costs: [3, 4, 5],
    desc: "每节点 +1 每回合抽牌数",
  },
  {
    id: "openingHand",
    name: "起手训练",
    key: "openingHand",
    perNode: 1,
    costs: [1, 2, 3],
    desc: "每节点 +1 初始手牌数量",
  },
];

export const SQUAD_BADGES: SquadBadgeDef[] = [
  {
    id: "novice",
    name: "初心者徽章",
    kicker: "NOVICE BADGE",
    desc: "为尚未定型的小队提供一套可自由分配的基础训练方案。",
    base: { openingHand: 1 },
    requirement: null,
    tracks: NOVICE_TRACKS,
  },
];

const ZERO_SQUAD_MODS: SquadResourceMods = {
  openingHand: 0,
  drawCount: 0,
  redraws: 0,
  waits: 0,
  mana: 0,
  handLimit: 0,
};

export function getBadge(id: string): SquadBadgeDef | undefined {
  return SQUAD_BADGES.find((badge) => badge.id === id);
}

export function nextNodeCost(track: TalentTrackDef, unlocked: number): number | null {
  const index = Math.max(0, Math.floor(unlocked));
  return track.costs[index] ?? null;
}

export function spentPoints(badge: SquadBadgeDef, nodes: Record<string, number>): number {
  return badge.tracks.reduce((sum, track) => {
    const unlocked = Math.max(0, Math.min(track.costs.length, Math.floor(nodes[track.id] ?? 0)));
    return sum + track.costs.slice(0, unlocked).reduce((trackSum, cost) => trackSum + cost, 0);
  }, 0);
}

export function squadModsOf(
  badgeId: string | null,
  nodes: Record<string, number>,
): SquadResourceMods {
  const badge = badgeId ? getBadge(badgeId) : undefined;
  if (!badge) return { ...ZERO_SQUAD_MODS };

  const mods = { ...ZERO_SQUAD_MODS, ...badge.base };
  for (const track of badge.tracks) {
    const unlocked = Math.max(0, Math.min(track.costs.length, Math.floor(nodes[track.id] ?? 0)));
    mods[track.key] += unlocked * track.perNode;
  }
  return mods;
}