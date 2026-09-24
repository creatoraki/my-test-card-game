import type { StatusCtx, StatusDef } from "../types";
import { RULES } from "../core/battleRules";
import { MILKY_WAY_MAX_BONUS, starlightMaxOf } from "../prophet/prophetUnit";

// 银河: 汇星溢出时, 每溢出 1 层为受伤最重的存活队友恢复 data.heal 点生命(与 lowestHpAlly 同口径)。
function healOnStarlightOverflow(c: StatusCtx, overflow: number): void {
  const owner = c.state.combatants[c.ownerId];
  const milkyWay = owner?.statuses.find((status) => status.id === "milkyWay" && status.stacks > 0);
  const perStack = milkyWay?.data?.heal ?? 0;
  if (!owner || perStack <= 0) return;
  const allies = c.state.playerIds
    .map((id) => c.state.combatants[id])
    .filter((ally) => ally?.alive);
  if (allies.length === 0) return;
  const target = allies.reduce((mostInjured, current) =>
    current.maxHp - current.hp > mostInjured.maxHp - mostInjured.hp ? current : mostInjured,
  );
  c.ops.log(c.state, `🌌 银河：星辉溢出 ${overflow} 层`);
  c.ops.heal(c.state, owner.id, target.id, perStack * overflow, { scaled: true });
}

export const PROPHET_STATUS_DEFS: Record<string, StatusDef> = {
  starlight: {
    id: "starlight",
    name: "星辉",
    emoji: "✨",
    kind: "buff",
    maxStacks: RULES.combat.starlightMax,
    maxStacksOf: starlightMaxOf,
    stackMode: "add",
    refreshMode: "max",
    desc: `应星卡牌可以消耗星辉替代法力水晶。上限 ${RULES.combat.starlightMax} 层，银河可以提高。`,
    hooks: { onOverflow: healOnStarlightOverflow },
  },
  zenithStar: {
    id: "zenithStar",
    name: "天顶星",
    emoji: "🌠",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: "下一张带瀑布效果的牌无视费用比较触发瀑布，随后移除。",
  },
  gravityLens: {
    id: "gravityLens",
    name: "引力透镜",
    emoji: "🔭",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: "下一张实际触发瀑布的牌，其瀑布效果额外结算一次，随后移除。",
  },
  drift: {
    id: "drift",
    name: "漂流",
    emoji: "🛟",
    kind: "buff",
    stackMode: "max",
    refreshMode: "override",
    desc: "瀑布触发时，获得来源治愈力 20% 的护盾。",
  },
  milkyWay: {
    id: "milkyWay",
    name: "银河",
    emoji: "🌌",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "keep",
    undispellable: true,
    desc: `本场战斗星辉上限 +${MILKY_WAY_MAX_BONUS}；汇星溢出时，每溢出 1 层，为受伤最重的队友恢复生命。`,
    detailStats: (inst) => [{ label: "每层溢出治疗", value: Math.round(inst.data?.heal ?? 0) }],
  },
  cascade: {
    id: "cascade",
    name: "倒泻",
    emoji: "🌊",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    durationStartsImmediately: true,
    desc: "本回合打出的下一张牌若当前费用低于上一张打出的牌，视为满足瀑布条件并保留倒泻；否则移除倒泻。",
  },
};
