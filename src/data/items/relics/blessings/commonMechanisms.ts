import type { RelicEntry } from "../defineRelic";

// 普通渠道的机制联动遗物，由 common.ts 统一赋予普通稀有度。
export const COMMON_MECHANISM_RELIC_ENTRIES: readonly RelicEntry[] = [
  {
    id: "relic-shredder",
    name: "碎纸机",
    scope: "battle",
    desc: "每回合第 2 次有牌被丢弃时，抽 1 张牌。",
  },
  {
    id: "relic-paper-clip",
    name: "回形针",
    scope: "battle",
    desc: "回合结束时，手牌中第一张被动牌改为以「丢弃」方式离手，会触发它被丢弃时的效果（每场战斗 2 次）。",
  },
  {
    id: "relic-blade-lanyard",
    name: "回刃挂绳",
    scope: "battle",
    desc: "每场战斗，第一次用速攻攻击牌击杀敌人后，将弃牌堆中最早进入的一张非速攻攻击牌返回手牌。",
  },
  {
    id: "relic-cork-guard",
    name: "软木刀镡",
    scope: "battle",
    desc: "每场战斗，第一次在同一回合打出两张速攻牌后，可以选择一张手牌，使其获得心眼。",
  },
  {
    id: "relic-elastic-band",
    name: "松紧带",
    scope: "battle",
    desc: "每回合第一次有牌回到手牌时，不叠加回手负担。",
  },
  {
    id: "relic-scale-weight",
    name: "秤砣",
    scope: "battle",
    desc: "打出当前费用高于原始费用的牌时，该牌的攻击力与治愈力 +30。",
  },
  {
    id: "relic-coin-pouch",
    name: "零钱袋",
    scope: "battle",
    desc: "每回合打出第 2 张 0 费牌后，抽 1 张牌。",
  },
  {
    id: "relic-notepad",
    name: "便签本",
    scope: "battle",
    desc: "每回合第一次打出临时卡后，返还 1 点法力。",
  },
  {
    id: "relic-pruning-shears",
    name: "修枝剪",
    scope: "battle",
    desc: "每场战斗，前两次打出成熟牌后，随机使一张其他生长中的培育手牌，将其推进 1 层。",
  },
  {
    id: "relic-leaf-mold",
    name: "腐叶土",
    scope: "battle",
    desc: "培育牌枯萎时，额外获得 1 张枯萎的果实。",
  },
  {
    id: "relic-nail-gun",
    name: "钉枪",
    scope: "battle",
    desc: "每回合第一张多段攻击牌，每段命中时为目标附加 1 层穿孔。",
  },
  {
    id: "relic-tape-measure",
    name: "卷尺",
    scope: "battle",
    desc: "敌人的穿孔被一次性移除 4 层或以上时（采收、满弓），抽 1 张牌（每回合 1 次）。",
  },
  {
    id: "relic-fire-hook",
    name: "炉钩",
    scope: "battle",
    desc: "焚尽目标后，对其施加 3 层中毒，持续 2 回合。",
  },
  {
    id: "relic-dropper",
    name: "滴管",
    scope: "battle",
    desc: "每回合第一次毒发时，目标身上所有中毒的持续时间 +1 拍。",
  },
  {
    id: "relic-warning-vest",
    name: "警示背心",
    scope: "battle",
    desc: "我方单位获得嘲讽时，同时获得 6 层保险，持续 2 回合。",
  },
  {
    id: "relic-receipt",
    name: "回执",
    scope: "battle",
    desc: "每次理赔后，持有者获得等同于本次实际回复量 25% 的护盾。",
  },
  {
    id: "relic-scrap-box",
    name: "废料小盒",
    scope: "battle",
    desc: "每场战斗，第一次尝试获得一个已经持有的组装部件时，改为释放该部件一次，不移除它。",
  },
  {
    id: "relic-porcelain-tray",
    name: "白瓷试剂盘",
    scope: "battle",
    desc: "组装成功获得可打出的奖励卡时，该卡下一次打出的费用降低 1 点，最低为零。",
  },
  {
    id: "relic-resonant-copper",
    name: "谐振铜片",
    scope: "battle",
    desc: "打出当前费用至少 2 点的牌后，手牌中所有共鸣牌各免费获得 1 次共鸣强化，每场最多 2 次。",
  },
  {
    id: "relic-straw-knot",
    name: "稻草结",
    scope: "battle",
    desc: "对同时带有厄运与痛楚的敌人造成暴击伤害后，该敌人的痛楚提前结算 1 拍。",
  },
  {
    id: "relic-thimble",
    name: "顶针",
    scope: "battle",
    desc: "每回合第一次提前结算痛楚时，额外结算 1 拍。",
  },
  {
    id: "relic-door-stop",
    name: "门挡",
    scope: "battle",
    desc: "敌人的招式被推迟时，为其附加 2 层穿孔。",
  },
  {
    id: "relic-fulfilled-bookmark",
    name: "应验书签",
    scope: "battle",
    desc: "每场战斗，第一次预言应验并结算完原有奖励后，查看抽牌堆顶 2 张牌，选择 1 张加入手牌，另一张置于抽牌堆底。",
  },
  {
    id: "relic-wish-slip",
    name: "许愿签",
    scope: "battle",
    desc: "预言落空时，抽 1 张牌。",
  },
];
