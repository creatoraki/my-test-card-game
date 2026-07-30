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
const BYPASS = EXPLORE_RULES.bypass;

// ★ 落点分支(choices) ★ —— 抵达终点后浮层里的两个按钮, 见 explore/session.chooseOption。
// 写法约定:
//   · choices[0] 是**主选项**, 其 energyDelta 必须与事件的 energyDelta 一致 ——
//     终点卡上给玩家预览的就是这个数, 两边对不上等于骗人。
//   · choices[1] 是**替代路线**, 一律有代价: 要么花能量规避, 要么少拿收益。
//     绝不能出现「白给的第二选项」, 否则风险终点就不再是风险。
//   · desc 是一行人话, 直接渲染在按钮里 —— 玩家不该为了读懂代价去猜数字。

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
    choices: [
      {
        id: "rest",
        label: "就地休整",
        desc: "轮流躺一会儿, 全队回复 25% 生命",
        energyDelta: 0,
        effects: [{ type: "HEAL_PARTY", percent: 0.25 }],
      },
      {
        id: "ransack",
        label: "翻找储物柜",
        desc: "不休息, 把柜子挨个撬开 —— 花时间, 换东西",
        energyDelta: -4,
        effects: [
          {
            type: "ROLL_DROP",
            table: [
              { kind: "item", itemId: "scrap-piece", chance: 1, min: 1, max: 2 },
              { kind: "item", itemId: "nutrient-paste", chance: 0.5 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "med-cabinet",
    kind: "heal",
    category: "survival",
    title: "应急医疗柜",
    description: "封条完好的急救舱, 只够一个人用到底。",
    energyDelta: 0,
    effects: [{ type: "HEAL_ONE_FULL", othersPercent: 0.1 }],
    choices: [
      {
        id: "use",
        label: "用掉急救舱",
        desc: "伤得最重的一人回满, 其余回复 10%",
        energyDelta: 0,
        effects: [{ type: "HEAL_ONE_FULL", othersPercent: 0.1 }],
      },
      {
        id: "strip",
        label: "拆成便携件",
        desc: "谁也不治, 整柜药剂拆下来带走 —— 急救组件 ×1、营养膏 ×1",
        energyDelta: 0,
        effects: [
          { type: "GAIN_ITEM", itemId: "trauma-kit" },
          { type: "GAIN_ITEM", itemId: "nutrient-paste" },
        ],
      },
    ],
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
    choices: [
      {
        id: "wash",
        label: "全身冲洗",
        desc: "污染 −1 层, 全队回复 15% 生命 · 泄压耗掉 4 粒子",
        energyDelta: -4,
        effects: [
          { type: "MODIFY_TAINT", amount: -1 },
          { type: "HEAL_PARTY", percent: 0.15 },
        ],
      },
      {
        id: "canteen",
        label: "只灌满水壶",
        desc: "不泄压, 不耗粒子, 全队回复 10% 生命",
        energyDelta: 0,
        effects: [{ type: "HEAL_PARTY", percent: 0.1 }],
      },
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
    // ★ 设计文档 §6.1: 探索层产出的全是**实物**, 废料要带回据点的回收台卖了才是积分。
    //   两条分支的对价换成「多拿但占背包 / 少拿但不费粒子」—— 负重本身就是代价。
    energyDelta: -2,
    effects: [
      {
        type: "ROLL_DROP",
        table: [
          { kind: "item", itemId: "scrap-piece", chance: 1, min: 2, max: 3 },
          { kind: "item", itemId: "scrap-alloy", chance: 0.5 },
        ],
      },
    ],
    choices: [
      {
        id: "clear",
        label: "搬空分拣仓",
        desc: "废件 ×2-3、可能有整块合金 · 停机与搬运耗掉 2 粒子",
        energyDelta: -2,
        effects: [
          {
            type: "ROLL_DROP",
            table: [
              { kind: "item", itemId: "scrap-piece", chance: 1, min: 2, max: 3 },
              { kind: "item", itemId: "scrap-alloy", chance: 0.5 },
            ],
          },
        ],
      },
      {
        id: "skim",
        label: "只挑轻的",
        desc: "不停机, 顺手拿一件废件 —— 不耗粒子, 也不怎么压背包",
        energyDelta: 0,
        effects: [{ type: "GAIN_ITEM", itemId: "scrap-piece" }],
      },
    ],
  },
  {
    id: "teardown-bench",
    kind: "loot",
    category: "growth",
    title: "拆解台",
    description: "工位上摆着半台拆开的伺服器, 工具还插在原位。",
    energyDelta: -2,
    effects: [
      {
        type: "ROLL_DROP",
        table: [
          { kind: "family", familyId: "servo", chance: 1 },
          { kind: "family", familyId: "coil", chance: 0.6 },
        ],
      },
    ],
    choices: [
      {
        id: "teardown",
        label: "全部拆解",
        desc: "模组材料 ×1-2（品质随净化粒子档位）· 接电作业耗掉 2 粒子",
        energyDelta: -2,
        effects: [
          {
            type: "ROLL_DROP",
            table: [
              { kind: "family", familyId: "servo", chance: 1 },
              { kind: "family", familyId: "coil", chance: 0.6 },
            ],
          },
        ],
      },
      {
        id: "tools",
        label: "只拿工具",
        desc: "顺走那把撬棒 —— 不耗粒子, 但装备占 2 格",
        energyDelta: 0,
        effects: [{ type: "GAIN_ITEM", itemId: "prybar-c" }],
      },
    ],
  },
  {
    id: "sleeper-camp",
    kind: "loot",
    category: "growth",
    title: "上批苏醒者营地",
    description: "睡袋、烧尽的加热片, 还有一封没写完的信。",
    energyDelta: 0,
    effects: [{ type: "GAIN_ITEM", itemId: "nutrient-paste", count: 2 }],
    choices: [
      {
        id: "gather",
        label: "收拢遗物",
        desc: "还没吃完的营养膏 ×2",
        energyDelta: 0,
        effects: [{ type: "GAIN_ITEM", itemId: "nutrient-paste", count: 2 }],
      },
      {
        id: "read",
        label: "读完那封信",
        desc: "什么也不拿。知道他们怎么走的, 污染 −1 层",
        energyDelta: 0,
        effects: [{ type: "MODIFY_TAINT", amount: -1 }],
      },
    ],
  },
  {
    id: "locker-row",
    kind: "loot",
    category: "growth",
    title: "未清空的储物柜",
    description: "三百年前有人锁上它就去上班了, 再没回来。",
    energyDelta: -2,
    effects: [
      {
        type: "ROLL_DROP",
        table: [
          { kind: "item", itemId: "scrap-piece", chance: 0.8 },
          { kind: "item", itemId: "data-shard", chance: 0.35 },
          { kind: "family", familyId: "jammer", chance: 0.2 },
        ],
      },
    ],
    choices: [
      {
        id: "pry",
        label: "逐个撬开",
        desc: "私人物品、旧存档, 偶尔还有能用的东西 · 撬锁耗掉 2 粒子",
        energyDelta: -2,
        effects: [
          {
            type: "ROLL_DROP",
            table: [
              { kind: "item", itemId: "scrap-piece", chance: 0.8 },
              { kind: "item", itemId: "data-shard", chance: 0.35 },
              { kind: "family", familyId: "jammer", chance: 0.2 },
            ],
          },
        ],
      },
      {
        id: "unlocked",
        label: "只开没锁的",
        desc: "一支过滤滤芯 —— 不耗粒子, 也占不了多少地方",
        energyDelta: 0,
        effects: [{ type: "GAIN_ITEM", itemId: "filter-cartridge" }],
      },
    ],
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
    choices: [
      {
        id: "fight",
        label: "迎战",
        desc: `打掉这一组, 拿走它们的产出 · 耗 ${COST.normal} 粒子`,
        energyDelta: -COST.normal,
        effects: [{ type: "START_BATTLE", encounterId: "n-crew" }],
      },
      {
        id: "bypass",
        label: "绕行",
        desc: `贴着墙根摸过去 —— 不打, 也什么都拿不到 · 耗 ${BYPASS.normal} 粒子`,
        energyDelta: -BYPASS.normal,
        effects: [],
      },
    ],
  },
  {
    id: "patrol-beacon",
    kind: "battle",
    category: "battle",
    title: "巡回信标",
    description: "信标机边走边播报旧的疏散指令, 顺手把挡路的都清掉。",
    energyDelta: -COST.normal,
    effects: [{ type: "START_BATTLE", encounterId: "n-beacon" }],
    choices: [
      {
        id: "fight",
        label: "迎战",
        desc: `拆掉信标机 · 耗 ${COST.normal} 粒子`,
        energyDelta: -COST.normal,
        effects: [{ type: "START_BATTLE", encounterId: "n-beacon" }],
      },
      {
        id: "bypass",
        label: "等它走远",
        desc: `蹲在检修间里等广播过去 · 耗 ${BYPASS.normal} 粒子`,
        energyDelta: -BYPASS.normal,
        effects: [],
      },
    ],
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
      { type: "GAIN_ITEM", itemId: "scrap-alloy", count: 2 },
    ],
    choices: [
      {
        id: "fight",
        label: "在待压区打",
        desc: `边打边把压缩仓掏空 · 整块合金 ×2 · 耗 ${COST.normal} 粒子`,
        energyDelta: -COST.normal,
        effects: [
          { type: "START_BATTLE", encounterId: "n-crew" },
          { type: "GAIN_ITEM", itemId: "scrap-alloy", count: 2 },
        ],
      },
      {
        id: "climb",
        label: "从投料口爬出去",
        desc: `不打, 空手走 · 全队 −8% 生命 · 耗 ${BYPASS.normal} 粒子`,
        energyDelta: -BYPASS.normal,
        effects: [{ type: "DAMAGE_PARTY_PERCENT", percent: 0.08 }],
      },
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
    choices: [
      {
        id: "fight",
        label: "迎战",
        desc: `正面拆掉它 · 耗 ${COST.elite} 粒子`,
        energyDelta: -COST.elite,
        effects: [{ type: "START_BATTLE", encounterId: "n-compactor" }],
      },
      {
        id: "bypass",
        label: "绕开整个压缩区",
        desc: `多走两层楼梯 —— 不打, 无收益 · 耗 ${BYPASS.elite} 粒子`,
        energyDelta: -BYPASS.elite,
        effects: [],
      },
    ],
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
    choices: [
      {
        id: "accept",
        label: "接单",
        desc: "干完这票 · 居民积分 +26 · 耗 3 粒子",
        energyDelta: -3,
        effects: [{ type: "GAIN_LOOT", amount: 26 }],
      },
      {
        id: "decline",
        label: "不接",
        desc: "登出终端就走, 什么都不花也什么都没有",
        energyDelta: 0,
        effects: [],
      },
    ],
  },
  {
    id: "dispatch-chute",
    kind: "merchant",
    category: "economy",
    title: "传送投递口",
    description: "把选中的物品提前寄回据点, 团灭也丢不掉。",
    // ★ 背包玩法唯一的保险手段(设计文档 §6.5), 也是首图的必备教学点 ——
    //   没有它, 后段只能在「背满了打不动」和「丢掉稀有装备」之间硬二选一。
    //   OPEN_CHUTE 只是开启寄件流程; 真正扣的 −5 粒子在玩家按下「寄回」时才收
    //   (见 explore/session.shipHome), 所以这里的 energyDelta 是 0。
    energyDelta: 0,
    effects: [{ type: "OPEN_CHUTE" }],
    choices: [
      {
        id: "use",
        label: "接入投递口",
        desc: `寄回一批物资 · 寄件时扣 ${5} 粒子 · 团灭也丢不掉`,
        energyDelta: 0,
        effects: [{ type: "OPEN_CHUTE" }],
      },
      {
        id: "skip",
        label: "不用",
        desc: "省下粒子, 东西继续自己背着",
        energyDelta: 0,
        effects: [],
      },
    ],
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
    choices: [
      {
        id: "reverse",
        label: "反着装回去",
        desc: "净化粒子 +25, 本段一无所获",
        energyDelta: 25,
        effects: [],
      },
      {
        id: "swap",
        label: "正常更换滤芯",
        desc: "净化粒子 +10, 换下来的旧芯还能卖 · 整块合金 ×1",
        energyDelta: 10,
        effects: [{ type: "GAIN_ITEM", itemId: "scrap-alloy" }],
      },
    ],
  },
  {
    id: "quiet-conduit",
    kind: "energy",
    category: "energy",
    title: "隐匿通道",
    description: "顺着检修井绕过整层的探测器 —— 这一段不消耗基础能量。",
    energyDelta: 0,
    effects: [{ type: "SKIP_SEGMENT_COST" }],
    choices: [
      {
        id: "sneak",
        label: "直接穿过",
        desc: "免除本段的基础粒子消耗",
        energyDelta: 0,
        effects: [{ type: "SKIP_SEGMENT_COST" }],
      },
      {
        id: "detour",
        label: "顺路摸一把",
        desc: "在井底的备件箱里翻一遍 · 得一批物资 · 基础消耗照扣",
        energyDelta: 0,
        effects: [
          {
            type: "ROLL_DROP",
            table: [
              { kind: "item", itemId: "scrap-piece", chance: 1, min: 1, max: 2 },
              { kind: "family", familyId: "coil", chance: 0.45 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "pry-panel",
    kind: "energy",
    category: "energy",
    title: "强拆配电柜",
    description: "拆得越狠, 拿得越多, 过滤装置也烧得越快。",
    // 设计文档 §4.3 的「买收益」条目: 强拆配电柜 = E −8 → 模组材料 ×2。
    energyDelta: -8,
    effects: [{ type: "ROLL_DROP", table: [{ kind: "family", familyId: "servo", chance: 2 }] }],
    choices: [
      {
        id: "gut",
        label: "拆到底",
        desc: "模组材料 ×2（品质随档位）· 耗 8 粒子",
        energyDelta: -8,
        effects: [{ type: "ROLL_DROP", table: [{ kind: "family", familyId: "servo", chance: 2 }] }],
      },
      {
        id: "surface",
        label: "只取表层",
        desc: "废件 ×1 · 耗 2 粒子",
        energyDelta: -2,
        effects: [{ type: "GAIN_ITEM", itemId: "scrap-piece" }],
      },
    ],
  },
  {
    id: "vent-breach",
    kind: "energy",
    category: "energy",
    risk: "highRisk",
    title: "通风破口",
    description: "破口后面是干净的储藏舱, 但粒子会顺着灌进来。",
    // 设计文档 §4.3 的「买收益」条目: 通风破口 = E −12 → 装备 ×1(品质按当前档位)。
    energyDelta: -12,
    minSegment: 3,
    effects: [{ type: "ROLL_DROP", table: [{ kind: "family", familyId: "armor-plate", chance: 1 }] }],
    choices: [
      {
        id: "enter",
        label: "钻进去",
        desc: "储藏舱里有整套护板 · 装备 ×1（品质按当前档位）· 耗 12 粒子",
        energyDelta: -12,
        effects: [
          { type: "ROLL_DROP", table: [{ kind: "family", familyId: "armor-plate", chance: 1 }] },
        ],
      },
      {
        id: "seal",
        label: "焊回去",
        desc: "堵住破口就走, 不花粒子也没有收益",
        energyDelta: 0,
        effects: [],
      },
    ],
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
    choices: [
      {
        id: "detour",
        label: "老实绕出去",
        desc: "耗 12 粒子, 但一个人都不伤",
        energyDelta: -12,
        effects: [],
      },
      {
        id: "force",
        label: "强行破门",
        desc: `快得多, 代价是全队 −10% 生命 · 耗 ${BYPASS.hazard} 粒子`,
        energyDelta: -BYPASS.hazard,
        effects: [{ type: "DAMAGE_PARTY_PERCENT", percent: 0.1 }],
      },
    ],
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
    choices: [
      {
        id: "rush",
        label: "低头硬闯",
        desc: "全队 −12% 生命 · 耗 8 粒子",
        energyDelta: -8,
        effects: [{ type: "DAMAGE_PARTY_PERCENT", percent: 0.12 }],
      },
      {
        id: "wait",
        label: "等碎片落尽",
        desc: "一个人都不伤, 但在粉尘里多待了很久 · 耗 10 粒子",
        energyDelta: -10,
        effects: [],
      },
    ],
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
      {
        type: "ROLL_DROP",
        table: [
          { kind: "item", itemId: "scrap-alloy", chance: 1, min: 1, max: 2 },
          { kind: "item", itemId: "scrap-core", chance: 0.4 },
        ],
      },
    ],
    choices: [
      {
        id: "wade",
        label: "趟过去",
        desc: "全队 −15% 生命 · 成色极好的一堆废料",
        energyDelta: 0,
        effects: [
          { type: "DAMAGE_PARTY_PERCENT", percent: 0.15 },
          {
            type: "ROLL_DROP",
            table: [
              { kind: "item", itemId: "scrap-alloy", chance: 1, min: 1, max: 2 },
              { kind: "item", itemId: "scrap-core", chance: 0.4 },
            ],
          },
        ],
      },
      {
        id: "leave",
        label: "放弃对面那堆",
        desc: "不趟电, 不受伤, 也不带走任何东西",
        energyDelta: 0,
        effects: [],
      },
    ],
  },
  // 设计文档 §8.7 的「压力门夹层」: 唯一一个**直接惩罚背包**的事件 ——
  // 背得越满亏得越多, 于是「要不要再多拿一件」这个决定在这里有了反面。
  {
    id: "pressure-door",
    kind: "hazard",
    category: "hazard",
    risk: "negative",
    title: "压力门夹层",
    description: "两道门之间的空腔正在泄压。带不动的东西必须扔下。",
    energyDelta: 0,
    effects: [{ type: "DISCARD_SLOTS", slots: 4 }],
    choices: [
      {
        id: "drop",
        label: "扔掉最不值钱的",
        desc: "强制丢弃 4 格物资（从最不值钱的开始）· 不耗粒子",
        energyDelta: 0,
        effects: [{ type: "DISCARD_SLOTS", slots: 4 }],
      },
      {
        id: "hold",
        label: "一件都不放",
        desc: "全队顶着压差硬挤过去 —— 全队 −12% 生命 · 耗 6 粒子",
        energyDelta: -6,
        effects: [{ type: "DAMAGE_PARTY_PERCENT", percent: 0.12 }],
      },
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
      {
        type: "ROLL_DROP",
        table: [
          { kind: "family", familyId: "jammer", chance: 1 },
          { kind: "item", itemId: "scrap-core", chance: 0.6 },
        ],
      },
    ],
    choices: [
      {
        id: "open",
        label: "开门",
        desc: "污染 +1 层(整趟远征不可清除) · 一件饰品 + 可能的未熄核心",
        energyDelta: 0,
        effects: [
          { type: "MODIFY_TAINT", amount: 1 },
          {
            type: "ROLL_DROP",
            table: [
              { kind: "family", familyId: "jammer", chance: 1 },
              { kind: "item", itemId: "scrap-core", chance: 0.6 },
            ],
          },
        ],
      },
      {
        id: "avoid",
        label: "不碰",
        desc: "把门重新压紧, 干干净净地走开",
        energyDelta: 0,
        effects: [],
      },
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
    choices: [
      {
        id: "uplink",
        label: "接入总控",
        desc: `打掉它就是通关 · 耗 ${COST.boss} 粒子`,
        energyDelta: -COST.boss,
        effects: [{ type: "START_BATTLE", encounterId: "n-boss", boss: true }],
      },
      {
        id: "cut",
        label: "切断上行链路",
        desc: `这一段什么都不会发生, 但你还得自己找路回去 · 耗 ${BYPASS.boss} 粒子`,
        energyDelta: -BYPASS.boss,
        effects: [],
      },
    ],
  },
  {
    id: "evac-lift",
    kind: "retreat",
    category: "endgame",
    title: "撤离升降机",
    description: "还能动的一部货梯。进去就结束这趟远征, 手上的东西全部带回。",
    energyDelta: 0,
    effects: [{ type: "RETREAT" }],
    choices: [
      {
        id: "board",
        label: "进入升降机",
        desc: "立刻结束远征, 手上的居民积分全部落袋",
        energyDelta: 0,
        effects: [{ type: "RETREAT" }],
      },
      {
        id: "stay",
        label: "不坐, 继续深入",
        desc: "把货梯留在这一层, 继续往下走",
        energyDelta: 0,
        effects: [],
      },
    ],
  },
  {
    id: "last-supply",
    kind: "heal",
    category: "endgame",
    title: "最后补给",
    description: "撤离通道旁的备勤舱, 显然是留给回来的人的。",
    energyDelta: 0,
    effects: [{ type: "HEAL_PARTY", percent: 0.4 }],
    choices: [
      {
        id: "use",
        label: "全部用掉",
        desc: "全队回复 40% 生命",
        energyDelta: 0,
        effects: [{ type: "HEAL_PARTY", percent: 0.4 }],
      },
      {
        id: "keep",
        label: "留给下一批",
        desc: "只带走登记牌 —— 据点认这个 · 居民积分 +25",
        energyDelta: 0,
        effects: [{ type: "GAIN_LOOT", amount: 25 }],
      },
    ],
  },
  {
    id: "risky-vault",
    kind: "loot",
    category: "endgame",
    risk: "highRisk",
    title: "高风险宝库",
    description: "总控的私藏。开一次, 整层都会知道。",
    // 终局宝库: 三个族各掷一次 + 一枚未熄核心。品质吃当前档位 —— 能量越低, 开出来的越好。
    energyDelta: -15,
    effects: [
      {
        type: "ROLL_DROP",
        table: [
          { kind: "family", familyId: "prybar", chance: 1 },
          { kind: "family", familyId: "armor-plate", chance: 1 },
          { kind: "item", itemId: "scrap-core", chance: 1 },
        ],
      },
    ],
    choices: [
      {
        id: "open",
        label: "开箱",
        desc: "武器 + 防具各 1 件（品质按当前档位）、未熄核心 ×1 · 耗 15 粒子",
        energyDelta: -15,
        effects: [
          {
            type: "ROLL_DROP",
            table: [
              { kind: "family", familyId: "prybar", chance: 1 },
              { kind: "family", familyId: "armor-plate", chance: 1 },
              { kind: "item", itemId: "scrap-core", chance: 1 },
            ],
          },
        ],
      },
      {
        id: "mark",
        label: "只记下位置",
        desc: "不惊动整层 · 只把门口那枚数据存档带走",
        energyDelta: 0,
        effects: [{ type: "GAIN_ITEM", itemId: "data-shard" }],
      },
    ],
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
