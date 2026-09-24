// ============================================================================
// 卡牌词条注册表。新增词条只需在这里注册判定与触发后的副作用。
// ============================================================================

import type { BattleState, Card, EffectDescriptor } from "../types";
import { ops } from "../core/ops";
import { RULES } from "../core/battleRules";
import { baseEffectsOf } from "./cardEffects";
import { resolveEffects } from "../effects/effects";

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
    desc: `预言家获得对应层数的星辉。星辉上限 ${RULES.combat.starlightMax} 层，银河可以提高。`,
  },
  {
    id: "starPay",
    name: "应星",
    desc: "应星卡牌可以消耗星辉替代法力水晶，星辉不足时支付剩余法力水晶。",
  },
  {
    id: "starPact",
    name: "星契",
    desc: "这张牌的所属者变为预言家，并可以用星辉替代法力水晶。本场战斗持续，不会被搬运或剥离。",
  },
  {
    id: "starSeal",
    name: "星印",
    desc: "预言家专属的卡牌增益：费用 +1，打出后以预言家为来源结算收益，离开手牌时移除。同名星印不叠加。",
  },
  {
    id: "heavy",
    name: "沉重",
    desc: "星印。费用 +1，没有打出收益。",
  },
  {
    id: "cometTail",
    name: "彗尾",
    desc: "星印。费用 +1；打出后对随机敌人造成预言家攻击力 30% 的伤害。",
  },
  {
    id: "streamer",
    name: "流光",
    desc: "星印。费用 +1；打出时视为速攻，不推进时刻。",
  },
  {
    id: "prophecy",
    name: "预言",
    desc: "预言家对未来的断言。期限内条件达成即应验，期限结束仍未达成则落空。同时只能存在 1 个预言，新的预言会顶替旧的；同名预言只刷新期限。",
  },
  {
    id: "fulfill",
    name: "应验",
    desc: "预言的条件在期限内达成，立即获得奖励并移除预言。",
  },
  {
    id: "fail",
    name: "落空",
    desc: "预言的期限结束时条件仍未达成，结算落空效果并移除预言。",
  },
  {
    id: "cascade",
    name: "倒泻",
    desc: "本回合打出的下一张牌若当前费用低于上一张打出的牌，视为满足瀑布条件并保留倒泻；否则移除倒泻。",
  },
  {
    id: "milkyWay",
    name: "银河",
    desc: "本场战斗星辉上限 +2；汇星溢出时，溢出的星辉转为对受伤最重的队友的治疗。",
  },
  {
    id: "blind",
    name: "致盲",
    desc: "命中率 -20%。",
  },
  {
    id: "waterfall",
    name: "瀑布",
    desc: "该牌的当前费用严格高于其他可打出手牌时，触发额外效果。",
  },
  {
    id: "zenithStar",
    name: "天顶星",
    desc: "下一张带瀑布效果的牌无视费用比较触发瀑布，随后移除此状态。",
  },
  {
    id: "gravityLens",
    name: "引力透镜",
    desc: "下一张实际触发瀑布的牌，其瀑布效果额外结算一次。",
  },
  {
    id: "drift",
    name: "漂流",
    desc: "持续 3 回合；瀑布触发时，获得来源治愈力 20% 的护盾。",
  },
  {
    id: "countercurrent",
    name: "逆流",
    desc: "星印。费用 +1；打出后预言家汇星 1。",
  },
  {
    id: "domino",
    name: "多米诺",
    desc: "星印。费用 +1；打出后抽 1 张牌，持有多米诺被动时会重新附加到未带卡牌增益的手牌。",
  },
  {
    id: "pierce",
    name: "穿孔",
    desc: "每层使目标受到的伤害提高 2%，最多 10 层。",
  },
  {
    id: "fullDraw",
    name: "满弓",
    desc: "目标穿孔层数达到指定数量时，移除指定层数并触发满弓效果；本次不再附加穿孔。",
  },
  {
    id: "overripe",
    name: "过熟",
    desc: "培育牌成熟后继续留在手牌中会过熟，打出时结算过熟效果。",
  },
  {
    id: "ripen",
    name: "催熟",
    desc: "使一张生长中或已成熟的培育牌推进 1 层；成熟牌会被推进为过熟。",
  },
  {
    id: "rottenFruit",
    name: "腐烂的果实",
    desc: "过熟培育牌在回合结束仍留在手牌中时转化而成的临时卡。",
  },
  {
    id: "cultivate",
    name: "培育",
    desc: "该牌在手牌中每经过 1 个回合推进 1 层；成熟后打出触发培育效果，继续留在手牌中会过熟。",
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
