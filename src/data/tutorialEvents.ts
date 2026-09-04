import type { EventChoice, ExploreEffect } from "../explore/types";
import type { EventPool } from "./exploreEvents";
import { chance, choice } from "./exploreEventKit";

const direct = (
  id: string,
  label: string,
  desc: string,
  story: string,
  effects: ExploreEffect[] = [],
  energyDelta = 0,
): EventChoice => ({ id, label, desc, story, energyDelta, effects });

const TUTORIAL_EVENTS: EventPool["growth"] = [
  {
    id: "tut-equip-locker",
    kind: "loot",
    category: "growth",
    title: "装备储物柜",
    description: "储物柜的识别灯亮起，柜门后是一件刚完成校准的随机装备。",
    energyDelta: 0,
    choices: [
      direct("open", "打开装备柜", "领取一件随机装备", "你确认队伍编号，储物柜交出一件可用装备。", [{ type: "GRANT_EQUIP" }]),
      direct("force", "强制解锁备用柜", "领取一件随机装备", "你切断备用锁，另一只储物柜也吐出一件随机装备。", [{ type: "GRANT_EQUIP" }]),
    ],
  },
  {
    id: "tut-module-bench",
    kind: "loot",
    category: "growth",
    title: "模组工作台",
    description: "工作台正在检查一阶通用模组，装配臂已经把一个模组箱推到交付槽。",
    energyDelta: 0,
    choices: [
      direct("inspect", "检查模组箱", "领取一件随机模组", "你读取工作台的检验结果，合格模组被送入待拾取框。", [{ type: "GRANT_MODULE" }]),
      direct("reroute", "改走备用交付线", "领取一件随机模组", "你把交付线切到备用轨道，另一枚模组也完成了出库。", [{ type: "GRANT_MODULE" }]),
    ],
  },
  {
    id: "tut-heal-station",
    kind: "heal",
    category: "survival",
    title: "治疗站",
    description: "白色治疗灯为队伍亮起，接口可以把储备药剂分配给所有存活成员。",
    energyDelta: 0,
    choices: [
      direct("restore", "启动全队治疗", "全队回复 25% 生命", "你让治疗站扫描全队，恢复脉冲依次通过护甲接口。", [{ type: "HEAL_PARTY", percent: 0.25 }]),
      direct("reserve", "保留一部分药剂", "全队回复 12% 生命并获得 4 粒子", "你降低治疗强度，把剩余药剂转成净化粒子。", [
        { type: "HEAL_PARTY", percent: 0.12 },
        { type: "MODIFY_ENERGY", amount: 4 },
      ]),
    ],
  },
  {
    id: "tut-supply-crate",
    kind: "loot",
    category: "growth",
    title: "补给箱",
    description: "补给箱的封条没有损坏，里面装着可以带回据点的标准材料。",
    energyDelta: 0,
    choices: [
      direct("gear", "领取复位零件", "获得弹簧 ×1", "你拆开缓冲层，取出一只完整弹簧。", [{ type: "GAIN_ITEM", itemId: "coil-spring" }]),
      direct("battery", "领取磁性单元", "获得磁铁 ×1", "你检查分拣组件，取出一枚仍然稳定的磁铁。", [{ type: "GAIN_ITEM", itemId: "magnet" }]),
    ],
  },
  {
    id: "tut-hazard-vent",
    kind: "hazard",
    category: "hazard",
    title: "泄压风道",
    description: "风道里传来不稳定的高压声，任何一次操作都可能让粒子或队伍承受损失。",
    energyDelta: 0,
    choices: [
      choice("seal", "缓慢关闭阀门", "风险加权：可能损失粒子或生命", "你把阀门一格一格推回安全线。", [
        chance("seal-energy", 70, "阀门顺利闭合，但泄压消耗了 6 粒子。", [{ type: "MODIFY_ENERGY", amount: -6 }]),
        chance("seal-damage", 30, "阀门突然回弹，全队损失 8% 生命。", [{ type: "DAMAGE_PARTY_PERCENT", percent: 0.08 }]),
      ]),
      choice("vent", "直接释放压力", "风险加权：可能获得粒子或受到伤害", "你打开旁通阀，让积压的压力一次性冲出风道。", [
        chance("vent-energy", 55, "压力流被净化器捕获，队伍获得 6 粒子。", [{ type: "MODIFY_ENERGY", amount: 6 }]),
        chance("vent-damage", 45, "旁通阀失控，全队损失 12% 生命。", [{ type: "DAMAGE_PARTY_PERCENT", percent: 0.12 }]),
      ]),
    ],
  },
  {
    id: "tut-trade-terminal",
    kind: "merchant",
    category: "economy",
    title: "交易终端",
    description: "终端列出医疗服务与材料货架，支付指定食品即可查看公开库存。",
    energyDelta: 0,
    services: ["medical-service", "general-material-shop"],
    choices: [
      direct("trade", "接入交易终端", "打开服务目录", "你接入终端，服务目录和支付条件被逐项点亮。", [{ type: "OPEN_SHOP" }]),
      direct("leave", "暂不交易", "保留当前物资", "你记下终端位置，决定把食品留给更需要的时刻。"),
    ],
  },
  {
    id: "tut-scrap-pile",
    kind: "loot",
    category: "growth",
    title: "废料堆",
    description: "废料堆里能直接辨认出几件标准零件，翻动方式会决定带走哪一类物资。",
    energyDelta: 0,
    choices: [
      direct("sort", "分类拾取", "获得弹簧 ×2", "你先按尺寸分类，取出两只仍然顺滑的弹簧。", [{ type: "GAIN_ITEM", itemId: "coil-spring", count: 2 }]),
      direct("search", "深入翻找", "获得磁铁 ×1 与电池 ×1", "你冒险翻到废料堆底部，找到一枚磁铁和一块电池。", [
        { type: "GAIN_ITEM", itemId: "magnet" },
        { type: "GAIN_ITEM", itemId: "standard-battery" },
      ]),
    ],
  },
  {
    id: "tut-energy-tap",
    kind: "energy",
    category: "energy",
    title: "能量接入点",
    description: "接入点可以把未使用的电流转成净化粒子，也可以反向抽取回路储能。",
    energyDelta: 0,
    choices: [
      direct("charge", "回收稳定电流", "净化粒子 +8", "你将稳定电流导入净化核心，粒子读数向上跳了一格。", [{ type: "MODIFY_ENERGY", amount: 8 }]),
      direct("draw", "抽取备用回路", "净化粒子 −4，换取额外物资", "你抽走备用回路的储能，换来的粒子损失换成了一枚磁铁。", [
        { type: "MODIFY_ENERGY", amount: -4 },
        { type: "GAIN_ITEM", itemId: "magnet" },
      ]),
    ],
  },
  {
    id: "tut-empty-corridor",
    kind: "empty",
    category: "empty",
    title: "空置走廊",
    description: "走廊里没有补给也没有敌人，只有净化粒子仍会随着前进被消耗。",
    energyDelta: 0,
    choices: [
      direct("pass", "安静通过", "什么也不会发生", "你们穿过空走廊，只有脚步声提醒你们时间正在流逝。"),
      direct("check", "检查两侧门缝", "什么也不会发生", "你们检查了所有门缝，确认这里确实没有留下任何东西。"),
    ],
  },
  {
    id: "tut-medbay",
    kind: "heal",
    category: "survival",
    title: "简易医务室",
    description: "医务室还保留着一套低功率护理程序，足以让队伍恢复一部分生命。",
    energyDelta: 0,
    choices: [
      direct("care", "接受护理", "全队回复 18% 生命", "你让医务室逐一确认队员状态，护理程序稳定地运行起来。", [{ type: "HEAL_PARTY", percent: 0.18 }]),
      direct("quick", "快速包扎", "全队回复 8% 生命并获得 3 粒子", "你跳过完整扫描，让医务室把节省下来的功率回充净化核心。", [
        { type: "HEAL_PARTY", percent: 0.08 },
        { type: "MODIFY_ENERGY", amount: 3 },
      ]),
    ],
  },
  {
    id: "tut-hazard-duct",
    kind: "hazard",
    category: "hazard",
    title: "污染排气管",
    description: "排气管的污染读数忽高忽低，选择封锁还是抽空都可能改变队伍的状态。",
    energyDelta: 0,
    choices: [
      choice("filter", "启动过滤程序", "风险加权：可能净化粒子增加或减少", "你把排气管接入过滤程序，让系统自行判断污染浓度。", [
        chance("filter-gain", 65, "过滤芯吸收了可用能量，净化粒子 +5。", [{ type: "MODIFY_ENERGY", amount: 5 }]),
        chance("filter-loss", 35, "污染峰值冲穿滤芯，净化粒子 −8。", [{ type: "MODIFY_ENERGY", amount: -8 }]),
      ]),
      choice("bypass", "绕过污染段", "风险加权：可能受伤或获得少量粒子", "你让队伍贴着管壁快速通过污染段。", [
        chance("bypass-safe", 60, "你们安全穿过，回收了 2 粒子。", [{ type: "MODIFY_ENERGY", amount: 2 }]),
        chance("bypass-hit", 40, "污染雾从裂缝喷出，全队损失 10% 生命。", [{ type: "DAMAGE_PARTY_PERCENT", percent: 0.1 }]),
      ]),
    ],
  },
  {
    id: "tut-exp-console",
    kind: "loot",
    category: "growth",
    title: "经验控制台",
    description: "控制台保存着训练演算记录，可以把本轮经验暂存给所有存活角色。",
    energyDelta: 0,
    choices: [
      direct("study", "读取完整演算", "存活角色各获得经验 +16", "你让控制台播放完整训练记录，所有存活队员都能从中提取经验。", [{ type: "GAIN_EXP_PARTY", amount: 16 }]),
      direct("skim", "快速读取摘要", "存活角色各获得经验 +8，并获得 3 粒子", "你只读取关键摘要，把节省的处理时间转成净化粒子。", [
        { type: "GAIN_EXP_PARTY", amount: 8 },
        { type: "MODIFY_ENERGY", amount: 3 },
      ]),
    ],
  },
  {
    id: "tut-forge-bench",
    kind: "loot",
    category: "growth",
    title: "锻造工作台",
    description: "工作台可以免费生成一组选牌候选，完成后会进入待办奖励队列。",
    energyDelta: 0,
    choices: [
      direct("draw", "生成卡牌候选", "获得一次免费角色卡组锻造", "你启动选牌程序，新的卡牌候选被登记到待办奖励。", [{ type: "FORGE_DRAW" }]),
      direct("review", "复核卡组需求", "获得一次免费角色卡组锻造", "你让工作台重新读取队伍需求，同样生成了一次免费锻造机会。", [{ type: "FORGE_DRAW" }]),
    ],
  },
  {
    id: "tut-market",
    kind: "merchant",
    category: "economy",
    title: "训练市场",
    description: "市场终端提供消耗品与卡组服务，是否现在支付食品由队伍决定。",
    energyDelta: 0,
    services: ["consumable-shop", "card-draw-service"],
    choices: [
      direct("open", "查看市场", "打开服务目录", "你接入市场终端，货架与训练服务同时上线。", [{ type: "OPEN_SHOP" }]),
      direct("save", "保存食品", "暂不打开交易", "你关闭市场的外部接口，把食品留到远征后段。"),
    ],
  },
];

const TUTORIAL_BATTLES: EventPool["battle"] = [
  {
    id: "tut-battle-drone",
    kind: "battle",
    category: "battle",
    title: "训练战斗无人机",
    description: "训练无人机亮出低功率武装，接下来将进入一场难度 3 的节点战斗。",
    energyDelta: 0,
    choices: [
      direct("engage", "接受训练", "进入难度 3 战斗", "你确认战斗规则，训练无人机解除安全锁。", [{ type: "START_NODE_BATTLE", tier: "t3" }]),
      direct("challenge", "主动挑战", "进入难度 3 战斗", "你要求无人机提高反应速度，训练场立刻切换到难度 3。", [{ type: "START_NODE_BATTLE", tier: "t3" }]),
    ],
  },
  {
    id: "tut-round-guard",
    kind: "battle",
    category: "battle",
    title: "训练场守卫",
    description: "训练场守卫收到清场指令，准备检验队伍刚学会的路线决策。",
    energyDelta: 0,
    choices: [
      direct("engage", "迎战", "进入本轮推进战斗", "你们完成战斗准备，守卫的武装系统全部上线。"),
      direct("confirm", "确认战术", "进入本轮推进战斗", "你们快速复核站位，守卫随即发起攻击。"),
    ],
  },
  {
    id: "tut-round-sentinel",
    kind: "battle",
    category: "battle",
    title: "模拟哨兵",
    description: "模拟哨兵锁定队伍，训练场的下一道门只会在战斗结束后打开。",
    energyDelta: 0,
    choices: [
      direct("engage", "迎战", "进入本轮推进战斗", "你们踏入标记区域，模拟哨兵解除待机。"),
      direct("advance", "执行演练", "进入本轮推进战斗", "你们按照演练流程推进，模拟哨兵立刻封锁退路。"),
    ],
  },
];

export const TUTORIAL_EVENT_POOL: EventPool = {
  survival: TUTORIAL_EVENTS.filter((event) => event.category === "survival"),
  growth: TUTORIAL_EVENTS.filter((event) => event.category === "growth"),
  economy: TUTORIAL_EVENTS.filter((event) => event.category === "economy"),
  route: [],
  energy: TUTORIAL_EVENTS.filter((event) => event.category === "energy"),
  hazard: TUTORIAL_EVENTS.filter((event) => event.category === "hazard"),
  battle: TUTORIAL_BATTLES,
  endgame: [],
  empty: TUTORIAL_EVENTS.filter((event) => event.category === "empty"),
};
