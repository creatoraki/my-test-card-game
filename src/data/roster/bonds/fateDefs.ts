// 蚀刻系(增益与减益)与因果系(代价与回报)。数值见《羁绊重构设计文档》第五章, 行为在 engine/bonds。

import type { BondDef } from "./types";

export const FATE_BOND_DEFS: BondDef[] = [
  // ---- 蚀刻 ----
  {
    id: "moon",
    name: "月亮",
    title: "幻月",
    arcana: "XVIII",
    family: "etch",
    desc: "月光底下，什么都看不清——尤其是敌人。",
    color: "#ff5fa2",
    tiers: [
      { count: 3, desc: "每回合第一次对敌人施加减益时，同一减益也施加给另一名随机敌人" },
      { count: 6, desc: "带有 3 种及以上减益的敌人，无法格挡、无法闪避" },
      { count: 9, desc: "每回合开始时，为生命最高的敌人施加 1 种它尚未拥有的随机通用减益" },
    ],
  },
  {
    id: "sun",
    name: "太阳",
    title: "正午",
    arcana: "XIX",
    family: "etch",
    desc: "正午没有影子。",
    color: "#ff9ccf",
    tiers: [
      { count: 3, desc: "每回合第一次为队友施加增益时，同一增益也施加给生命最低的另一名队友" },
      { count: 6, desc: "拥有 2 种及以上增益的角色，其攻击不会被闪避或格挡" },
      { count: 9, desc: "每回合开始时，为生命最低的队友施加 1 种其尚未拥有的随机通用增益" },
    ],
  },
  {
    id: "temperance",
    name: "节制",
    title: "调和",
    arcana: "XIV",
    family: "etch",
    desc: "毒与药只差一个方向。",
    color: "#ffc2df",
    tiers: [
      { count: 3, desc: "每回合开始时，移除全队身上剩余持续最短的 1 个减益" },
      { count: 6, desc: "被调和移除的减益，改为施加给一名随机敌人" },
      { count: 9, desc: "每名角色每回合第一次受到持续伤害时，改为回复等量生命" },
    ],
  },

  // ---- 因果 ----
  {
    id: "death",
    name: "死神",
    title: "收割",
    arcana: "XIII",
    family: "karma",
    desc: "死神的旗帜上是一朵白玫瑰：结束也是开始。",
    color: "#e6e1d3",
    tiers: [
      { count: 4, desc: "击杀敌人时，抽 1 张牌（每回合至多 2 次）" },
      { count: 8, desc: "击杀敌人时，对其余敌人造成被击杀者最大生命 10% 的固定伤害（可连锁）" },
      { count: 12, desc: "每场战斗 1 次：我方角色即将阵亡时，改为回复至最大生命 30%" },
    ],
  },
  {
    id: "devil",
    name: "恶魔",
    title: "契约",
    arcana: "XV",
    family: "karma",
    desc: "锁链很松，随时可以取下——只是没人愿意。",
    color: "#e0405a",
    tiers: [
      { count: 4, desc: "每回合 1 次，法力差 1 点时可由出牌角色支付最大生命 15% 代替" },
      { count: 8, desc: "生命低于 50% 的角色造成伤害时，回复伤害量 20% 的生命" },
      { count: 12, desc: "生命低于 30% 的角色，每回合前 2 张牌不消耗法力" },
    ],
  },
  {
    id: "justice",
    name: "正义",
    title: "天平",
    arcana: "XI",
    family: "karma",
    desc: "天平的两端永远等重：你给我的，我原样奉还。",
    color: "#a8c0d8",
    tiers: [
      { count: 3, desc: "格挡成功时，对攻击者造成等于被格挡掉伤害量的固定伤害" },
      { count: 6, desc: "闪避成功时，对攻击者造成其本次攻击原伤害 50% 的固定伤害" },
      { count: 9, desc: "敌人施加给我方的减益，同时施加给施加者自身" },
    ],
  },
];
