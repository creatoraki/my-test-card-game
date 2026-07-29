// ============================================================================
// 首图「废弃楼层」的终点事件池 —— 见 探索模式设计.md §8。
//
// 首图的职责是**教机制**, 所以池子要窄、结果要一眼看懂。三条主题线:
//   1. 清运回路 —— scrap-bot / radio-bot 不是猎人, 而是作业中的机械;
//   2. 仍在供电的设施 —— 门禁、货梯、维护终端、消防喷淋、售货机;
//   3. 上一批苏醒者的遗留 —— 营地、遗书、私藏物资。
// 首图**不引入**污染泄漏、坠落、生物失控 —— 那是下水管道与温室花园的性格。
//
// ⚠ P0 尚未实现的机制(商人交易、投递口、路由类 buff、实物背包)一律标 disabled:
//   条目留在池里当占位与 TODO, 但 session.generateSegment 不会抽到它们 ——
//   否则玩家会撞上一个「点了没反应」的终点。
// ============================================================================

import { EXPLORE_RULES } from "../explore/rules";
import type { RouteEvent } from "../explore/types";

// 战斗类事件的能量代价直接读规则常量, 免得这里和 rules.ts 各写一份数字。
const COST = EXPLORE_RULES.battleEnergy;

// ---------------------------------------------------------------------------
// §8.1 生存类
// ---------------------------------------------------------------------------
const SURVIVAL: RouteEvent[] = [
  {
    id: "break-room",
    kind: "heal",
    category: "survival",
    title: "员工休息室",
    description: "折叠床还铺着。自动贩售机的营养膏过期了三百年, 但净水口仍在出水。",
    energyDelta: 0,
    effects: [{ type: "HEAL_PARTY", percent: 0.25 }],
  },
  {
    id: "med-cabinet",
    kind: "heal",
    category: "survival",
    title: "应急医疗柜",
    description: "封条完好的急救舱, 只够一个人用到底。",
    energyDelta: 0,
    effects: [{ type: "HEAL_ONE_FULL", othersPercent: 0.1 }],
  },
  {
    id: "sprinkler-room",
    kind: "heal",
    category: "survival",
    title: "消防喷淋室",
    description: "手动泄压后, 冷水把附着在装甲缝里的粒子冲了下去。",
    energyDelta: -4,
    effects: [
      { type: "MODIFY_TAINT", amount: -1 },
      { type: "HEAL_PARTY", percent: 0.15 },
    ],
  },
];

// ---------------------------------------------------------------------------
// §8.2 成长类
// ---------------------------------------------------------------------------
const GROWTH: RouteEvent[] = [
  {
    id: "sorting-belt",
    kind: "loot",
    category: "growth",
    title: "废品分拣带",
    description: "传送带还在空转, 分拣仓里堆着没人来收的东西。",
    energyDelta: -2,
    effects: [{ type: "GAIN_LOOT", amount: 18 }],
  },
  {
    id: "teardown-bench",
    kind: "loot",
    category: "growth",
    title: "拆解台",
    description: "工位上摆着半台拆开的伺服器, 工具还插在原位。",
    energyDelta: -2,
    effects: [{ type: "GAIN_LOOT", amount: 24 }],
  },
  {
    id: "sleeper-camp",
    kind: "loot",
    category: "growth",
    title: "上批苏醒者营地",
    description: "睡袋、烧尽的加热片, 还有一封没写完的信。",
    energyDelta: 0,
    effects: [{ type: "GAIN_LOOT", amount: 14 }],
  },
  {
    id: "locker-row",
    kind: "loot",
    category: "growth",
    title: "未清空的储物柜",
    description: "三百年前有人锁上它就去上班了, 再没回来。",
    energyDelta: -2,
    effects: [{ type: "GAIN_LOOT", amount: 12 }],
  },
];

// ---------------------------------------------------------------------------
// §8.3 战斗类
// ---------------------------------------------------------------------------
const BATTLE: RouteEvent[] = [
  {
    id: "cleanup-crew",
    kind: "battle",
    category: "battle",
    title: "清运班组",
    description: "两台清运机械正在把这一层的东西按旧目录归类。你也在目录里。",
    energyDelta: -COST.normal,
    effects: [{ type: "START_BATTLE", encounterId: "n-crew" }],
  },
  {
    id: "patrol-beacon",
    kind: "battle",
    category: "battle",
    title: "巡回信标",
    description: "信标机边走边播报旧的疏散指令, 顺手把挡路的都清掉。",
    energyDelta: -COST.normal,
    effects: [{ type: "START_BATTLE", encounterId: "n-beacon" }],
  },
  {
    id: "treated-as-scrap",
    kind: "battle",
    category: "battle",
    risk: "highRisk",
    title: "被当作废品",
    description: "你们被投进了待压区。首回合手忙脚乱, 但压缩仓里的东西确实值钱。",
    energyDelta: -COST.normal,
    effects: [
      { type: "START_BATTLE", encounterId: "n-crew" },
      { type: "GAIN_LOOT", amount: 20 },
    ],
  },
  {
    id: "compactor",
    kind: "elite",
    category: "battle",
    risk: "highRisk",
    title: "报废压缩机",
    description: "整层的废料都往这里送。它比清运机械大一圈, 也认真得多。",
    energyDelta: -COST.elite,
    minSegment: 3,
    effects: [{ type: "START_BATTLE", encounterId: "n-compactor" }],
  },
];

// ---------------------------------------------------------------------------
// §8.4 经济类 —— P0 未接入交易系统, 全部占位
// ---------------------------------------------------------------------------
const ECONOMY: RouteEvent[] = [
  {
    id: "vending",
    kind: "merchant",
    category: "economy",
    title: "量子隧穿售货机",
    description: "用居民积分换营养膏与道具。",
    energyDelta: 0,
    effects: [],
    disabled: true,
  },
  {
    id: "wandering-trader",
    kind: "merchant",
    category: "economy",
    title: "流浪回收商",
    description: "一具还在自称是商人的电子生命。废件换材料, 材料换指令。",
    energyDelta: 0,
    effects: [],
    disabled: true,
  },
  {
    id: "work-order",
    kind: "merchant",
    category: "economy",
    title: "控制终端·临时工单",
    description: "接一条本段内能干完的小活, 换居民积分。",
    energyDelta: -3,
    effects: [{ type: "GAIN_LOOT", amount: 26 }],
  },
  {
    id: "dispatch-chute",
    kind: "merchant",
    category: "economy",
    title: "传送投递口",
    description: "把选中的物品提前寄回据点, 团灭也丢不掉。",
    energyDelta: -5,
    effects: [],
    disabled: true, // 需要实物背包(P1)才有意义
  },
];

// ---------------------------------------------------------------------------
// §8.5 路由类 —— P0 未实现路由 buff, 全部占位
// ---------------------------------------------------------------------------
const ROUTE: RouteEvent[] = [
  {
    id: "maint-terminal",
    kind: "route",
    category: "route",
    title: "维护终端",
    description: "下一段线路的展示时长 +1.0 秒。",
    energyDelta: 0,
    effects: [],
    disabled: true,
  },
  {
    id: "floor-plan",
    kind: "route",
    category: "route",
    title: "楼层平面图",
    description: "接下来 3 段, 每段永久显示 2 条横线。",
    energyDelta: 0,
    effects: [],
    disabled: true,
  },
  {
    id: "jumper",
    kind: "route",
    category: "route",
    title: "短接器",
    description: "获得 1 次「紧急回滚」。",
    energyDelta: -3,
    effects: [],
    disabled: true,
  },
];

// ---------------------------------------------------------------------------
// §8.6 能量类 —— 直接改写难度曲线的位置
// ---------------------------------------------------------------------------
const ENERGY: RouteEvent[] = [
  {
    id: "backflow-purifier",
    kind: "energy",
    category: "energy",
    title: "逆流净化机",
    description: "把过滤芯反着装回去。能撑得更久, 代价是这一段什么也带不走。",
    energyDelta: 25,
    effects: [],
  },
  {
    id: "quiet-conduit",
    kind: "energy",
    category: "energy",
    title: "隐匿通道",
    description: "顺着检修井绕过整层的探测器 —— 这一段不消耗基础能量。",
    energyDelta: 0,
    effects: [{ type: "SKIP_SEGMENT_COST" }],
  },
  {
    id: "pry-panel",
    kind: "energy",
    category: "energy",
    title: "强拆配电柜",
    description: "拆得越狠, 拿得越多, 过滤装置也烧得越快。",
    energyDelta: -8,
    effects: [{ type: "GAIN_LOOT", amount: 34 }],
  },
  {
    id: "vent-breach",
    kind: "energy",
    category: "energy",
    risk: "highRisk",
    title: "通风破口",
    description: "破口后面是干净的储藏舱, 但粒子会顺着灌进来。",
    energyDelta: -12,
    minSegment: 3,
    effects: [{ type: "GAIN_LOOT", amount: 52 }],
  },
];

// ---------------------------------------------------------------------------
// §8.7 风险类
// ---------------------------------------------------------------------------
const HAZARD: RouteEvent[] = [
  {
    id: "false-alarm",
    kind: "hazard",
    category: "hazard",
    risk: "negative",
    title: "警报误触",
    description: "整层的门同时闭合。绕出去花了很久。",
    energyDelta: -12,
    effects: [],
  },
  {
    id: "burst-duct",
    kind: "hazard",
    category: "hazard",
    risk: "negative",
    title: "破裂的通风管",
    description: "管道在头顶炸开, 碎片和陈年粉尘一起落下来。",
    energyDelta: -8,
    effects: [{ type: "DAMAGE_PARTY_PERCENT", percent: 0.12 }],
  },
  {
    id: "static-discharge",
    kind: "hazard",
    category: "hazard",
    risk: "highRisk",
    title: "静电放电区",
    description: "地板还带着电。趟过去很疼, 但对面那堆废件成色极好。",
    energyDelta: 0,
    effects: [
      { type: "DAMAGE_PARTY_PERCENT", percent: 0.15 },
      { type: "GAIN_LOOT", amount: 40 },
    ],
  },
  {
    id: "tainted-storage",
    kind: "hazard",
    category: "hazard",
    risk: "highRisk",
    title: "污染储藏间",
    description: "门缝里渗出细密的光点。里面的东西很好, 但会跟着你走完整趟远征。",
    energyDelta: 0,
    effects: [
      { type: "MODIFY_TAINT", amount: 1 },
      { type: "GAIN_LOOT", amount: 46 },
    ],
  },
];

// ---------------------------------------------------------------------------
// §8.8 终局类 —— BOSS 接入之后才进池
// ---------------------------------------------------------------------------
const ENDGAME: RouteEvent[] = [
  {
    id: "boss-uplink",
    kind: "boss",
    category: "endgame",
    title: "BOSS 接入点",
    description: "回收总控发现了这一层的异常。它正在把整条清运回路调过来。",
    energyDelta: -COST.boss,
    effects: [{ type: "START_BATTLE", encounterId: "n-boss", boss: true }],
  },
  {
    id: "evac-lift",
    kind: "retreat",
    category: "endgame",
    title: "撤离升降机",
    description: "还能动的一部货梯。进去就结束这趟远征, 手上的东西全部带回。",
    energyDelta: 0,
    effects: [{ type: "RETREAT" }],
  },
  {
    id: "last-supply",
    kind: "heal",
    category: "endgame",
    title: "最后补给",
    description: "撤离通道旁的备勤舱, 显然是留给回来的人的。",
    energyDelta: 0,
    effects: [{ type: "HEAL_PARTY", percent: 0.4 }],
  },
  {
    id: "risky-vault",
    kind: "loot",
    category: "endgame",
    risk: "highRisk",
    title: "高风险宝库",
    description: "总控的私藏。开一次, 整层都会知道。",
    energyDelta: -15,
    effects: [{ type: "GAIN_LOOT", amount: 80 }],
  },
];

// ---------------------------------------------------------------------------
// 事件池注册表 —— 按类别分组, session.generateSegment 据此做保底抽取。
// ---------------------------------------------------------------------------
export interface EventPool {
  survival: RouteEvent[];
  growth: RouteEvent[];
  battle: RouteEvent[];
  economy: RouteEvent[];
  route: RouteEvent[];
  energy: RouteEvent[];
  hazard: RouteEvent[];
  endgame: RouteEvent[];
}

export const EVENT_POOLS: Record<string, EventPool> = {
  "ruined-floor": {
    survival: SURVIVAL,
    growth: GROWTH,
    battle: BATTLE,
    economy: ECONOMY,
    route: ROUTE,
    energy: ENERGY,
    hazard: HAZARD,
    endgame: ENDGAME,
  },
};

export function getEventPool(id: string): EventPool {
  const pool = EVENT_POOLS[id];
  if (!pool) throw new Error(`未知事件池: ${id}`);
  return pool;
}

// 全部事件的扁平索引 —— 结算页/记录回顾按 id 反查标题时用。
export const ALL_ROUTE_EVENTS: RouteEvent[] = Object.values(EVENT_POOLS).flatMap((p) =>
  Object.values(p).flat(),
);
