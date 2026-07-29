// 遭遇战数据 —— enemies 引用 enemies.ts 的敌人 id(可重复, createBattle 会自动加 A/B/C 后缀)。
// 遭遇战的编排顺序不在此定义 —— 见 maps.ts, 由 MapDef.sequence 串成一次远征。
//
// 站位: 敌人默认由 .enemy-row 的 flex 水平居中自动排布; 想让某场战斗的敌人贴合背景地面时,
// 把该槽位从 "id" 字符串改写成 { id, dx, dy, scale } 对象 —— 两种写法可在同一数组里混用,
// 字符串等价于 { id } (无偏移)。坐标是"相对默认位置推开多少设计 px", 不是绝对坐标, 故未标注的
// 遭遇战行为完全不变。消费方见 ui/CombatantView.tsx(下发 CSS 变量)与 ui/CombatantView.css(.combatant)。

// 单位是"设计 px": 战斗画面是固定 1920×1080 的设计画布, 整体等比缩放去适配窗口(见 ui/stage.ts),
// 故这里的偏移与玩家的实际分辨率无关 —— 一次调好, 任何窗口尺寸下站位都与背景严丝合缝。
export interface EnemyPlacement {
  id: string; // 敌人 def id
  dx?: number; // 相对默认位置的水平偏移(设计 px), 右为正
  dy?: number; // 相对默认位置的垂直偏移(设计 px), 下为正 —— 往下 = 站得更靠近镜头
  // 体型/远近透视缩放, 缺省 1。只作用于立绘与命中特效 —— 血条、护盾/BUFF 图标、意图、
  // 倒计时全场统一尺寸, 不跟着放大。缩放中心是立绘底边中点, 故改 scale 时脚不离地,
  // 立绘只向上长, 不必回头补 dy。
  scale?: number;
}

// 字符串 = 用默认排布位置; 对象 = 手工指定站位。
export type EnemySlot = string | EnemyPlacement;

export interface EncounterDef {
  id: string;
  name: string;
  enemies: EnemySlot[];
}

// 两个 slot 取值器 —— 引擎只关心打谁(slotDefId), UI 只关心站哪(slotPlacement)。
export function slotDefId(slot: EnemySlot): string {
  return typeof slot === "string" ? slot : slot.id;
}

// 无偏移(字符串写法或对象只写了 id)时返回 undefined, 由 UI 走默认排布。
export function slotPlacement(slot: EnemySlot): EnemyPlacement | undefined {
  if (typeof slot === "string") return undefined;
  return slot.dx == null && slot.dy == null && slot.scale == null ? undefined : slot;
}

export const ENCOUNTERS: EncounterDef[] = [
  { id: "e1", name: "林间怪响", enemies: ["weird-bird", "weird-bird"] },
  { id: "e2", name: "惊起的鸟群", enemies: ["weird-bird", "weird-bird", "weird-bird"] },
  { id: "e3", name: "巢穴深处", enemies: ["weird-bird", "weird-bird", "weird-bird", "weird-bird"] },
  // 霓虹城市: 三台机器人散开在街上, 左右两台站得稍远, 中间的废品机器人压向镜头。
  // 电线杆立绘细高, 给更大的 scale 撑出"高"的体型; 收音机体型接近废品, scale 取中。
  //
  // ⚠ 底部 HUD 改造后 dx 整体 +195(旧值 -420 / -150 / 50): 舞台不再避让左侧手牌栏
  // (左边缘 406 → 16), 水平中心因此西移 195px —— 加回去才让敌人停在与改造前**完全相同**的
  // 绝对位置上(背景没动, 地面线也没动)。dy 不变, 垂直方向舞台顶边未变。
  {
    id: "n1",
    name: "废墟拾荒者",
    enemies: [
      { id: "pole-bot", dx: -125, dy: 350, scale: 1.5 },
      { id: "radio-bot", dx: 45, dy: 450, scale: 1.2 },
      { id: "scrap-bot", dx: 245, dy: 400, scale: 1.5 },
    ],
  },
  // ── 废弃楼层的路由终点战(见 探索模式设计.md §8.3) ──
  // 站位沿用 n1 那套已经和霓虹城市背景对好的坐标, 只是按人数取其中几个位置,
  // 免得每加一场战斗都要重新对一遍地面线。
  {
    id: "n-crew",
    name: "清运班组",
    enemies: [
      { id: "scrap-bot", dx: -125, dy: 400, scale: 1.5 },
      { id: "scrap-bot", dx: 245, dy: 400, scale: 1.5 },
    ],
  },
  {
    id: "n-beacon",
    name: "巡回信标",
    enemies: [
      { id: "radio-bot", dx: -125, dy: 450, scale: 1.2 },
      { id: "scrap-bot", dx: 245, dy: 400, scale: 1.5 },
    ],
  },
  {
    id: "n-compactor",
    name: "报废压缩机",
    enemies: [
      { id: "pole-bot", dx: 45, dy: 350, scale: 1.8 },
      { id: "scrap-bot", dx: -195, dy: 420, scale: 1.4 },
      { id: "scrap-bot", dx: 285, dy: 420, scale: 1.4 },
    ],
  },
  {
    id: "n-boss",
    name: "回收总控",
    enemies: [
      { id: "pole-bot", dx: 45, dy: 330, scale: 2 },
      { id: "radio-bot", dx: -215, dy: 450, scale: 1.2 },
      { id: "scrap-bot", dx: 305, dy: 400, scale: 1.5 },
    ],
  },
];
