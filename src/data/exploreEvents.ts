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
      choice("supplies", "拆取维护架上的急救匣", "获得医疗包 ×2，或获得医疗包与圣水", "你放弃打开防具箱，转而拆下维护架上的备用组件，把它们留作之后的治疗手段。", [
        outcome("supplies-a", "两只医疗包被送到出口，消毒仓没有改变队伍状态。", [item("medical-kit-c", 2)]),
        outcome("supplies-b", "医疗包和圣水一起被识别，净化液填满了备用槽。", [item("medical-kit-c"), item("holy-water-c")]),
      ]),
      choice("pizza", "用披萨换取高级装备处理", "需要 披萨 ×1；防具候选 2 选 1，或随机防具并全队治疗 15%", "你用披萨启动消毒仓的高级装备协议。", [
        outcome("pizza-a", "两件防具完成消毒并被列为候选，属性信息完整公开。", [equip(2, "armor")]),
        outcome("pizza-b", "消毒仓随机推出一件防具，同时释放恢复雾气。", [equip(1, "armor"), { type: "HEAL_PARTY", percent: 0.15 }]),
      ], 0, cost("pizza")),
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
      choice("assets", "撕毁绩效报告，改查资产", "寻找资源芯片或机械部件", "你放弃经验结算，拆开审计终端，寻找被隐藏的部门资产。", [
        outcome("assets-a", "终端底部藏着一枚用于管理部门物资的资源芯片。", [item("resource-chip")]),
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
      choice("manual", "亲自给机械臂分工", "取得磁轨衬层、齿轮或资源芯片", "你逐条设定机械臂的目标，避免它们互相抢夺运输路线。", [
        outcome("manual-a", "机械臂从停机轨道上拆下完整衬层，并将一枚齿轮送到交付台。", items(item("mag-rail-lining"), item("standard-gear"))),
        outcome("manual-b", "精确调度让一只隐藏货箱被找了出来，里面保存着资源芯片。", [item("resource-chip")]),
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
      choice("replay", "亲自重演一段战术", "集中培养一名角色并可能取得资源芯片", "你选择一名角色进入投影场景，让他独自完成一段高压训练。", [
        outcome("replay-a", "该角色完成了完整的战术回放，所有训练反馈都被写入他的个人档案。", [oneExp(34)]),
        outcome("replay-b", "回放中途出现错误，但角色仍完成了训练，系统额外留下了一枚资源芯片。", [oneExp(22), item("resource-chip")]),
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
    description: "展示厅里的装备没有被锁在黑箱中，而是以全息投影的方式公开显示。系统允许队伍选择查看武器、防具，或者直接校准现有装备。",
    energyDelta: 0,
    hiddenRest: { foodItemId: "fried-chicken", npcId: "npc-mobile-mechanic" },
    choices: [
      choice("weapon", "查看武器展柜", "公开 2 或 3 件武器候选", "你要求系统只显示适合武器槽的装备。", [
        outcome("weapon-a", "三件武器的攻击、命中和暴击属性被完整投影，你从中选走一件。", [equip(3, "weapon")]),
        outcome("weapon-b", "展厅只找到两件武器，但维护台同时推出了一枚齿轮。", [equip(2, "weapon"), item("standard-gear")]),
      ]),
      choice("defense", "查看防具展柜", "公开防具或饰品候选", "你让展示厅关闭武器投影，寻找防具和饰品库存。", [
        outcome("defense-a", "两件防具的生命、防御和规则属性全部公开，系统没有隐藏任何负面属性。", [equip(2, "armor")]),
        outcome("defense-b", "饰品柜比防具柜保存得更好，三件饰品连同羁绊信息一起显示出来。", [equip(3, "trinket")]),
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
      choice("sort", "精细分拣", "取得废料和机械部件", "你逐个检查传送带上的废料，只保留能完整拆解的部分。", [
        outcome("sort-a", "大多数零件已经损坏，但两块废料和一枚齿轮还可以带回据点。", items(item("scrap-piece", 2), item("standard-gear"))),
        outcome("sort-b", "你从一堆普通碎片里找出了完整合金和一块没有漏液的电池。", items(item("scrap-alloy"), item("standard-battery"))),
      ]),
      choice("compress", "启动高压压缩", "额外消耗 3 粒子，取得高品质废料", "你让压缩塔快速运行，把整条传送带上的部件一次性处理。", [
        outcome("compress-a", "高压压缩把大量普通碎片凝成了一枚完整废料核心。", [item("scrap-core")]),
        outcome("compress-b", "压缩塔的合金分离功能仍然有效，两块高纯度废料被推出。", [item("scrap-alloy", 2)]),
      ], 3),
      choice("crate", "搜索废料下方的完整货箱", "取得消耗品或公开饰品候选", "你关闭压缩带，派人打开最底部的货箱层。", [
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
        outcome("hardware-b", "数据线路上的导电墨料和一枚资源管理芯片被完整取出。", items(item("conductive-ink"), item("resource-chip"))),
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
      choice("strategy", "进入战略席位", "公开装备候选或获得免费重铸与资源芯片", "你坐到会议桌前，让系统把队伍登记为战略项目组。", [
        outcome("strategy-a", "董事会投影批准了战略资产调拨，三件装备的全部资料被公开。", [equip(3)]),
        outcome("strategy-b", "投影没有批准新装备，却允许你重新生成一件装备的随机羁绊，并发放资源芯片。", [{ type: "REFORGE_BOND" }, item("resource-chip")]),
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
    economy: [],
    route: [],
    energy: [],
    hazard: [],
    endgame: [],
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
