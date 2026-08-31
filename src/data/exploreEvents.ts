import type { StatModifier } from "../engine/types";
import type { EventChoice, ExploreEffect, NodeEvent } from "../explore/types";

const outcome = (id: string, text: string, effects: ExploreEffect[]) => ({
  id,
  weight: 1,
  text,
  effects,
});

const choice = (
  id: string,
  label: string,
  desc: string,
  story: string,
  outcomes: EventChoice["outcomes"],
  energyDelta = 0,
  choiceCost?: EventChoice["cost"],
): EventChoice => ({ id, label, desc, story, energyDelta, cost: choiceCost, outcomes });

const item = (itemId: string, count = 1): ExploreEffect => ({ type: "GAIN_ITEM", itemId, count });
const dmg = (percent: number): ExploreEffect => ({ type: "DAMAGE_PARTY_PERCENT", percent });
const energy = (amount: number): ExploreEffect => ({ type: "MODIFY_ENERGY", amount });
const contaminate = (count = 1): ExploreEffect => ({ type: "CONTAMINATE_CARDS", count });
const burden = (count = 1): ExploreEffect => ({ type: "FORCE_ITEM", itemId: "heavy-burden", count });
const heal = (percent: number): ExploreEffect => ({ type: "HEAL_PARTY", percent });
const items = (...effects: ExploreEffect[]): ExploreEffect[] => effects;
const partyExp = (amount: number): ExploreEffect => ({ type: "GAIN_EXP_PARTY", amount });
const oneExp = (amount: number): ExploreEffect => ({ type: "GAIN_EXP_ONE", amount });
const equip = (count: number, slot?: "weapon" | "armor" | "trinket"): ExploreEffect => ({
  type: "EQUIP_OFFER",
  count,
  slot,
});
const cost = (itemId: string, count = 1) => ({ itemId, count });
const aura = (id: string, name: string, desc: string, mods: StatModifier) => ({
  type: "GRANT_AURA" as const,
  aura: { id, name, desc, mods },
});

// 风险事件的概率结果: w 直接写设计文档里的百分数, 每个策略内累加为 100。
const chance = (id: string, w: number, text: string, effects: ExploreEffect[]) => ({
  id,
  weight: w,
  text,
  effects,
});

const SURVIVAL: NodeEvent[] = [
  {
    id: "survival-night-shift-sleep-pods",
    kind: "heal",
    category: "survival",
    title: "夜班睡眠舱",
    description: "夜班员工的睡眠舱仍在低功率运行，舱门上的生命体征灯逐一亮起。",
    energyDelta: 0,
    choices: [
      choice("recover", "接入睡眠舱", "全队治疗 18%，获得医疗包或糖块", "你让队伍依次接入尚未断电的睡眠舱。", [
        outcome("recover", "睡眠舱释放出温和的恢复脉冲，全队回复当前生命 18%；体力极限没有恢复。", [{ type: "HEAL_PARTY", percent: 0.18 }]),
      ]),
      choice("supplies", "拆下维生模块", "获得医疗包 ×1 或糖块 ×2，队伍不接受现场治疗", "你不让任何人进入睡眠舱，而是把备用维生模块拆成可携带的治疗组件。", [
        outcome("supplies-a", "备用维生模块里还封着一只医疗包。你们拆下它带走，睡眠舱没有启动。", [item("medical-kit-c")]),
        outcome("supplies-b", "医疗组件已经失效，营养匣却仍然可以工作。你们带走糖块 ×2。", [item("sugar-cube-c", 2)]),
      ]),
      choice("milk", "提交整夜休眠申请", "需要 牛奶 ×1；全队治疗并修复体力极限，或获得医疗包与粒子", "你让控制台把队伍登记成连续加班员工，申请一整轮高规格休眠。", [
        outcome("milk-a", "牛奶的包装条码通过福利核验，所有睡眠舱进入深度修复模式。", [{ type: "HEAL_PARTY", percent: 0.35 }, { type: "HEAL_LIMIT_PARTY", percent: 0.08 }]),
        outcome("milk-b", "福利系统只剩半套深度程序，但备用电池仍被完整释放。", [{ type: "HEAL_PARTY", percent: 0.25 }, item("medical-kit-c"), { type: "MODIFY_ENERGY", amount: 4 }]),
      ], 0, cost("milk")),
    ],
  },
  {
    id: "survival-remote-trauma-station",
    kind: "heal",
    category: "survival",
    title: "远程创伤台",
    description: "创伤台的机械臂悬在半空，扫描光束仍在寻找可以处理的伤口。",
    energyDelta: 0,
    choices: [
      choice("single", "锁定最重伤员", "当前生命比例最低的角色治疗 42%，或治疗 30% 并处理 1 个怪癖", "你把当前生命比例最低的队员推入固定架，让全部凝胶处理深层创伤。", [
        outcome("single-a", "机械臂锁定了最严重的伤势，深层创伤被逐层封合。", [{ type: "HEAL_ONE", percent: 0.42 }]),
        outcome("single-b", "红色扫描区与神经异常重叠，机械臂顺便修正了异常反应。", [{ type: "HEAL_ONE", percent: 0.3 }, { type: "CURE_QUIRK", scope: "one" }]),
      ]),
      choice("party", "分配微型凝胶", "全队治疗 14%", "你取消单人锁定，把凝胶分成小剂量注入每个人的护甲接口。", [{ type: "HEAL_PARTY", percent: 0.14 }]),
      choice("hamburger", "用汉堡换取完整护理", "需要 汉堡 ×1；全队治疗 28% 并获得医疗包，或单体回满并治疗怪癖", "你把汉堡放进创伤台的奖励识别槽。", [
        outcome("hamburger-a", "创伤台将热量转成全队护理脉冲，备用医疗包也被解锁。", [{ type: "HEAL_PARTY", percent: 0.28 }, item("medical-kit-c")]),
        outcome("hamburger-b", "一名队员获得完整创伤修复，创伤台顺手清除了一个神经异常。", [{ type: "HEAL_ONE", percent: 0, full: true }, { type: "CURE_QUIRK", scope: "one" }]),
      ], 0, cost("hamburger")),
    ],
  },
  {
    id: "survival-cold-chain-ration-station",
    kind: "heal",
    category: "survival",
    title: "冷链配给站",
    description: "冷链配给站的保鲜灯在黑暗中持续闪烁，货架深处堆着未被污染的员工餐。",
    energyDelta: 0,
    choices: [
      choice("full-ration", "启动全员配给", "全队治疗 20%，额外消耗 3 粒子", "你让配给站将剩余营养液平均分配给所有人。", [{ type: "HEAL_PARTY", percent: 0.2 }], -3),
      choice("contaminated", "接受污染风险的高热量餐", "全队治疗 12%，每人污染 1 张卡", "你打开标记为高风险的冷柜，让每个人快速吃下配给。", [{ type: "HEAL_PARTY", percent: 0.12 }, { type: "CONTAMINATE_CARDS", count: 1, each: true }]),
      choice("pizza", "用披萨换取高级配给", "需要 披萨 ×1；全队治疗 30%，修复 10% 体力极限，或治疗 22% 并获得 2 个医疗包", "你用披萨覆盖配给站的高级员工餐识别器。", [
        outcome("pizza-a", "高级配给将恢复信号推到极限，队伍的治疗上限也被暂时修复。", [{ type: "HEAL_PARTY", percent: 0.3 }, { type: "HEAL_LIMIT_PARTY", percent: 0.1 }]),
        outcome("pizza-b", "配给站吐出两只医疗包，队伍获得稳定而克制的恢复。", [{ type: "HEAL_PARTY", percent: 0.22 }, item("medical-kit-c", 2)]),
      ], 0, cost("pizza")),
    ],
  },
  {
    id: "survival-airtight-recovery-capsule",
    kind: "heal",
    category: "survival",
    title: "气密恢复舱",
    description: "气密舱隔绝了楼层里的污染雾，透明舱壁上还留着上一批使用者的呼吸记录。",
    energyDelta: 0,
    choices: [
      choice("seal", "封闭舱门", "全队治疗 24%，额外消耗 4 粒子", "你关闭外部阀门，让恢复舱进入完整循环。", [{ type: "HEAL_PARTY", percent: 0.24 }], -4),
      choice("filter", "反向抽取过滤芯", "获得圣水并降低一名角色污染值，或获得医疗包与糖块", "你不让队伍进入恢复舱，而是拆下仍有活性的过滤芯，换取之后可以使用的净化物资。", [
        outcome("filter-a", "过滤芯里凝结的中和液仍然可用。你们封装成圣水，并将其中一部分用于一名队员。", [item("holy-water-c"), { type: "REDUCE_POLLUTION", scope: "one", amount: 20 }]),
        outcome("filter-b", "过滤芯已经干涸，只剩下备用医疗匣和营养匣。你们带走医疗包和糖块，没有启动恢复舱。", [item("medical-kit-c"), item("sugar-cube-c")]),
      ]),
      choice("cola", "用可乐换取循环供氧", "需要 可乐 ×1；全队治疗 18% 并获得 8 粒子，或获得循环供氧光环", "你用可乐启动恢复舱的旧员工协议。", [
        outcome("cola-a", "循环泵恢复运转，队伍得到一阵稳定的恢复脉冲和净化粒子。", [{ type: "HEAL_PARTY", percent: 0.18 }, { type: "MODIFY_ENERGY", amount: 8 }]),
        outcome("cola-b", "恢复舱将供氧协议写入队伍识别码，之后的战斗会持续受益。", [aura("recovery-oxygen", "循环供氧", "战斗中治疗效果提高。", { flat: { healBoost: 10 } })]),
      ], 0, cost("cola")),
    ],
  },
  {
    id: "survival-sterile-suture-robots",
    kind: "heal",
    category: "survival",
    title: "无菌缝合机器人",
    description: "无菌缝合机器人排成一列，细小的机械针在消毒灯下反射出冷光。",
    energyDelta: 0,
    choices: [
      choice("line", "排队接受缝合", "全队治疗 16%", "你让机器人按照受伤程度依次处理队伍。", [{ type: "HEAL_PARTY", percent: 0.16 }]),
      choice("deep", "指定一名角色做深层缝合", "指定角色治疗 32%，修复 15% 体力极限，或治疗 22% 并治疗怪癖", "你把最重的伤口交给中央缝合臂。", [
        outcome("deep-a", "中央缝合臂完成深层修复，连体力极限的裂口也被一并补上。", [{ type: "HEAL_ONE", percent: 0.32 }, { type: "HEAL_LIMIT_ONE", percent: 0.15 }]),
        outcome("deep-b", "缝合臂避开了旧伤，同时清理了一个长期影响行动的怪癖。", [{ type: "HEAL_ONE", percent: 0.22 }, { type: "CURE_QUIRK", scope: "one" }]),
      ]),
      choice("fried-chicken", "用炸鸡启动极限护理", "需要 炸鸡 ×1；单体体力极限恢复至基础最大生命并治疗 20%，或全队修复 12% 极限并获得医疗包", "你将炸鸡放入机器人中央的高热量医疗槽。", [
        outcome("fried-chicken-a", "中央机器人完成一次完整的极限修复，随后为目标补上额外生命。", [{ type: "HEAL_LIMIT_ONE", full: true }, { type: "HEAL_ONE", percent: 0.2 }]),
        outcome("fried-chicken-b", "所有机器人同步工作，队伍的治疗上限被整体抬高，医疗包也被送到出口。", [{ type: "HEAL_LIMIT_PARTY", percent: 0.12 }, item("medical-kit-c")]),
      ], 0, cost("fried-chicken")),
    ],
  },
  {
    id: "survival-card-pollution-wash",
    kind: "heal",
    category: "survival",
    title: "卡牌污染洗消站",
    description: "洗消站的卡槽仍在等待投递，紫黑色的污染纹路在透明传送带上缓慢移动。",
    energyDelta: 0,
    choices: [
      choice("wash", "洗消一张卡", "指定角色净化 1 张污染卡并治疗 10%，或净化并降低污染值 18", "你把一名队员的污染卡组接入洗消站。", [
        outcome("wash-a", "洗消液剥离污染后，卡组持有者也获得了一阵恢复。", [{ type: "PURIFY_CARDS", scope: "one", count: 1 }, { type: "HEAL_ONE", percent: 0.1 }]),
        outcome("wash-b", "洗消站将剥离出的污染压缩回收，角色的污染值随之下降。", [{ type: "PURIFY_CARDS", scope: "one", count: 1 }, { type: "REDUCE_POLLUTION", scope: "one", amount: 18 }]),
      ]),
      choice("cycle", "启动全队循环洗消", "全队污染值降低 10，额外消耗 2 粒子", "你把洗消站切换到循环模式，让所有队员同时接入。", [{ type: "REDUCE_POLLUTION", scope: "party", amount: 10 }], -2),
      choice("cola", "用两罐可乐换取深层洗消", "需要 可乐 ×2；每人净化 1 张并降低污染值 20，或单体净化 2 张并治疗怪癖", "你把两罐可乐放进洗消站的旧式能源槽。", [
        outcome("cola-a", "洗消站的全线喷头同时启动，每名队员的污染卡和污染值都得到处理。", [{ type: "PURIFY_CARDS", scope: "party", count: 1 }, { type: "REDUCE_POLLUTION", scope: "party", amount: 20 }]),
        outcome("cola-b", "所有资源集中到一名队员的卡组，深层洗消同时清理了一项怪癖。", [{ type: "PURIFY_CARDS", scope: "one", count: 2 }, { type: "CURE_QUIRK", scope: "one" }]),
      ], 0, cost("cola", 2)),
    ],
  },
  {
    id: "survival-neural-feedback-lounge",
    kind: "heal",
    category: "survival",
    title: "神经反馈休息室",
    description: "休息室的软椅围着一圈神经反馈头环，墙上的灯光仍在播放让人平静的呼吸节奏。",
    energyDelta: 0,
    choices: [
      choice("single", "接受单人反馈", "指定角色治疗 1 个怪癖并降低污染值 15，或全队污染值降低 8 并治疗 8%", "你让一名队员戴上反馈头环，逐步校准神经信号。", [
        outcome("single-a", "反馈头环完成单人校准，清理了一项长期影响行动的怪癖。", [{ type: "CURE_QUIRK", scope: "one" }, { type: "REDUCE_POLLUTION", scope: "one", amount: 15 }]),
        outcome("single-b", "你把反馈频率扩散到休息室的公共线路，所有队员的污染与疲劳都得到缓解。", [{ type: "REDUCE_POLLUTION", scope: "party", amount: 8 }, { type: "HEAL_PARTY", percent: 0.08 }]),
      ]),
      choice("supplies", "关闭反馈椅，带走安抚物资", "获得圣水，或获得糖块 ×2 与医疗包", "你不把队伍交给旧系统，而是拆下椅背上的安抚组件，作为之后使用的治疗物资。", [
        outcome("supplies-a", "安抚组件的储液囊仍然完整，你们将它封装为圣水，没有启动反馈训练。", [item("holy-water-c")]),
        outcome("supplies-b", "储液囊已经失效，但营养匣和备用治疗匣还能拆下。", [item("sugar-cube-c", 2), item("medical-kit-c")]),
      ]),
      choice("fried-chicken", "用炸鸡开启深度反馈", "需要 炸鸡 ×1；全队各治疗 1 个怪癖并降低污染值 25，或获得平静呼吸光环", "你用高热量食品让休息室进入深度反馈模式。", [
        outcome("fried-chicken-a", "所有头环同时进入深层校准，队伍的怪癖和污染值都得到处理。", [{ type: "CURE_QUIRK", scope: "party" }, { type: "REDUCE_POLLUTION", scope: "party", amount: 25 }]),
        outcome("fried-chicken-b", "休息室将平静呼吸写入队伍协议，之后的战斗节奏变得更加稳定。", [aura("calm-breathing", "平静呼吸", "战斗中提高治疗、护盾与格挡，并获得少量防御。", { flat: { healBoost: 12, shieldBoost: 12, blockRate: 8, defense: 3 } })]),
      ], 0, cost("fried-chicken")),
    ],
  },
  {
    id: "survival-protective-gear-decontamination",
    kind: "heal",
    category: "survival",
    title: "防护装备消毒仓",
    description: "消毒仓的悬挂轨道上还留着一批防护装备，喷淋臂在空仓之间来回摆动。",
    energyDelta: 0,
    choices: [
      choice("decontaminate", "启动全队消毒", "全队治疗 12%，污染值降低 8", "你让消毒仓对全队的装备和生命读数做一次同步处理。", [{ type: "HEAL_PARTY", percent: 0.12 }, { type: "REDUCE_POLLUTION", scope: "party", amount: 8 }]),
      choice("supplies", "拆取维护架上的急救匣", "获得医疗包 ×2，或获得医疗包与圣水", "你拆下维护架上的备用组件，把它们留作之后的治疗手段。", [
        outcome("supplies-a", "两只医疗包被送到出口，消毒仓没有改变队伍状态。", [item("medical-kit-c", 2)]),
        outcome("supplies-b", "医疗包和圣水一起被识别，净化液填满了备用槽。", [item("medical-kit-c"), item("holy-water-c")]),
      ]),
    ],
  },
];

const GROWTH: NodeEvent[] = [
  {
    id: "growth-breaker-maze",
    kind: "loot",
    category: "growth",
    title: "断路器迷宫",
    description: "配电间的墙面被拆成了数十个大小不一的断路柜。每个柜门都标着不同部门的名称，只有一条微弱的电弧还在所有柜体之间来回跳动。",
    energyDelta: 0,
    hiddenRest: { foodItemId: "milk", npcId: "npc-night-canteen" },
    choices: [
      choice("blueprint", "按照旧图纸逐层拆解", "取出断路陶芯与备用电池", "你先确认断电顺序，再按照图纸逐层拆下绝缘部件。", [
        outcome("blueprint-a", "最外层的柜体已经烧毁，但深处的陶芯仍然完整，你还在备用槽里找到了电池。", items(item("breaker-ceramic-core"), item("standard-battery"))),
        outcome("blueprint-b", "两个备用回路都没有被高压击穿，你顺利取出了两枚完整陶芯。", [item("breaker-ceramic-core", 2)]),
      ]),
      choice("current", "让备用电流跑完一轮", "额外消耗 3 粒子，训练全队或一名角色", "你重新接通备用回路，让系统自行演算最安全的电力分配方式。", [
        outcome("current-a", "电流演算变成了一次全队协同训练，终端还从维修槽里推出一枚齿轮。", items(partyExp(10), item("standard-gear"))),
        outcome("current-b", "你把全部演算数据集中给一名队员，他从旧电网的运行逻辑中获得了更多经验。", items(oneExp(28), item("standard-battery"))),
      ], 3),
      choice("training", "接管员工训练回路", "获得一次免费卡组锻造或删卡机会", "你绕开配电系统，把自己的身份写入一条仍在运行的员工训练线路。", [
        outcome("training-a", "配电系统误把你们识别成待培训员工，三张角色专属卡牌候选被投影出来。", [{ type: "FORGE_DRAW" }]),
        outcome("training-b", "系统将一张卡牌判断为过时工序，你可以把它从角色卡组中永久删除。", [{ type: "FORGE_REMOVE" }]),
      ]),
    ],
  },
  {
    id: "growth-cooling-diversion-valve",
    kind: "loot",
    category: "growth",
    title: "冷却液分流阀",
    description: "冷却管线从墙壁一直延伸到天花板，管壁上结着细小的蓝白色晶体。两只分流阀分别连接着稳定回路和高压回流回路。",
    energyDelta: 2,
    choices: [
      choice("scrape", "关闭窄阀，慢慢刮取微晶", "额外消耗 2 粒子，采集冷却微晶", "你把冷却液流量压到最低，从管壁上刮取已经稳定的结晶层。", [
        outcome("scrape-a", "第一段管线上的结晶保存得很好，旁边的检修槽还留着一枚逻辑魔方。", items(item("cooling-microcrystal"), item("logic-cube"))),
        outcome("scrape-b", "你找到一段长期无人触碰的旧管道，一次取下了两块完整微晶。", [item("cooling-microcrystal", 2)]),
      ], 2),
      choice("log", "打开高压回流，读取热工日志", "全队获得经验或公开 2 件装备候选", "你不直接采集材料，而是让高压回流带动终端重新启动，读取冷却系统过去的运行记录。", [
        outcome("log-a", "热工日志里包含完整的设备协同记录，全队都从中学到了新的维护方法。", [partyExp(12), item("cooling-microcrystal")]),
        outcome("log-b", "超算机房把一批遗留装备登记在冷却系统名下，两件装备的完整信息同时显示出来。", [equip(2)]),
      ]),
      choice("bypass", "切换到备用维护回路", "获得一枚微晶或一次免费羁绊重铸", "你让备用回路接管冷却工作，打开一条从未登记的维护路径。", [
        outcome("bypass-a", "备用管线的结晶层没有被污染，你完整取出了一枚冷却微晶。", [item("cooling-microcrystal")]),
        outcome("bypass-b", "维护终端允许你重新生成一件装备的随机羁绊。", [{ type: "REFORGE_BOND" }]),
      ]),
    ],
  },
  {
    id: "growth-misprint-card-printer",
    kind: "loot",
    category: "growth",
    title: "错版卡牌印刷室",
    description: "印刷室里堆满了没有裁切完成的卡牌。它们的图案互相重叠，中央印刷台仍在询问：重新印刷、删除旧版，还是保留原样？",
    energyDelta: 0,
    choices: [
      choice("deck", "重新接入一名角色的卡组", "获得一次免费卡组锻造或删卡机会", "你选择一名角色，把他的卡组接入印刷台，让系统生成新的专属训练结果。", [
        outcome("deck-a", "印刷台校准了角色身份，三张专属卡牌从不同的错版纸张中逐渐显现。", [{ type: "FORGE_DRAW" }]),
        outcome("deck-b", "系统发现一张重复的旧工序卡，你可以趁印刷台清理时将它永久删除。", [{ type: "FORGE_REMOVE" }]),
      ]),
      choice("archive", "把错版纸张改造成训练档案", "全队或一名角色获得经验并取得材料", "你不直接操作卡组，而是把错版纸张中的可读信息重新排列。", [
        outcome("archive-a", "大量错版内容被重新拼成一份团队训练档案，印刷台还吐出一管导电印墨。", items(partyExp(9), item("conductive-ink"))),
        outcome("archive-b", "你将最完整的个人记录交给一名队员，剩余纸张中找到了一枚逻辑魔方。", items(oneExp(25), item("logic-cube"))),
      ]),
      choice("printer", "拆下印刷头", "拆取导电印墨或封装配件", "你关闭印刷程序，打开机器外壳，寻找仍有使用价值的部件。", [
        outcome("printer-a", "两个备用墨盒还没有完全固化，你将其中的功能性墨料全部收集起来。", [item("conductive-ink", 2)]),
        outcome("printer-b", "印刷头旁边的维护盒里保存着封装凝胶和一枚备用齿轮。", items(item("packaging-gel"), item("standard-gear"))),
      ]),
    ],
  },
  {
    id: "growth-cargo-elevator-routing",
    kind: "loot",
    category: "growth",
    title: "货运电梯三联单",
    description: "货运电梯停在中间楼层，控制台上显示三个仍然有效的货运目的地。每个目的地都对应一套不同的仓储记录。",
    energyDelta: 0,
    hiddenRest: { foodItemId: "bread", npcId: "npc-cargo-clerk" },
    choices: [
      choice("supply", "前往配给仓", "获取食品和医疗补给", "你让电梯优先前往食品和医疗物资所在的仓层。", [
        outcome("supply-a", "配给仓的大部分货架已经空了，但两袋面包和一只医疗包还被封存在冷柜中。", items(item("bread", 2), item("medical-kit-c"))),
        outcome("supply-b", "员工饮料仓的冷藏功能仍在运转，你带走了几份没有失效的补给。", items(item("milk", 2), item("fruit-juice-c"))),
      ]),
      choice("equipment", "前往装备仓", "公开 2 或 3 件装备候选", "你把电梯权限切换到安保装备仓，等待货运系统重新盘点库存。", [
        outcome("equipment-a", "三只装备货箱被送到电梯口，装备属性、槽位和羁绊信息全部公开。", [equip(3)]),
        outcome("equipment-b", "货运系统只追回两只货箱，但附带送出了一枚调度齿轮。", [equip(2), item("standard-gear")]),
      ]),
      choice("training", "前往培训仓", "全队或一名角色获得培训经验", "你将电梯设定为员工培训物资目的地。", [
        outcome("training-a", "培训仓的墙面仍保存着全员协作课程，全队一起完成了旧时代的训练。", [partyExp(11)]),
        outcome("training-b", "你把整套培训记录交给一名队员，他独自完成了高密度的岗位学习。", [oneExp(32)]),
      ]),
    ],
  },
  {
    id: "growth-performance-audit",
    kind: "loot",
    category: "growth",
    title: "绩效审计室",
    description: "绩效终端还在结算几百年前的季度目标。它把队伍识别为一支迟到太久的项目组，并提供了三种不同的结算方式。",
    energyDelta: 0,
    choices: [
      choice("team", "提交团队绩效", "全队获得经验或取得额外训练反馈", "你把所有人的探索记录合并成一份团队报告。", [
        outcome("team-a", "审计终端认可了团队完成度，并从奖励槽中送出一块电池。", [partyExp(10), item("standard-battery")]),
        outcome("team-b", "系统恢复了一份完整的季度报告，全队获得了额外的训练反馈。", [partyExp(15)]),
      ]),
      choice("key", "指定关键员工", "集中培养一名角色", "你选择一名角色，把所有绩效数据集中归入他的个人档案。", [
        outcome("key-a", "该角色被终端标记为关键员工，并得到了一份个人成长档案和导电印墨。", [oneExp(27), item("conductive-ink")]),
        outcome("key-b", "终端恢复了该角色最完整的岗位记录，密集的个人训练让他获得明显成长。", [oneExp(35)]),
      ]),
      choice("assets", "撕毁绩效报告，改查资产", "寻找部门资产或机械部件", "你放弃经验结算，拆开审计终端，寻找被隐藏的部门资产。", [
        outcome("assets-a", "终端底部留下一枚部门物资魔方。", [item("logic-cube")]),
        outcome("assets-b", "资产柜里没有完整装备，但两种机械部件仍然可以带走。", items(item("mag-rail-lining"), item("standard-gear"))),
      ]),
    ],
  },
  {
    id: "growth-optical-security-maze",
    kind: "loot",
    category: "growth",
    title: "光导薄膜安检迷宫",
    description: "大厅里的智能玻璃仍在改变反射角度。不同的光路会把队伍引向不同的安检台，有的通往装备柜，有的通往维护材料库。",
    energyDelta: 0,
    hiddenRest: { foodItemId: "cola", npcId: "npc-vip-reception" },
    choices: [
      choice("green", "沿绿色反射线前进", "采集材料或公开装备候选", "你跟随玻璃上最稳定的绿色光线，不触碰任何主动扫描面。", [
        outcome("green-a", "绿色光路最终通向维护槽，你取下了一段薄膜和一份未固化凝胶。", items(item("light-guide-film"), item("packaging-gel"))),
        outcome("green-b", "光线把你们引到隐藏装备柜，三件装备在安检屏上完整公开。", [equip(3)]),
      ]),
      choice("shutdown", "强行关闭全部玻璃扫描", "额外消耗 2 粒子，获得材料或重铸机会", "你将便携电源接入安检总线，短暂关闭大厅的识别系统。", [
        outcome("shutdown-a", "扫描系统停止后，整排维护槽都可以安全打开，你取出了两段完整薄膜。", [item("light-guide-film", 2)]),
        outcome("shutdown-b", "关闭系统同时解锁了装备校准端口，你重新生成了一件装备的随机羁绊，并取走了维护墨料。", [{ type: "REFORGE_BOND" }, item("conductive-ink")]),
      ], 2),
      choice("vip", "把身份伪装成高级访客", "获得删卡机会或公开 2 件装备候选", "你让终端读取旧时代的访客协议，尝试获得更高权限。", [
        outcome("vip-a", "高级访客协议允许你把一张卡牌登记为无效项目并永久移除。", [{ type: "FORGE_REMOVE" }]),
        outcome("vip-b", "访客协议打开了小型装备柜，两件装备的全部信息呈现在玻璃上。", [equip(2)]),
      ]),
    ],
  },
  {
    id: "growth-module-workbench",
    kind: "loot",
    category: "growth",
    title: "模组拆装台",
    description: "拆装台上没有新模组，只有一组空的接口和一台仍然运行的词条校准器。它无法制造长期属性，却可以帮助队伍处理现有装备与卡组。",
    energyDelta: 0,
    choices: [
      choice("calibrate", "校准一件现有装备", "免费重铸输出或防护向羁绊", "你把一件装备固定在拆装台上，让机器重新生成它的随机羁绊。", [
        outcome("calibrate-a", "校准器抹去旧词条，新的羁绊沿着攻击和爆发方向稳定下来。", [{ type: "REFORGE_BOND", bias: "offense" }]),
        outcome("calibrate-b", "校准器重新排列接口结构，新的羁绊更偏向防御和生存。", [{ type: "REFORGE_BOND", bias: "defense" }]),
      ]),
      choice("interface", "拆取空接口", "取得工业材料", "你不处理现有装备，而是把没有安装模组的接口拆下来。", [
        outcome("interface-a", "空接口里还残留着导电墨料，旁边的逻辑槽中卡着一枚魔方。", items(item("conductive-ink"), item("logic-cube"))),
        outcome("interface-b", "维护盒中保存着封装凝胶和两枚备用齿轮。", items(item("packaging-gel"), item("standard-gear", 2))),
        outcome("interface-c", "接口底座下压着一只没拆封的通用模组箱，封条还是完好的。", [item("module-crate-t1")]),
      ]),
      choice("test", "运行跨角色卡组测试", "获得免费卡组锻造或删卡机会", "你选择一名角色作为测试者，让系统检查他的卡组是否适合承载其他关键词模组。", [
        outcome("test-a", "测试台将角色卡组重新排序，三张可以承担新机制的专属卡牌候选浮现出来。", [{ type: "FORGE_DRAW" }]),
        outcome("test-b", "测试台标记出一张无法参与连锁的卡牌，你可以将它从卡组中删除。", [{ type: "FORGE_REMOVE" }]),
      ]),
    ],
  },
  {
    id: "growth-robotic-arm-dispatch",
    kind: "loot",
    category: "growth",
    title: "搬运机械臂调度",
    description: "十几条机械臂正在搬运空箱子。控制台要求队伍选择一种调度方式：亲自分工、交给系统，或者让所有机械臂同时执行最大负荷任务。",
    energyDelta: 0,
    choices: [
      choice("manual", "亲自给机械臂分工", "取得磁轨衬层、齿轮或检查隐藏货箱", "你逐条设定机械臂的目标，避免它们互相抢夺运输路线。", [
        outcome("manual-a", "机械臂从停机轨道上拆下完整衬层，并将一枚齿轮送到交付台。", items(item("mag-rail-lining"), item("standard-gear"))),
        outcome("manual-b", "精确调度让一只隐藏货箱被找了出来，里面保存着一枚可用电池。", [item("standard-battery")]),
      ]),
      choice("auto", "让系统自动安排任务", "公开装备候选或获取消耗品", "你关闭手动控制，让中央调度系统自行判断队伍最需要什么。", [
        outcome("auto-a", "系统把装备货箱列为最高优先级，三件装备被送到队伍面前。", [equip(3)]),
        outcome("auto-b", "自动调度判断队伍需要补给，两件仍可使用的消耗品从运输线落下。", items(item("medical-kit-c"), item("fruit-juice-c"))),
      ]),
      choice("maximum", "启动全部机械臂的极限搬运", "额外消耗 4 粒子，获得团队或个人训练", "你让所有机械臂同时运行，把仓库最深处的物资强行拖出来。", [
        outcome("maximum-a", "机械臂的同步运动形成了一次意外的团队训练，全队都学会了新的配合方式。", [partyExp(13)]),
        outcome("maximum-b", "你让一名队员观察完整调度过程，他从机械臂的动作中获得了个人训练收益。", [oneExp(30), item("standard-battery")]),
      ], 4),
    ],
  },
  {
    id: "growth-sealed-greenhouse-rack",
    kind: "loot",
    category: "growth",
    title: "封闭温室培育架",
    description: "玻璃温室里的植物早已失去人工照料，但自动培育架仍然按照旧计划循环供水。几排植物根系之间，已经长出可以用于设备加工的特殊结晶。",
    energyDelta: 0,
    hiddenRest: { foodItemId: "hamburger", npcId: "npc-greenhouse-keeper" },
    choices: [
      choice("roots", "剪取成熟根系", "采集冷却微晶和封装凝胶", "你只剪下已经完成生长周期的部分，保留培育架继续运转。", [
        outcome("roots-a", "成熟根系表面附着着冷却结晶，根部还分泌出少量工业封装凝胶。", items(item("cooling-microcrystal"), item("packaging-gel"))),
        outcome("roots-b", "你找到一排无人采收的低温根系，一次取得两块微晶。", [item("cooling-microcrystal", 2)]),
      ]),
      choice("nutrition", "重启植物营养程序", "额外消耗 2 粒子，取得团队或个人训练成果", "你把营养系统重新接通，让植物架把残余能量转化为可读取的生长记录。", [
        outcome("nutrition-a", "植物生长记录变成了一堂全队观察课，营养仓还送出一颗糖块。", [partyExp(10), item("sugar-cube-c")]),
        outcome("nutrition-b", "你让一名队员独自整理培育档案，净化用圣水从营养柜中被一起取出。", [oneExp(26), item("holy-water-c")]),
      ], 2),
      choice("pantry", "保留培育架，搬走备用食品", "获取食品补给", "你不打断植物的生长，而是打开旁边的员工营养柜。", [
        outcome("pantry-a", "营养柜仍在低温运行，几份员工食品没有完全失效。", items(item("milk", 2), item("bread"))),
        outcome("pantry-b", "培育区的高级员工餐被藏在备用柜里，你还找到了一颗单独包装的糖块。", items(item("hamburger"), item("sugar-cube-c"))),
      ]),
    ],
  },
  {
    id: "growth-tactical-replay-room",
    kind: "loot",
    category: "growth",
    title: "战术回放厅",
    description: "培训厅的投影仍在播放旧员工的战术演示。画面中的敌人已经消失，只剩下三个可操作的训练模式。",
    energyDelta: 0,
    choices: [
      choice("watch", "观看完整回放", "取得团队训练或免费卡组锻造", "你不进行操作，只观察旧时代队伍如何处理不同的战斗局面。", [
        outcome("watch-a", "完整回放展示了队伍协作、目标切换和资源分配，全队都获得了训练经验。", [partyExp(12)]),
        outcome("watch-b", "回放结束后，系统根据观察结果生成了三张适合角色专属卡池的候选卡牌。", [{ type: "FORGE_DRAW" }]),
      ]),
      choice("replay", "亲自重演一段战术", "集中培养一名角色并可能取得额外训练反馈", "你选择一名角色进入投影场景，让他独自完成一段高压训练。", [
        outcome("replay-a", "该角色完成了完整的战术回放，所有训练反馈都被写入他的个人档案。", [oneExp(34)]),
        outcome("replay-b", "回放中途出现错误，但角色仍完成了训练并获得额外反馈。", [oneExp(22)]),
      ]),
      choice("projector", "拆掉战术投影仪", "取得光导材料或电池", "你放弃训练，直接打开投影仪的核心外壳。", [
        outcome("projector-a", "投影仪的光学层中保存着一段完整薄膜，逻辑模块里还嵌着一枚魔方。", items(item("light-guide-film"), item("logic-cube"))),
        outcome("projector-b", "训练厅的备用电池组没有被使用，你将两块电池从投影仪底座中拆出。", [item("standard-battery", 2)]),
      ]),
    ],
  },
  {
    id: "growth-equipment-showroom",
    kind: "loot",
    category: "growth",
    title: "装备展示与试穿厅",
    description: "展示厅里的装备没有被锁在黑箱中，而是以全息投影的方式公开显示。系统允许队伍查看武器，或者直接校准现有装备。",
    energyDelta: 0,
    hiddenRest: { foodItemId: "fried-chicken", npcId: "npc-mobile-mechanic" },
    choices: [
      choice("weapon", "查看武器展柜", "公开 2 或 3 件武器候选", "你要求系统只显示适合武器槽的装备。", [
        outcome("weapon-a", "三件武器的攻击、命中和暴击属性被完整投影，你从中选走一件。", [equip(3, "weapon")]),
        outcome("weapon-b", "展厅只找到两件武器，但维护台同时推出了一枚齿轮。", [equip(2, "weapon"), item("standard-gear")]),
      ]),
      choice("calibration", "启动羁绊校准台", "重铸装备并取得维护材料", "你把一件现有装备放入校准台，让它重新生成随机羁绊。", [
        outcome("calibration-a", "校准台生成了新的随机羁绊，剩余墨料被装入一支可携带容器。", [{ type: "REFORGE_BOND" }, item("conductive-ink")]),
        outcome("calibration-b", "装备完成重新校准，封装柜将一管工业凝胶作为维护补偿送出。", [{ type: "REFORGE_BOND" }, item("packaging-gel")]),
      ]),
    ],
  },
  {
    id: "growth-precision-scrap-compressor",
    kind: "loot",
    category: "growth",
    title: "废料精密压缩塔",
    description: "压缩塔把废旧部件按照材料纯度分成不同管道。你可以选择精细分拣、快速压缩，或者让压缩塔寻找被废料掩盖的完整物品。",
    energyDelta: 0,
    choices: [
      choice("sort", "精细分拣", "取得换金物和机械部件", "你逐个检查传送带上的废料，只保留能完整拆解的部分。", [
        outcome("sort-a", "大多数零件已经损坏，但两只铜质小熊和一枚齿轮还可以带回据点。", items(item("bronze-bear", 2), item("standard-gear"))),
        outcome("sort-b", "你从一堆普通碎片里找出了银质小熊和一块没有漏液的电池。", items(item("silver-bear"), item("standard-battery"))),
      ]),
      choice("compress", "启动高压压缩", "额外消耗 3 粒子，取得高品质换金物", "你让压缩塔快速运行，把整条传送带上的部件一次性处理。", [
        outcome("compress-a", "高压压缩把大量普通碎片凝成了一只金质小熊。", [item("golden-bear")]),
        outcome("compress-b", "压缩塔的合金分离功能仍然有效，两只银质小熊被推出。", [item("silver-bear", 2)]),
      ], 3),
      choice("crate", "搜索废料下方的完整货箱", "取得消耗品或检查废弃设备", "你关闭压缩带，派人打开最底部的货箱层。", [
        outcome("crate-a", "一个旧急救箱被压在废料下方，里面的医疗包和糖块仍然封装完好。", items(item("medical-kit-c"), item("sugar-cube-c"))),
        outcome("crate-b", "货箱底部藏着企业员工饰品，两件物品的属性和羁绊信息全部公开。", [equip(2, "trinket")]),
      ]),
    ],
  },
  {
    id: "growth-backup-server-array",
    kind: "loot",
    category: "growth",
    title: "备份服务器阵列",
    description: "服务器阵列仍在等待一次完整备份。它提供三种备份方式：团队镜像、个人镜像，以及拆除服务器后直接带走硬件。",
    energyDelta: 0,
    choices: [
      choice("team", "建立全队镜像", "全队获得经验并可能取得魔方", "你把所有人的行动记录写入同一份团队备份。", [
        outcome("team-a", "服务器把队伍的协作过程完整保存下来，并留下了一枚逻辑魔方。", [partyExp(11), item("logic-cube")]),
        outcome("team-b", "阵列恢复了一份完整的团队战术档案，全队得到超出预期的训练反馈。", [partyExp(16)]),
      ]),
      choice("personal", "建立个人镜像", "集中培养一名角色或免费删卡", "你选择一名角色，让服务器只保存他的完整成长记录。", [
        outcome("personal-a", "服务器完整重建了该角色的行动档案，他获得了一次高密度个人训练。", [oneExp(36)]),
        outcome("personal-b", "镜像过程中发现了一张低效卡牌，系统允许你将它从个人卡组中移除。", [oneExp(24), { type: "FORGE_REMOVE" }]),
      ]),
      choice("hardware", "拆掉备份阵列", "取得冷却材料、电池或导电材料", "你停止备份，直接拆下服务器中的可用硬件。", [
        outcome("hardware-a", "服务器散热层里保存着冷却微晶，能源仓中还留有一块电池。", items(item("cooling-microcrystal"), item("standard-battery"))),
        outcome("hardware-b", "数据线路上的导电墨料被完整取出。", [item("conductive-ink")]),
      ]),
    ],
  },
  {
    id: "growth-night-shift-pantry",
    kind: "loot",
    category: "growth",
    title: "夜班休息室储物墙",
    description: "休息室里的自动灯按照夜班时间表逐盏亮起。储物墙上仍然保留着员工个人配给，旁边的公告板则记录着旧时代的训练任务。",
    energyDelta: 0,
    choices: [
      choice("lockers", "开启个人储物柜", "取得食品补给", "你逐个打开储物柜，只取走仍然密封的食物和补给。", [
        outcome("lockers-a", "三个储物柜的冷藏功能还在工作，里面的基础食品都没有完全失效。", items(item("milk", 2), item("bread"))),
        outcome("lockers-b", "一个高级员工柜里保存着可乐和两颗独立包装的糖块。", items(item("cola"), item("sugar-cube-c", 2))),
      ]),
      choice("training", "阅读夜班训练公告", "全队或一名角色获得经验并取得食品", "你不拿走食品，而是逐张阅读墙上的岗位训练公告。", [
        outcome("training-a", "公告上的协作守则让全队获得了训练经验，最后一张公告背后还夹着一块面包。", [partyExp(9), item("bread")]),
        outcome("training-b", "你让一名队员单独整理岗位公告，他从复杂的流程中学到了更多东西。", [oneExp(29), item("logic-cube")]),
      ]),
      choice("vending", "拆走休息室的饮料机核心", "取得果汁、电池或工业材料", "你放弃搜寻储物柜，打开饮料机后方的能源核心。", [
        outcome("vending-a", "饮料机的冷藏仓还保存着一瓶果汁，能源核心中则留有一块电池。", items(item("fruit-juice-c"), item("standard-battery"))),
        outcome("vending-b", "饮料机的维护接口中没有食品，但两种工业材料仍然可以被完整拆下。", items(item("conductive-ink"), item("packaging-gel"))),
      ]),
    ],
  },
  {
    id: "growth-board-meeting-reenactment",
    kind: "loot",
    category: "growth",
    title: "董事会会议重演厅",
    description: "长桌尽头的投影仍在重演一场没有结束的董事会会议。系统把队伍识别为迟到数百年的项目负责人，并要求选择一种方式参与会议。",
    energyDelta: 0,
    hiddenRest: { foodItemId: "pizza", npcId: "npc-board-projection" },
    choices: [
      choice("strategy", "进入战略席位", "公开装备候选或获得免费重铸", "你坐到会议桌前，让系统把队伍登记为战略项目组。", [
        outcome("strategy-a", "董事会投影批准了战略资产调拨，三件装备的全部资料被公开。", [equip(3)]),
        outcome("strategy-b", "投影没有批准新装备，却允许你重新生成一件装备的随机羁绊。", [{ type: "REFORGE_BOND" }]),
      ]),
      choice("report", "提交季度成长报告", "全队或一名角色获得成长评估", "你选择全队或一名角色作为报告对象，把行动经历交给董事会系统。", [
        outcome("report-a", "董事会认可了团队完成度，全队获得了一次正式成长评估。", [partyExp(14)]),
        outcome("report-b", "你将报告的核心功劳归于一名队员，他获得了整份个人成长评估。", [oneExp(38)]),
      ]),
      choice("agenda", "撕毁会议议程", "获得免费卡组锻造或删卡机会", "你拒绝继续配合投影，直接拆掉会议桌上的资料终端。", [
        outcome("agenda-a", "议程终端把角色识别为待修正项目，意外开放了一次免费专属锻造。", [{ type: "FORGE_DRAW" }]),
        outcome("agenda-b", "董事会系统将一张卡牌列为无效资产，你可以把它从角色卡组中删除。", [{ type: "FORGE_REMOVE" }]),
      ]),
    ],
  },
];

// ---------------------------------------------------------------------------
// 风险事件 —— 见 design/关卡事件设计/废弃楼层/废弃楼层-风险事件.md
// 10 个 negative(纯负面) + 8 个 highRisk(带正面收益)。**位置全图完全随机**:
// 不写 depth ⇒ 可出现在任意推进段(含第 1 段); 数量下限(每图至少 2 个)
// 由探索引擎统一处理(见 EXPLORE_RULES.eventPool.hazard)。
// ---------------------------------------------------------------------------
const HAZARD: NodeEvent[] = [
  {
    // 失效的生物门禁
    id: "biometric-gate-failure",
    kind: "hazard",
    category: "hazard",
    risk: "negative",
    title: "西侧生物门厅",
    description:
      "你踏进门厅时，穹顶的虹膜扫描器突然亮起。墙上的员工名册还停留在三百年前，系统从扬声器里念出一个已经死去的员工姓名，并把队伍标记为“待确认的内部人员”。厚重的生物门在开启与闭合之间来回抖动，门缝里透出一线冷白的消毒光。",
    energyDelta: 0,
    choices: [
      choice("wait", "等待身份审核", "可能无额外损失，也可能被拖走 6 粒子", "你让队伍站进扫描光束，任由旧系统逐一比对脸部、步态和心跳。", [
        chance("wait-a", 70, "虹膜扫描器完成了身份比对，生物门安静地滑开；净化回路没有付出额外代价。", []),
        chance("wait-b", 30, "身份审核反复重启，门厅的净化回路被拖走了 6 点粒子；门终于在低鸣中打开。", [energy(-6)]),
      ]),
      choice("forge", "伪造员工身份", "结果波动很大，最坏会同时挨伤害与污染", "你从终端缓存里拼出一份临时身份，把某个失踪员工的声音接入门禁。", [
        chance("forge-a", 15, "伪造的员工身份骗过了门禁。你们在系统重新起疑前穿过门厅，没有付出额外代价。", []),
        chance("forge-b", 30, "门禁识破了身份里的缺口，脉冲闸门短暂合拢；你们消耗 3 点粒子，才重新打开通道。", [energy(-3)]),
        chance("forge-c", 35, "伪造身份在门缝前失效，脉冲闸门擦过队伍；全队损失 8% HP 后，门禁停止了追问。", [dmg(0.08)]),
        chance("forge-d", 20, "脉冲闸门在队伍身后合拢，冲击让全队损失 12% HP；系统还污染了{实际角色名}的卡牌《{实际卡牌名}》。", [dmg(0.12), contaminate(1)]),
      ]),
    ],
  },
  {
    // 编队清洁无人机
    id: "cleaning-drone-formation",
    kind: "hazard",
    category: "hazard",
    risk: "negative",
    title: "清洁机器人中转廊",
    description:
      "你刚拐过消防柜，十几架清洁无人机便从天花板的充电槽里同时脱离。它们拖着细长的紫外线灯，沿地面喷出一层会发光的消毒雾。队伍被系统识别成“移动异常源”，而背包里的每一件物品都在无人机的扫描屏上变成了“未登记垃圾”。",
    energyDelta: 0,
    choices: [
      choice("scan", "停下接受扫描", "接受扫描，可能污染 1 张卡牌", "你收起武器，让无人机像一群安静的鱼一样从身边游过。", [
        chance("scan-a", 60, "无人机逐件完成扫描，把队伍标记为可通行目标；消毒雾散开了，没有造成额外损失。", []),
        chance("scan-b", 40, "扫描器在{实际角色名}身上停留过久，旧系统把卡牌《{实际卡牌名}》标记为异常并完成了污染。", [contaminate(1)]),
      ]),
      choice("maintenance", "模仿维护信号", "伪装失败时会额外消耗粒子", "你调出维修频段，带队伍模仿清洁班组的移动节奏。", [
        chance("maintenance-a", 35, "你们的维护信号与无人机队列成功同步，清洁编队让出通道；净化回路没有额外损耗。", []),
        chance("maintenance-b", 40, "维护信号短暂错位，无人机释放了一轮错误回收脉冲；你们消耗 4 点粒子后通过中转廊。", [energy(-4)]),
        chance("maintenance-c", 25, "伪装信号连续失败，清洁无人机反复校准队伍；你们消耗 5 点粒子，才让编队恢复原有航线。", [energy(-5)]),
      ]),
      choice("formation", "穿过无人机编队", "可能受伤或背上无法卸下的负担", "你抓住灯光转向的间隙向前冲。无人机被迫改变队形，旋翼、消毒雾和金属箱在狭窄的中转廊里同时移动。", [
        chance("formation-a", 10, "你们抓住灯光转向的间隙穿过编队，旋翼和消毒雾从身侧掠过；没有额外损失。", []),
        chance("formation-b", 35, "队伍冲过中转廊时被消毒雾和旋翼擦中，全队损失 8% HP，终于冲出了无人机的队形。", [dmg(0.08)]),
        chance("formation-c", 35, "一只封装箱被无人机的磁锁扣在背包外侧，队伍被迫拾取《沉重的负担》 ×1；你们带着它离开中转廊。", [burden()]),
        chance("formation-d", 20, "无人机编队在身后合拢，消毒雾与冲击同时压过来；全队损失 15% HP，并额外消耗 4 点粒子后脱离追踪。", [dmg(0.15), energy(-4)]),
      ]),
    ],
  },
  {
    // 自适应玻璃反光廊
    id: "adaptive-reflection-hall",
    kind: "hazard",
    category: "hazard",
    risk: "negative",
    title: "临街自适应玻璃连廊",
    description:
      "你进入连廊后，身后的玻璃门无声闭合。两侧落地玻璃把同一条走廊复制成无数个方向，远处的出口在每一面反光里都不一样。你每抬头一次，玻璃就重新计算视线，连廊像是在队伍脚下缓慢转动。",
    energyDelta: 0,
    choices: [
      choice("light-band", "跟随应急光带", "沿备用电源行走，可能额外消耗粒子", "你放弃观察反射，只盯住地面上断断续续的橙色引导灯。", [
        chance("light-band-a", 65, "你们始终盯住地面的橙色光带，反光没有改变它指向的出口；队伍顺利走出连廊。", []),
        chance("light-band-b", 35, "应急光带几次熄灭又亮起，备用电源从净化回路抽走了 5 点粒子；你们沿着重新出现的光带离开。", [energy(-5)]),
      ]),
      choice("blind-system", "关闭视觉系统", "避开反射，但可能污染 1 张卡牌", "你让队伍进入盲行模式，只用鞋底的震动和墙内的声波定位。", [
        chance("blind-system-a", 45, "盲行模式捕捉到了墙内的声波定位，队伍避开所有反射，安全穿过连廊。", []),
        chance("blind-system-b", 55, "看不见的光学污染沿着盲行信号渗入{实际角色名}的牌组，卡牌《{实际卡牌名}》被污染。", [contaminate(1)]),
      ]),
      choice("maintenance-pipe", "贴着维护管线移动", "贴墙移动，可能污染卡牌或锁死负担", "你沿着墙根的管线爬行，把连廊中央留给玻璃的视线算法。", [
        chance("maintenance-pipe-a", 35, "你们贴着维护管线爬过狭窄的连廊，背包避开了所有锁死的配重；没有额外损失。", []),
        chance("maintenance-pipe-b", 40, "管线上的旧维护信号反射进队伍设备，卡牌《{实际卡牌名}》被污染。受影响角色：{实际角色名}。", [contaminate(1)]),
        chance("maintenance-pipe-c", 25, "一枚配重模块在管线转弯处锁死在背包外壳上，队伍被迫拾取《沉重的负担》 ×1。", [burden()]),
      ]),
      choice("rush", "盲穿反光走廊", "关闭辅助判断，承受更大的身体损伤", "你关闭所有辅助判断，凭记忆向前冲。", [
        chance("rush-a", 10, "你们关闭所有辅助判断，凭记忆冲过反光走廊；玻璃系统没有来得及锁定队伍。", []),
        chance("rush-b", 25, "反光墙在队伍身侧同时亮起，短促的光学冲击让全队损失 6% HP；出口就在前方。", [dmg(0.06)]),
        chance("rush-c", 30, "连廊的方向在最后一刻翻转，队伍撞上维护隔断；全队损失 12% HP 后冲出玻璃门。", [dmg(0.12)]),
        chance("rush-d", 35, "反光系统同时点亮所有墙面，冲击贯穿护甲；全队损失 18% HP，并额外消耗 3 点粒子才撕开出口。", [dmg(0.18), energy(-3)]),
      ]),
    ],
  },
  {
    // 纳米雾化隔离室
    id: "nano-fog-isolation-room",
    kind: "hazard",
    category: "hazard",
    risk: "negative",
    title: "无菌实验室",
    description:
      "无菌实验室的外门还贴着“实验进行中”的红色封条。你推门时，室内没有人，只有一排培养舱在黑暗里缓慢呼吸。门缝释放出的纳米消毒雾在手电光下结成细丝，像有一层看不见的水正在沿着队伍的护甲往里渗。",
    energyDelta: 0,
    choices: [
      choice("suit", "穿隔离服慢行", "降低伤害，但可能消耗粒子或污染卡牌", "你从墙边的应急柜里扯出旧式隔离服，为每个人重新压紧面罩，然后一步一步走过气闸。", [
        chance("suit-a", 50, "旧式隔离服仍能维持密封，你们逐步穿过气闸，没有让纳米雾进入防护层。", []),
        chance("suit-b", 30, "隔离服的备用供能不足，你们消耗 4 点粒子维持面罩密封，终于走出雾化区域。", [energy(-4)]),
        chance("suit-c", 20, "一枚旧滤芯在途中失效，纳米雾沿着接口渗入{实际角色名}的牌组，污染了卡牌《{实际卡牌名}》。", [contaminate(1)]),
      ]),
      choice("cut-lock", "切断隔离门锁", "快速通过，但可能同时承受伤害与污染", "你把门锁改成手动模式，试图在雾气完全释放前冲过外气闸。", [
        chance("cut-lock-a", 15, "手动门锁在压力交换前成功断开，队伍穿过外气闸，没有受到额外影响。", []),
        chance("cut-lock-b", 35, "气流把队伍推向墙面，全队损失 6% HP 后穿过了外气闸。", [dmg(0.06)]),
        chance("cut-lock-c", 30, "隔离门断开的瞬间释放了强烈气流；全队损失 12% HP，并额外消耗 3 点粒子压住防护层。", [dmg(0.12), energy(-3)]),
        chance("cut-lock-d", 20, "纳米雾和压力冲击同时穿过防护层，全队损失 18% HP；卡牌《{实际卡牌名}》也被污染，受影响角色为{实际角色名}。", [dmg(0.18), contaminate(1)]),
      ]),
    ],
  },
  {
    // 量子电梯错层
    id: "quantum-elevator-offset",
    kind: "hazard",
    category: "hazard",
    risk: "negative",
    title: "访客电梯前厅",
    description:
      "电梯前厅的楼层指示灯同时显示了三个不同的楼层。你按下呼叫键，电梯几乎立刻抵达，却没有发出任何运行声。门打开后，里面不是电梯井，而是一段被拉伸的办公走廊；走廊尽头的灯光与前厅方向相反，像是电梯把某一层折叠错了位置。",
    energyDelta: 0,
    choices: [
      choice("calibrate", "等待电梯校准", "等待稳定，但可能消耗大量粒子", "你站在黄线外，看着维护程序一点点重建楼层坐标。", [
        chance("calibrate-a", 65, "电梯重新建立了楼层坐标，拉伸的办公走廊恢复成正常门厢；队伍安全走出前厅。", []),
        chance("calibrate-b", 35, "校准程序在错误楼层间反复跳转，净化回路被抽走 8 点粒子；电梯最终对准了出口。", [energy(-8)]),
      ]),
      choice("skip-door", "跳过错层门", "快速进入，但大概率承受全队伤害", "你选择电梯门再次打开的瞬间直接跨入。", [
        chance("skip-door-a", 20, "你们在错层门再次打开时准确跨入，门后的走廊正好落在正确位置；没有额外损失。", []),
        chance("skip-door-b", 80, "错层门把队伍甩向变化中的重力方向，全队撞上墙面并损失 12% HP，随后跌出电梯前厅。", [dmg(0.12)]),
      ]),
      choice("reset-passengers", "重置乘员识别", "可能消耗粒子、污染卡牌或承受复合冲击", "你把所有人从乘员名单中删除，再用临时访客身份重新注册。", [
        chance("reset-a", 10, "临时访客身份覆盖了旧乘员名单，电梯放弃追踪，队伍顺利通过。", []),
        chance("reset-b", 25, "身份重置触发了短促的入侵回波；你们额外消耗 4 点粒子，卡牌《{实际卡牌名}》被污染，受影响角色为{实际角色名}。", [energy(-4), contaminate(1)]),
        chance("reset-c", 35, "系统反复重建乘员名单，净化回路被抽走 8 点粒子；电梯终于接受了新的身份。", [energy(-8)]),
        chance("reset-d", 30, "电梯把身份重置判定为入侵，前厅与门厢同时发出冲击；全队损失 12% HP，并额外消耗 3 点粒子。", [dmg(0.12), energy(-3)]),
      ]),
    ],
  },
  {
    // 情绪识别审查厅
    id: "emotional-screening-hall",
    kind: "hazard",
    category: "hazard",
    risk: "negative",
    title: "員工健康审查室",
    description:
      "审查室的墙面没有门，只有一整块会呼吸的黑色屏幕。你踏入感应区后，屏幕亮出一张三百年前的员工脸孔，并用温和得近乎亲切的声音询问：“你为什么急着离开？”它把每一次转头、握拳和呼吸变化都标成了异常情绪。",
    energyDelta: 0,
    choices: [
      choice("still", "保持静止降低存在感", "保持静止，可能额外消耗粒子", "你让所有人站成审查系统最熟悉的办公姿态，连呼吸都压到最低。", [
        chance("still-a", 60, "队伍保持着标准办公姿态，审查屏幕失去兴趣并关闭了感应区；没有额外损失。", []),
        chance("still-b", 40, "系统延长了监测时间，净化装置为维持静止场额外消耗 4 点粒子；审查终于结束。", [energy(-4)]),
      ]),
      choice("accept", "接受情绪审查", "接受分析，可能污染 1-2 张卡牌", "你主动回答问题，把恐惧和疲惫交给旧 AI 分析。", [
        chance("accept-a", 35, "旧 AI 完成了情绪问答，只留下一个无害的员工标签；队伍获准离开审查室。", []),
        chance("accept-b", 45, "审查系统把{实际角色名}的一段情绪记录写入牌组，卡牌《{实际卡牌名}》被污染。", [contaminate(1)]),
        chance("accept-c", 20, "情绪模型将{实际角色名}的两段记录判定为异常，卡牌《{实际卡牌名1}》和《{实际卡牌名2}》被污染。", [contaminate(2)]),
      ]),
      choice("imitate", "模仿标准员工情绪", "模仿动作，可能消耗粒子或承受伤害", "你让队伍按屏幕示范微笑、点头、放松肩膀。", [
        chance("imitate-a", 30, "队伍整齐完成微笑、点头和放松肩膀的动作，模型将你们识别为标准员工。", []),
        chance("imitate-b", 40, "一名队员慢了半拍，模型要求重新演示；你们额外消耗 5 点粒子，才让审查程序放行。", [energy(-5)]),
        chance("imitate-c", 30, "集体伪装被系统识破，审查屏幕释放反冲脉冲；全队损失 8% HP 后冲出感应区。", [dmg(0.08)]),
      ]),
      choice("interfere", "干扰识别模型", "高波动干扰，可能同时受伤与污染", "你向审查屏幕注入一段互相矛盾的情绪数据。", [
        chance("interfere-a", 10, "互相矛盾的情绪数据让模型短暂失去判断，门在窗口关闭前打开；队伍顺利离开。", []),
        chance("interfere-b", 30, "模型反冲沿屏幕和地面传回，队伍损失 6% HP，并额外消耗 3 点粒子压制识别信号。", [dmg(0.06), energy(-3)]),
        chance("interfere-c", 35, "识别模型恢复后释放强烈脉冲，全队损失 12% HP；卡牌《{实际卡牌名}》被污染，受影响角色为{实际角色名}。", [dmg(0.12), contaminate(1)]),
        chance("interfere-d", 25, "矛盾数据彻底失控，黑色屏幕爆发出一圈情绪反冲；全队损失 20% HP 后，审查室才恢复静默。", [dmg(0.2)]),
      ]),
    ],
  },
  {
    // 低温冷却液泄漏带
    id: "cryogenic-coolant-leak",
    kind: "hazard",
    category: "hazard",
    risk: "negative",
    title: "超算机房冷却环廊",
    description:
      "你进入环廊时，脚下传来细碎的玻璃声。地板缝里渗出的冷却液薄得像一层水膜，沿着金属地面向机房深处流动；每一盏状态灯都被冻在半亮的位置。护甲接缝开始结霜，背包的扣件也发出轻微的脆响。",
    energyDelta: 0,
    choices: [
      choice("detour", "绕过泄漏区域", "绕行可能额外消耗粒子", "你沿墙边寻找干燥的维修踏板，尽量不碰到液面。", [
        chance("detour-a", 70, "你们沿着干燥的维修踏板绕过冷却液，重新启动门控模块后通过环廊，没有额外损失。", []),
        chance("detour-b", 30, "被冻住的门控模块需要反复加热，队伍额外消耗 7 点粒子，才绕出泄漏区域。", [energy(-7)]),
      ]),
      choice("insulation", "铺设临时绝缘膜", "铺路可能受伤并锁死负担", "你拆开背包，把绝缘膜一段段压在冷却液上。", [
        chance("insulation-a", 30, "绝缘膜在冷却液上铺出了一条稳定通路，队伍踩着膜面通过，护甲没有被冻伤。", []),
        chance("insulation-b", 45, "冷却液从膜边漫过，低温冲击穿过护甲；全队损失 6% HP 后通过环廊。", [dmg(0.06)]),
        chance("insulation-c", 25, "冻结的配重模块焊在背包外壳上，队伍被迫拾取《沉重的负担》 ×1，并额外消耗 3 点粒子维持绝缘膜。", [burden(), energy(-3)]),
      ]),
    ],
  },
  {
    // 永不散会的会议室
    id: "endless-boardroom",
    kind: "hazard",
    category: "hazard",
    risk: "negative",
    title: "董事会会议室",
    description:
      "会议室的磨砂门在你面前自动打开，里面坐满了半透明的全息人影。他们围着一张空桌争论一个永远没有结论的议题，所有脸都朝向你，仿佛等了三百年才等到迟到的参会者。门锁随即播报：“请确认本次会议的出席状态。”",
    energyDelta: 0,
    choices: [
      choice("wait", "等待会议结束", "等待会议结束，可能消耗粒子", "你不回应，也不打断会议。全息董事会会重复同一轮争论。", [
        chance("wait-a", 55, "全息董事会完成了又一轮没有结论的争论，会议门锁自行释放；队伍没有付出额外代价。", []),
        chance("wait-b", 30, "会议轮次短暂失控，系统从净化回路抽走 5 点粒子维持秩序；随后门锁打开。", [energy(-5)]),
        chance("wait-c", 15, "董事会重复播放了整段议程，门锁为维持出席状态抽走 10 点粒子；会议终于允许队伍离开。", [energy(-10)]),
      ]),
      choice("host", "伪造会议主持人指令", "伪造权限，可能污染卡牌或消耗粒子", "你接管桌面麦克风，用旧权限念出散会口令。", [
        chance("host-a", 25, "旧权限接受了散会口令，全息人影同时起身，会议室向队伍打开出口。", []),
        chance("host-b", 50, "会议系统把伪造指令写入{实际角色名}的牌组，卡牌《{实际卡牌名}》被污染。", [contaminate(1)]),
        chance("host-c", 25, "伪造指令触发了议程反制，队伍额外消耗 7 点粒子；卡牌《{实际卡牌名1}》和《{实际卡牌名2}》被污染。", [energy(-7), contaminate(2)]),
      ]),
      choice("break-wall", "砸开玻璃墙", "直接破坏出口，可能受伤并背上负担", "你放弃和系统讲道理，瞄准会议室侧面的可变色玻璃。", [
        chance("break-wall-a", 10, "可变色玻璃在第一击下裂开，逃生风压把碎片推向外侧；队伍从缺口安全离开。", []),
        chance("break-wall-b", 35, "玻璃碎片和逃生风压同时扑来，全队损失 8% HP 后冲出会议室。", [dmg(0.08)]),
        chance("break-wall-c", 35, "玻璃墙爆裂的冲击让全队损失 15% HP，一只应急货箱被磁锁扣住，队伍被迫拾取《沉重的负担》 ×1。", [dmg(0.15), burden()]),
        chance("break-wall-d", 20, "全息投影在玻璃碎裂时骤然增亮，冲击穿过队伍；全队损失 22% HP 后从会议室撤出。", [dmg(0.22)]),
      ]),
    ],
  },
  {
    // 访客无人机盘查
    id: "visitor-drone-inspection",
    kind: "hazard",
    category: "hazard",
    risk: "negative",
    title: "访客安检前厅",
    description:
      "前厅的接待台已经空了，只剩一枚悬浮的访客徽章在空中旋转。你刚经过地面上的感应线，四架访客无人机便从天花板降下，投出一张“来访目的”表格。它们没有足够的数据库判断队伍是谁，却足够准确地判断谁最像不该出现在这里的人。",
    energyDelta: 0,
    choices: [
      choice("scan", "关闭装备接受扫描", "接受扫描，可能污染卡牌", "你让队伍卸下主动设备，接受一轮冷蓝色的全身扫描。", [
        chance("scan-a", 55, "访客无人机完成全身扫描，旧数据库找到了足够的匹配记录；队伍被放行，没有额外损失。", []),
        chance("scan-b", 45, "扫描器把{实际角色名}标记为异常访客，卡牌《{实际卡牌名}》被污染。", [contaminate(1)]),
      ]),
      choice("interference", "发射低频干扰", "干扰失败会消耗粒子并造成伤害", "你用短脉冲让无人机的镜头错开几秒。", [
        chance("interference-a", 30, "低频脉冲让无人机的镜头错开，队伍从空出的通道穿过前厅。", []),
        chance("interference-b", 45, "无人机重新锁定了频率，净化回路释放反向脉冲；你们额外消耗 4 点粒子后摆脱盘查。", [energy(-4)]),
        chance("interference-c", 25, "干扰信号引发回波，队伍损失 5% HP，并额外消耗 8 点粒子，才让无人机失去目标。", [dmg(0.05), energy(-8)]),
      ]),
      choice("maintenance-slot", "藏入设备维护槽", "藏匿可能污染卡牌并锁死负担", "你带队钻入接待台后方的维护槽，等待无人机从头顶飞过。", [
        chance("maintenance-slot-a", 35, "你们缩进维护槽，等无人机飞过头顶后从末端离开；没有触发异常警报。", []),
        chance("maintenance-slot-b", 40, "维护槽的过滤器把异常信号反射进牌组，卡牌《{实际卡牌名}》被污染，受影响角色为{实际角色名}。", [contaminate(1)]),
        chance("maintenance-slot-c", 25, "维护槽末端弹出锁死的配重箱，队伍被迫拾取《沉重的负担》 ×1；同时卡牌《{实际卡牌名}》被污染，受影响角色为{实际角色名}。", [contaminate(1), burden()]),
      ]),
      choice("drive-away", "驱赶无人机", "强行冲出，可能承受高额伤害", "你直接抬手击落最近的一架。", [
        chance("drive-away-a", 10, "你们击落第一架无人机并趁剩余编队重组时冲出前厅，没有受到额外影响。", []),
        chance("drive-away-b", 25, "交叉火力擦过队伍，全队损失 8% HP 后冲出了访客安检区。", [dmg(0.08)]),
        chance("drive-away-c", 35, "无人机的驱离脉冲穿过护甲，全队损失 16% HP；卡牌《{实际卡牌名}》被污染，受影响角色为{实际角色名}。", [dmg(0.16), contaminate(1)]),
        chance("drive-away-d", 30, "前厅变成交叉火力区，队伍损失 24% HP，并额外消耗 4 点粒子才冲出无人机射界。", [dmg(0.24), energy(-4)]),
      ]),
    ],
  },
  {
    // 货运重力缓冲廊
    id: "cargo-gravity-buffer",
    kind: "hazard",
    category: "hazard",
    risk: "negative",
    title: "货运中转廊",
    description:
      "你听见一声沉闷的“换向”提示，脚下的重量突然消失。货架从地面脱离，沿着墙面滑行；办公设备和封装箱在半空中互相撞击，像一场没有终点的货物雨。前方的门每隔几秒改变一次重力方向，门框里没有稳定的上下。",
    energyDelta: 0,
    choices: [
      choice("wait-pulse", "等重力脉冲归零", "等待稳定，可能消耗粒子", "你让队伍抓住固定扶手，等待缓冲器完成下一轮换向。", [
        chance("wait-pulse-a", 60, "你们抓住固定扶手，等缓冲器完成换向；重力恢复稳定，队伍顺利通过货运中转廊。", []),
        chance("wait-pulse-b", 40, "重力脉冲拖延了归零时间，队伍额外消耗 6 点粒子维持固定装置，才等到门框恢复方向。", [energy(-6)]),
      ]),
      choice("tie-down", "固定身体与背包", "降低失重风险，可能背上负担或受伤", "你用缆带把队员和背包绑在同一根货轨上。", [
        chance("tie-down-a", 25, "缆带承住了换向冲击，队伍和背包一起沿货轨滑过门框，没有额外损失。", []),
        chance("tie-down-b", 35, "断裂的固定点把一只配重箱甩到背包上，队伍被迫拾取《沉重的负担》 ×1。", [burden()]),
        chance("tie-down-c", 25, "缆带把冲击集中到队伍身上，全队损失 8% HP，并额外消耗 3 点粒子稳住货轨。", [dmg(0.08), energy(-3)]),
        chance("tie-down-d", 15, "固定点在重力反转时断裂，全队损失 12% HP；冲击还污染了{实际角色名}的卡牌《{实际卡牌名}》。", [dmg(0.12), contaminate(1)]),
      ]),
      choice("shelf", "抓住货架强行通过", "借货架摆荡，可能承受高额伤害", "你借着货架换向的瞬间向前摆荡，试图把整支队伍送过门框。", [
        chance("shelf-a", 10, "你们借货架换向的瞬间摆荡过门框，货架恰好把整支队伍送到稳定地面。", []),
        chance("shelf-b", 25, "货架在门框前提前反转，队伍撞上缓冲壁，全队损失 10% HP 后落地。", [dmg(0.1)]),
        chance("shelf-c", 35, "货架的重力方向再次改变，队伍被连续甩向两侧，全队损失 18% HP 后才抓住固定点。", [dmg(0.18)]),
        chance("shelf-d", 30, "货运脉冲在门框处猛烈反转，全队损失 25% HP，并额外消耗 3 点粒子，才从货物雨中脱身。", [dmg(0.25), energy(-3)]),
      ]),
    ],
  },
  {
    // 量子样品冷库
    id: "quantum-sample-cold-storage",
    kind: "hazard",
    category: "hazard",
    risk: "highRisk",
    title: "无菌实验室",
    description:
      "这是同一层的另一种实验室状态：你穿过无菌实验室的内门时，培养舱已经全部熄灭，只有中央样品柜还在工作。柜内的量子样品像一小块被折叠的夜空，不断把周围的温度和声音吸进去；每一次冷却泵停顿，样品柜外壁都会结出新的霜花。",
    energyDelta: 0,
    choices: [
      choice("cooling", "调低冷却功率", "降低功率，可能消耗粒子或获得圣水", "你先把冷却系统调到最低，让样品柜暂时依靠备用滤芯维持稳定。", [
        chance("cooling-a", 70, "样品柜暂时稳定下来，但备用滤芯持续抽空净化回路；你们额外消耗 5 点粒子后离开冷库。", [energy(-5)]),
        chance("cooling-b", 30, "冷却功率降到最低后，备用中和剂被封装成一瓶仍然密封的圣水；你们带走圣水 ×1。", [item("holy-water-c")]),
      ]),
      choice("disconnect", "断开样品舱", "切断主缆线，可能污染卡牌或取得数据存档", "你拔掉连接样品柜和实验室的主缆线，把异常冻结限制在柜体内部。", [
        chance("disconnect-a", 25, "主缆线在空间场失稳前成功断开，异常冻结被限制在样品柜内；队伍安全离开。", []),
        chance("disconnect-b", 35, "断线时逸出的异常场扫过{实际角色名}的牌组，卡牌《{实际卡牌名}》被污染。", [contaminate(1)]),
        chance("disconnect-c", 20, "空间场连续闪烁两次，{实际角色名}的卡牌《{实际卡牌名1}》和《{实际卡牌名2}》被异常场污染。", [contaminate(2)]),
        chance("disconnect-d", 20, "异常场在消散前留下了一段数据存档；你们获得数据存档 ×1，但卡牌《{实际卡牌名}》被污染，受影响角色为{实际角色名}。", [contaminate(1), item("data-shard")]),
      ]),
    ],
  },
  {
    // 纳米打印原型机
    id: "nano-printer-prototype",
    kind: "hazard",
    category: "hazard",
    risk: "highRisk",
    title: "原型制造车间",
    description:
      "车间中央的纳米打印机已经运行了三百年，却只打印出一件没有完成的黑色装置。成型臂每次落下都差一毫米，熔融材料便沿着模具边缘重新流回去。你靠近时，机器把队伍识别为“待装配零件”，数十条机械臂同时转向。",
    energyDelta: 0,
    choices: [
      choice("terminate", "终止打印程序", "停止程序，可能消耗粒子或获得圣水", "你从维护台输入停机指令，先让打印头降温，再切断供料。", [
        chance("terminate-a", 70, "打印头按顺序降温并退出程序，但停机自检抽走了 5 点净化粒子；打印机终于安静下来。", [energy(-5)]),
        chance("terminate-b", 30, "打印程序顺利终止，维护腔里弹出一瓶仍然密封的圣水；你们带走圣水 ×1。", [item("holy-water-c")]),
      ]),
      choice("rescue", "抢救半成品", "强制拾取负担，少数情况下额外获得医疗包", "你趁机械臂回到上位时切入打印舱，把未完成的设备从模具里撬下来。", [
        chance("rescue-a", 70, "半成品从模具里脱落，自动锁进背包；队伍被迫拾取《沉重的负担》 ×1，但没有找到其他可用组件。", [burden()]),
        chance("rescue-b", 30, "你们撬下半成品时拆出了仍有压力的医疗包；队伍被迫拾取《沉重的负担》 ×1，并带走医疗包 ×1。", [burden(), item("medical-kit-c")]),
      ]),
      choice("jam", "卡住机械臂", "阻止机械臂闭合，可能受伤或获得医疗包", "你用工具把两条成型臂锁在一起，让整台机器暂时无法闭合。", [
        chance("jam-a", 30, "两条成型臂被工具牢牢卡住，打印机停止挣扎；队伍从维护平台安全撤离。", []),
        chance("jam-b", 50, "机械臂反复挣扎，冲击沿平台传到队伍；全队损失 10% HP 后，卡住的机械臂终于停下。", [dmg(0.1)]),
        chance("jam-c", 20, "机械臂挣扎时撞开医疗包，冲击让全队损失 12% HP；你们同时带走医疗包 ×1。", [dmg(0.12), item("medical-kit-c")]),
      ]),
      choice("restart", "强制重启打印机", "重启生产线，可能受伤或消耗粒子", "你把整条生产线重新上电，赌系统会从最初工单恢复。", [
        chance("restart-a", 10, "打印机从最初工单重新启动，却在完成自检前自行停机；队伍没有受到额外影响。", []),
        chance("restart-b", 25, "所有机械臂同时落下，队伍被高压震动波及；全队损失 10% HP 后退到安全线外。", [dmg(0.1)]),
        chance("restart-c", 35, "打印舱在重启过程中爆裂，队伍损失 18% HP，并额外消耗 4 点粒子压住失控的供能线。", [dmg(0.18), energy(-4)]),
        chance("restart-d", 30, "打印机重新识别了旧订单，爆裂的废弃模块撞伤队伍；全队损失 25% HP 后才停机。", [dmg(0.25)]),
      ]),
    ],
  },
  {
    // 高压算力池接线
    id: "high-pressure-compute-pool",
    kind: "hazard",
    category: "hazard",
    risk: "highRisk",
    title: "主算力池机房",
    description:
      "你推开机房防火门时，整面服务器墙像潮汐一样明灭。算力池把多余电力泄向废弃办公区，地面上密布的接线槽不断冒出白色电弧。空气里有烧焦塑料的气味，所有终端都在请求一个早已不存在的管理员确认。",
    energyDelta: 0,
    choices: [
      choice("shield", "使用隔离屏蔽接线", "稳妥接线，可能消耗或净化粒子", "你先套上绝缘屏蔽，把一条细线接进外围回路。", [
        chance("shield-a", 70, "外围回路逐渐降压，但接线过程持续消耗屏蔽供能；你们额外消耗 4 点粒子后断开连接。", [energy(-4)]),
        chance("shield-b", 30, "隔离屏蔽稳定住了电流，算力池的残余能量被净化装置回收；净化粒子增加 12 点。", [energy(12)]),
      ]),
      choice("backup", "将电力导入备用回路", "转移电力，可能污染卡牌或净化粒子", "你把泄放电流引向一组没有标记的备用线路。", [
        chance("backup-a", 40, "备用线路接住了电流，却把异常数据回流进{实际角色名}的牌组；卡牌《{实际卡牌名}》被污染。", [contaminate(1)]),
        chance("backup-b", 35, "备用回路成功分流了算力池的电力，队伍在没有额外损失的情况下断开接线。", []),
        chance("backup-c", 25, "备用回路回收了大量过剩能量，但异常数据也污染了{实际角色名}的卡牌《{实际卡牌名}》；净化粒子增加 18 点。", [contaminate(1), energy(18)]),
      ]),
      choice("core", "直接接入主算力池", "跳过保护，可能承受高额伤害或净化粒子", "你跳过所有保护，把净化装置接上算力池核心。", [
        chance("core-a", 10, "主算力池接口稳定下来，残余电力被净化装置完整压回；队伍安全断开连接。", []),
        chance("core-b", 25, "主接口释放了一轮电弧，全队损失 12% HP 后，算力池暂时恢复平稳。", [dmg(0.12)]),
        chance("core-c", 35, "服务器墙的回流冲击穿过护甲，全队损失 20% HP 后被迫切断主接线。", [dmg(0.2)]),
        chance("core-d", 30, "主算力池爆发出强烈回流，全队损失 25% HP；净化装置仍压回了过剩能量，净化粒子增加 24 点。", [dmg(0.25), energy(24)]),
      ]),
    ],
  },
  {
    // 企业安保原型靶场
    id: "corporate-security-range",
    kind: "hazard",
    category: "hazard",
    risk: "highRisk",
    title: "企业安保原型靶场",
    description:
      "靶场的隔离门半开着，里面的模拟城市还停在一次测试开始前。你迈过门槛，墙面立刻投出红色标记，把队伍标记成“未授权入侵样本”。天花板上的炮台没有立刻开火，而是先调整角度，像在等待队伍自己选择一条更容易命中的路线。",
    energyDelta: 0,
    choices: [
      choice("safe-line", "沿安全标线绕行", "沿标线移动，可能消耗粒子或获得数据存档", "你沿着地面上褪色的白线走，尽量不触碰靶场中央的感应区。", [
        chance("safe-line-a", 55, "褪色的安全标线在队伍脚下重新亮起，你们绕过感应区，靶场没有启动炮台。", []),
        chance("safe-line-b", 25, "标线反复重新校准，队伍额外消耗 5 点粒子等待通道稳定后通过。", [energy(-5)]),
        chance("safe-line-c", 20, "安全标线在尽头指向一处维护槽，你们从里面取出数据存档 ×1，然后离开靶场。", [item("data-shard")]),
      ]),
      choice("fire-zone", "穿过测试射击区", "主动进入射击区，可能受伤或发现废弃设备", "你主动踏进模拟城市，让炮台把火力集中到队伍身上。", [
        chance("fire-zone-a", 10, "你们踩着炮台的射击间隔穿过模拟城市，测试系统没有命中队伍。", []),
        chance("fire-zone-b", 35, "炮台的模拟弹道擦过队伍，全队损失 12% HP 后冲出测试射击区。", [dmg(0.12)]),
        chance("fire-zone-c", 25, "队伍在核心区被连续火力压住，全队损失 20% HP 后才穿过最后一道标线。", [dmg(0.2)]),
        chance("fire-zone-d", 30, "炮台在出口前完成最后一轮锁定，全队损失 25% HP；回收槽随后弹出复合护甲 ×1。", [dmg(0.25), item("composite-armor-common")]),
      ]),
    ],
  },

  {
    // 机密档案量子封存柜
    id: "quantum-archive-locker",
    kind: "hazard",
    category: "hazard",
    risk: "highRisk",
    title: "机密档案库",
    description:
      "档案库没有纸张，只有一排排悬浮在黑暗里的量子封存柜。你靠近其中一柜时，柜门上浮出公司的旧徽标和一串被擦除的项目编号。锁内的资料像在呼吸，每一次脉冲都让周围的空气短暂变色，仿佛有人从数据另一端看见了队伍。",
    energyDelta: 0,
    choices: [
      choice("wait", "等待量子锁自行解密", "等待自检，可能消耗粒子或获得数据存档", "你保持距离，等待封存柜按照旧协议完成自检。", [
        chance("wait-a", 70, "量子封存柜完成了漫长的自检，却只释放出一段空白索引；队伍额外消耗 6 点粒子后离开档案库。", [energy(-6)]),
        chance("wait-b", 30, "量子锁完成解密，柜内的完整档案落入存储器；你们带走数据存档 ×1。", [item("data-shard")]),
      ]),
      choice("copy", "趁警报间隙复制档案", "截取缓存，可能污染 1-2 张卡牌或取得数据存档", "你不打开柜门，只在警报短暂熄灭时截取量子缓存。", [
        chance("copy-a", 45, "你们截取缓存的同时，警报数据写入{实际角色名}的牌组，卡牌《{实际卡牌名}》被污染。", [contaminate(1)]),
        chance("copy-b", 30, "量子缓存反向追踪了复制信号，{实际角色名}的卡牌《{实际卡牌名1}》和《{实际卡牌名2}》被污染。", [contaminate(2)]),
        chance("copy-c", 25, "你们在警报熄灭前复制出数据存档 ×1，但反向追踪污染了{实际角色名}的卡牌《{实际卡牌名}》。", [contaminate(1), item("data-shard")]),
      ]),
      choice("break-locker", "破坏封存柜外壳", "从外部切开，可能受伤或取得数据存档", "你用工具从外部切开柜体，试图避开量子锁。", [
        chance("break-locker-a", 25, "封存柜外壳沿切口裂开，压缩场没有向外释放；队伍没有拿到档案，但安全离开。", []),
        chance("break-locker-b", 45, "外壳破裂释放出猛烈压缩场，全队损失 12% HP，柜内资料也在冲击中散失。", [dmg(0.12)]),
        chance("break-locker-c", 30, "压缩场擦过队伍，全队损失 6% HP；你们在资料散逸前抢出数据存档 ×1。", [dmg(0.06), item("data-shard")]),
      ]),
      choice("overwrite", "覆写量子密钥", "强行夺权，可能污染、受伤、消耗粒子并获得数据存档", "你把自己的临时密钥写进封存柜，让系统把队伍当成新的档案管理员。", [
        chance("overwrite-a", 10, "临时密钥覆盖了旧权限，量子封存柜把队伍识别为新的档案管理员；没有额外损失。", []),
        chance("overwrite-b", 25, "旧权限发起最后一次清除，{实际角色名}的卡牌《{实际卡牌名1}》和《{实际卡牌名2}》被污染。", [contaminate(2)]),
        chance("overwrite-c", 35, "量子密钥反冲穿过队伍，全队损失 18% HP，并额外消耗 4 点粒子才完成断开。", [dmg(0.18), energy(-4)]),
        chance("overwrite-d", 30, "旧权限的清除脉冲让全队损失 10% HP；卡牌《{实际卡牌名}》被污染，但你们仍带走数据存档 ×1。受影响角色为{实际角色名}。", [dmg(0.1), contaminate(1), item("data-shard")]),
      ]),
    ],
  },
  {
    // 无人化维修蜂巢
    id: "autonomous-repair-hive",
    kind: "hazard",
    category: "hazard",
    risk: "highRisk",
    title: "自动维修蜂巢间",
    description:
      "维修区的墙壁向内收缩，露出数百个正在工作的机械臂。它们没有统一的中央控制台，每一条手臂都在执行一张不同的旧工单：更换关节、拆下外壳、回收“失效部件”。你刚进入，最近的机械臂便伸过来，在护甲上投出“待维修”的黄色框线。",
    energyDelta: 0,
    choices: [
      choice("protocol", "按维护协议缓慢通过", "接受维护，必定强制拾取负担，可能获得圣水", "你让队伍排成检修队列，接受机械臂逐件确认。", [
        chance("protocol-a", 70, "机械臂将一件配重部件判定为待返还工件并挂进背包，队伍被迫拾取《沉重的负担》 ×1。", [burden()]),
        chance("protocol-b", 30, "维护协议完成了返还流程，队伍被迫拾取《沉重的负担》 ×1；一条机械臂还交出圣水 ×1。", [burden(), item("holy-water-c")]),
      ]),
      choice("control", "抢夺维修机械臂控制权", "夺取控制权，可能受伤并获得医疗包", "你攀上维护平台，试图夺取一条机械臂的近端控制权。", [
        chance("control-a", 70, "机械臂把入侵者当成故障源甩向维护平台，全队损失 8% HP 后，你们切断了它的近端控制权。", [dmg(0.08)]),
        chance("control-b", 30, "机械臂的挣扎让队伍损失 8% HP，但医疗包被撞开；你们带走医疗包 ×1。", [dmg(0.08), item("medical-kit-c")]),
      ]),
      choice("overclock", "超频整个维修蜂巢", "超频蜂巢，可能消耗粒子、污染卡牌、受伤或获得材料", "你把所有旧工单同时推入最高优先级，让维修蜂巢互相争抢电力和材料。", [
        chance("overclock-a", 10, "所有工单同时争抢优先级，维修蜂巢短暂死锁；机械臂停止后，队伍从平台间穿过，没有额外损失。", []),
        chance("overclock-b", 30, "工单争抢抽走 8 点粒子，异常维修信号还污染了{实际角色名}的卡牌《{实际卡牌名}》。", [energy(-8), contaminate(1)]),
        chance("overclock-c", 30, "机械臂群在平台间掀起金属风暴，全队损失 15% HP 后，蜂巢的供能暂时中断。", [dmg(0.15)]),
        chance("overclock-d", 30, "蜂巢失控地争抢电力，队伍额外消耗 10 点粒子；卡牌《{实际卡牌名}》被污染，但你们从维修台带走导电印墨 ×1。受影响角色为{实际角色名}。", [energy(-10), contaminate(1), item("conductive-ink")]),
      ]),
    ],
  },
  {
    // 全息董事会遗留终端
    id: "holographic-board-terminal",
    kind: "hazard",
    category: "hazard",
    risk: "highRisk",
    title: "董事会会议室",
    description:
      "和那间不断开会的会议室不同，这里的全息人影已经全部消失，只剩桌面中央的董事会终端仍在运行。你靠近时，终端把一张张旧脸投到空气里，询问最高权限用户为何迟到。每一次失败登录都会让整面玻璃墙亮起一圈红色警戒。",
    energyDelta: 0,
    choices: [
      choice("verify", "接受普通身份验证", "按流程验证，可能消耗粒子或获得数据存档", "你用最普通的访客身份递交访问请求，等待终端按流程核验。", [
        chance("verify-a", 80, "终端按普通访客流程反复查询旧数据库，队伍额外消耗 4 点粒子后通过验证。", [energy(-4)]),
        chance("verify-b", 20, "普通身份验证意外匹配到一份被遗忘的董事会记录；你们带走数据存档 ×1。", [item("data-shard")]),
      ]),
      choice("forge", "伪造董事权限", "伪造权限，可能污染卡牌或净化粒子", "你把一名旧董事的权限片段拼接起来，向终端提交一份不完整的授权。", [
        chance("forge-a", 60, "权限片段的缺口被系统写入{实际角色名}的牌组，卡牌《{实际卡牌名}》被污染。", [contaminate(1)]),
        chance("forge-b", 25, "终端识破了不完整的授权，清除脉冲污染了{实际角色名}的卡牌《{实际卡牌名1}》和《{实际卡牌名2}》。", [contaminate(2)]),
        chance("forge-c", 15, "伪造权限短暂成立，终端释放出 12 点净化粒子；撤销权限时，卡牌《{实际卡牌名}》被污染，受影响角色为{实际角色名}。", [energy(12), contaminate(1)]),
      ]),
      choice("cache", "利用会议缓存", "读取会议缓存，可能消耗粒子或找到废弃设备", "你不碰权限验证，转而从会议投影的缓存里寻找已经打开的通道。", [
        chance("cache-a", 50, "会议缓存里还留着一条未关闭的通道，你们沿着投影缺口离开终端，没有额外损失。", []),
        chance("cache-b", 30, "缓存数据已经残缺，队伍额外消耗 6 点粒子解码后才找到出口。", [energy(-6)]),
        chance("cache-c", 20, "会议投影结束时，一件破阵信标从残留设备中短暂显形；你们带走破阵信标 ×1。", [item("breach-beacon-common")]),
      ]),
      choice("seize", "强制夺取终端权限", "强行夺权，可能受伤或打开废弃设备槽", "你把手掌压上终端核心，直接让自己的生物信号覆盖旧董事会。", [
        chance("seize-a", 10, "生物信号覆盖了旧董事会权限，终端停止安保脉冲；队伍成功夺取控制权，没有额外损失。", []),
        chance("seize-b", 50, "终端释放安保脉冲把队伍推开，全队损失 10% HP 后，核心恢复静默。", [dmg(0.1)]),
        chance("seize-c", 20, "夺权失败触发连续安保脉冲，全队损失 20% HP 后才从终端核心撤手。", [dmg(0.2)]),
        chance("seize-d", 20, "安保脉冲让全队损失 10% HP，但终端被迫打开附近的设备槽；你们带走破阵信标 ×1。", [dmg(0.1), item("breach-beacon-common")]),
      ]),
    ],
  },
  {
    // 楼层核心供氧调节站
    id: "floor-oxygen-regulator",
    kind: "hazard",
    category: "hazard",
    risk: "highRisk",
    title: "楼层核心供氧站",
    description:
      "供氧站位于整层的中央，透明管道从这里向四面八方伸展，通往已经没有人的办公室。你抵达时，管道里仍流动着温暖的空气，控制台却在红色警告中显示“人员配置：零”。备用舱里保存着少量医疗气体，但每一次阀门切换都会让整层的气压轻轻起伏。",
    energyDelta: 0,
    choices: [
      choice("balance", "手动平衡气压", "调节气压，可能消耗粒子或治疗全队", "你站到控制台前，逐个关闭不再使用的区域，把气流慢慢导向队伍所在的走廊。", [
        chance("balance-a", 70, "你们逐区关闭供氧阀门，气流终于稳定，但控制台的持续调节额外消耗了 5 点粒子。", [energy(-5)]),
        chance("balance-b", 30, "备用管线在压力回弹中释放出医疗气体，全队回复 10% HP 后，供氧站恢复平稳。", [heal(0.1)]),
      ]),
      choice("shutoff", "关闭一侧供氧区", "切断一侧供氧，可能受伤后获得治疗", "你切断一整侧办公区的供氧，把压力集中到另一侧。", [
        chance("shutoff-a", 45, "一侧供氧区关闭时形成的气压差挤过走廊，全队损失 6% HP 后通过控制台。", [dmg(0.06)]),
        chance("shutoff-b", 30, "气压切换发生偏移，队伍被压向透明管道，全队损失 12% HP 后才稳住呼吸。", [dmg(0.12)]),
        chance("shutoff-c", 25, "气压差先压过队伍，全队损失 6% HP；残余医疗气体随后进入面罩，全队回复 20% HP。", [dmg(0.06), heal(0.2)]),
      ]),
      choice("medical-gas", "抽取紧急医疗气体", "直接抽取气体，可能污染卡牌或治疗全队", "你打开标有“仅限董事会使用”的红色阀门，把医疗气体直接接入队伍。", [
        chance("medical-gas-a", 10, "红色阀门顺利打开，医疗气体没有被异常物质污染；队伍安全关闭供氧站。", []),
        chance("medical-gas-b", 35, "异常物质随医疗气体进入{实际角色名}的设备，卡牌《{实际卡牌名}》被污染。", [contaminate(1)]),
        chance("medical-gas-c", 25, "阀门后的异常物质持续喷出，{实际角色名}的卡牌《{实际卡牌名1}》和《{实际卡牌名2}》被污染。", [contaminate(2)]),
        chance("medical-gas-d", 30, "医疗气体带着异常物质喷入队伍；全队回复 35% HP，但{实际角色名}的卡牌《{实际卡牌名1}》和《{实际卡牌名2}》被污染。", [heal(0.35), contaminate(2)]),
      ]),
    ],
  },
];

const ECONOMY: NodeEvent[] = [
  {
    id: "cold-chain-benefit-counter",
    kind: "merchant",
    category: "economy",
    title: "冷链员工福利兑换台",
    description: "冷链兑换台已接入。本次可用服务：临期食品商店、医疗服务。两种服务使用不同食品货币。",
    energyDelta: 0,
    services: ["near-expiry-food-shop", "medical-service"],
    choices: [
      { id: "trade", label: "刷卡进入兑换台", desc: "接入冷链交易终端", energyDelta: 0, effects: [{ type: "OPEN_SHOP" }] },
      { id: "leave", label: "不做交易，转身离开", desc: "不支付任何食品", energyDelta: 0, story: "你没有动兑换台上的任何东西。" },
    ],
  },
  {
    id: "material-procurement-terminal",
    kind: "merchant",
    category: "economy",
    title: "材料定向采购台",
    description: "采购室已恢复。通用材料接受面包，地区采集材料接受炸鸡；两套货架分别锁定。",
    energyDelta: 0,
    services: ["general-material-shop", "regional-gathering-shop"],
    choices: [
      { id: "trade", label: "接入定向采购台", desc: "查看两套材料货架", energyDelta: 0, effects: [{ type: "OPEN_SHOP" }] },
      { id: "leave", label: "放弃采购，继续前进", desc: "不支付任何食品", energyDelta: 0, story: "你记下采购室的坐标，却没有打开任何货架。" },
    ],
  },
  {
    id: "specimen-exchange-locker",
    kind: "merchant",
    category: "economy",
    title: "生物样本交换柜",
    description: "样本交换柜已开启。炸鸡可兑换怪物材料，汉堡可兑换消耗品；每类最多购买 1 件。",
    energyDelta: 0,
    services: ["monster-material-shop", "consumable-shop"],
    choices: [
      { id: "trade", label: "解锁样本交换柜", desc: "查看怪物材料与消耗品", energyDelta: 0, effects: [{ type: "OPEN_SHOP" }] },
      { id: "leave", label: "不交换样本，转身离开", desc: "不支付任何食品", energyDelta: 0, story: "你让样本柜继续保持封闭，带着空手离开。" },
    ],
  },
  {
    id: "security-gear-checkpoint",
    kind: "merchant",
    category: "economy",
    title: "安保装备验收门",
    description: "安保验收门已生成武器货架。所有武器属性、品质和占格已公开。",
    energyDelta: 0,
    services: ["weapon-shop"],
    choices: [
      { id: "trade", label: "刷卡查看武器货架", desc: "接入武器终端", energyDelta: 0, effects: [{ type: "OPEN_SHOP" }] },
      { id: "leave", label: "暂不验收装备", desc: "不支付任何食品", energyDelta: 0, story: "你没有触碰安保验收门，装备货架在身后重新降下。" },
    ],
  },
  {
    id: "accessory-protocol-booth",
    kind: "merchant",
    category: "economy",
    title: "团队协议台",
    description: "校准厅提供团队协议。团队 BUFF 按本次远征常驻处理。",
    energyDelta: 0,
    services: ["random-party-buff"],
    choices: [
      { id: "trade", label: "接入团队协议台", desc: "查看团队 BUFF", energyDelta: 0, effects: [{ type: "OPEN_SHOP" }] },
      { id: "leave", label: "跳过协议，继续前进", desc: "不支付任何食品", energyDelta: 0, story: "你决定暂时不改动队伍协议，离开了校准厅。" },
    ],
  },
  {
    id: "skill-archive-audit-terminal",
    kind: "merchant",
    category: "economy",
    title: "技能档案审计终端",
    description: "技能档案终端已接入。抽卡使用披萨，删卡使用面包 ×2；请选择角色后再确认。",
    energyDelta: 0,
    services: ["card-draw-service", "card-remove-service"],
    choices: [
      { id: "trade", label: "刷卡进入审计终端", desc: "查看抽卡与删卡服务", energyDelta: 0, effects: [{ type: "OPEN_SHOP" }] },
      { id: "leave", label: "保留当前卡组，转身离开", desc: "不支付任何食品", energyDelta: 0, story: "你合上技能档案，没有让审计终端改动卡组。" },
    ],
  },
];

const BATTLE: NodeEvent[] = [
  {
    id: "battle-cleaning-drone",
    kind: "battle",
    category: "battle",
    title: "清扫无人机",
    description: "一台清扫无人机把探测灯对准队伍，旧指令将你们标记为待处理的污染源。",
    energyDelta: 0,
    depth: [2, 4],
    effects: [{ type: "START_NODE_BATTLE" }],
    choices: [
      choice("engage", "迎战", "立刻进入战斗", "无人机的清扫臂已经锁定目标，你们只能先拆掉它。", undefined),
    ],
  },
  {
    id: "battle-scrap-crew",
    kind: "battle",
    category: "battle",
    title: "废品机器人清运班组",
    description: "几台废品机器人从堆料后方排成清运队列，机械钳上还挂着没有卸下的旧货箱。",
    energyDelta: 0,
    depth: [2, 4],
    effects: [{ type: "START_NODE_BATTLE" }],
    choices: [
      choice("engage", "迎战", "立刻进入战斗", "清运班组把道路封死，所有机械臂同时转向了你们。", undefined),
    ],
  },
];

// 空节点(设计: 每张图固定 emptyNodes.count 个, 见 rules.ts)——
// 「走到了, 但什么都没有」: 没有任何分支收益, 也没有任何风险,
// 唯一的结果就是**每节点固定的净化粒子消耗照扣不误**。它们是深潜路上的白噪音,
// 逼玩家为「这一格只是空路」的推断付出不可逆的粒子, 也是记忆压力的组成部分。
// ⚠ 刻意不写 depth: 空节点可以出现在任意推进段, 深段遇上它比浅段更疼。
const EMPTY: NodeEvent[] = [
  {
    id: "empty-vacant-corridor",
    kind: "empty",
    category: "empty",
    title: "空置通道",
    description: "这条通道里什么也没有——没有补给，没有威胁，只有一路沉默的灰。",
    energyDelta: 0,
    choices: [
      choice("pass", "继续前进", "什么也没有发生", "你们穿过空荡荡的通道，脚步声在墙壁之间弹了又弹，除此之外什么也没有发生。", undefined),
    ],
  },
  {
    id: "empty-stripped-cubicle",
    kind: "empty",
    category: "empty",
    title: "废弃隔间",
    description: "隔间的门大敞着，里面早就被搬空了，连一颗螺丝钉都没留下。",
    energyDelta: 0,
    choices: [
      choice("pass", "继续前进", "什么也没有发生", "你们把隔间翻了个底朝天——架子是空的，柜子是空的，连墙上的挂扣都被拆走了。", undefined),
    ],
  },
  {
    id: "empty-silent-junction",
    kind: "empty",
    category: "empty",
    title: "静默岔口",
    description: "岔口的路标指向三个方向，但每一条都安静得不像话。",
    energyDelta: 0,
    choices: [
      choice("pass", "继续前进", "什么也没有发生", "你们在岔口停了一小会儿，听不到任何动静，最终随便挑了一条路继续走。", undefined),
    ],
  },
];

export interface EventPool {
  survival: NodeEvent[];
  growth: NodeEvent[];
  economy: NodeEvent[];
  route: NodeEvent[];
  energy: NodeEvent[];
  hazard: NodeEvent[];
  battle: NodeEvent[];
  endgame: NodeEvent[];
  empty: NodeEvent[]; // 空节点(什么都不发生, 能量照扣) —— 独立保底, 不进入普通填充
}

export const EVENT_POOLS: Record<string, EventPool> = {
  "ruined-floor": {
    survival: SURVIVAL,
    growth: GROWTH,
    economy: ECONOMY,
    route: [],
    energy: [],
    hazard: HAZARD,
    battle: BATTLE,
    endgame: [],
    empty: EMPTY,
  },
};

export function getEventPool(id: string): EventPool {
  const pool = EVENT_POOLS[id];
  if (!pool) throw new Error(`未知事件池: ${id}`);
  return pool;
}

export const ALL_NODE_EVENTS: NodeEvent[] = Object.values(EVENT_POOLS).flatMap((pool) =>
  Object.values(pool).flat(),
);
