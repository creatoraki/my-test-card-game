import { getItemDef, sellPriceOf, type TechTreeState } from "@/data";
import type { ExploreState, PartySnapshot } from "@/explore/types";
import type { ItemStack } from "@/items/types";
import type { RunResult } from "@/store/runStore";
import { vitalsOf, type CharacterState } from "@/store/townStore";

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
  levels: TechTreeState["levels"],
): EndSummary {
  const stats = session?.stats ?? EMPTY_STATS;
  const haul = session ? [...session.shipped, ...session.backpack] : [];
  // 换金物在落袋时已被 townStore.depositHaul 自动售出, 这里用**同一套** sellPriceOf 现算,
  // 得到的就是刚刚入账的那笔钱 —— 两边不各存一份数。
  const salvageValue = haul.reduce((total, stack) => {
    const def = getItemDef(stack.itemId);
    if (def.category !== "scrap") return total;
    return total + sellPriceOf(def, levels) * stack.count;
  }, 0);
  const wiped = result === "lost";
  // 实际进账 = 探索所得积分 + 换金物自动售出。
  // ⚠ 团灭时 session.loot 已被 EXPLORE_RULES.wipe.lootKept 归零, 但投递口寄回的换金物照样变现,
  //   所以这里不再按 wiped 一刀切成 0 —— 那笔钱是真进了据点的。
  const bankedLoot = (session?.loot ?? 0) + salvageValue;

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
        caption: salvageValue ? "回城已自动售出入账" : undefined,
      },
      {
        key: "loot",
        label: "居民积分入账",
        value: bankedLoot,
        unit: "积分",
        tone: wiped ? "red" : "cyan",
        icon: "◎",
        caption: wiped && !bankedLoot ? "本趟积分全部遗失" : undefined,
      },
      {
        key: "nodes",
        label: "走过节点",
        value: session?.history.filter((entry) => entry.slot === "node").length ?? 0,
        unit: "节点",
        tone: "cyan",
        icon: "⌁",
      },
      { key: "rounds", label: "推进轮数", value: session?.round ?? 0, unit: "轮", tone: "green", icon: "⟳" },
      { key: "pickups", label: "拾取物品", value: stats.pickups, unit: "件", tone: "green", icon: "▦" },
      { key: "energy", label: "消耗净化粒子", value: stats.energySpent, unit: "粒子", tone: "cyan", icon: "◌" },
    ],
    salvageValue,
    haul,
    roster: (session?.party ?? []).map((member) => {
      const character = characters[member.charId];
      return {
        ...member,
        maxHp: character ? vitalsOf(character).maxHp : member.maxHp,
        pollution: character?.pollution ?? 0,
      };
    }),
    wiped,
  };
}
