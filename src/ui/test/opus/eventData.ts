// 事件面板 demo 的静态内容。
// ⚠ 这里是**演示用**数据, 不接 explore 引擎 —— 面板只关心「一个事件长什么样」,
//   所以把类型、文案、选项、结算摘要全部平铺成常量, 换一套皮就能看新效果。

/** 资源标识。demo 只用四种, 够覆盖「够/不够/不消耗」三种选项状态。 */
export type ResourceId = "stamina" | "supply" | "credit" | "time";

export interface ResourceMeta {
  /** 面板上显示的短名。 */
  label: string;
  /** 资源条与消耗标签共用的单字符号 —— 比图标可控, 且不依赖素材。 */
  sigil: string;
}

export const RESOURCE_META: Record<ResourceId, ResourceMeta> = {
  stamina: { label: "体力", sigil: "◆" },
  supply: { label: "物资", sigil: "▣" },
  credit: { label: "信用点", sigil: "◇" },
  time: { label: "时限", sigil: "◷" },
};

/** demo 的资源池: 故意让「信用点」很少, 好让第三个选项自然进入禁用态。 */
export const RESOURCE_POOL: Record<ResourceId, number> = {
  stamina: 9,
  supply: 4,
  credit: 1,
  time: 3,
};

export type EventKind = "survival" | "growth" | "risk";

/** 结算摘要的一行。tone 决定颜色: 收益 / 代价 / 中性。 */
export interface OutcomeEntry {
  label: string;
  value: string;
  tone: "gain" | "cost" | "neutral";
}

export interface EventOption {
  id: string;
  /** 选项名称。编号由渲染顺序生成, 数据里不写死。 */
  name: string;
  /** 名称下方的一行提示, 说明这条路「大概会发生什么」。 */
  hint: string;
  /** 资源消耗。空数组 = 无消耗选项(通常是保守路线)。 */
  costs: Array<{ res: ResourceId; amount: number }>;
  /** 选择后的故事结果正文。 */
  story: string;
  /** 结算摘要。 */
  outcome: OutcomeEntry[];
  /** 是否产出需要玩家另行处理的奖励(拾取框 / 待办奖励队列)。 */
  reward?: { title: string; detail: string };
}

export interface EventDemo {
  kind: EventKind;
  /** 类型徽章文字。 */
  kindLabel: string;
  /** 事件序号, 给类型切换器的小字与标题水印用。 */
  serial: string;
  /** 面板右上的事件编号, 纯装饰但能让面板「像一份档案」。 */
  code: string;
  title: string;
  subtitle: string;
  /** 插图下方的三个标签。 */
  tags: string[];
  desc: string;
  options: EventOption[];
}

export const EVENT_DEMOS: Record<EventKind, EventDemo> = {
  survival: {
    kind: "survival",
    kindLabel: "生存",
    serial: "207",
    code: "EVT-207 / 废弃楼层",
    title: "锈蚀的净水阀",
    subtitle: "生存事件 · 可重复触发",
    tags: ["污染 -1", "净化站", "小队共享"],
    desc: "循环泵还在跳动，管道尽头的阀门被结晶封死。仪表说水是干净的，锈味说不是。队里有人已经开始舔嘴唇了。",
    options: [
      {
        id: "flush",
        name: "强行冲洗管路",
        hint: "用备用物资顶开结晶，代价是一次性消耗",
        costs: [
          { res: "supply", amount: 2 },
          { res: "time", amount: 1 },
        ],
        story:
          "阀门在第三次撞击后松动，浑浊的水柱喷了满脸，随后逐渐清澈。你们灌满了所有能装水的东西，管道在身后继续呻吟。",
        outcome: [
          { label: "全队污染", value: "-1", tone: "gain" },
          { label: "净水储备", value: "+3", tone: "gain" },
          { label: "物资", value: "-2", tone: "cost" },
          { label: "推进时限", value: "-1", tone: "cost" },
        ],
        reward: { title: "拾取框待处理", detail: "净水囊 ×3 已进入拾取框，确认前需先处理" },
      },
      {
        id: "sample",
        name: "只取一小份样本",
        hint: "谨慎路线，不消耗任何资源",
        costs: [],
        story:
          "你只灌了半个水囊就退开。回程路上没人抱怨，但也没人真正解渴——至少仪表盘上的污染读数没有再往上爬。",
        outcome: [
          { label: "全队污染", value: "±0", tone: "neutral" },
          { label: "净水储备", value: "+1", tone: "gain" },
        ],
      },
      {
        id: "rebuild",
        name: "重建整段滤芯",
        hint: "需要向据点购置滤材，信用点不足时不可选",
        costs: [
          { res: "credit", amount: 3 },
          { res: "stamina", amount: 2 },
        ],
        story: "滤芯到位，整层楼的水路重新接通。",
        outcome: [
          { label: "全队污染", value: "-3", tone: "gain" },
          { label: "区域增益", value: "净水循环", tone: "gain" },
          { label: "信用点", value: "-3", tone: "cost" },
        ],
      },
    ],
  },
  growth: {
    kind: "growth",
    kindLabel: "成长",
    serial: "118",
    code: "EVT-118 / 废弃楼层",
    title: "训练舱的残响",
    subtitle: "成长事件 · 单次",
    tags: ["经验", "卡牌机会", "单人"],
    desc: "这台旧训练舱还留着上一位使用者的动作记录。屏幕上循环播放着一段没能完成的连招，像在等人替它打完。",
    options: [
      {
        id: "drill",
        name: "跟着记录练一轮",
        hint: "消耗体力换取经验，稳定收益",
        costs: [{ res: "stamina", amount: 3 }],
        story:
          "你把那段连招重复了四十七遍。第四十八遍时，训练舱终于安静下来，屏幕上跳出一行绿色的「完成」。",
        outcome: [
          { label: "队伍经验", value: "+240", tone: "gain" },
          { label: "体力", value: "-3", tone: "cost" },
        ],
        reward: { title: "待办奖励", detail: "卡牌三选一：来自训练舱的三张残响卡" },
      },
      {
        id: "extract",
        name: "拆出记录芯片",
        hint: "破坏训练舱，换成可携带的材料",
        costs: [{ res: "time", amount: 1 }],
        story: "训练舱在断电前闪了一下。你把芯片撬下来时，那段连招还在你的视网膜上晃。",
        outcome: [
          { label: "记录芯片", value: "×1", tone: "gain" },
          { label: "队伍经验", value: "+60", tone: "gain" },
          { label: "推进时限", value: "-1", tone: "cost" },
        ],
        reward: { title: "拾取框待处理", detail: "记录芯片 ×1 已进入拾取框，确认前需先处理" },
      },
    ],
  },
  risk: {
    kind: "risk",
    kindLabel: "风险",
    serial: "431",
    code: "EVT-431 / 废弃楼层",
    title: "无人应答的电梯井",
    subtitle: "风险事件 · 结果随机",
    tags: ["加权结果", "污染", "高回报"],
    desc: "井道深处传来规律的金属敲击，三下一停，像某种还没死透的信号。绳索够长，但只够下去一次。",
    options: [
      {
        id: "descend",
        name: "顺绳索下探",
        hint: "高风险高回报，结果由远征随机数决定",
        costs: [
          { res: "stamina", amount: 4 },
          { res: "time", amount: 1 },
        ],
        story:
          "敲击声在你下到第九层时停了。井底躺着一个还没被翻过的补给箱，和一具握着扳手的骸骨——它的手指在你伸手时收紧了半寸。",
        outcome: [
          { label: "抽取结果", value: "重大发现", tone: "gain" },
          { label: "稀有材料", value: "×2", tone: "gain" },
          { label: "污染", value: "+2", tone: "cost" },
          { label: "体力", value: "-4", tone: "cost" },
        ],
        reward: { title: "拾取框待处理", detail: "稀有材料 ×2 已进入拾取框，确认前需先处理" },
      },
      {
        id: "listen",
        name: "在井口回敲三下",
        hint: "不消耗资源，但可能惊动下面的东西",
        costs: [],
        story: "你敲了三下。井道沉默了很久，然后回了四下。你们决定当作没听见，把井盖压了回去。",
        outcome: [
          { label: "抽取结果", value: "无事发生", tone: "neutral" },
          { label: "怪癖", value: "疑神疑鬼", tone: "cost" },
        ],
      },
      {
        id: "seal",
        name: "焊死井盖再走",
        hint: "花费物资彻底封闭，规避后续风险",
        costs: [
          { res: "supply", amount: 2 },
          { res: "credit", amount: 2 },
        ],
        story: "焊枪烧完最后一格电。井盖封住了，敲击声还在下面，但已经不是你的问题了。",
        outcome: [
          { label: "区域风险", value: "已清除", tone: "gain" },
          { label: "物资", value: "-2", tone: "cost" },
          { label: "信用点", value: "-2", tone: "cost" },
        ],
      },
    ],
  },
};

export const EVENT_KINDS: EventKind[] = ["survival", "growth", "risk"];
