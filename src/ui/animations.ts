// ============================================================================
// 出牌动画预设表(纯 UI 表现层)。
// 每个 CardAnim 对应一套: 攻击/辅助分类 + 首击特效(emoji 或序列帧) + 主色 + 时间轴参数。
// 具体视觉(受击抖动/斩击/火爆/柔光…)在 ui/HitFxLayer.css 里按 .vfx-<anim> / 反馈类实现。
// ============================================================================

import type { Card, CardAnim } from "../engine";
import { CARD_DEFS, type EnemyMove } from "../data";
import { SWORD_FALL_FRAMES } from "./vfxSprites";

// 卡牌定义表的 anim 索引: 卡实例随城镇档案持久化(localStorage), 实例上固化的 anim
// 副本会在改数据后过期 —— 旧档的卡永远放老特效。anim 是纯表现字段, 故按定义表实时
// 解析。不走 getCardDef: 它对未知 id 直接 throw, 而存档可能残留已删定义的旧卡。
const DEF_ANIM = new Map(CARD_DEFS.map((d) => [d.id, d.anim]));

// 序列帧特效参数。几何/时序集中在此(而非散落 CSS), 保证「登记一次」即可调。
// 由 ui/SpriteFx.tsx 行内下发给逐帧 <img>。
export interface SpritePreset {
  frames: readonly string[]; // 逐帧图 URL(按播放顺序)
  frameMs: number; // 每帧停留(ms); frames.length * frameMs 须 ≤ CINEMA.hitHold, 否则末尾帧会被卸载截断
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
  floatMs: number; // 飘字时长(压缩): impactMs + floatMs 须 ≤ CINEMA.hitHold, 否则飘字被卸载截断
}

export interface AnimPreset {
  kind: "attack" | "support"; // attack: 目标受击特效; support: 目标柔和光效
  emoji?: string; // 首击特效图形(无 sprite/iai 时使用)
  sprite?: SpritePreset; // 序列帧特效(存在时优先于 emoji)
  iai?: IaiPreset; // 居合斩程序化特效(与 sprite 平行的第三种渲染分支)
  color: string; // 主色(用于闪光/冲击环/光晕/飘字着色)
  windup: number; // ms: 施法者前冲蓄力 → 命中时刻(伤害/特效在此刻触发)
  hold: number; // ms: 命中后特效(含飘字)完整播放所需时长
  // 震屏档位: 下标取 CINEMA.shake.amp。0=不震(辅助系), 1=普通攻击, 2=重击。
  shake: 0 | 1 | 2;
}

// ── 分镜运镜时间轴(ms)与相机参数 ──
// 每一步(玩家出牌 / 敌人行动)统一走这套电影化时序: 施法者弹出 → 顿(全景) →
// 镜头推近并把目标居中放大 → 命中特效+飘字停留 → 镜头恢复+归位 → 下一步。
//
// 相机是「一个世界 + 一个相机」: 背景与敌我单位同在 .battle-scene 内, 由**唯一**一份
// transform 驱动 —— 场景是刚体, 推近时角色与它脚下的地面绝不会分离。
// 换算细节见 BattleScreen.tsx 的 computeCamera。
export const CINEMA = {
  beat: 500, // 角色弹出后, 相机停在全景的"顿"时长
  zoomIn: 380, // 相机推近并把目标居中的过渡时长
  hitHold: 1000, // 命中特效 + 伤害/治疗数字在聚焦镜头下的停留时长
  zoomOut: 380, // 相机恢复(退回全景)的过渡时长
  gap: 120, // 一步收尾到下一步之间的小间隔
  scale: 1.55, // 单目标聚焦时的最大放大倍数(多目标会按并集自适应收敛)
  // 取景留白: 目标并集最多占取景安全区的这个比例, 越小留白越多、镜头越远。
  fit: 0.78,
  // ── 技能卡「亮相」演出(仅玩家出牌): 镜头聚焦目标后、命中特效前, 卡面从左侧飞入停留再飞出 ──
  cardIn: 280, // 卡面从屏幕左侧飞入 + 渐显
  cardHold: 700, // 卡面停在距左侧 200px 处停留
  cardOut: 320, // 卡面往右飞出 + 渐隐

  // ── 打击感: 顿帧 + 震屏(见 ui/BattleScreen.css 的 .hitstop / worldShakeA|B) ──
  // 顿帧: 命中瞬间把世界的所有 CSS 动画与粒子更新冻住这么久, 解冻的同一刻爆发震屏。
  // 设 0 即关闭整段顿帧(震屏仍在, 只是紧贴命中时刻触发)。
  hitstop: 70,
  // 震屏: amp 按 AnimPreset.shake 取下标(0=不震), punch 是同时叠加的冲击缩放。
  // 幅度落在 .battle-world 的 translate/scale 上 —— transform 已被下面的 drift 占用。
  shake: { amp: [0, 3, 6], dur: 260, punch: 0.012 },

  // ── 空闲镜头漂移(Ken Burns) ──
  // 全景态下世界做一圈极慢的推移 + 微缩放, 让画面永不完全静止。它挂在 .battle-world 上 ⇒
  // 背景与单位一起动, 场景仍是刚体。相机推近期间自动暂停(见 BattleScreen 的 data-focused)。
  drift: { scale: 0.018, x: 8, y: 5, dur: 22000 },
} as const;

export const ANIM: Record<CardAnim, AnimPreset> = {
  // —— 攻击系 ——
  slash: { kind: "attack", emoji: "💥", color: "#ff6b6b", windup: 190, hold: 660, shake: 1 },
  shot: { kind: "attack", emoji: "🎯", color: "#ffd43b", windup: 150, hold: 640, shake: 1 },
  fire: { kind: "attack", emoji: "🔥", color: "#ff922b", windup: 210, hold: 720, shake: 1 },
  ice: { kind: "attack", emoji: "❄️", color: "#66d9e8", windup: 210, hold: 720, shake: 1 },
  lightning: { kind: "attack", emoji: "⚡", color: "#a5d8ff", windup: 130, hold: 600, shake: 1 },
  poison: { kind: "attack", emoji: "☠️", color: "#94d82d", windup: 190, hold: 720, shake: 1 },
  // 魔剑坠落(序列帧): 12 帧 × 70ms = 840ms, 在 hitHold(1000ms) 内播完, 不循环。
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
      anchorTop: 146, // 立绘框(150px, 底对齐)脚下 = 剑插地处; anchorY 是帧内比例, 故放大无需动此值
      anchorY: 0.82,
      impactMs: 210, // 约第 3 帧砸中
    },
    windup: 210,
    hold: 840,
    shake: 2, // 重击档: 巨剑砸地理应把镜头震一下
  },
  // 居合拔刀斩(程序化 CSS): 全屏压暗 → 光点由暗渐亮蓄力 → 500ms 斩痕从左下向右上
  // 贯出 + 青白反白闪 + 顿帧震屏, 整段压在 hitHold(1000ms) 内。视觉在 IaiSlashFx.tsx
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
