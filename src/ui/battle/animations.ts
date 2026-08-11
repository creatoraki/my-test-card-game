// ============================================================================
// 出牌动画预设表(纯 UI 表现层)。
// 每个 CardAnim 对应一套: 攻击/辅助分类 + 首击特效(emoji 或序列帧) + 主色 + 时间轴参数。
// 具体视觉(受击抖动/斩击/火爆/柔光…)在 ui/HitFxLayer.css 里按 .vfx-<anim> / 反馈类实现。
// ============================================================================

import type { Card, CardAnim } from "@/engine";
import { CARD_DEFS, type EnemyMove } from "@/data";
import { SWORD_FALL_FRAMES } from "@/ui/art/vfxSprites";

// 卡牌定义表的 anim 索引: 卡实例随城镇档案持久化(localStorage), 实例上固化的 anim
// 副本会在改数据后过期 —— 旧档的卡永远放老特效。anim 是纯表现字段, 故按定义表实时
// 解析。不走 getCardDef: 它对未知 id 直接 throw, 而存档可能残留已删定义的旧卡。
const DEF_ANIM = new Map(CARD_DEFS.map((d) => [d.id, d.anim]));

// 序列帧特效参数。几何/时序集中在此(而非散落 CSS), 保证「登记一次」即可调。
// 由 ui/SpriteFx.tsx 行内下发给逐帧 <img>。
export interface SpritePreset {
  frames: readonly string[]; // 逐帧图 URL(按播放顺序)
  frameMs: number; // 每帧停留(ms); 总时长须小于命中特效的 hold, 否则末尾帧会被卸载截断
  width: number; // 渲染宽(px)
  height: number; // 渲染高(px); 须与原图比例一致
  anchorTop: number; // .vfx 图层相对卡面顶边的下移量(px), 决定冲击点落在目标何处
  anchorY: number; // 冲击点在帧内的纵向位置(0~1), 用于把它对到锚点
  impactMs: number; // 挂载 → 真正砸中的偏移(ms), 用于同步受击抖动/冲击环
}

// 居合斩(程序化 CSS)参数。视觉几何在 IaiSlashFx.tsx / IaiSlashFx.css, 这里只放 JS 要消费的时序。
export interface IaiPreset {
  // 挂载 → 斩击爆发的偏移(ms), = 蓄力时长(压暗+光点渐亮)。
  // runSteps 用它推迟顿帧/震屏, hitFxVars 用它推迟受击抖动/闪白与飘字。
  impactMs: number;
  floatMs: number; // 飘字时长(压缩): impactMs + floatMs 须小于命中特效的 hold, 否则飘字被卸载截断
}

export interface AnimPreset {
  kind: "attack" | "support"; // attack: 目标受击特效; support: 目标柔和光效
  emoji?: string; // 首击特效图形(无 sprite/iai 时使用)
  sprite?: SpritePreset; // 序列帧特效(存在时优先于 emoji)
  iai?: IaiPreset; // 居合斩程序化特效(与 sprite 平行的第三种渲染分支)
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

export const ANIM: Record<CardAnim, AnimPreset> = {
  // —— 攻击系 ——
  slash: { kind: "attack", emoji: "💥", color: "#ff6b6b", windup: 190, hold: 660, shake: 1 },
  shot: { kind: "attack", emoji: "🎯", color: "#ffd43b", windup: 150, hold: 640, shake: 1 },
  fire: { kind: "attack", emoji: "🔥", color: "#ff922b", windup: 210, hold: 720, shake: 1 },
  ice: { kind: "attack", emoji: "❄️", color: "#66d9e8", windup: 210, hold: 720, shake: 1 },
  lightning: { kind: "attack", emoji: "⚡", color: "#a5d8ff", windup: 130, hold: 600, shake: 1 },
  poison: { kind: "attack", emoji: "☠️", color: "#94d82d", windup: 190, hold: 720, shake: 1 },
  // 魔剑坠落(序列帧): 12 帧 × 70ms = 840ms, 在命中特效 hold 内播完, 不循环。
  // height 460 ≈ 4.8 倍身位; 帧上方约 247px(帧高 53.7%)是 00-02 的凝聚段(剑位于帧内
  // 5%~37%), 露出多少取决于敌人头顶的净空。裁切边界现在在 .screen.battle(整屏)而非
  // 舞台, 故凝聚段可向上越过舞台顶边、延伸到顶栏区域, 比改造前多露一截;
  // 要让它完整可见仍需加 ui/BattleScreen.css 里 .enemy-row 的 padding-top(现 42px), 代价是
  // 敌人不再贴舞台顶 —— 目前维持现状, 属「不动布局换更大剑」的明确取舍, 非 bug。
  // 调 impactMs 时记得同步改 ui/HitFxLayer.css 里 swordFallRing 的百分比。
  "sword-fall": {
    kind: "attack",
    color: "#ff4d4d", // 与素材红色剑光同色系(供闪白/冲击环/飘字着色)
    sprite: {
      frames: SWORD_FALL_FRAMES,
      frameMs: 70,
      width: 192, // 243:583 原始比例
      height: 460,
      anchorTop: 249, // 对应 --foe-figure-h(256px) 的脚线基准, 底对齐脚下 = 剑插地处; JS 侧手工同步点
      anchorY: 0.82,
      impactMs: 210, // 约第 3 帧砸中
    },
    windup: 210,
    hold: 840,
    shake: 2, // 重击档: 巨剑砸地理应把镜头震一下
  },
  // 居合拔刀斩(程序化 CSS): 全屏压暗 → 光点由暗渐亮蓄力 → 500ms 斩痕从左下向右上
  // 贯出 + 青白反白闪 + 顿帧震屏, 整段压在命中特效 hold 内。视觉在 IaiSlashFx.tsx
  // 与 ui/IaiSlashFx.css 的 iai 系关键帧(百分比按 1000ms 总时长换算, 50% = impactMs 500)。
  // 调 impactMs 时须同步改 ui/IaiSlashFx.css 里 iaiBlade/iaiGlow/iaiRing/iaiScreenDim 的百分比。
  "iai-slash": {
    kind: "attack",
    color: "#8fe3ff", // 青蓝主色(冲击环/受击着色/飘字), 与 sword-fall 的红形成区分
    iai: { impactMs: 500, floatMs: 500 },
    windup: 210, // 现时序不消费, 按语义填写
    hold: 1000,
    shake: 2, // 居合重斩, 与 sword-fall 同档
  },
  // —— 辅助系(柔和光效): 一律不震屏, 治疗/加盾不该有冲击反馈 ——
  heal: { kind: "support", emoji: "💚", color: "#69db7c", windup: 200, hold: 720, shake: 0 },
  shield: { kind: "support", emoji: "🛡️", color: "#6ea8fe", windup: 200, hold: 700, shake: 0 },
  buff: { kind: "support", emoji: "✨", color: "#ffd43b", windup: 200, hold: 700, shake: 0 },
};

// 单个单位当前正在播放的受击/首击特效(由 BattleScreen 在命中时刻下发)。
export interface HitFx {
  anim: CardAnim;
  float?: { text: string; tone: "dmg" | "heal" }; // 飘字(伤害/治疗量), 可选
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
