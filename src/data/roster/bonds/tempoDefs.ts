// 时序系(时刻轴)与流转系(牌与法力)。数值见《羁绊重构设计文档》第五章, 行为在 engine/bonds。
// 待机次数 / 抽牌数 / 法力这类小队资源走 squadMods, 规则部分由引擎按档位结算。

import type { BondDef } from "./types";

export const TEMPO_BOND_DEFS: BondDef[] = [
  // ---- 时序 ----
  {
    id: "wheel",
    name: "命运之轮",
    title: "轮转",
    arcana: "X",
    family: "chrono",
    desc: "时间在转，只要你肯让它转。",
    color: "#b06cf0",
    tiers: [
      { count: 3, desc: "本回合推进满 3 个时刻时，抽 1 张牌" },
      { count: 6, desc: "本回合推进满 5 个时刻时，获得 1 点法力" },
      { count: 9, desc: "本回合推进满 6 个时刻时，抽牌堆顶的 1 张牌以 0 费自动打出" },
    ],
  },
  {
    id: "star",
    name: "星星",
    title: "指引",
    arcana: "XVII",
    family: "chrono",
    desc: "星光不催人赶路，但它让人抢在黑夜之前。",
    color: "#d79bff",
    tiers: [
      { count: 3, desc: "每回合开始时，随机 1 张费用为 1 的普通手牌本回合视为速攻" },
      { count: 6, desc: "每回合打出的第 2 张速攻牌结算后，抽 1 张牌" },
      { count: 9, desc: "每回合第一张速攻牌结算后返回手牌" },
    ],
  },
  {
    id: "hanged",
    name: "倒吊人",
    title: "悬停",
    arcana: "XII",
    family: "chrono",
    desc: "倒过来看世界的人，愿意先停一下。",
    color: "#8f7dff",
    tiers: [
      { count: 3, desc: "每回合待机次数 +1", squadMods: { waits: 1 } },
      { count: 6, desc: "每回合第一次待机时，抽 1 张牌", squadMods: { waits: 1 } },
      { count: 9, desc: "待机时可悬置 1 张手牌，下回合开始时以 0 费自动打出（每回合 1 张）", squadMods: { waits: 1 } },
    ],
  },

  // ---- 流转 ----
  {
    id: "fool",
    name: "愚者",
    title: "启程",
    arcana: "0",
    family: "flow",
    desc: "毫无计划地起步，反而看见更多的路。",
    color: "#7ce08a",
    tiers: [
      { count: 6, desc: "每回合额外抽 1 张牌", squadMods: { drawCount: 1 } },
      { count: 12, desc: "每回合额外抽 2 张牌；每回合开始时，随机 1 张手牌本回合费用 −1", squadMods: { drawCount: 2 } },
    ],
  },
  {
    id: "magician",
    name: "魔术师",
    title: "万能",
    arcana: "I",
    family: "flow",
    desc: "桌上四件法器齐备：你需要的已经都在手里。",
    color: "#b8f060",
    tiers: [
      { count: 6, desc: "回合结束时未用完的法力，最多 1 点结转到下回合" },
      { count: 12, desc: "每回合法力 +1；结转上限改为 2 点", squadMods: { mana: 1 } },
    ],
  },
  {
    id: "hermit",
    name: "隐者",
    title: "提灯",
    arcana: "IX",
    family: "flow",
    desc: "一盏灯照不亮整座城，但够看清脚下这一步。",
    color: "#4fd6a8",
    tiers: [
      { count: 3, desc: "回合结束时弃置手牌最后 1 张，下回合开始时多抽等量的牌" },
      { count: 6, desc: "每回合第一次弃牌时，查看抽牌堆顶 3 张，选 1 张置于牌堆顶" },
      { count: 9, desc: "每回合第一次主动弃牌会触发该牌的被弃置效果；回合末改为弃置最后 2 张" },
    ],
  },
];
