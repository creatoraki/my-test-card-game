// 遭遇战数据 —— enemies 引用 enemies.ts 的敌人 id(可重复, createBattle 会自动加 A/B/C 后缀)。
// 遭遇战的编排顺序不在此定义 —— 见 maps.ts, 由 MapDef.sequence 串成一次远征。
//
// ★ 本文件是「战斗配置模板」的登记处(废弃楼层首图): 根据 enemies.ts 的小怪/精英/BOSS 分层,
//   用 4 种小怪自由组合出轻/中战斗模板, 用 2 种精英撑起"重"档位模板, 再加 1 个 BOSS 收束战。
//   同一张模板可被多张战斗事件卡复用(见 design/关卡事件设计/废弃楼层/废弃楼层-战斗事件.md §四),
//   多张事件卡引用同一模板时, 敌人编队、数量、站位与强度完全相同, 差异只来自卡面叙事。
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

// ---------------------------------------------------------------------------
// 站位常量 —— 废弃楼层战斗背景的地面线。立绘主体高度已由 enemyArt.ts 的 body 归一,
// dy 219.625 把各立绘脚线统一压到同一地面线上; scale 只调体型(脚不离地)。
// 已知体型基准(供上面各模板乘用): 清扫无人机 1.2 / 收音机 1 / 红绿灯 1.15 /
// 维修蜘蛛 0.72 / 电线杆(瘦高)1.4 / 废品机器人 1 / 垃圾山的守护者(单人 BOSS)2.4。
// ---------------------------------------------------------------------------
const GROUND_DY = 219.625;
const SPIDER_DY = GROUND_DY + 80 ;

// 批量生成"站在地面线上、体型固定"的槽位(可额外指定水平偏移与 flip)。
function g(id: string, scale: number, dx = 0, flip = false): EnemyPlacement {
  return { id, dx, dy: GROUND_DY, scale, flip };
}

function spider(dx: number): EnemyPlacement {
  return { id: "maintenance-spider", dx, dy: SPIDER_DY, scale: 0.8 };
}

// ── 小怪战斗模板(轻 3 只 / 中 4 只, 只用 4 种小怪) ───────────────────────────

// 轻战斗 · 教学: 侦察 + 高速机动。教玩家看意图、理解"敌人掉落按各自结算"。
const CREW = [
  g("radio-bot", 1, -120),
  spider(0),
  g("sweep-drone", 1.2, 120, true),
];
// 轻战斗 · 纯机动: 两台高速无人机与一台支援单位, 教玩家专一处理一个目标类型。
const SWEEP = [
  g("radio-bot", 1, -120),
  g("sweep-drone", 1.2, 0),
  g("sweep-drone", 1.2, 120, true),
];
// 中战斗 · 控制+暴露+机动: 红绿灯控制、收音机易伤、无人机突破, 教玩家判断先杀谁。
const BEACON = [
  g("radio-bot", 1, -180),
  g("traffic-light-bot", 1.15, -60),
  spider(60),
  g("sweep-drone", 1.2, 180),
];
// 中战斗 · 支援+控制+暴露: 蜘蛛奶、红绿灯控、收音机暴露, 走"拖节奏"路线。
const PATROL = [
  g("radio-bot", 1, -180, true),
  g("traffic-light-bot", 1.15, -60),
  spider(60),
  g("sweep-drone", 1.2, 180),
];

// ── 精英战斗模板(重, 单场 2-3 只, 至少含 1 只精英) ──────────────────────────

// 重战斗 · 双精英正面对撞: 废品压块 + 高压电网, 玩家要同时处理封罐/护甲与升压/穿刺。
const COMPACTOR = [g("scrap-bot", 1, -96), g("pole-bot", 1.4, 96)];
// 重战斗 · 高压精英被支援保护: 电线杆 + 维修蜘蛛 + 收音机, 教玩家先清支援再碰精英。
const ELITE_GUARD = [
  g("radio-bot", 1, -120),
  spider(0),
  g("pole-bot", 1.4, 120),
];

// ── BOSS 战(单场 1 只) ──────────────────────────────────────────────────────

const BOSS_SLOT: EnemyPlacement = { id: "scrap-mountain-guardian", dy: -60, scale: 2.4 };

export const ENCOUNTERS: EncounterDef[] = [
  // ── 小怪战(轻) ──
  {
    id: "n-crew",
    name: "清运班组",
    enemies: CREW,
  },
  {
    id: "n-sweep",
    name: "清扫网",
    enemies: SWEEP,
  },
  // ── 小怪战(中) ──
  {
    id: "n-beacon",
    name: "巡回信标",
    enemies: BEACON,
  },
  {
    id: "n-patrol",
    name: "维修巡线",
    enemies: PATROL,
  },
  // ── 精英战(重) ──
  {
    id: "n-compactor",
    name: "报废压缩机",
    enemies: COMPACTOR,
  },
  {
    id: "n-elite-guard",
    name: "高压拦截",
    enemies: ELITE_GUARD,
  },
  // ── BOSS 收束战 ──
  {
    id: "n-boss",
    name: "回收总控",
    enemies: [BOSS_SLOT],
  },
];
