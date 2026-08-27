import { getItemDef } from "@/data";
import type { ExploreState, PartySnapshot } from "@/explore/types";
import type { ItemStack } from "@/items/types";
import type { RunResult } from "@/store/runStore";
import type { CharacterState } from "@/store/townStore";

export type EndTrophyTone = "gold" | "cyan" | "green" | "red";

export interface EndTrophy {
  key: string;
  label: string;
  value: number;
  unit: string;
  tone: EndTrophyTone;
  icon: string;
  caption?: string;
}

export interface EndRosterMember extends PartySnapshot {
  pollution: number;
}

export interface EndSummary {
  trophies: EndTrophy[];
  salvageValue: number;
  haul: ItemStack[];
  roster: EndRosterMember[];
  wiped: boolean;
}

const EMPTY_STATS = {
  kills: 0,
  expTotal: 0,
  pickups: 0,
  energySpent: 0,
};

export function buildEndSummary(
  session: ExploreState | null,
  characters: Record<string, CharacterState>,
  result: RunResult,
): EndSummary {
  const stats = session?.stats ?? EMPTY_STATS;
  const haul = session ? [...session.shipped, ...session.backpack] : [];
  const salvageValue = haul.reduce((total, stack) => {
    const def = getItemDef(stack.itemId);
    if (def.category !== "scrap") return total;
    return total + (def.sellValue ?? 0) * stack.count;
  }, 0);
  const wiped = result === "lost";
  const bankedLoot = wiped ? 0 : session?.loot ?? 0;

  return {
    trophies: [
      { key: "kills", label: "击败怪物", value: stats.kills, unit: "名", tone: "red", icon: "⚔" },
      { key: "exp", label: "获取经验", value: stats.expTotal, unit: "点", tone: "gold", icon: "✦" },
      {
        key: "salvage",
        label: "换金物总价值",
        value: salvageValue,
        unit: "积分",
        tone: "gold",
        icon: "◈",
      },
      {
        key: "loot",
        label: "居民积分入账",
        value: bankedLoot,
        unit: "积分",
        tone: wiped ? "red" : "cyan",
        icon: "◎",
        caption: wiped ? "本趟积分全部遗失" : undefined,
      },
      { key: "nodes", label: "走过节点", value: session?.history.length ?? 0, unit: "节点", tone: "cyan", icon: "⌁" },
      { key: "rounds", label: "推进轮数", value: session?.round ?? 0, unit: "轮", tone: "green", icon: "⟳" },
      { key: "pickups", label: "拾取物品", value: stats.pickups, unit: "件", tone: "green", icon: "▦" },
      { key: "energy", label: "消耗净化粒子", value: stats.energySpent, unit: "粒子", tone: "cyan", icon: "◌" },
    ],
    salvageValue,
    haul,
    roster: (session?.party ?? []).map((member) => ({
      ...member,
      pollution: characters[member.charId]?.pollution ?? 0,
    })),
    wiped,
  };
}