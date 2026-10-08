// 锋刃系(输出方式)与壁垒系(生存方式)。数值见《羁绊重构设计文档》第五章, 行为在 engine/bonds。

import type { BondDef } from "./types";

export const FRONT_BOND_DEFS: BondDef[] = [
  // ---- 锋刃 ----
  {
    id: "strength",
    name: "力量",
    title: "驯狮",
    arcana: "VIII",
    family: "blade",
    desc: "以柔驯猛。贵的牌要打得稳、打得开、打得住。",
    color: "#ff6b57",
    tiers: [
      { count: 3, desc: "重攻（基础费用≥2 的攻击牌）不会被格挡" },
      { count: 6, desc: "重攻命中后，对其他所有敌人造成本次伤害 30% 的固定伤害" },
      { count: 9, desc: "每回合第一张重攻视为速攻，且费用 −1" },
    ],
  },
  {
    id: "chariot",
    name: "战车",
    title: "驰骋",
    arcana: "VII",
    family: "blade",
    desc: "两头狮子朝不同方向拉，驾车的人只看一个目标。",
    color: "#ff9a3d",
    tiers: [
      { count: 3, desc: "本回合第 2 次及以后攻击同一名敌人时，无视其闪避" },
      { count: 6, desc: "本回合第 3 次及以后攻击同一名敌人时，无视其防御" },
      { count: 9, desc: "击杀本回合已被攻击 2 次以上的敌人时，下一张攻击牌视为速攻（每回合 1 次）" },
    ],
  },
  {
    id: "judgement",
    name: "审判",
    title: "号角",
    arcana: "XX",
    family: "blade",
    desc: "号角落下的那一刻，罪与罚同时兑现。",
    color: "#ffc94a",
    tiers: [
      { count: 3, desc: "攻击生命低于 30% 的敌人时必定暴击" },
      { count: 6, desc: "暴击击杀时，溢出伤害转移给生命最低的另一名敌人（可连锁）" },
      { count: 9, desc: "暴击伤害无视目标的防御与护盾" },
    ],
  },

  // ---- 壁垒 ----
  {
    id: "tower",
    name: "高塔",
    title: "崩塌",
    arcana: "XVI",
    family: "bulwark",
    desc: "塔会倒，但倒下的砖石会砸向攻城的人。",
    color: "#5b8cff",
    tiers: [
      { count: 3, desc: "护盾被敌人打空时，对攻击者造成等于被打掉护盾量的固定伤害" },
      { count: 6, desc: "有护盾的角色被施加减益时，改为失去 8 点护盾抵消该减益" },
      { count: 9, desc: "碎盾反击改为对所有敌人生效" },
    ],
  },
  {
    id: "priestess",
    name: "女祭司",
    title: "帷幕",
    arcana: "II",
    family: "bulwark",
    desc: "帷幕之后的静默知识：伤口愈合之外，还要看见下一道伤。",
    color: "#5ec8ff",
    tiers: [
      { count: 3, desc: "溢出的治疗量转为等量护盾" },
      { count: 6, desc: "治疗生命低于 30% 的角色时，额外移除其 1 个减益" },
      { count: 9, desc: "每回合第一张单体治疗牌改为作用于全队" },
    ],
  },
  {
    id: "emperor",
    name: "皇帝",
    title: "王座",
    arcana: "IV",
    family: "bulwark",
    desc: "秩序的意义，是不让任何一个人独自承受。",
    color: "#7fe3e0",
    tiers: [
      { count: 4, desc: "队友受到敌人单体攻击时，由生命最高的另一名队友代为承受 30%" },
      { count: 8, desc: "敌人每回合第一次全体攻击，改为只命中生命最高的队友" },
      { count: 12, desc: "我方角色受到的单次伤害不超过其最大生命的 25%" },
    ],
  },
];
