import * as THREE from "three";
import type { DecorDef } from "../../types";
import { box, cylinder } from "../core/geometryUtils";
import { PALETTE } from "../materials/materialKit";
import { boardTexture } from "../textures/decalTextures";
import type { BuildContext } from "../room/buildContext";

/** 柜台。变体 0: 茶水间橱柜(水槽、龙头、开着门的微波炉); 变体 1: 电梯厅服务台(高挡板、死机的电脑)。 */
export function buildCounter(ctx: BuildContext, def: DecorDef): THREE.Group {
  const g = new THREE.Group();
  const [len, depth] = def.size ?? [3, 0.66];
  const { kit } = ctx;
  if (def.variant === 1) {
    const panel = kit.surface("metal", { color: 0x4b5358, metalness: 0.4, roughness: 1, bumpScale: 0.5 });
    const top = kit.plain(0x8f8a80, { roughness: 0.3 });
    g.add(box(len, 1.05, 0.06, panel, 0, 0.525, depth / 2 - 0.03));
    g.add(box(len, 0.72, depth - 0.08, kit.plain(0x2d3134, { roughness: 0.7 }), 0, 0.36, -0.04));
    g.add(box(len + 0.06, 0.04, 0.3, top, 0, 1.07, depth / 2 - 0.1));
    g.add(box(len, 0.03, depth, top, 0, 0.74, 0));
    const pc = kit.plain(0x2a2c2e, { roughness: 0.45 });
    g.add(box(0.46, 0.3, 0.05, pc, -0.3, 0.93, -0.1));
    g.add(box(0.42, 0.26, 0.005, kit.plain(0x080a0b, { roughness: 0.1 }), -0.3, 0.93, -0.074, { cast: false }));
    g.add(cylinder(0.05, 0.06, 0.05, kit.plain(0xb8a060, { roughness: 0.3, metalness: 0.9 }), 12, 0.5, 1.115, 0.05));
    return g;
  }
  const cabinet = kit.plain(0x7d8078, { roughness: 0.6 });
  const top = kit.plain(0x3b3d3e, { roughness: 0.35 });
  const steel = kit.plain(0xb6babd, { roughness: 0.25, metalness: 0.9 });
  g.add(box(len, 0.86, depth - 0.04, cabinet, 0, 0.43, -0.02));
  g.add(box(len + 0.02, 0.04, depth, top, 0, 0.88, 0));
  const doors = Math.floor(len / 0.6);
  const handle = kit.plain(0x2a2c2e, { roughness: 0.4, metalness: 0.6 });
  for (let i = 0; i < doors; i += 1) {
    const x = -len / 2 + (i + 0.5) * (len / doors);
    g.add(box(len / doors - 0.03, 0.74, 0.01, kit.plain(0x8a8d84, { roughness: 0.6 }), x, 0.44, depth / 2 - 0.035));
    g.add(box(0.1, 0.02, 0.02, handle, x, 0.74, depth / 2 - 0.02));
  }
  g.add(box(0.5, 0.02, 0.36, kit.plain(0x16181a, { roughness: 0.2, metalness: 0.8 }), -0.6, 0.895, 0));
  const tap = cylinder(0.015, 0.015, 0.25, steel, 8, -0.6, 1.02, -0.22);
  g.add(tap);
  const spout = cylinder(0.012, 0.012, 0.16, steel, 8, -0.6, 1.14, -0.15);
  spout.rotation.x = Math.PI / 2;
  g.add(spout);
  // 微波炉, 门半开
  const micro = kit.plain(0xd6d3cb, { roughness: 0.5 });
  g.add(box(0.5, 0.3, 0.38, micro, 0.8, 1.05, -0.08));
  const door = new THREE.Group();
  door.position.set(0.55, 1.05, 0.11);
  door.rotation.y = -1.1;
  door.add(box(0.38, 0.28, 0.02, kit.plain(0x1a1c1d, { roughness: 0.2 }), 0.19, 0, 0));
  g.add(door);
  g.add(cylinder(0.08, 0.09, 0.2, kit.plain(0x9a2d24, { roughness: 0.35 }), 14, 0.15, 1.0, -0.1));
  return g;
}

/** 饮水机: 白色机身 + 半桶水。 */
export function buildWater(ctx: BuildContext): THREE.Group {
  const g = new THREE.Group();
  g.add(box(0.36, 1, 0.36, ctx.kit.plain(0xcfd0cb, { roughness: 0.5 }), 0, 0.5, 0));
  g.add(box(0.2, 0.12, 0.02, ctx.kit.plain(0x35393b, { roughness: 0.4 }), 0, 0.72, 0.18));
  const bottle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.46, 20),
    ctx.disposer.track(new THREE.MeshStandardMaterial({ color: 0x5fa6c8, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.45, depthWrite: false })),
  );
  bottle.position.y = 1.24;
  g.add(bottle);
  return g;
}

const WALL_YAW = { x0: Math.PI / 2, x1: -Math.PI / 2, z0: 0, z1: Math.PI } as const;

/** 墙上的白板: 残留的表格和一行红色警告。 */
export function buildBoard(ctx: BuildContext, def: DecorDef): THREE.Group {
  const g = new THREE.Group();
  g.rotation.y = WALL_YAW[def.wall ?? "z0"];
  const frame = ctx.kit.plain(0x9ea3a5, { roughness: 0.3, metalness: 0.8 });
  const face = ctx.disposer.track(new THREE.MeshStandardMaterial({ map: boardTexture(), roughness: 0.3 }));
  g.add(box(1.6, 1, 0.03, frame, 0, 1.55, 0.02));
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(1.52, 0.92), face);
  surface.position.set(0, 1.55, 0.037);
  surface.receiveShadow = true;
  g.add(surface);
  g.add(box(1.2, 0.03, 0.06, frame, 0, 1.02, 0.05));
  return g;
}

/**
 * 档案铁架: 四根角铁立柱 + 五层隔板, 用一只 InstancedMesh 摆满各色档案盒;
 * 变体 2 的第三层塌了一边。
 */
export function buildShelf(ctx: BuildContext, def: DecorDef): THREE.Group {
  const g = new THREE.Group();
  const { kit, rng } = ctx;
  const steel = kit.surface("metal", { color: 0x6f7678, metalness: 0.55, roughness: 1, bumpScale: 0.5 });
  const w = 2;
  const d = 0.5;
  const h = 2.2;
  for (const sx of [-w / 2, w / 2]) for (const sz of [-d / 2, d / 2]) g.add(box(0.04, h, 0.04, steel, sx, h / 2, sz));
  const levels = [0.08, 0.55, 1.02, 1.49, 1.96];
  const collapsed = def.variant === 2 ? 2 : -1;
  levels.forEach((y, i) => {
    const shelf = box(w, 0.025, d, steel, 0, y, 0);
    if (i === collapsed) { shelf.rotation.z = 0.2; shelf.position.y -= 0.1; }
    g.add(shelf);
  });
  const colors = [0x2f4f6b, 0x6b2f2a, 0x8c7a4a, 0x3d5a45, 0xb7ae98, 0x40444a];
  const slots: THREE.Matrix4[] = [];
  const tints: THREE.Color[] = [];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  levels.slice(0, 4).forEach((y, i) => {
    let x = -w / 2 + 0.06;
    while (x < w / 2 - 0.12) {
      const bw = 0.08 + rng() * 0.06;
      if (rng() < 0.18) { x += bw + 0.15; continue; } // 被翻走的空位
      const bh = 0.3 + rng() * 0.08;
      const tilt = rng() < 0.12 ? 0.35 : (rng() - 0.5) * 0.06;
      const sag = i === collapsed ? (x + w / 2) * 0.2 - 0.1 : 0;
      q.setFromEuler(new THREE.Euler(0, (rng() - 0.5) * 0.08, tilt + (i === collapsed ? 0.2 : 0)));
      m.compose(new THREE.Vector3(x + bw / 2, y + 0.0125 + bh / 2 + sag - 0.1 * (i === collapsed ? 1 : 0), (rng() - 0.5) * 0.05), q, new THREE.Vector3(bw, bh, 0.34 + rng() * 0.08));
      slots.push(m.clone());
      tints.push(new THREE.Color(colors[Math.floor(rng() * colors.length)]).multiplyScalar(0.7 + rng() * 0.4));
      x += bw + 0.01;
    }
  });
  const boxes = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), kit.plain(0xffffff, { roughness: 0.75 }), slots.length);
  slots.forEach((mat, i) => { boxes.setMatrixAt(i, mat); boxes.setColorAt(i, tints[i]); });
  boxes.castShadow = true;
  boxes.receiveShadow = true;
  g.add(boxes);
  // 地上掉落的几只盒子
  const paper = kit.plain(PALETTE.paper, { roughness: 0.9 });
  for (let i = 0; i < 2; i += 1) {
    const fallen = box(0.34, 0.1, 0.3, kit.plain(colors[i + 1], { roughness: 0.75 }), (rng() - 0.5) * 1.4, 0.05, d / 2 + 0.25);
    fallen.rotation.y = rng() * Math.PI;
    g.add(fallen);
    const sheet = box(0.21, 0.004, 0.3, paper, (rng() - 0.5) * 1.6, 0.003, d / 2 + 0.45, { cast: false });
    sheet.rotation.y = rng() * Math.PI;
    g.add(sheet);
  }
  return g;
}
