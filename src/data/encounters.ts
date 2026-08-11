// 遭遇战数据 —— enemies 引用 enemies.ts 的敌人 id(可重复, createBattle 会自动加 A/B/C 后缀)。
// 遭遇战的编排顺序不在此定义 —— 见 maps.ts, 由 MapDef.sequence 串成一次远征。
//
// 站位: 敌人默认由 .enemy-row 的 flex 水平居中自动排布; 想让某场战斗的敌人贴合背景地面时,
// 把该槽位从 "id" 字符串改写成 { id, dx, dy, scale } 对象 —— 两种写法可在同一数组里混用,
// 字符串等价于 { id } (无偏移)。坐标是"相对默认位置推开多少设计 px", 不是绝对坐标, 故未标注的
// 遭遇战行为完全不变。消费方见 ui/CombatantView.tsx(下发 CSS 变量)与 ui/CombatantView.css(.combatant)。

// 单位是"设计 px": 战斗画面是固定 1920×1080 的设计画布, 整体等比缩放去适配窗口(见 ui/stage.ts),
// 故这里的偏移与玩家的实际分辨率无关 —— 一次调好, 任何窗口尺寸下站位都与背景严丝合缝。
// 主体高度基准由 styles/tokens.css 的 --foe-figure-h 定义, scale 是在其之上的乘数;
// 基准变化时只需重新换算 scale, dx/dy 不随之移动。
export interface EnemyPlacement {
  id: string; // 敌人 def id
  dx?: number; // 相对默认位置的水平偏移(设计 px), 右为正
  dy?: number; // 相对默认位置的垂直偏移(设计 px), 下为正 —— 往下 = 站得更靠近镜头
  // 体型/远近透视缩放, 缺省 1。只作用于立绘与命中特效 —— 血条、护盾/BUFF 图标、意图、
  // 倒计时全场统一尺寸, 不跟着放大。缩放中心是立绘底边中点, 故改 scale 时脚不离地,
  // 立绘只向上长, 不必回头补 dy。
  scale?: number;
  // 立绘左右镜像。同一台敌人在左右两侧同时出场时, 给右侧那台开 true, 两台就"面朝彼此"
  // 而不是排成同向的复制粘贴。只翻立绘本身 —— 血条/BUFF/意图/倒计时与命中特效都不翻转
  // (消费方见 ui/battle/CombatantView 与 ui/battle/EnemySprite)。
  flip?: boolean;
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
  return slot.dx == null && slot.dy == null && slot.scale == null && slot.flip == null
    ? undefined
    : slot;
}

// 当前所有遭遇战统一成"两台收音机机器人夹一台电线杆机器人"的临时配置(立绘验证期):
// 三个槽位共用 dy 219.625 地面线; 左右收音机开 flip 走左右镜像, 三台敌人面朝中间。
// radio-bot 新模型按主体高度归一。旧模型整图高 256px, 新模型主体高 1619px/2048px;
// 为保持旧观感取 scale = 1619/2048 ≈ 0.7905。旧整图底部留白为
// (2048 - 186 - 1619) × 256/2048 = 30.375px, 故 dy 从 250 减到 219.625,
// 把新脚线拉回原地面线。后续 scale 仍以主体脚线为中心, 单独调体型无需再补 dy。
//
// 三台时 .enemy-row 的布局宽为 3×256 + 2×20 = 808px, 相比两台的 532px,
// 默认左槽中心从 -138 西移到 -276。dx 是相对默认槽位的偏移, 为保持两台收音机
// 与改动前的绝对位置不变, 左侧补偿 -200 + 138 = -62, 右侧补偿 200 - 138 = 62;
// 中间槽默认中心就是 0, 所以不补偿。以后增删敌人时, 先按布局宽变化重新计算补偿。
//
// ⚠ 底部 HUD 改造后 dx 整体 +195(旧值 -320 / 50): 舞台不再避让左侧手牌栏
// (左边缘 406 → 16), 水平中心因此西移 195px —— 加回去才让敌人停在与改造前**完全相同**的
// 绝对位置上(背景没动, 地面线也没动)。dy 不变, 垂直方向舞台顶边未变。
const RADIO_TRIO: EnemySlot[] = [
  { id: "radio-bot", dx: -62, dy: 219.625, scale: 1 },
  { id: "pole-bot", dx: 0, dy: 80, scale: 1.4 },
  { id: "radio-bot", dx: 62, dy: 219.625, scale: 1, flip: true },
];

export const ENCOUNTERS: EncounterDef[] = [
  {
    id: "n1",
    name: "废墟拾荒者",
    enemies: RADIO_TRIO,
  },
  // ── 废弃楼层的路由终点战(见 探索模式设计.md §8.3) ──
  {
    id: "n-crew",
    name: "清运班组",
    enemies: RADIO_TRIO,
  },
  {
    id: "n-beacon",
    name: "巡回信标",
    enemies: RADIO_TRIO,
  },
  {
    id: "n-compactor",
    name: "报废压缩机",
    enemies: RADIO_TRIO,
  },
  {
    id: "n-boss",
    name: "回收总控",
    enemies: RADIO_TRIO,
  },
];
