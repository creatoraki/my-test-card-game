// ============================================================================
// 出牌动画预设表(纯 UI 表现层)。
// 每个 CardAnim 对应一套: 攻击/辅助分类 + 首击特效(emoji 或序列帧) + 主色 + 时间轴参数。
// 具体视觉(受击抖动/斩击/火爆/柔光…)在 ui/HitFxLayer.css 里按 .vfx-<anim> / 反馈类实现。
// ============================================================================

import type { Card, CardAnim } from "@/engine";
import { CARD_DEFS, type EnemyMove } from "@/data";

// 卡牌定义表的 anim 索引: 卡实例随城镇档案持久化(localStorage), 实例上固化的 anim
// 副本会在改数据后过期 —— 旧档的卡永远放老特效。anim 是纯表现字段, 故按定义表实时
// 解析。不走 getCardDef: 它对未知 id 直接 throw, 而存档可能残留已删定义的旧卡。
const DEF_ANIM = new Map(CARD_DEFS.map((d) => [d.id, d.anim]));

// 程序化 CSS 特效参数。视觉几何在各自 Fx 组件中, 这里只放 JS 要消费的时序。
export interface ProcFxPreset {
  // 挂载 → 斩击爆发的偏移(ms), = 蓄力时长(压暗+光点渐亮)。
  // runSteps 用它推迟顿帧/震屏, hitFxVars 用它推迟受击抖动/闪白与飘字。
  impactMs: number;
  floatMs: number; // 飘字时长(压缩): impactMs + floatMs 须小于命中特效的 hold, 否则飘字被卸载截断
  // 掉血(commit 快照)是否推迟到 impactMs。缺省 false = 挂载即结算(历史行为, iai-slash 依赖它)。
  // 蓄力型特效(爆点远晚于挂载)置 true, 否则血条会在爆开前就掉完。
  damageAtImpact?: boolean;
}

export interface AnimPreset {
  kind: "attack" | "support"; // attack: 目标受击特效; support: 目标柔和光效
  emoji?: string; // 首击特效图形(无 sprite/proc/icon 时使用)
  proc?: ProcFxPreset; // 程序化 CSS 特效
  icon?: "shield"; // 图标特效(复用 BUFF 图标 SVG, 优先于 emoji); 渲染映射见 HitFxLayer 的 ICON_FX
  screenFx?: "dim" | "flash" | "blood" | "glitch"; // 可选的场景外全屏层
  color: string; // 主色(用于闪光/冲击环/光晕/飘字着色)
  windup: number; // ms: 施法者前冲蓄力 → 命中时刻(伤害/特效在此刻触发)
  hold: number; // ms: 命中后特效(含飘字)完整播放所需时长
  // 震屏档位仅作为 pickShot 的选档输入; 实际幅度唯一由 camera/shots.ts 的 SHOTS[*].shake 决定。
  shake: 0 | 1 | 2;
}

// ── 分镜运镜时间轴(ms)与相机参数 ──
// 分档节奏由 camera/shots.ts 消费。这里保留透视、瞄准和亮相卡等跨组件的视觉契约，
// 相机运动本身由 camera/useCameraRig.ts 的 rAF 循环接管。
export const CINEMA = {
  // ── 3D 场景 ──
  // 透视距离(世界 px, 即设计画布的坐标系), 下发为 .screen.battle 的 perspective 属性。
  // 相机的"推近"实为沿视线推进 z = P(1-1/s)。越小畸变与视差越强: 1000 很"广角",
  // 2600 接近正交(退化回 2D 平推)。
  perspective: 1400,

  // 世界层的整体漂移默认关闭。局部立绘仍由 CombatantView 的 idleBob 提供待机呼吸。
  idleDrift: { x: 0, y: 0 },

  // 分层纵深(世界 px, 负 = 远离镜头)。★ 画面 3D 感的**真正**来源: 相机一动, 各层因深度
  // 不同而以不同速率位移(视差)。只旋转一整块平面是产生不了纵深的 —— 平面上没有任何深度线索。
  //
  // 各层静止时的成像与纵深为 0 时**逐 px 相同**(每层按 (P-z)/P 预缩放抵消透视), 差别只在
  // 相机运动的瞬间显现。
  //
  // ⚠ 代价: 「场景是刚体」这条老约定就此作废 —— 角色与它脚下的背景地面会以不同速率移动。
  //   幅度就是下面这三个数; 全部设 0 即精确退回刚体(整场戏一起动), 没有任何其它开关。
  //   bg 拉得越远, 角色越"从背景里凸出来", 但脚底相对地面的滑移也越明显。
  depth: {
    bg: -600, // 背景层(.battle-bg-video)
    far: -300, // 远景粒子(.battle-ambience.far)
    // 近景粒子(.battle-ambience.near): 正值 = 比敌人更靠近镜头, 动得最快、推近时扑面而来。
    // ⚠ near + 推进量 P(1−1/scale) 必须显著小于 P, 否则最近的一层会跨过镜头平面炸开。
    //   当前 250 + 1400(1−1/1.55) ≈ 747 < 1400, 余量充足; 加大 near 或 scale 前先算这一条。
    near: 250,
    // 敌我单位(.battle-stage)恒为 0 —— 它是取景与相机数学的基准面, 不要给它加深度。
  },

  // 朝向 = 偏航/俯仰(转) + 平移(挪) 两者叠加。
  // ★ 位移必须是**斜的**: 纯水平的直线位移, 人眼一律读作"一张图在平面上滑", 加多少透视与
  //   视差都救不回来 —— 因为现实中相机不会只沿一条水平轨道走。垂直分量(panY)与随横向偏离
  //   抬升的弧度(arc)一起, 把轨迹从直线掰成斜线/弧线, 这才是纵深读数的关键。
  aim: {
    scale: 1.15, // 选中攻击卡后的固定推近倍数(不随目标体型自适应)
    yaw: 6, // 目标贴到安全区边缘时的最大偏航角(deg), 按目标横向偏离的比例线性取
    pitch: 3, // 同上的俯仰角(deg): 目标偏上镜头就微微仰、偏下就微微俯
    pan: 0.28, // 横向偏移取"目标中心 → 画框锚点"横向差值的这个比例(不求对准, 只求朝向)
    panMax: 70, // 横向偏移上限(世界 px), 防止多敌人靠边站时镜头甩太远
    panY: 0.3, // 纵向同上。敌人普遍站在画框上方 ⇒ 这一项让镜头整体微微抬起
    panMaxY: 45, // 纵向偏移上限(世界 px)。刻意小于横向: 上下露边比左右更容易穿帮
    // 弧度: 目标越偏离画框中央, 镜头额外抬升越多(世界 px)。于是从中央看向两侧时, 镜头走的
    // 是一条弧而不是一条水平直线 —— 哪怕两个敌人一样高, 移动轨迹也是斜的。设 0 即退回直线。
    arc: 16,
    dur: 420, // 进入/切换/退出瞄准态的过渡时长
  },

  // ── 技能卡「亮相」演出(仅玩家出牌): 镜头聚焦目标后、命中特效前, 卡面从左侧飞入停留再飞出 ──
  cardIn: 280, // 卡面从屏幕左侧飞入 + 渐显
  cardHold: 700, // 卡面停在距左侧 200px 处停留
  cardOut: 320, // 卡面往右飞出 + 渐隐

} as const;

// 手牌发牌时序(ms)。单张飞行时长写在 HandCard.module.css 的 .hand-card animation(0.8s),
// 这里只管「什么时候起飞」—— 两者要一起改。
export const HAND_DEAL = {
  stagger: 300,
  opening: 1000,
} as const;

// 弃牌演出时长(ms)。pop = 弹出到顶点, total = 弹出 + 化光消散全长,
// 与 HandCard.module.css 的 cardDiscardBurst 关键帧一起改。
export const DISCARD = {
  pop: 320,
  total: 1000,
} as const;

export const ANIM: Record<CardAnim, AnimPreset> = {
  // —— 攻击系 ——
  slash: { kind: "attack", emoji: "💥", color: "#ff6b6b", windup: 190, hold: 660, shake: 1 },
  shot: { kind: "attack", emoji: "🎯", color: "#ffd43b", windup: 150, hold: 640, shake: 1 },
  fire: { kind: "attack", emoji: "🔥", color: "#ff922b", windup: 210, hold: 720, shake: 1 },
  ice: { kind: "attack", emoji: "❄️", color: "#66d9e8", windup: 210, hold: 720, shake: 1 },
  lightning: { kind: "attack", emoji: "⚡", color: "#a5d8ff", windup: 130, hold: 600, shake: 1 },
  poison: { kind: "attack", emoji: "☠️", color: "#94d82d", windup: 190, hold: 720, shake: 1 },
  // 居合拔刀斩(程序化 CSS): 全屏压暗 → 光点由暗渐亮蓄力 → 500ms 斩痕从左下向右上
  // 贯出 + 青白反白闪 + 顿帧震屏, 整段压在命中特效 hold 内。视觉在 IaiSlashFx.tsx
  // 与 ui/IaiSlashFx.css 的 iai 系关键帧(百分比按 1000ms 总时长换算, 50% = impactMs 500)。
  // 调 impactMs 时须同步改 ui/IaiSlashFx.css 里 iaiBlade/iaiGlow/iaiRing/iaiScreenDim 的百分比。
  "iai-slash": {
    kind: "attack",
    color: "#8fe3ff", // 青蓝主色(冲击环/受击着色/飘字)
    proc: { impactMs: 500, floatMs: 500 },
    screenFx: "dim",
    windup: 210, // 现时序不消费, 按语义填写
    hold: 1000,
    shake: 2,
  },
  // 刀光斩(程序化 CSS): 1.6s 三拍, 目标中心斜贯、粒子收敛、八点爆裂与刀痕消散。
  // 950ms 是第三拍爆点, 与 BladeSlashFx 的 BURST_START 同源; 掉血也在此刻结算。
  "blade-slash": {
    kind: "attack",
    color: "#a8d4ff",
    proc: { impactMs: 950, floatMs: 800, damageAtImpact: true },
    screenFx: "flash",
    windup: 190,
    hold: 1750,
    shake: 1,
  },
  // 三段斩击(Canvas 2D): 2.6s 三幕 —— V形折返两刀(0~0.9s) → 折返十连斩(0.9~1.4s) →
  // 静默 0.45s 后伤口延迟裂开 + 粒子爆裂(1.85s 爆点)。几何表在
  // fx/TriSlashFx/triSlashGeometry.ts(爆点固定 1.85s), 时间轴按 proc.impactMs 与
  // 1850ms 的比例整体缩放, 故以后调节奏只改这里; 震屏归相机 SHOTS.tri、白闪归
  // screenFx: "flash", 组件不做画布内震屏/白闪(与 blade-slash 分工一致)。
  // floatMs 600 把飘字压缩到 1.85s 爆点后收尾: impactMs + floatMs = 2450 < hold。
  "tri-slash": {
    kind: "attack",
    color: "#78c8ff",
    proc: { impactMs: 1850, floatMs: 600, damageAtImpact: true },
    screenFx: "flash",
    windup: 190,
    hold: 2500, // impactMs + floatMs = 2450 < hold, 飘字不被卸载截断
    shake: 2,
  },
  // 血色刀光(程序化 CSS): 2.8s 三幕 —— 刀身下劈 → 刀痕张开 → 血花蓄压爆裂。
  // 1900ms 是血花炸裂爆点, 掉血、飘字、顿帧、重震和第二次全屏闪都在这一拍。
  "blood-slash": {
    kind: "attack",
    color: "#ff5a5a",
    proc: { impactMs: 1900, floatMs: 600, damageAtImpact: true },
    screenFx: "blood",
    windup: 210,
    hold: 2800,
    shake: 2,
  },
  // 霓虹数据·交叉斩(程序化 CSS): 2.2s 四拍 —— 扫描线锁定 → 双刀交叉贯穿 →
  // 白核凝聚 + 色差坏帧 → 静默张开后像素崩解。1700ms 是爆点, 与
  // fx/NeonCrossFx/neonCrossGeometry.ts 的 NEON_TIMELINE.impact 同源;
  // 掉血/飘字/顿帧/重震都锚在这一拍。
  "neon-cross": {
    kind: "attack",
    color: "#6ef4ff", // 青蓝主色(冲击环/受击着色/飘字), 与品红刃形成对撞
    proc: { impactMs: 1700, floatMs: 600, damageAtImpact: true },
    screenFx: "glitch",
    windup: 190,
    hold: 2500, // impactMs + floatMs = 2300 < hold, 飘字不被截断; 也盖住 total 2200
    shake: 2,
  },
  // 流光·三段斩(程序化 CSS): 起手顿住 → 崩断转场 → 六连乱舞 → 斩痕爆点。
  // 2200ms 爆点与 TripleSlashFx/tripleSlashGeometry.ts 的 TRIPLE_TIMELINE.impact 同源;
  // 掉血/飘字/顿帧/重震都锚在这一拍, 震屏归相机 SHOTS.triple, 白闪归 screenFx。
  "triple-strike": {
    kind: "attack",
    color: "#ffd27a", // 亮金主色, 与几何表 [data-tone="gold"] 同色
    proc: { impactMs: 2200, floatMs: 600, damageAtImpact: true },
    screenFx: "flash",
    windup: 190,
    hold: 2900, // impactMs + floatMs = 2800 < hold, 也盖住 total 2700
    shake: 2,
  },
  // 快斩·单刀弧斩(程序化 CSS): 560ms 四拍 —— 刀路预兆 → 刃出 → 60ms 停顿 → 爆点 + 余韵。
  // 与上面那批 2 秒级大招不同, 这是**基础档位**: 给普通攻击每回合放, 靠停顿/曲线/方向
  // 撑打击感而非铺陈。200ms 爆点与 fx/BasicSlashFx/basicSlashGeometry.ts 的
  // BASIC_TIMELINE.impact 同源; 掉血/飘字锚在这一拍。刻意不配 screenFx、不占专属运镜档,
  // 高频特效抢镜比不够华丽更伤。
  "basic-slash": {
    kind: "attack",
    color: "#dce8ff", // 中性冷钢, 与质感层 --tone 同色: 它要能当所有普通攻击的底, 不带元素属性
    proc: { impactMs: 200, floatMs: 380, damageAtImpact: true },
    windup: 190,
    hold: 700, // impactMs + floatMs = 580 < hold, 也盖住 total 560, 飘字与末尾帧都不被截断
    shake: 1,
  },
  // 锐利刀锋斩(程序化 CSS): 1.75s 六拍 —— 聚光起势 → 刀光横扫 → 爆点 → 金属余鸣 → 缓降 → 消散。
  // 它是**按音效做的**: 时间轴逐拍对齐 锐利刀锋.wav 的实测包络, 再整体按 KEEN_RATE(1.4) 加速,
  // 采样侧用同样的 pitch 跟着快, 撞击峰才仍落在 336ms 的爆点上(见 animSfx 的 keen-edge 覆盖)。
  // 336 / 1750 与 fx/KeenEdgeFx/keenEdgeGeometry.ts 的 KEEN_PLAY.impact / .total 同源;
  // 掉血/飘字锚在爆点, 震屏归相机 SHOTS.keen、白闪归 screenFx: "flash", 组件不做这两件事。
  "keen-edge": {
    kind: "attack",
    color: "#bfe4ff", // 冷蓝白锐化版, 与 KeenEdgeFx.module.css 的 --keen-edge 同色
    proc: { impactMs: 336, floatMs: 600, damageAtImpact: true },
    screenFx: "flash",
    windup: 190,
    hold: 1800, // impactMs + floatMs = 936 < hold, 也盖住 total 1750, 余鸣与光尘尾段不被截断
    shake: 2,
  },
  // —— 辅助系(柔和光效): 一律不震屏, 治疗/加盾不该有冲击反馈 ——
  heal: { kind: "support", emoji: "💚", color: "#69db7c", windup: 200, hold: 720, shake: 0 },
  // 护盾: 不再用 emoji, 改用护盾 BUFF 图标 SVG(见 StatusPips 的 ShieldIcon)做虚幻放大浮现。
  // hold 须 ≥ 图标动画 1s(见 HitFxLayer.module.css 的 vfxIconRise), 否则末尾帧被卸载截断。
  shield: { kind: "support", icon: "shield", color: "#6ea8fe", windup: 200, hold: 1100, shake: 0 },
  buff: { kind: "support", emoji: "✨", color: "#ffd43b", windup: 200, hold: 700, shake: 0 },
};

// 单个单位当前正在播放的受击/首击特效(由 BattleScreen 在命中时刻下发)。
export interface HitFx {
  anim: CardAnim;
  float?: { text: string; tone: "dmg" | "heal" | "miss" }; // 飘字(伤害/治疗量/未命中), 可选
  seq: number; // 递增序号, 用于强制重放动画
}

// 卡牌 → 动画类型。优先按定义表实时解析(见 DEF_ANIM: 实例上的副本可能来自旧存档),
// 定义已不存在才回退实例自带值, 都没有则按效果兜底推断。
export function cardAnim(card: Card): CardAnim {
  const anim = DEF_ANIM.has(card.id) ? DEF_ANIM.get(card.id) : card.anim;
  if (anim) return anim;
  const has = (t: string) => card.effects.some((e) => e.type === t);
  if (has("DAMAGE")) return "slash";
  if (has("HEAL")) return "heal";
  if (has("GAIN_BLOCK")) return "shield";
  return "buff";
}

// 敌人招式 → 动画类型。优先招式显式声明的 anim, 否则按效果兜底推断(与 cardAnim 同规则)。
export function moveAnim(move: EnemyMove): CardAnim {
  if (move.anim) return move.anim;
  const has = (t: string) => move.effects.some((e) => e.type === t);
  if (has("DAMAGE")) return "slash";
  if (has("HEAL")) return "heal";
  if (has("GAIN_BLOCK")) return "shield";
  return "buff";
}
