// 二连箭(twin-arrow)特效的几何与时序表 —— 纯数据 + 纯函数, 不碰 ctx, 不碰 DOM。
//
// 所有坐标都是「以画布中心为原点的设计 px」: 弓位与目标保持固定相对关系，
// 由组件将设计坐标映射到实际 Canvas。正式战斗的默认画布为 1280×1000，
// demo 传入 1920×1080 后与原世界坐标中的相对位置逐 px 对齐。
//
// 时序以本表为真相: 组件按 preset.impactMs 与 TWIN_ARROW_TIMELINE.hit1 的比例
// 整体缩放时间轴, 改节奏只改这里。

export const TAU = Math.PI * 2;

export const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);

/** 正式战斗的默认画布尺寸: 以目标中心为原点的设计 px。 */
export const TWIN_ARROW_CANVAS = { width: 1280, height: 1000 } as const;

/** 默认弓位: 目标中心左下，等价于原 demo 的 (520,700) - (960,540)。 */
export const DEFAULT_ORIGIN = { x: -440, y: 160 } as const;

/** 默认目标中心: Canvas 中心。 */
export const DEFAULT_TARGET = { x: 0, y: 0 } as const;

/**
 * 时间轴(ms)。两箭在 400–430ms 区间重叠 —— 第二箭在第一箭还没落地时就离弦,
 * 这是「二连」的节奏特征, 不要为了整齐把它拉开。
 */
export const TWIN_ARROW_TIMELINE = {
  windup: 50, // 光团弓成形, 开始聚能拉弓
  fire1: 240, // 第一箭离弦
  fire2: 400, // 第二箭离弦(第一箭仍在飞)
  hit1: 430, // 第一箭命中 → 第一段伤害结算
  hit2: 590, // 第二箭命中 → 第二段伤害结算
  settle: 900, // 余波: 火花下坠、冲击环外推收束
  total: 1400, // 画面完全清空
} as const;

/** 单箭飞行时长(ms)。hit1 - fire1 与 hit2 - fire2 都等于它。 */
export const TWIN_ARROW_FLIGHT_MS = 190;

/** 弓的半径(世界 px): 光团弓的所有尺寸都按它派生。 */
export const BOW_RADIUS = 140;

/** 两箭落点相对目标中心的错开量, 免得两次命中糊在同一个点上。 */
export const HIT_OFFSETS = [
  { x: -34, y: -40 },
  { x: 26, y: 28 },
] as const;

/**
 * 拉弓曲线: 0 = 松弦, 1 = 拉满。双峰 —— 拉满放第一箭 → 回弹到 0.25 →
 * 二次拉满放第二箭 → 归位。原型的手感全在这条曲线上。
 */
export function pullAt(ms: number): number {
  if (ms < 50) return 0.08;
  if (ms < 240) return 0.08 + 0.92 * easeOutCubic((ms - 50) / 190);
  if (ms < 330) return 1 - 0.75 * easeOutCubic((ms - 240) / 90);
  if (ms < 400) return 0.25 + 0.75 * easeOutCubic((ms - 330) / 70);
  if (ms < 500) return 1 - 0.92 * easeOutCubic((ms - 400) / 100);
  return 0.08;
}

// ── 运行期实体 ──

/** 飞行中的箭: p 是 0→1 的行程比例, 命中即销毁。 */
export interface ArrowShot {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  x: number;
  y: number;
  p: number;
  ang: number;
}

export interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

export interface ShockRing {
  x: number;
  y: number;
  t: number;
  life: number;
  max: number;
}

/** 命中光爆: 原型里这层是画在怪物身上的(enemy.flash), 组件化后独立成自己的光层。 */
export interface ImpactBurst {
  x: number;
  y: number;
  t: number;
  life: number;
}

// ── 工厂 ──

/** 搭箭点(弓局部坐标 x, y 恒为 0): 拉满时最靠后。 */
export function nockOffset(radius: number, pull: number): number {
  return -radius * 0.092 - pull * radius * 0.85;
}

export function spawnArrow(
  origin: { x: number; y: number },
  target: { x: number; y: number },
  aimAngle: number,
  index: number,
): ArrowShot {
  // 从拉满时的弦上起飞, 而不是从弓心 —— 箭头与弓弦脱离的那一帧才对得上。
  const nock = nockOffset(BOW_RADIUS, 1);
  const sx = origin.x + nock * Math.cos(aimAngle);
  const sy = origin.y + nock * Math.sin(aimAngle);
  const offset = HIT_OFFSETS[index] ?? HIT_OFFSETS[0];
  const tx = target.x + offset.x;
  const ty = target.y + offset.y;
  return { sx, sy, tx, ty, x: sx, y: sy, p: 0, ang: Math.atan2(ty - sy, tx - sx) };
}

/** 命中火花: 30 颗橙黄主体(沿入射反方向扇形喷) + 8 颗高亮白芯(全向)。 */
export function spawnSparks(x: number, y: number, angle: number): Spark[] {
  const list: Spark[] = [];
  for (let i = 0; i < 36; i++) {
    const dir = angle + Math.PI + (Math.random() - 0.5) * 2.6;
    const speed = 230 + Math.random() * 900;
    list.push({
      x,
      y,
      vx: Math.cos(dir) * speed,
      vy: Math.sin(dir) * speed,
      life: 0.22 + Math.random() * 0.38,
      maxLife: 0.6,
      size: 2.6 + Math.random() * 4.2,
      hue: 25 + Math.random() * 35,
    });
  }
  for (let i = 0; i < 8; i++) {
    const dir = Math.random() * TAU;
    const speed = 360 + Math.random() * 1020;
    list.push({
      x,
      y,
      vx: Math.cos(dir) * speed,
      vy: Math.sin(dir) * speed,
      life: 0.12 + Math.random() * 0.18,
      maxLife: 0.3,
      size: 2 + Math.random() * 2.8,
      hue: 55,
    });
  }
  return list;
}

/** 冲击环: 一大一小两圈, 小圈更快收。 */
export function spawnRings(x: number, y: number): ShockRing[] {
  return [
    { x, y, t: 0, life: 0.44, max: 265 },
    { x, y, t: 0, life: 0.28, max: 150 },
  ];
}

export function spawnBurst(x: number, y: number): ImpactBurst {
  return { x, y, t: 0, life: 0.26 };
}

// ── 推进(原型 update 里的粒子物理, 抽成纯函数) ──

/** 阻尼 + 重力, 返回仍存活的粒子。 */
export function advanceSparks(list: Spark[], dt: number): Spark[] {
  const alive: Spark[] = [];
  const damp = Math.pow(0.02, dt);
  for (const p of list) {
    p.life -= dt;
    if (p.life <= 0) continue;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= damp;
    p.vy *= damp;
    p.vy += 380 * dt;
    alive.push(p);
  }
  return alive;
}

export function advanceRings(list: ShockRing[], dt: number): ShockRing[] {
  const alive: ShockRing[] = [];
  for (const r of list) {
    r.t += dt;
    if (r.t < r.life) alive.push(r);
  }
  return alive;
}

export function advanceBursts(list: ImpactBurst[], dt: number): ImpactBurst[] {
  const alive: ImpactBurst[] = [];
  for (const b of list) {
    b.t += dt;
    if (b.t < b.life) alive.push(b);
  }
  return alive;
}

/**
 * 光团弓的存在感包络(0–1)。原型是无限循环播放, 弓一直挂在手上;
 * 组件化后是单次演出, 所以弓要「凝聚出来 → 打完散掉」, 否则开头结尾都是硬切。
 */
export function bowAlphaAt(ms: number): number {
  if (ms < 90) return easeOutCubic(ms / 90); // 凝聚成形
  if (ms < TWIN_ARROW_TIMELINE.settle) return 1;
  const fade = (ms - TWIN_ARROW_TIMELINE.settle) / 320; // 余波期散掉
  return Math.max(0, 1 - fade);
}

