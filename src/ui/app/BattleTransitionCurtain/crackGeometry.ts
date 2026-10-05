// ============================================================================
// 「一点受击的平板玻璃」拟真裂纹的几何生成。绘制见 crackPainter.ts。
//
// 形态依据: 玻璃被点状冲击时不会长成蛛网装饰, 而是
//   ① 冲击点一小块被压成粉末(crush zone, 不透明白);
//   ② 从粉碎区放射出若干条**径向裂纹**, 越往外越细、并非全部等长;
//   ③ 径向裂纹之间被**同心裂纹**横向连接, 围出一格一格四边形碎片;
//   ④ 碎片仍嵌在原位不动, 但各自朝不同角度反光 —— 这是"碎了"最主要的视觉信号。
// ============================================================================

export interface Point {
  x: number;
  y: number;
}

/** 一条裂纹线段。near/far 为两端到冲击点的距离, 断裂前沿据此决定它何时、以多少比例出现。 */
export interface Edge {
  a: Point;
  b: Point;
  near: number;
  far: number;
  width: number;
}

/** 一块玻璃碎片。tone 为相对底图的明暗偏移(正=偏亮), glint 为棱面高光的渐变方向。 */
export interface Shard {
  poly: Point[];
  outer: number; // 顶点到冲击点的最大距离 —— 前沿越过它之后这片才算裂开
  tone: number;
  glint: { x0: number; y0: number; x1: number; y1: number };
}

export interface Fracture {
  edges: Edge[];
  shards: Shard[];
  speck: { x: number; y: number; r: number }[];
  crush: Point[];
}

const SPOKES = 20; // 径向裂纹条数
const CRUSH_RADIUS = 22; // 冲击点粉碎区半径(px)
const RING_GROWTH_MIN = 1.42; // 同心裂纹半径的等比增长区间: 越往外碎片越大
const RING_GROWTH_MAX = 1.9;

export const clamp = (value: number) => Math.max(0, Math.min(1, value));
const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// 并查集: 被"没画出来的裂纹"分隔的相邻碎片其实是同一整片, 必须共用同一个 tone,
// 否则会在本不存在的缝隙两侧露出明暗断层。
function makeUnionFind(size: number) {
  const parent = Array.from({ length: size }, (_, index) => index);
  const find = (index: number): number => {
    let root = index;
    while (parent[root] !== root) root = parent[root];
    while (parent[index] !== root) {
      const next = parent[index];
      parent[index] = root;
      index = next;
    }
    return root;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };
  return { find, union };
}

export function buildFracture(origin: Point, width: number, height: number): Fracture {
  // 覆盖半径按「冲击点到最远屏角」算, 否则从边角点击时另一侧会露出没裂的区域。
  const maxRadius =
    Math.max(
      Math.hypot(origin.x, origin.y),
      Math.hypot(width - origin.x, origin.y),
      Math.hypot(origin.x, height - origin.y),
      Math.hypot(width - origin.x, height - origin.y),
    ) * 1.08;

  // ── 径向裂纹的角度: 权重归一化保证首尾闭合, 同时让扇区宽窄不均(等分会显得太规整) ──
  const weights = Array.from({ length: SPOKES }, () => randomBetween(0.58, 1.42));
  const weightSum = weights.reduce((sum, value) => sum + value, 0);
  const angles: number[] = [];
  let angleAcc = Math.random() * Math.PI * 2;
  for (const weight of weights) {
    angles.push(angleAcc);
    angleAcc += (Math.PI * 2 * weight) / weightSum;
  }

  // ── 同心裂纹的半径: 等比增长, 靠近冲击点密、远处疏 ──
  const ringRadius: number[] = [CRUSH_RADIUS];
  while (ringRadius[ringRadius.length - 1] < maxRadius) {
    ringRadius.push(ringRadius[ringRadius.length - 1] * randomBetween(RING_GROWTH_MIN, RING_GROWTH_MAX));
  }
  const rings = ringRadius.length;

  // ── 顶点网格: vertex[ring][spoke]。逐点扰动既让径向裂纹蜿蜒, 也让同心裂纹不成正圆 ──
  const vertex: Point[][] = [];
  for (let ring = 0; ring < rings; ring++) {
    const row: Point[] = [];
    const wobble = ring === 0 ? 0.04 : 0.055 + ring * 0.012;
    for (let spoke = 0; spoke < SPOKES; spoke++) {
      const angle = angles[spoke] + randomBetween(-wobble, wobble);
      const radius = ringRadius[ring] * (ring === 0 ? randomBetween(0.94, 1.06) : randomBetween(0.85, 1.17));
      row.push({ x: origin.x + Math.cos(angle) * radius, y: origin.y + Math.sin(angle) * radius });
    }
    vertex.push(row);
  }

  // 并非所有径向裂纹都能传到最远处 —— 约四分之一会中途止裂, 于是外围出现更大的整片。
  const spokeReach = angles.map(() =>
    Math.random() > 0.26 ? rings - 1 : Math.round(randomBetween(Math.max(2, rings * 0.5), rings - 1)),
  );

  const shardIndex = (ring: number, spoke: number) => ring * SPOKES + (spoke % SPOKES);
  const { find, union } = makeUnionFind((rings - 1) * SPOKES);
  const edges: Edge[] = [];

  const pushEdge = (a: Point, b: Point, widthScale: number) => {
    const da = Math.hypot(a.x - origin.x, a.y - origin.y);
    const db = Math.hypot(b.x - origin.x, b.y - origin.y);
    const mid = (da + db) / 2;
    // 裂纹在根部最宽, 越往梢部越细 —— 这条渐细规律比线条颜色更能说明"这是裂纹不是线"。
    const width = lerp(1.75, 0.42, clamp(mid / maxRadius) ** 0.7) * widthScale;
    edges.push({ a, b, near: Math.min(da, db), far: Math.max(da, db), width });
  };

  // 径向裂纹: 逐段推入, 止裂之后的段落不画, 并把两侧碎片并成一片。
  for (let spoke = 0; spoke < SPOKES; spoke++) {
    for (let ring = 0; ring < rings - 1; ring++) {
      if (ring + 1 <= spokeReach[spoke]) {
        pushEdge(vertex[ring][spoke], vertex[ring + 1][spoke], 1);
      } else {
        union(shardIndex(ring, spoke), shardIndex(ring, spoke - 1 + SPOKES));
      }
    }
  }

  // 同心裂纹: 只在相邻两条径向裂纹之间连一小段, 且越往外越容易缺席。
  // 缺席的那段不是"没画", 而是那两块碎片本来就连着 —— 用并查集表达。
  for (let ring = 1; ring < rings - 1; ring++) {
    const keepChance = Math.max(0.32, 0.92 - ring * 0.085);
    for (let spoke = 0; spoke < SPOKES; spoke++) {
      if (Math.random() < keepChance) {
        pushEdge(vertex[ring][spoke], vertex[ring][(spoke + 1) % SPOKES], 0.82);
      } else {
        union(shardIndex(ring - 1, spoke), shardIndex(ring, spoke));
      }
    }
  }

  // 粉碎区边界(ring 0)始终完整: 它是冲击点最硬的一圈轮廓。
  for (let spoke = 0; spoke < SPOKES; spoke++) {
    pushEdge(vertex[0][spoke], vertex[0][(spoke + 1) % SPOKES], 0.9);
  }

  // ── 碎片面 ──
  const groupTone = new Map<number, number>();
  const shards: Shard[] = [];
  for (let ring = 0; ring < rings - 1; ring++) {
    for (let spoke = 0; spoke < SPOKES; spoke++) {
      const next = (spoke + 1) % SPOKES;
      const poly = [vertex[ring][spoke], vertex[ring][next], vertex[ring + 1][next], vertex[ring + 1][spoke]];
      const root = find(shardIndex(ring, spoke));
      let tone = groupTone.get(root);
      if (tone === undefined) {
        // 每片朝向略有不同 ⇒ 反射的天光不同 ⇒ 明暗有细微差。幅度必须很小,
        // 大了就变成马赛克而不是玻璃。
        tone = randomBetween(-0.055, 0.075);
        groupTone.set(root, tone);
      }
      const glintAngle = Math.random() * Math.PI * 2;
      const span = Math.hypot(poly[2].x - poly[0].x, poly[2].y - poly[0].y) * 0.85;
      const center = {
        x: (poly[0].x + poly[1].x + poly[2].x + poly[3].x) / 4,
        y: (poly[0].y + poly[1].y + poly[2].y + poly[3].y) / 4,
      };
      shards.push({
        poly,
        outer: Math.max(...poly.map((p) => Math.hypot(p.x - origin.x, p.y - origin.y))),
        tone,
        glint: {
          x0: center.x - Math.cos(glintAngle) * span,
          y0: center.y - Math.sin(glintAngle) * span,
          x1: center.x + Math.cos(glintAngle) * span,
          y1: center.y + Math.sin(glintAngle) * span,
        },
      });
    }
  }

  // ── 冲击点: 粉碎区轮廓 + 周围溅出的细碎颗粒 ──
  const crush: Point[] = [];
  const crushPoints = 14;
  for (let index = 0; index < crushPoints; index++) {
    const angle = (Math.PI * 2 * index) / crushPoints;
    const radius = CRUSH_RADIUS * randomBetween(0.5, 0.82);
    crush.push({ x: origin.x + Math.cos(angle) * radius, y: origin.y + Math.sin(angle) * radius });
  }
  const speck = Array.from({ length: 46 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const radius = CRUSH_RADIUS * randomBetween(0.35, 2.3);
    return {
      x: origin.x + Math.cos(angle) * radius,
      y: origin.y + Math.sin(angle) * radius,
      r: randomBetween(0.4, 1.5),
    };
  });

  return { edges, shards, speck, crush };
}
