import type { DamageCtx, StatusCtx, StatusDef } from "../types";

// 蚀刻: 受到的直接伤害提高的百分点。持续伤害走 pure 管线, 不吃状态乘区, 天然不受影响。
export const ETCH_TAKEN_PCT = 20;
// 衔尾蛇: DOT 到期时转化为另一种 DOT 的层数比例。
const OUROBOROS_RATIO = 0.5;

export const ALCHEMIST_STATUS_DEFS: Record<string, StatusDef> = {
  emberWall: {
    id: "emberWall",
    name: "余烬护壁",
    emoji: "🔥",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: "护盾被击破时，对击破者施加灼烧，随后移除本状态。",
    hooks: {
      onShieldBroken: (c: StatusCtx, dmg: DamageCtx) => {
        const burnStacks = Math.round(c.inst.data?.burnStacks ?? 0);
        if (dmg.sourceId && dmg.sourceId !== c.ownerId && burnStacks > 0)
          c.ops.applyStatus(c.state, dmg.sourceId, "burn", burnStacks, 2, undefined, c.ownerId);
        c.inst.stacks = 0;
      },
    },
  },
  etch: {
    id: "etch",
    name: "蚀刻",
    emoji: "🧪",
    kind: "debuff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "max",
    resistMode: "duration",
    desc: `受到的直接伤害提高 ${ETCH_TAKEN_PCT}%；灼烧、中毒、焚尽等持续伤害不受影响。`,
    hooks: {
      modifyIncomingDamage: (_c, _dmg, mods) => {
        mods.addTakenPct(ETCH_TAKEN_PCT);
      },
    },
  },
  quench: {
    id: "quench",
    name: "淬火",
    emoji: "🗡️",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "max",
    desc: "攻击每次命中，对目标施加灼烧（来源为炼金术士，持续 2 回合）；每张牌最多触发 2 次。",
    detailStats: (inst) => [
      { label: "每次灼烧", value: Math.round(inst.data?.burnStacks ?? 0), suffix: " 层" },
      { label: "每张牌上限", value: inst.data?.cap ?? 2, suffix: " 次" },
    ],
    hooks: {
      onAfterAttack: (c: StatusCtx, dmg: DamageCtx) => {
        if (!dmg.isAttack || dmg.missed || dmg.sourceId !== c.ownerId) return;
        const target = c.state.combatants[dmg.targetId];
        const burnStacks = Math.round(c.inst.data?.burnStacks ?? 0);
        if (!target?.alive || target.team !== "enemy" || burnStacks <= 0) return;
        // 与花粉同口径: 出牌结算期间 playedThisRound 尚未追加本张牌, 回合号 + 已出牌数唯一标识"这张牌"。
        const data = (c.inst.data ??= {});
        const playKey = c.state.round * 1000 + c.state.playedThisRound.length;
        if (data.playKey !== playKey) {
          data.playKey = playKey;
          data.used = 0;
        }
        if ((data.used ?? 0) >= (data.cap ?? 2)) return;
        data.used = (data.used ?? 0) + 1;
        c.ops.applyStatus(c.state, dmg.targetId, "burn", burnStacks, 2, undefined, c.inst.sourceId ?? c.ownerId);
      },
    },
  },
  philosophersStone: {
    id: "philosophersStone",
    name: "贤者之石",
    emoji: "💎",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "keep",
    undispellable: true,
    desc: "本场战斗中，每次组装成功时，从本次消耗的组装 BUFF 中选择 1 种保留。",
  },
  ouroboros: {
    id: "ouroboros",
    name: "衔尾蛇",
    emoji: "🐍",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "keep",
    undispellable: true,
    desc: "本场战斗中，敌人身上的灼烧某一段自然到期时，施加该段层数 50% 的中毒；中毒某一段自然到期时，施加该段层数 50% 的灼烧。转化出的段到期时继续转化，层数不足 1 时停止。",
    hooks: {
      onFoeDotExpired: (c: StatusCtx, victimId: string, statusId: string, stacks: number) => {
        const converted = Math.floor(stacks * OUROBOROS_RATIO);
        const victim = c.state.combatants[victimId];
        if (converted < 1 || !victim?.alive) return;
        const next = statusId === "burn" ? "poison" : "burn";
        c.ops.applyStatus(c.state, victimId, next, converted, 2, undefined, c.ownerId);
      },
    },
  },
};
