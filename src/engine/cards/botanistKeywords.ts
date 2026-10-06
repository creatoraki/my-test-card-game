// 植物学家卡面词条说明(悬浮提示)。由 keywords.ts 并入 CARD_KEYWORD_INFOS。
// ⚠ 淬毒不登记为词条: 通用模组「淬毒模组」的卡面后缀同名, 会被误标。淬毒的效果直接写在夹竹桃卡面上。

import type { CardKeywordInfo } from "./keywords";
import { RULES } from "../core/battleRules";

export const BOTANIST_CARD_KEYWORD_INFOS: CardKeywordInfo[] = [
  {
    id: "pierce",
    name: "穿孔",
    desc: `每层使目标受到的伤害提高 ${Math.round(RULES.pierce.perStack * 100)}%，最多 ${RULES.pierce.max} 层。不放大中毒。`,
  },
  {
    id: "venomArrow",
    name: "毒箭",
    desc: "为目标附加 N 层穿孔；目标在命中前带有中毒（任意来源）时，改为附加 2N 层。多段攻击逐段判定；满弓目标不附加。",
  },
  {
    id: "fullDraw",
    name: "满弓",
    desc: "目标穿孔层数达到指定数量时，移除指定层数并触发满弓效果；本次不再附加穿孔。",
  },
  {
    id: "harvest",
    name: "采收",
    desc: "终结技。读取目标全部穿孔层数，按层数强化本卡，结算后移除这些穿孔。没有穿孔时只结算基础部分。",
  },
  {
    id: "toxicBurst",
    name: "毒发",
    desc: "立即按目标当前中毒层数结算一拍中毒伤害，不减少层数，也不消耗持续拍数。",
  },
  {
    id: "mycoToxin",
    name: "菌毒",
    desc: "独立减益：持有期间，中毒结算时不扣除剩余拍数。菌毒自身不造成伤害，也不增加中毒层数。",
  },
  {
    id: "cultivate",
    name: "培育",
    desc: "该牌在手牌中每经过 1 个回合推进 1 层，归零即成熟，打出时追加成熟效果。成熟维持 2 个回合，第 2 个回合结束仍在手牌中会枯萎。",
  },
  {
    id: "witheredFruit",
    name: "枯萎的果实",
    desc: "0 费临时卡。对敌人使用：附加中毒；对队友使用：恢复生命。消耗。",
  },
  {
    id: "wither",
    name: "枯萎",
    desc: "成熟第 2 个回合结束时仍在手牌中的培育牌移出本场战斗，替换为 1 张枯萎的果实。",
  },
  {
    id: "ripen",
    name: "催熟",
    desc: "选择一张手牌中生长中的培育牌，推进 1 层；成熟牌不可选。",
  },
  {
    id: "graft",
    name: "嫁接",
    desc: "其他角色的手牌获得培育 1；成熟后打出时，该牌所属角色在本次结算中攻击力 +40%、治愈力 +40%。不会枯萎，打出或离开手牌后移除。",
  },
  {
    id: "bloom",
    name: "盛放",
    desc: "本回合打出成熟牌时，其成熟效果额外结算一次；嫁接牌的加成按两次计算。",
  },
  {
    id: "slow",
    name: "迟滞",
    desc: "每层使该敌人招式的发动时刻推迟 1，最多 2 层；持续 2 拍：对它接下来的 2 次招式都生效。",
  },
  {
    id: "insectTrap",
    name: "捕虫夹",
    desc: "该敌人下一次发动招式时，本次招式伤害降低 30%，并且手牌中所有生长中的培育牌推进 1 层。最多持续 2 回合。",
  },
  {
    id: "pollen",
    name: "花粉",
    desc: "持有者每张攻击牌首次命中敌人时，对其施加毒箭。",
  },
  {
    id: "edge",
    name: "锋芒",
    desc: "攻击力 +20%。不可叠加，重复获得时持续回合取较大值。",
  },
  {
    id: "deepRoots",
    name: "根深",
    desc: "本回合受到的伤害不会降低体力极限。",
  },
  {
    id: "sporeVeil",
    name: "孢子护幕",
    desc: "受到带有中毒的敌人攻击时，本次伤害降低 25%。",
  },
  {
    id: "myceliumWeb",
    name: "菌丝网络",
    desc: "本场战斗中，敌人的中毒每结算一次（包括毒发），为其附加 1 层穿孔；每名敌人每回合最多 2 层。不可驱散。",
  },
];
