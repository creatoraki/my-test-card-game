// ============================================================================
// 三段斩击(tri-slash)的固定几何表 —— html-templates/三段斩击特效.html 的模块
// A(配置)/B(数学工具)/C(轨迹几何)/D(一次性事件) 直搬, 只做两处裁剪:
//
//   1. 坐标系: 模板设计画布里目标圆心在 [1010, 720], 这里一律换算成「以目标中心为原点」,
//      entryPoint 相应从 [823.6, 775.65] 变为 [-186.4, 55.65]。
//   2. 内容: 删掉模板的演示脚手架 —— target 剪影 / core 能量核心 / groundY 地面 / dust 尘土。
//      震屏与全屏白闪也不在这里(震屏归相机 SHOTS.tri, 白闪归 AnimPreset.screenFx)。
//
// 全部几何在模块加载时算一次即导出 —— 种子固定 ⇒ 每次重播逐帧一致, 且不产生 re-render
// (与 BladeSlashFx 的「固定几何表」同精神)。
//
// 渲染时序真相: 几何表内爆点(phase3.hitTime)固定 1.85s、总长 loopTotal 2.60s,
// 组件侧按 proc.impactMs 与 1850ms 的比例整体缩放时间轴(见 TriSlashFx.tsx)。
// ============================================================================

// ── 模块 A: 配置 ──
// targetCircle: 敌人圆形化模型, 所有刀痕都是该圆上的等长弦(不过圆心),
//               弦长恒为 2·√(radius² − chordOffset²) ≈ 178.6px。
// slashes: 全部 12 刀(第一段 2 刀 + 第二段 10 刀)。angle 正值右上斜 / 负值右下斜;
//          side 决定弦偏左上(up) / 弦偏右下(down); rPivot 圆外折返点滑出距离;
//          gapAfter 收刀后停顿。折返点方位由 angle+side 组合决定。
// phase3: 第三段延迟受击。shakeAmt/shakeDecay/flashDur/flashAlpha 原样保留但不消费
//         (战斗里震屏与白闪由相机与 screenFx 承担, 见文件头注释)。
export const TRI_CONFIG = {
  targetCircle: { radius: 100, chordOffset: 45 },

  slashes: [
    // ---- 第一段: V 形折返(30° 划过 → 60° 砍回, 两刀轨迹无缝衔接) ----
    { angle: 30, side: "up", dur: 0.2, rPivot: 78.75, gapAfter: 0 },
    { angle: 60, side: "down", dur: 0.2, rPivot: 100, gapAfter: 0.5 },
    // ---- 第二段: 折返十连斩(突然加速; 正负角度交替 + 四向折返点轮转) ----
    { angle: 55, side: "up", dur: 0.06, rPivot: 70 },
    { angle: -30, side: "down", dur: 0.058, rPivot: 80 },
    { angle: -50, side: "up", dur: 0.054, rPivot: 62 },
    { angle: 40, side: "down", dur: 0.052, rPivot: 74 },
    { angle: 65, side: "up", dur: 0.05, rPivot: 66 },
    { angle: -45, side: "down", dur: 0.048, rPivot: 78 },
    { angle: -25, side: "up", dur: 0.046, rPivot: 58 },
    { angle: 20, side: "down", dur: 0.044, rPivot: 72 },
    { angle: 70, side: "up", dur: 0.044, rPivot: 68 },
    { angle: -35, side: "down", dur: 0.044, rPivot: 76 },
  ],

  // 第一刀起手点: 沿 30° 线距第一道弦左端 100px(与第二刀出刀段等长, 两刀总长一致)。
  // 已从模板的 [823.6, 775.65] 换算为以目标中心为原点。
  entryPoint: [-186.4, 55.65] as [number, number],

  // ---- 第三段: 延迟受击 ----
  phase3: {
    delayStart: 1.4, // 静默期开始(伤口尚未出现)
    delayDur: 0.45, // 延迟时长
    hitTime: 1.85, // 爆发时刻(几何表爆点, 时间轴锚)
    scarOpenDur: 0.09, // 切痕张开耗时
    scarFadeFrom: 0.32, // 切痕开始淡出
    scarFadeDur: 0.4,
    shakeAmt: 10, // 震屏幅度(px) —— 战斗里不消费
    shakeDecay: 7, // 震屏衰减速率 —— 战斗里不消费
    flashDur: 0.06, // 全屏白闪时长 —— 战斗里不消费
    flashAlpha: 0.16, // 全屏白闪透明度 —— 战斗里不消费
  },

  loopTotal: 2.6, // 一次演出的总时长(s)

  // 确定性伪随机种子: 保证每次重放轨迹/粒子完全一致。
  seed: 20240607,
} as const;

export type SlashDef = (typeof TRI_CONFIG.slashes)[number];
export type Pt = [number, number];

// ── 模块 B: 数学与随机工具 ──
export const TAU = Math.PI * 2;
export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const easeOutCubic = (k: number) => 1 - Math.pow(1 - k, 3);
/** easeOutCubic 的反函数: 给定弧长比例求时间比例(用于事件时刻与刀光精确同步)。 */
export const easeInverse = (p: number) => 1 - Math.cbrt(1 - p);

/** 确定性伪随机数(mulberry32)。 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── 模块 C: 轨迹几何 ──
// 第一段两刀合并为一个刀组(7 段折线): 一次 easing 连续扫过, 折返点不停顿、刀速连续。
// 第二段每刀一个刀组, 刀内三段同样按弧长连续推进。
// 折返闪光 / 刀痕残影的时刻用 easeInverse 反算, 与刀光精确同步。

export interface BladeGroup {
  index: number;
  points: Pt[];
  segLens: number[];
  start: number;
  dur: number;
  end: number;
  totalLen: number;
  pivots: { frac: number; x: number; y: number; size: number; ttl: number }[];
}

export interface BladeState {
  active: boolean;
  group: BladeGroup | null;
  segIdx: number;
  k: number;
}

export interface PivotEvent {
  x: number;
  y: number;
  time: number;
  size: number;
  ttl: number;
}

export interface ScarEvent {
  from: Pt;
  to: Pt;
  time: number;
  index: number;
}

export interface FlashEvent {
  x: number;
  y: number;
  t: number;
  size: number;
  ttl: number;
}

export interface TraceEvent {
  from: Pt;
  to: Pt;
  t: number;
  ttl: number;
  width: number;
}

export interface HitParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl: number;
  size: number;
  white: boolean;
  gravity: number;
}

/** 生成每把刀的 4 顶点折线(入刀点 → 弦端点 → 弦端点 → 折返点), 以目标中心为原点。 */
function buildSlashPoints(s: SlashDef): { pts: (Pt | null)[]; pivot: Pt } {
  const { radius: R, chordOffset: d } = TRI_CONFIG.targetCircle;
  const half = Math.sqrt(R * R - d * d); // 半弦长 ≈ 89.3
  const rad = (s.angle * Math.PI) / 180;
  const u: Pt = [Math.cos(rad), -Math.sin(rad)]; // 刀方向
  const n: Pt =
    s.side === "up"
      ? [-Math.sin(rad), -Math.cos(rad)] // 弦中点偏移: 左上
      : [Math.sin(rad), Math.cos(rad)]; // 弦中点偏移: 右下
  const mid: Pt = [d * n[0], d * n[1]];
  const cL: Pt = [mid[0] - half * u[0], mid[1] - half * u[1]]; // 圆左侧端点
  const cR: Pt = [mid[0] + half * u[0], mid[1] + half * u[1]]; // 圆右侧端点
  if (s.side === "up") {
    const pivot: Pt = [cR[0] + s.rPivot * u[0], cR[1] + s.rPivot * u[1]];
    return { pts: [null, cL, cR, pivot], pivot }; // [0] 占位, 由前刀终点/起点填入
  }
  const pivot: Pt = [cL[0] - s.rPivot * u[0], cL[1] - s.rPivot * u[1]];
  return { pts: [null, cR, cL, pivot], pivot };
}

// ---- 构建全部刀: 每把刀的入刀点 = 上一把刀的折返点 ----
const allSlashes = TRI_CONFIG.slashes.map((s) => buildSlashPoints(s));
allSlashes[0].pts[0] = TRI_CONFIG.entryPoint.slice() as Pt;
for (let i = 1; i < allSlashes.length; i++) {
  allSlashes[i].pts[0] = allSlashes[i - 1].pivot.slice() as Pt;
}

// ---- 组装刀组: 第一段两刀合并, 第二段每刀独立 ----
const groups: BladeGroup[] = [];
{
  const s0 = TRI_CONFIG.slashes[0];
  const s1 = TRI_CONFIG.slashes[1];
  // 合并组: 7 顶点折线(entry → 弦1两端 → 折返点 → 弦2两端 → 收刀点), 两刀无缝衔接
  const merged = [...allSlashes[0].pts, ...allSlashes[1].pts.slice(1)] as Pt[];
  const g: BladeGroup = {
    index: 0,
    points: merged,
    segLens: merged
      .slice(0, -1)
      .map((p, i) => Math.hypot(merged[i + 1][0] - p[0], merged[i + 1][1] - p[1])),
    start: 0,
    dur: s0.dur + s1.dur,
    end: 0,
    totalLen: 0,
    pivots: [],
  };
  g.totalLen = g.segLens.reduce((a, b) => a + b, 0);
  // 折返点(刀1 折返)与收刀点(刀2 收刀)的组内弧长比例
  const pivot1Arc = g.segLens[0] + g.segLens[1] + g.segLens[2];
  g.pivots = [
    {
      frac: pivot1Arc / g.totalLen,
      x: allSlashes[0].pivot[0],
      y: allSlashes[0].pivot[1],
      size: 30,
      ttl: 0.22,
    },
    {
      frac: 1,
      x: allSlashes[1].pivot[0],
      y: allSlashes[1].pivot[1],
      size: 16,
      ttl: 0.18,
    },
  ];
  groups.push(g);

  // 第二段: 每刀一个刀组
  let t = s0.dur + s1.dur + s1.gapAfter;
  for (let i = 2; i < allSlashes.length; i++) {
    const pts = allSlashes[i].pts as Pt[];
    const s = TRI_CONFIG.slashes[i];
    const g2: BladeGroup = {
      index: i,
      points: pts,
      segLens: pts
        .slice(0, -1)
        .map((p, j) => Math.hypot(pts[j + 1][0] - p[0], pts[j + 1][1] - p[1])),
      start: t,
      dur: s.dur,
      end: 0,
      totalLen: 0,
      pivots: [],
    };
    g2.totalLen = g2.segLens.reduce((a, b) => a + b, 0);
    g2.pivots = [
      { frac: 1, x: allSlashes[i].pivot[0], y: allSlashes[i].pivot[1], size: 11, ttl: 0.14 },
    ];
    groups.push(g2);
    t += s.dur;
  }
}
groups.forEach((g) => {
  g.end = g.start + g.dur;
});

/** 刀组内弧长 s 处的点。 */
function arcPoint(group: BladeGroup, s: number): Pt {
  let acc = 0;
  for (let i = 0; i < group.segLens.length; i++) {
    if (s <= acc + group.segLens[i]) {
      const k = group.segLens[i] > 0 ? (s - acc) / group.segLens[i] : 0;
      return [
        lerp(group.points[i][0], group.points[i + 1][0], k),
        lerp(group.points[i][1], group.points[i + 1][1], k),
      ];
    }
    acc += group.segLens[i];
  }
  return group.points[group.points.length - 1];
}

/** 折返闪光事件: 时刻 = 刀光到达折返点弧长的精确时刻。 */
const pivotEvents: PivotEvent[] = [];
groups.forEach((g) => {
  g.pivots.forEach((pv) => {
    pivotEvents.push({
      x: pv.x,
      y: pv.y,
      time: g.start + g.dur * easeInverse(pv.frac),
      size: pv.size,
      ttl: pv.ttl,
    });
  });
});

/** 刀痕残影事件: 时刻 = 刀光扫过弦中点的精确时刻。 */
const scarEvents: ScarEvent[] = [];
groups.forEach((g) => {
  // 每把刀在组内占据的段: 第一段合并组 0-2 为刀1、3-5 为刀2; 其余组整组为一把刀
  const slashIdx = g.index === 0 ? [0, 1] : [g.index];
  slashIdx.forEach((idx) => {
    // 该刀弦段在组内的段序号: 合并组刀1=段1、刀2=段4; 独立组=段1
    const segIdxInGroup = g.index === 0 ? (idx === 0 ? 1 : 4) : 1;
    const from = g.points[segIdxInGroup];
    const to = g.points[segIdxInGroup + 1];
    let acc = 0;
    for (let i = 0; i < segIdxInGroup; i++) acc += g.segLens[i];
    const fracMid = (acc + g.segLens[segIdxInGroup] / 2) / g.totalLen;
    scarEvents.push({
      from,
      to,
      time: g.start + g.dur * easeInverse(fracMid),
      index: idx,
    });
  });
});

/**
 * 主切痕(第三段伤口爆开线): 沿回折刀 60° 方向穿过敌人圆心,
 * 长度与所有刀痕一致(≈178.6px), 中点即圆心(以目标中心为原点)。
 */
const scarSeg = (() => {
  const { radius: R, chordOffset: d } = TRI_CONFIG.targetCircle;
  const half = Math.sqrt(R * R - d * d);
  const rad = (TRI_CONFIG.slashes[1].angle * Math.PI) / 180;
  const u: Pt = [Math.cos(rad), -Math.sin(rad)];
  return {
    from: [half * u[0], half * u[1]] as Pt, // 右上端
    to: [-half * u[0], -half * u[1]] as Pt, // 左下端
  };
})();

/** 时间 t 处的刀光: 所在刀组、段序号与段内比例(弧长连续推进)。 */
function bladeAt(t: number): BladeState {
  for (const g of groups) {
    if (t >= g.start && t < g.end) {
      const p = clamp((t - g.start) / g.dur, 0, 1);
      const s = easeOutCubic(p) * g.totalLen;
      let acc = 0;
      for (let i = 0; i < g.segLens.length; i++) {
        if (s <= acc + g.segLens[i]) {
          return {
            active: true,
            group: g,
            segIdx: i,
            k: g.segLens[i] > 0 ? (s - acc) / g.segLens[i] : 0,
          };
        }
        acc += g.segLens[i];
      }
      return { active: true, group: g, segIdx: g.segLens.length - 1, k: 1 };
    }
  }
  return { active: false, group: null, segIdx: 0, k: 0 };
}

/** 第一段光迹淡出: 刀光画完后不消失, 整条 V 形路径延迟淡出至第二段开始。 */
const phase1Fade = {
  start: groups[0].end,
  end: groups[1].start,
  group: groups[0],
};

// ── 模块 D: 一次性特效事件(爆闪 / 残痕 / 粒子) —— 全部由时间推导, 纯函数式 ──
const rng = mulberry32(TRI_CONFIG.seed + 7);

// ---- 折返点闪光: 时刻已按弧长反算, 与刀光精确同步 ----
const flashes: FlashEvent[] = [];
for (const pv of pivotEvents) {
  flashes.push({ x: pv.x, y: pv.y, t: pv.time, size: pv.size, ttl: pv.ttl });
}

// ---- 刀痕残影: 只留在等长圆弦上(每道刀痕长度一致) ----
// 第一段的两道弦由「整条 V 形光迹淡出」呈现, 不重复生成残痕。
const traces: TraceEvent[] = [];
for (const se of scarEvents) {
  if (se.index < 2) continue;
  const isLast = se.index === TRI_CONFIG.slashes.length - 1;
  traces.push({
    from: se.from,
    to: se.to,
    t: se.time,
    ttl: isLast ? 0.22 : 0.16, // 末刀残痕在静默期缓缓消散
    width: 5,
  });
}

// ---- 受击爆发: 切痕处大星芒(延迟结束后才出现) ----
const scarMid: Pt = [
  (scarSeg.from[0] + scarSeg.to[0]) / 2,
  (scarSeg.from[1] + scarSeg.to[1]) / 2,
];
flashes.push({ x: scarMid[0], y: scarMid[1], t: TRI_CONFIG.phase3.hitTime, size: 48, ttl: 0.3 });

// ---- 受击粒子: 沿刀口方向两侧喷出 ----
// ⚠ rng 的抽签顺序照搬模板(逐粒子: t → speed → along×2 → side×2 → ttl → size → white),
//   模板的尘土 dust 已删, 但 hitParticles 不受影响 —— 它先于 dust 抽完。
const hitParticles: HitParticle[] = (() => {
  const arr: HitParticle[] = [];
  const dx = scarSeg.to[0] - scarSeg.from[0];
  const dy = scarSeg.to[1] - scarSeg.from[1];
  const len = Math.hypot(dx, dy) || 1;
  const dirX = dx / len;
  const dirY = dy / len; // 刀口方向
  const nx = -dirY;
  const ny = dirX; // 法向
  for (let i = 0; i < 26; i++) {
    const t = rng();
    const px = lerp(scarSeg.from[0], scarSeg.to[0], t);
    const py = lerp(scarSeg.from[1], scarSeg.to[1], t);
    const speed = lerp(140, 400, rng());
    const along = lerp(-1, 1, rng()) * lerp(0.15, 0.55, rng()); // 沿刀口
    const side = (rng() < 0.5 ? -1 : 1) * lerp(0.25, 0.95, rng()); // 法向
    arr.push({
      x: px,
      y: py,
      vx: dirX * along * speed * 2 + nx * side * speed,
      vy: dirY * along * speed * 2 + ny * side * speed - lerp(20, 160, rng()),
      ttl: lerp(0.3, 0.62, rng()),
      size: lerp(1.4, 3.4, rng()),
      white: rng() < 0.55,
      gravity: 950,
    });
  }
  return arr;
})();

// ---- 渲染器消费的统一出口: 模块加载时算一次, 之后每帧只读不写 ----
export const TRI_FX = {
  groups,
  arcPoint,
  bladeAt,
  phase1Fade,
  scarSeg,
  flashes,
  traces,
  hitParticles,
} as const;
