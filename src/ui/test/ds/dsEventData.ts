// ds 事件面板演示数据 —— 纯展示内容，不承载任何游戏规则。
// 三种事件类型沿用探索域的事件类型色契约（风险=琥珀 / 成长=青绿 / 交易=紫），
// 每个事件 3 个选项：两个可执行 + 一个禁用演示；交易事件无待处理奖励，用来演示确认直接解锁。

export type DsEventType = "hazard" | "growth" | "trade";

export type CostTone = "amber" | "cyan" | "red";

/** 资源消耗的呈现方式：spend 消耗 / gain 获得 / none 无消耗 / lock 条件不足。 */
export type CostKind = "spend" | "gain" | "none" | "lock";

export interface DsOption {
  id: string;
  name: string;
  desc: string;
  /** 资源消耗文案，如「机械零件 ×1」。 */
  cost: string;
  costKind: CostKind;
  costTone: CostTone;
  /** 选择后的故事结果，逐字演出。 */
  result: string;
  /** 结算摘要，逐条揭晓。 */
  notes: string[];
  disabled?: boolean;
  disabledReason?: string;
}

export interface DsEvent {
  type: DsEventType;
  /** 档案标签，如「RISK EVENT / 07」。 */
  label: string;
  title: string;
  description: string;
  accent: string;
  sceneName: string;
  options: DsOption[];
  /** 待处理奖励（可为空：空数组表示本事件无奖励，结算播完直接解锁确认）。 */
  rewards: string[];
}

export const EVENT_TYPE_LABELS: Record<DsEventType, string> = {
  hazard: "风险事件",
  growth: "成长事件",
  trade: "交易事件",
};

export const EVENT_CONTENT: Record<DsEventType, DsEvent> = {
  hazard: {
    type: "hazard",
    label: "RISK EVENT / 07",
    title: "数据风暴眼",
    description:
      "废弃楼层的通讯井里卷起一团数据风暴。碎玻璃悬浮在半空，被染成琥珀色的电弧沿墙面爬行。风暴眼深处似乎裹着什么东西，每一次靠近，警报的频率都会更快。",
    accent: "#e3aa72",
    sceneName: "STORM EYE / 07",
    options: [
      {
        id: "deploy-beacon",
        name: "部署屏蔽信标",
        desc: "让风暴安静下来，再从冷却仓中取走物资。",
        cost: "机械零件 ×1",
        costKind: "spend",
        costTone: "amber",
        result: "你在最后一声警报前启动了信标。风暴像被按下静音键，缓缓沉降成地面上一层细碎的光尘。",
        notes: ["获得 冷凝芯片 ×2", "队伍污染 -4", "消耗 机械零件 ×1"],
        rewards: ["冷凝芯片 ×2"],
      },
      {
        id: "breach-core",
        name: "突入风暴核心",
        desc: "用暴力换取更高收益，但动静会惊动整层楼。",
        cost: "体力 ×8",
        costKind: "spend",
        costTone: "red",
        result: "风暴眼在你的掌心裂开，滚烫的数据流喷涌而出，像一条被惊醒的发光河。",
        notes: ["获得 稀有模块 ×1", "队伍污染 +6", "消耗 体力 ×8"],
        rewards: ["稀有模块 ×1"],
      },
      {
        id: "emergency-protocol",
        name: "激活应急协议",
        desc: "读取通讯井的最后一条维护记录。",
        cost: "解码芯片 ×1",
        costKind: "lock",
        costTone: "red",
        result: "终端拒绝了你的请求，屏幕上只留下一个不断漂移的坐标。",
        notes: ["暂时无法执行", "未获得奖励"],
        disabled: true,
        disabledReason: "资源不足",
      },
    ],
  },
  growth: {
    type: "growth",
    label: "GROWTH EVENT / 03",
    title: "地下温室",
    description:
      "透明穹顶下的培育舱还亮着微弱的暖光。那株陌生植物的根系缠住了供能管线，叶片在无风的空间里轻轻起伏，像是在等待一个愿意伸手的人。",
    accent: "#8ac8a5",
    sceneName: "GLASSHOUSE 03",
    options: [
      {
        id: "harvest",
        name: "采集成熟样本",
        desc: "保留根系，为队伍带回一份稳定的补给。",
        cost: "无消耗",
        costKind: "none",
        costTone: "cyan",
        result: "你小心摘下成熟的果实，温暖的香气在密闭的空气里散开，驱散了连日积攒的疲惫。",
        notes: ["获得 净化果实 ×1", "队伍士气 +2"],
        rewards: ["净化果实 ×1", "经验 +40"],
      },
      {
        id: "transplant",
        name: "移植整株植物",
        desc: "带走培育舱，也许它能在据点继续生长。",
        cost: "空置容器 ×1",
        costKind: "spend",
        costTone: "amber",
        result: "根系被完整地收进容器，微光顺着你的手臂一路亮到舱门。",
        notes: ["获得 据点种植素材", "后续事件已解锁"],
        rewards: ["据点种植素材"],
      },
      {
        id: "burn",
        name: "焚烧清理",
        desc: "用火焰清理潜伏的孢子污染。",
        cost: "火焰模块 ×1",
        costKind: "lock",
        costTone: "red",
        result: "火焰吞没温室，灰烬里露出一枚旧徽章。",
        notes: ["获得 未知徽章 ×1", "装备栏已满"],
        disabled: true,
        disabledReason: "装备栏已满",
      },
    ],
  },
  trade: {
    type: "trade",
    label: "TRADE EVENT / 12",
    title: "废弃货栈拍卖",
    description:
      "锈蚀的传送带把一个个货箱送进拍卖区。电子屏上的报价不断跳动，几个裹着旧斗篷的买家站在阴影里，用沉默竞价。这里的规矩只有一条：落锤之前，什么都可以谈。",
    accent: "#b8a9d1",
    sceneName: "AUCTION DECK 12",
    options: [
      {
        id: "bid-battery",
        name: "竞拍电池箱",
        desc: "入手一批仍有余电的动力电池。",
        cost: "信用点 ×200",
        costKind: "spend",
        costTone: "amber",
        result: "落锤声在货栈里荡开。你接过沉甸甸的电池箱，指示灯依次亮起，像一排在黑暗中睁开的眼睛。",
        notes: ["获得 动力电池 ×3", "消耗 信用点 ×200"],
        rewards: [],
      },
      {
        id: "sell-intel",
        name: "出售楼层情报",
        desc: "把探明的通道图卖给沉默的买家。",
        cost: "信用点 ×150",
        costKind: "gain",
        costTone: "cyan",
        result: "买家只扫了一眼终端，便推过来一小叠信用点。通道图在对方手中折成纸鹤，消失进斗篷里。",
        notes: ["获得 信用点 ×150", "情报已售出"],
        rewards: [],
      },
      {
        id: "meet-owner",
        name: "接触货栈主人",
        desc: "谈一笔不摆在台面上的生意。",
        cost: "推荐信 ×1",
        costKind: "lock",
        costTone: "red",
        result: "守卫拦住了你：货栈主人只接待持推荐信的客人。",
        notes: ["暂时无法执行", "未获得奖励"],
        disabled: true,
        disabledReason: "声望不足",
      },
    ],
  },
};
