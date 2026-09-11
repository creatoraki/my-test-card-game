// ============================================================================
// 卡牌词条注册表。新增词条只需在这里注册判定与触发后的副作用。
// ============================================================================

import type { BattleState, Card, EffectDescriptor } from "./types";
import { ops } from "./ops";
import { RULES } from "./rules";
import { baseEffectsOf } from "./cardEffects";
import { resolveEffects } from "./effects";

export interface KeywordCtx {
  primaryId?: string;
  hitIds: string[];
  baseEffects?: EffectDescriptor[];
}

export interface KeywordDef {
  id: string;
  name: string;
  desc: string;
  triggers(state: BattleState, card: Card, ctx: KeywordCtx): number;
  onTriggered?(state: BattleState, card: Card, ctx: KeywordCtx, times: number): void;
}

export const KEYWORD_DEFS: Record<string, KeywordDef> = {
  aim: {
    id: "aim",
    name: "瞄准",
    desc: "攻击未被瞄准的目标时为其附加被瞄准；再次用瞄准卡命中该目标时移除被瞄准并触发额外效果。",
    triggers: (state, card, ctx) => {
      const candidates =
        card.targeting === "allFoes"
          ? [...new Set(ctx.hitIds)].filter((id) => state.combatants[id]?.team === "enemy")
          : ctx.primaryId && ctx.hitIds.includes(ctx.primaryId)
            ? [ctx.primaryId]
            : [];
      let triggered = 0;
      for (const id of candidates) {
        const target = state.combatants[id];
        if (!target) continue;
        const aimed = target.statuses.find((status) => status.id === "aimed");
        if (aimed) {
          ops.applyStatus(state, id, "aimed", -1);
          triggered += 1;
        } else {
          ops.applyStatus(state, id, "aimed", 1);
        }
      }
      return triggered;
    },
  },
  echo: {
    id: "echo",
    name: "回响",
    desc: "卡牌的基础效果会对所有带有回响的其他我方单位重放一次；打出后主目标获得回响。",
    triggers: () => 0,
    onTriggered: (state, card, ctx) => {
      const echoedAllies = state.playerIds.filter((id) => {
        const ally = state.combatants[id];
        return ally?.alive && id !== ctx.primaryId && ally.statuses.some((status) => status.id === "echo");
      });
      // ⚠ 重放时必须剔除 PLAY_STAT_BONUS: 它写进的是**施放者本次出牌**的临时面板, 由 playCard
      //   在整次出牌结束时才撤回 —— 重放期间那份加成仍然生效。再叠一次就是纯粹的重复计数
      //   (回响模组的治愈力 -30 会滚成 -60、-90)。
      const baseEffects = (ctx.baseEffects ?? baseEffectsOf(card)).filter(
        (effect) => effect.type !== "PLAY_STAT_BONUS",
      );
      for (const id of echoedAllies) resolveEffects(state, baseEffects, card.ownerCharId, id);

      const primary = ctx.primaryId ? state.combatants[ctx.primaryId] : undefined;
      if (primary?.alive && primary.team === "player") {
        const alreadyEchoed = primary.statuses.some((status) => status.id === "echo" && status.stacks > 0);
        if (alreadyEchoed || !state.echoGainedThisRound) {
          ops.applyStatus(state, primary.id, "echo", 1, 1);
          if (!alreadyEchoed) state.echoGainedThisRound = true;
        }
      }
    },
  },
};

export interface CardKeywordInfo {
  id: string;
  name: string;
  desc: string;
}

export const CARD_KEYWORD_INFOS: CardKeywordInfo[] = [
  {
    id: "starlight",
    name: "汇星",
    desc: `打出后获得 ${RULES.combat.starlightMax} 层以内对应数量的星辉。`,
  },
  {
    id: "starPay",
    name: "应星",
    desc: "应星卡牌可以消耗星辉替代法力水晶，星辉不足时支付剩余法力水晶。",
  },
  {
    id: "waterfall",
    name: "瀑布",
    desc: "该牌为手牌中费用最高的牌时，触发额外效果。",
  },
  {
    id: "aim",
    name: "瞄准",
    desc: "攻击未被瞄准的目标时为其附加被瞄准；再次用瞄准卡命中该目标时移除被瞄准并触发额外效果。",
  },
  {
    id: "cultivate",
    name: "培育",
    desc: "该牌在手牌中每经过 1 个回合减少 1 层培育；归零后打出时触发额外效果。",
  },
  {
    id: "resonance",
    name: "共鸣",
    desc: "打出共鸣牌时，手牌中费用更低的共鸣牌获得 1 次强化。",
  },
  {
    id: "assemble",
    name: "组装",
    desc: "获得对应的组装部件；集齐任意 3 种时触发组装成功。",
  },
  {
    id: "echo",
    name: "回响",
    desc: "卡牌的基础效果会对所有带有回响的其他我方单位重放一次；打出后主目标获得回响。",
  },
  {
    id: "emergency",
    name: "急诊",
    desc: "目标本回合被攻击过时，改为结算急诊分支效果。",
  },
  {
    id: "voidCard",
    name: "虚无",
    desc: "回合结束时自动从手牌移入消耗堆，本场战斗不再出现。",
  },
  {
    id: "noto",
    name: "纳刀",
    desc: "下回合开始从弃牌堆取回手牌并免费打出；攻击牌本次伤害提高 40%。",
  },
];

const CARD_KEYWORD_PATTERN = new RegExp(
  CARD_KEYWORD_INFOS
    .map(({ name }) => name)
    .sort((left, right) => right.length - left.length)
    .join("|"),
  "g",
);

export function splitCardKeywords(text: string): Array<{ text: string; keyword?: CardKeywordInfo }> {
  const segments: Array<{ text: string; keyword?: CardKeywordInfo }> = [];
  let cursor = 0;

  for (const match of text.matchAll(CARD_KEYWORD_PATTERN)) {
    const index = match.index ?? 0;
    if (index > cursor) segments.push({ text: text.slice(cursor, index) });
    const keyword = CARD_KEYWORD_INFOS.find((info) => info.name === match[0]);
    if (keyword) segments.push({ text: match[0], keyword });
    cursor = index + match[0].length;
  }

  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}

export function cardKeywordsIn(text: string): CardKeywordInfo[] {
  const found: CardKeywordInfo[] = [];
  for (const segment of splitCardKeywords(text)) {
    if (segment.keyword && !found.includes(segment.keyword)) found.push(segment.keyword);
  }
  return found;
}

/*
 * 待接词条落点:
 * - 登阶: state.lastPlayedCard.cost < card.cost ? 1 : 0
 * - 日蚀: state.draw.slice(0, 3) 中同角色卡牌数量
 * - 月蚀: state.discard.slice(-3) 中同角色卡牌数量
 * - 共鸣: triggers 恒为 0, 在 onTriggered 中处理临时手牌费用强化
 */
