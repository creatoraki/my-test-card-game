import * as THREE from "three";
import type { HeroPose } from "../../engine/heroAnimator";
import {
  BONE_INDEX, BONES, FOOT, FRAME_H, FRAME_W, GROUND_DEBUG, PARTS, SEAM, TORSO_DEBUG, type MaskShape,
} from "./heroCalibration";

/** 蒙皮网格细分(横 × 纵)。 */
const GRID_X = 24;
const GRID_Y = 32;

/** 源图 px → 骨骼空间(原点在脚底, y 向上)。 */
function toRig(sx: number, sy: number): [number, number] {
  return [sx - FOOT[0], FOOT[1] - sy];
}

function smooth(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function shapeDist(shape: MaskShape, x: number, y: number): number {
  if (shape.kind === "ellipse") {
    const k = Math.hypot((x - shape.c[0]) / shape.r[0], (y - shape.c[1]) / shape.r[1]);
    return (k - 1) * Math.min(shape.r[0], shape.r[1]);
  }
  const [ax, ay] = shape.a;
  const [bx, by] = shape.b;
  const px = x - ax;
  const py = y - ay;
  const dx = bx - ax;
  const dy = by - ay;
  const h = Math.min(1, Math.max(0, (px * dx + py * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - dx * h, py - dy * h) - shape.r;
}

interface VertexSkin {
  bones: number[];
  weights: number[];
  keep: number;
  debug: THREE.Color;
}

/** 按部件遮罩优先级分配权重, 取最大的 4 个并归一化。 */
function skinAt(sx: number, sy: number): VertexSkin {
  const acc = new Map<number, number>();
  let remaining = 1;
  let keep = 0;
  const debug = new THREE.Color(0, 0, 0);
  const add = (bone: number, w: number, color: number) => {
    if (w <= 1e-4) return;
    acc.set(bone, (acc.get(bone) ?? 0) + w);
    debug.add(new THREE.Color(color).multiplyScalar(w));
  };
  for (const part of PARTS) {
    const d = Math.min(...part.shapes.map((s) => shapeDist(s, sx, sy)));
    const m = 1 - smooth(-part.feather * 0.5, part.feather, d);
    const w = m * remaining;
    add(BONE_INDEX[part.bone], w, part.debug);
    if (part.keepUpper) keep += w;
    remaining -= w;
  }
  const legT = smooth(SEAM[0], SEAM[1], sy);
  add(BONE_INDEX.spine, remaining * (1 - legT), TORSO_DEBUG);
  add(BONE_INDEX.ground, remaining * legT, GROUND_DEBUG);
  const top = [...acc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const sum = top.reduce((s, [, w]) => s + w, 0) || 1;
  const bones = [0, 0, 0, 0];
  const weights = [0, 0, 0, 0];
  top.forEach(([bone, w], i) => {
    bones[i] = bone;
    weights[i] = w / sum;
  });
  return { bones, weights, keep: Math.min(1, keep), debug };
}

/** 构建覆盖整帧的细分网格, 顶点带骨骼下标 / 权重 / 调试色。所有英雄网格共享。 */
export function buildHeroGeometry(): THREE.BufferGeometry {
  const count = (GRID_X + 1) * (GRID_Y + 1);
  const pos = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  const bones = new Float32Array(count * 4);
  const weights = new Float32Array(count * 4);
  const keep = new Float32Array(count);
  const debug = new Float32Array(count * 3);
  let v = 0;
  for (let j = 0; j <= GRID_Y; j++) {
    for (let i = 0; i <= GRID_X; i++) {
      const sx = (i / GRID_X) * FRAME_W;
      const sy = (j / GRID_Y) * FRAME_H;
      const [rx, ry] = toRig(sx, sy);
      pos.set([rx, ry, 0], v * 3);
      uv.set([sx / FRAME_W, 1 - sy / FRAME_H], v * 2);
      const skin = skinAt(sx, sy);
      bones.set(skin.bones, v * 4);
      weights.set(skin.weights, v * 4);
      keep[v] = skin.keep;
      debug.set([skin.debug.r, skin.debug.g, skin.debug.b], v * 3);
      v++;
    }
  }
  const index: number[] = [];
  for (let j = 0; j < GRID_Y; j++) {
    for (let i = 0; i < GRID_X; i++) {
      const a = j * (GRID_X + 1) + i;
      const b = a + 1;
      const c = a + GRID_X + 1;
      const d = c + 1;
      index.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setAttribute("aBones", new THREE.BufferAttribute(bones, 4));
  geo.setAttribute("aWeights", new THREE.BufferAttribute(weights, 4));
  geo.setAttribute("aKeep", new THREE.BufferAttribute(keep, 1));
  geo.setAttribute("aDebug", new THREE.BufferAttribute(debug, 3));
  geo.setIndex(index);
  return geo;
}

const PIVOTS = BONES.map((b) => new THREE.Vector2(...toRig(b.pivot[0], b.pivot[1])));

/** 骨骼姿态 → 每根骨骼的 2D 仿射矩阵(骨骼空间), 以及变形后的支点位置(F2 叠层用)。 */
export class HeroRig {
  readonly uniforms = {
    uBones: { value: BONES.map(() => new THREE.Matrix3()) },
    uPivots: { value: BONES.map(() => new THREE.Vector2()) },
  };
  private local = new THREE.Matrix3();
  private tmp = new THREE.Matrix3();

  update(pose: HeroPose): void {
    const angle: Record<string, number> = {
      root: pose.lean,
      spine: pose.spine,
      head: pose.head,
      hairBack: pose.hairBack,
      hairFront: pose.hairFront,
      nearArm: pose.nearArm,
      farArm: pose.farArm,
      ribbon: pose.ribbon,
    };
    const mats = this.uniforms.uBones.value;
    BONES.forEach((bone, i) => {
      const p = PIVOTS[i];
      const l = this.local.identity();
      // local = T(平移) · T(支点) · R · S · T(-支点)
      const sx = bone.name === "spine" ? 1 - pose.breath * 0.5 : 1;
      const sy = bone.name === "spine" ? 1 + pose.breath : 1;
      l.multiply(this.tmp.makeTranslation(p.x, p.y));
      l.multiply(this.tmp.makeRotation(angle[bone.name] ?? 0));
      l.multiply(this.tmp.makeScale(sx, sy));
      l.multiply(this.tmp.makeTranslation(-p.x, -p.y));
      if (bone.name === "root") l.premultiply(this.tmp.makeTranslation(pose.hipX, -pose.hipY + pose.bob));
      if (bone.parent >= 0) mats[i].multiplyMatrices(mats[bone.parent], l);
      else mats[i].copy(l);
      this.uniforms.uPivots.value[i].copy(p).applyMatrix3(mats[i]);
    });
  }
}

export const BONE_COUNT = BONES.length;
