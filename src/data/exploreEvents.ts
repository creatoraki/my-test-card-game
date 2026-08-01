// ============================================================================
// 首图「废弃楼层」的节点事件池 —— 见 探索模式设计.md §8。
//
// 首图的职责是**教机制**, 所以池子要窄、结果要一眼看懂。三条主题线:
//   1. 清运回路 —— scrap-bot / radio-bot 不是猎人, 而是作业中的机械;
//   2. 仍在供电的设施 —— 门禁、货梯、维护终端、消防喷淋、售货机;
//   3. 上一批苏醒者的遗留 —— 营地、遗书、私藏物资。
// 首图**不引入**异常泄漏、坠落、生物失控 —— 那是下水管道与温室花园的性格。
//
// ⚠ 尚未实现的机制(商人交易、路由类 buff)一律标 disabled:
//   条目留在池里当占位与 TODO, 但 session.pickNodes 不会抽到它们 ——
//   否则玩家会撞上一个「点了没反应」的节点。
//
// ⚠ **战斗不再是节点事件**(设计文档 §2.4): 战斗是每轮独立的第二个关卡(战斗签),
//   原来的战斗类事件池与「BOSS 接入点」已整体删除, 战斗内容改由地图的 battleEncounters 提供。
//
// ★ depth 字段 ★ = 该事件允许出现的推进段区间(1-4), 对应设计文档 §8 各表的「段」列。
//   稳定收益放浅段、高方差收益放深段是硬约束(§2.3.2): 浅停要是有价值的巩固打法,
//   深潜要是一次挥棒。缺省 [1, 4]。
// ============================================================================

import type { NodeEvent } from "../explore/types";

// ★ 落点分支(choices) ★ —— 抵达节点后浮层里的两个按钮, 见 explore/session.chooseOption。
// 写法约定:
//   · choices[0] 是**主选项**, 其 energyDelta 必须与事件的 energyDelta 一致 ——
//     节点卡上给玩家预览的就是这个数, 两边对不上等于骗人。
//   · choices[1] 是**替代路线**, 一律有代价: 要么花能量规避, 要么少拿收益。
//     绝不能出现「白给的第二选项」, 否则风险节点就不再是风险。
//   · desc 是一行人话, 直接渲染在按钮里 —— 玩家不该为了读懂代价去猜数字。
//   · ⚠ 这里所有 energyDelta 都是「每节点固定 −3」之外的**额外**增减(设计文档 §4.2)。

// ---------------------------------------------------------------------------
// §8.1 生存类
// ---------------------------------------------------------------------------
const SURVIVAL: NodeEvent[] = [
  {
    id: "break-room",
    kind: "heal",
    category: "survival",
    depth: [1, 2],
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
    depth: [1, 2],
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
    depth: [1, 3],
    title: "消防喷淋室",
    description: "手动泄压后, 冷水把附着在装甲缝里的灰尘冲了下去。",
    energyDelta: -4,
    effects: [{ type: "HEAL_PARTY", percent: 0.15 }],
    choices: [
      {
        id: "wash",
        label: "全身冲洗",
        desc: "全队回复 15% 生命 · 泄压耗掉 4 粒子",
        energyDelta: -4,
        effects: [{ type: "HEAL_PARTY", percent: 0.15 }],
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
const GROWTH: NodeEvent[] = [
  {
    id: "sorting-belt",
    kind: "loot",
    category: "growth",
    depth: [1, 2],
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
    depth: [1, 2],
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
    depth: [1, 3],
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
        desc: "什么也不拿。读完路线和警告, 记下撤离方向",
        energyDelta: 0,
        effects: [],
      },
    ],
  },
  {
    id: "locker-row",
    kind: "loot",
    category: "growth",
    depth: [1, 2],
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
        desc: "一支净化安瓿 —— 不耗粒子, 也占不了多少地方",
        energyDelta: 0,
        effects: [{ type: "GAIN_ITEM", itemId: "purge-ampoule" }],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// §8.4 经济类 —— 临期食品交易与投递
// ---------------------------------------------------------------------------
const ECONOMY: NodeEvent[] = [
  {
    id: "vending",
    kind: "merchant",
    category: "economy",
    depth: [1, 2],
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
    depth: [1, 2],
    title: "流浪回收商",
    description: "一具还在自称是商人的电子生命。废件换材料, 材料换指令。",
    energyDelta: 0,
    effects: [],
    disabled: true,
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
const ROUTE: NodeEvent[] = [
  {
    id: "maint-terminal",
    kind: "route",
    category: "route",
    depth: [1, 2],
    title: "维护终端",
    description: "本轮桥接的揭示时长 +1.0 秒。",
    energyDelta: 0,
    effects: [],
    disabled: true,
  },
  {
    id: "floor-plan",
    kind: "route",
    category: "route",
    depth: [1, 3],
    title: "楼层平面图",
    description: "接下来 3 轮, 每轮永久显示 2 根桥接。",
    energyDelta: 0,
    effects: [],
    disabled: true,
  },
  {
    id: "jumper",
    kind: "route",
    category: "route",
    title: "短接器",
    description: "获得 1 次「侧向跨接」。",
    energyDelta: -3,
    effects: [],
    disabled: true,
  },
];

// ---------------------------------------------------------------------------
// §8.6 能量类 —— 直接改写难度曲线的位置
// ---------------------------------------------------------------------------
const ENERGY: NodeEvent[] = [
  {
    id: "backflow-purifier",
    kind: "energy",
    category: "energy",
    depth: [1, 3],
    title: "逆流净化机",
    description: "把过滤芯反着装回去。能撑得更久, 代价是本轮的推进到此为止。",
    energyDelta: 18,
    effects: [{ type: "END_REGION" }],
    choices: [
      {
        id: "reverse",
        label: "反着装回去",
        desc: "净化粒子 +18 · 本轮推进立即结束, 直接进入推进战斗",
        energyDelta: 18,
        effects: [{ type: "END_REGION" }],
      },
      {
        id: "swap",
        label: "正常更换滤芯",
        desc: "净化粒子 +10, 换下来的旧芯还能卖 · 整块合金 ×1 · 可以继续推进",
        energyDelta: 10,
        effects: [{ type: "GAIN_ITEM", itemId: "scrap-alloy" }],
      },
    ],
  },
  {
    id: "quiet-conduit",
    kind: "energy",
    category: "energy",
    depth: [1, 2],
    title: "隐匿通道",
    description: "顺着检修井绕过整层的探测器 —— 接下来两个节点都不消耗基础能量。",
    energyDelta: 0,
    effects: [{ type: "SKIP_NODE_COST", nodes: 2 }],
    choices: [
      {
        id: "sneak",
        label: "直接穿过",
        desc: "接下来 2 个节点免除每节点 3 点的基础消耗",
        energyDelta: 0,
        effects: [{ type: "SKIP_NODE_COST", nodes: 2 }],
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
    depth: [3, 4],
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
    depth: [3, 4],
    title: "通风破口",
    description: "破口后面是干净的储藏舱, 但粒子会顺着灌进来。",
    // 设计文档 §4.3 的「买收益」条目: 通风破口 = E −12 → 装备 ×1(品质按当前档位)。
    energyDelta: -12,
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
const HAZARD: NodeEvent[] = [
  {
    id: "false-alarm",
    kind: "hazard",
    category: "hazard",
    risk: "negative",
    depth: [3, 4],
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
        desc: "快得多, 代价是全队 −10% 生命 · 耗 4 粒子",
        energyDelta: -4,
        effects: [{ type: "DAMAGE_PARTY_PERCENT", percent: 0.1 }],
      },
    ],
  },
  {
    id: "burst-duct",
    kind: "hazard",
    category: "hazard",
    risk: "negative",
    depth: [3, 4],
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
    depth: [3, 4],
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
    depth: [3, 4],
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
];

// ---------------------------------------------------------------------------
// §8.8 终局类 —— BOSS 接入之后才进池
// ---------------------------------------------------------------------------
const ENDGAME: NodeEvent[] = [
  // ⚠ 「BOSS 接入点」已删除(设计文档 §8.8): BOSS 不再是路由图上的一个节点,
  //   而是第 6 轮战斗签的固定内容 —— 见 data/maps.ts 的 battleEncounters.boss。
  {
    id: "evac-lift",
    kind: "retreat",
    category: "endgame",
    depth: [1, 2],
    minRound: 5,
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
    depth: [1, 2],
    minRound: 5,
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
    depth: [3, 4],
    minRound: 5,
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
  survival: NodeEvent[];
  growth: NodeEvent[];
  economy: NodeEvent[];
  route: NodeEvent[];
  energy: NodeEvent[];
  hazard: NodeEvent[];
  endgame: NodeEvent[];
}

export const EVENT_POOLS: Record<string, EventPool> = {
  "ruined-floor": {
    survival: SURVIVAL,
    growth: GROWTH,
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
export const ALL_NODE_EVENTS: NodeEvent[] = Object.values(EVENT_POOLS).flatMap((p) =>
  Object.values(p).flat(),
);
