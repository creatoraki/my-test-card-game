import * as THREE from "three";
import type { DecorDef } from "../../types";
import { box, cylinder } from "../core/geometryUtils";
import { PALETTE } from "../materials/materialKit";
import type { BuildContext } from "../room/buildContext";

/** 办公桌: 侧板桌腿 + 挡板, 桌面上按变体摆显示器 / 键盘 / 文件 / 杯子; 变体 2 的显示器倒扣在桌上。 */
export function buildDesk(ctx: BuildContext, def: DecorDef): THREE.Group {
  const g = new THREE.Group();
  const { kit, rng } = ctx;
  const top = kit.plain(0x6f6a60, { roughness: 0.55 });
  const frame = kit.plain(PALETTE.steelDark, { roughness: 0.5, metalness: 0.6 });
  g.add(box(1.4, 0.03, 0.72, top, 0, 0.745, 0));
  for (const sx of [-0.68, 0.68]) g.add(box(0.03, 0.73, 0.66, frame, sx, 0.365, 0));
  g.add(box(1.3, 0.4, 0.02, frame, 0, 0.5, -0.3));
  const plastic = kit.plain(0x2c2e30, { roughness: 0.45 });
  const screen = kit.plain(0x0a0d0f, { roughness: 0.12, metalness: 0.3 });
  const variant = def.variant ?? 0;
  const monitor = new THREE.Group();
  monitor.add(box(0.52, 0.34, 0.04, plastic, 0, 0.26, 0));
  monitor.add(box(0.48, 0.3, 0.005, screen, 0, 0.26, 0.022, { cast: false }));
  monitor.add(box(0.05, 0.1, 0.05, plastic, 0, 0.05, -0.02));
  monitor.add(box(0.22, 0.015, 0.16, plastic, 0, 0.008, -0.02));
  if (variant === 2) {
    monitor.rotation.x = -Math.PI / 2 + 0.08;
    monitor.position.set(-0.15, 0.78, 0.05);
  } else {
    monitor.position.set(-0.1 + rng() * 0.2, 0.76, -0.18);
    monitor.rotation.y = (rng() - 0.5) * 0.5;
  }
  g.add(monitor);
  if (variant !== 2) g.add(box(0.42, 0.02, 0.14, kit.plain(0x3a3c3e, { roughness: 0.6 }), 0.05, 0.77, 0.14));
  const paper = kit.plain(PALETTE.paper, { roughness: 0.9 });
  const stack = box(0.22, 0.03 + rng() * 0.06, 0.3, paper, 0.48, 0.79, 0.05);
  stack.rotation.y = rng() * 0.6;
  g.add(stack);
  if (variant === 1) {
    const mug = cylinder(0.04, 0.035, 0.1, kit.plain(0x8a2f2a, { roughness: 0.4 }), 12, -0.5, 0.81, 0.15);
    g.add(mug);
    const binder = box(0.06, 0.3, 0.26, kit.plain(0x2f4f6b, { roughness: 0.6 }), 0.62, 0.9, -0.2);
    binder.rotation.z = 0.35;
    g.add(binder);
  }
  return g;
}

/** 工位隔板: 布面板 + 铝合金顶框与支脚。长度取 size[0]。 */
export function buildPartition(ctx: BuildContext, def: DecorDef): THREE.Group {
  const g = new THREE.Group();
  const len = def.size?.[0] ?? 1.6;
  const fabric = ctx.kit.plain(0x46525c, { roughness: 0.95 });
  const alu = ctx.kit.plain(0x8e9396, { roughness: 0.35, metalness: 0.8 });
  g.add(box(len, 1.12, 0.05, fabric, 0, 0.62, 0));
  g.add(box(len + 0.02, 0.04, 0.07, alu, 0, 1.2, 0));
  for (const sx of [-len / 2, len / 2]) {
    g.add(box(0.04, 1.2, 0.07, alu, sx, 0.6, 0));
    g.add(box(0.06, 0.03, 0.4, alu, sx, 0.015, 0));
  }
  return g;
}

/** 办公转椅: 五星脚 + 气杆 + 坐垫 + 靠背。变体 1 侧翻在地。 */
export function buildChair(ctx: BuildContext, def: DecorDef): THREE.Group {
  const g = new THREE.Group();
  const chair = new THREE.Group();
  const metal = ctx.kit.plain(0x26292b, { roughness: 0.4, metalness: 0.7 });
  const fabric = ctx.kit.plain(PALETTE.fabric, { roughness: 0.95 });
  for (let i = 0; i < 5; i += 1) {
    const leg = box(0.3, 0.03, 0.04, metal, 0, 0.06, 0);
    leg.geometry.translate(0.15, 0, 0);
    leg.rotation.y = (i / 5) * Math.PI * 2;
    chair.add(leg);
    const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), metal);
    wheel.position.set(Math.cos((i / 5) * Math.PI * 2) * 0.29, 0.03, -Math.sin((i / 5) * Math.PI * 2) * 0.29);
    chair.add(wheel);
  }
  chair.add(cylinder(0.025, 0.025, 0.36, metal, 8, 0, 0.24, 0));
  chair.add(box(0.48, 0.08, 0.46, fabric, 0, 0.46, 0));
  const back = box(0.44, 0.52, 0.06, fabric, 0, 0.82, -0.24);
  back.rotation.x = -0.12;
  chair.add(back);
  chair.add(box(0.04, 0.3, 0.04, metal, 0, 0.58, -0.24));
  if (def.variant === 1) {
    chair.rotation.z = Math.PI / 2 - 0.1;
    chair.position.set(0.3, 0.24, 0);
  }
  g.add(chair);
  return g;
}

/** 茶水间圆桌: 桌面 + 立柱 + 底盘, 桌上散落纸杯。 */
export function buildTable(ctx: BuildContext): THREE.Group {
  const g = new THREE.Group();
  const top = ctx.kit.plain(0xb9b4a8, { roughness: 0.4 });
  const metal = ctx.kit.plain(0x303335, { roughness: 0.4, metalness: 0.7 });
  g.add(cylinder(0.52, 0.52, 0.03, top, 32, 0, 0.74, 0));
  g.add(cylinder(0.04, 0.04, 0.72, metal, 10, 0, 0.37, 0));
  g.add(cylinder(0.26, 0.28, 0.03, metal, 24, 0, 0.015, 0));
  const cupMat = ctx.kit.plain(0xe8e4d8, { roughness: 0.7 });
  for (let i = 0; i < 3; i += 1) {
    const a = ctx.rng() * Math.PI * 2;
    const cup = cylinder(0.035, 0.028, 0.09, cupMat, 10, Math.cos(a) * 0.25, 0.8, Math.sin(a) * 0.25);
    if (i === 2) { cup.rotation.z = Math.PI / 2; cup.position.y = 0.79; }
    g.add(cup);
  }
  return g;
}

/** 枯死的盆栽: 花盆 + 枯枝 + 残叶。变体 1 花盆翻倒、土撒了一地。 */
export function buildPlant(ctx: BuildContext, def: DecorDef): THREE.Group {
  const g = new THREE.Group();
  const potMat = ctx.kit.plain(0x5b3f30, { roughness: 0.85 });
  const soil = ctx.kit.plain(0x241a14, { roughness: 1 });
  const stem = ctx.kit.plain(0x4a3a28, { roughness: 0.9 });
  const leaf = ctx.kit.plain(0x6e5a2e, { roughness: 0.9, side: THREE.DoubleSide });
  const plant = new THREE.Group();
  plant.add(cylinder(0.2, 0.15, 0.42, potMat, 16, 0, 0.21, 0));
  plant.add(cylinder(0.185, 0.185, 0.02, soil, 16, 0, 0.4, 0));
  for (let i = 0; i < 6; i += 1) {
    const h = 0.4 + ctx.rng() * 0.6;
    const branch = cylinder(0.008, 0.014, h, stem, 5, 0, 0.4 + h / 2, 0);
    branch.geometry.translate(0, 0, 0);
    branch.rotation.set((ctx.rng() - 0.5) * 0.8, 0, (ctx.rng() - 0.5) * 0.8);
    plant.add(branch);
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.05), leaf);
    l.position.set((ctx.rng() - 0.5) * 0.3, 0.6 + ctx.rng() * 0.4, (ctx.rng() - 0.5) * 0.3);
    l.rotation.set(ctx.rng() * 3, ctx.rng() * 3, 0);
    l.castShadow = true;
    plant.add(l);
  }
  if (def.variant === 1) {
    plant.rotation.z = Math.PI / 2 - 0.15;
    plant.position.set(0, 0.19, 0);
    const spill = new THREE.Mesh(new THREE.CircleGeometry(0.32, 16), soil);
    spill.rotation.x = -Math.PI / 2;
    spill.scale.set(1.4, 0.8, 1);
    spill.position.set(-0.45, 0.004, 0);
    spill.receiveShadow = true;
    g.add(spill);
  }
  g.add(plant);
  return g;
}

/** 纸箱堆: 两三只大小不一的纸箱, 贴着封箱带。 */
export function buildBoxes(ctx: BuildContext, def: DecorDef): THREE.Group {
  const g = new THREE.Group();
  const card = ctx.kit.plain(PALETTE.cardboard, { roughness: 0.9 });
  const cardDark = ctx.kit.plain(0x6e5436, { roughness: 0.9 });
  const tape = ctx.kit.plain(0xa89468, { roughness: 0.4 });
  const sizes: [number, number, number, number, number, number][] = def.variant === 1
    ? [[0.5, 0.36, 0.4, -0.12, 0, 0.05], [0.44, 0.3, 0.36, 0.2, 0, -0.1]]
    : [[0.55, 0.4, 0.45, -0.1, 0, 0], [0.45, 0.32, 0.38, 0.18, 0, 0.12], [0.4, 0.3, 0.35, -0.05, 0.4, 0.02]];
  sizes.forEach(([w, h, d, x, y, z], i) => {
    const b = box(w, h, d, i % 2 ? cardDark : card, x, y + h / 2, z);
    b.rotation.y = (ctx.rng() - 0.5) * 0.5;
    b.add(box(0.06, 0.004, d + 0.002, tape, 0, h / 2 + 0.002, 0, { cast: false }));
    g.add(b);
  });
  return g;
}

/** 候梯长椅: 金属框架 + 三块坐面 + 靠背。 */
export function buildBench(ctx: BuildContext): THREE.Group {
  const g = new THREE.Group();
  const metal = ctx.kit.plain(0x5c6266, { roughness: 0.35, metalness: 0.8 });
  const seat = ctx.kit.surface("metal", { color: 0x7a8286, metalness: 0.6, roughness: 1, bumpScale: 0.4 });
  for (const sx of [-0.75, 0.75]) g.add(box(0.05, 0.42, 0.45, metal, sx, 0.21, 0));
  for (let i = 0; i < 3; i += 1) {
    g.add(box(0.5, 0.04, 0.45, seat, -0.52 + i * 0.52, 0.44, 0));
    const back = box(0.5, 0.36, 0.03, seat, -0.52 + i * 0.52, 0.7, -0.22);
    back.rotation.x = -0.12;
    g.add(back);
  }
  g.add(box(1.6, 0.05, 0.05, metal, 0, 0.4, -0.2));
  return g;
}
