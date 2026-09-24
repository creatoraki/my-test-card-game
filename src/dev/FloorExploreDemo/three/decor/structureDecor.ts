import * as THREE from "three";
import type { DecorDef } from "../../types";
import { box, cylinder, worldUv } from "../core/geometryUtils";
import { signTexture, stripeTexture } from "../textures/decalTextures";
import type { BuildContext } from "../room/buildContext";

export const WALL_YAW = { x0: Math.PI / 2, x1: -Math.PI / 2, z0: 0, z1: Math.PI } as const;

/** 嵌墙电梯: 不锈钢门套与门扇, 楼层指示灯; 变体 1 门被扒开一道缝, 露出漆黑的井道。 */
export function buildElevator(ctx: BuildContext, def: DecorDef): THREE.Group {
  const g = new THREE.Group();
  g.rotation.y = WALL_YAW[def.wall ?? "x0"];
  const { kit } = ctx;
  const steel = kit.plain(0x9ea4a8, { roughness: 0.28, metalness: 0.92 });
  const trim = kit.plain(0x3a3f42, { roughness: 0.4, metalness: 0.7 });
  const w = 1.3;
  const h = 2.2;
  g.add(box(0.12, h + 0.12, 0.08, trim, -w / 2 - 0.06, (h + 0.12) / 2, 0.04));
  g.add(box(0.12, h + 0.12, 0.08, trim, w / 2 + 0.06, (h + 0.12) / 2, 0.04));
  g.add(box(w + 0.24, 0.12, 0.08, trim, 0, h + 0.06, 0.04));
  const gap = def.variant === 1 ? 0.34 : 0.004;
  const leafW = w / 2 - gap / 2;
  for (const s of [-1, 1]) g.add(box(leafW, h, 0.03, steel, s * (gap / 2 + leafW / 2), h / 2, 0.02));
  if (def.variant === 1) {
    g.add(box(gap, h, 0.01, kit.glow(0x000000), 0, h / 2, 0.005, { cast: false, receive: false }));
    // 井道深处一线冷光
    g.add(box(gap * 0.5, 0.02, 0.01, kit.glow(0x6fb4ff, 1.4), 0, 0.12, 0.012, { cast: false, receive: false }));
  }
  const display = ctx.disposer.track(new THREE.MeshBasicMaterial({ map: signTexture("十三层", "#ff5a3a", "#140504"), color: new THREE.Color(1.8, 1.8, 1.8) }));
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.16), display);
  panel.position.set(0, h + 0.28, 0.02);
  g.add(panel);
  g.add(box(0.12, 0.26, 0.03, trim, w / 2 + 0.3, 1.2, 0.015));
  const lit = def.variant === 1 ? kit.glow(0xff4a2a, 2.5) : kit.plain(0x5a2a22, { roughness: 0.4 });
  g.add(cylinder(0.025, 0.025, 0.02, lit, 12, w / 2 + 0.3, 1.26, 0.035).rotateX(Math.PI / 2));
  g.add(cylinder(0.025, 0.025, 0.02, kit.plain(0x5a5f62, { roughness: 0.3, metalness: 0.8 }), 12, w / 2 + 0.3, 1.14, 0.035).rotateX(Math.PI / 2));
  return g;
}

/** 消防楼梯: 实心混凝土踏步沿本地 -z 升起到平台, 踏步口有防滑条, 敞开一侧装扶手。 */
export function buildStairs(ctx: BuildContext, def: DecorDef): THREE.Group {
  const g = new THREE.Group();
  const [w, d] = def.size ?? [2, 4.3];
  const rise = 3;
  const landing = 0.8;
  const run = d - landing;
  const steps = 17;
  const tread = run / steps;
  const stepH = rise / steps;
  const concrete = ctx.kit.surface("concrete", { color: 0xa7a59e, bumpScale: 0.8 });
  const nosing = ctx.kit.plain(0xb89a2a, { roughness: 0.5, metalness: 0.3 });
  for (let i = 0; i < steps; i += 1) {
    const h = stepH * (i + 1);
    const z = d / 2 - tread * (i + 0.5);
    const geometry = new THREE.BoxGeometry(w, h, tread);
    worldUv(geometry, 3, new THREE.Vector3(0, h / 2, z));
    const step = new THREE.Mesh(geometry, concrete);
    step.position.set(0, h / 2, z);
    step.castShadow = true;
    step.receiveShadow = true;
    g.add(step);
    g.add(box(w, 0.012, 0.05, nosing, 0, h + 0.006, z + tread / 2 - 0.025, { cast: false }));
  }
  const landingGeo = new THREE.BoxGeometry(w, rise, landing);
  worldUv(landingGeo, 3, new THREE.Vector3(0, rise / 2, -d / 2 + landing / 2));
  const land = new THREE.Mesh(landingGeo, concrete);
  land.position.set(0, rise / 2, -d / 2 + landing / 2);
  land.castShadow = true;
  land.receiveShadow = true;
  g.add(land);
  // 敞开一侧(本地 +x)的扶手: 立柱 + 顺着坡度的扶手管
  const rail = ctx.kit.plain(0x2f5a3f, { roughness: 0.45, metalness: 0.6 });
  const x = w / 2 - 0.05;
  for (let i = 0; i <= steps; i += 3) {
    const z = d / 2 - tread * (i + 0.5);
    const base = stepH * (i + 1);
    g.add(cylinder(0.02, 0.02, 0.95, rail, 8, x, base + 0.475, z));
  }
  const start = new THREE.Vector3(x, stepH + 0.95, d / 2 - tread * 0.5);
  const end = new THREE.Vector3(x, rise + 0.95, -d / 2 + landing);
  const handrail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(start, end), 1, 0.025, 8), rail);
  handrail.castShadow = true;
  g.add(handrail);
  return g;
}

/** 贴墙管道: 几根锈蚀的竖管 + 顶部横管与管卡。 */
export function buildPipes(ctx: BuildContext, def: DecorDef): THREE.Group {
  const g = new THREE.Group();
  g.rotation.y = WALL_YAW[def.wall ?? "z0"];
  const pipe = ctx.kit.surface("metal", { color: 0x7b6a58, metalness: 0.6, roughness: 1, bumpScale: 0.5 });
  const clamp = ctx.kit.plain(0x26292a, { roughness: 0.5, metalness: 0.6 });
  const offsets = [0, 0.22, 0.38];
  offsets.forEach((dx, i) => {
    const r = i === 0 ? 0.07 : 0.04;
    g.add(cylinder(r, r, 2.95, pipe, 14, dx, 1.475, r + 0.03));
    for (const y of [0.6, 1.6, 2.5]) g.add(box(r * 2 + 0.04, 0.04, 0.04, clamp, dx, y, 0.02));
  });
  const top = cylinder(0.06, 0.06, 1.6, pipe, 14, 0.4, 2.8, 0.1);
  top.rotation.z = Math.PI / 2;
  g.add(top);
  return g;
}

/** 倒在地上的灭火器。 */
export function buildExtinguisher(ctx: BuildContext): THREE.Group {
  const g = new THREE.Group();
  const red = ctx.kit.plain(0xa3241c, { roughness: 0.35, metalness: 0.2 });
  const body = cylinder(0.08, 0.08, 0.5, red, 16, 0, 0.08, 0);
  body.rotation.z = Math.PI / 2;
  g.add(body);
  const head = cylinder(0.03, 0.05, 0.08, ctx.kit.plain(0x1c1c1c, { roughness: 0.4, metalness: 0.7 }), 10, 0.29, 0.08, 0);
  head.rotation.z = Math.PI / 2;
  g.add(head);
  const hose = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.32, 0.09, 0), new THREE.Vector3(0.45, 0.03, 0.12), new THREE.Vector3(0.38, 0.02, 0.3), new THREE.Vector3(0.2, 0.02, 0.34),
    ]), 12, 0.012, 6),
    ctx.kit.plain(0x111111, { roughness: 0.6 }),
  );
  hose.castShadow = true;
  g.add(hose);
  return g;
}

/** 倒下的「小心地滑」黄色立牌。 */
export function buildFloorSign(ctx: BuildContext): THREE.Group {
  const g = new THREE.Group();
  const face = ctx.disposer.track(new THREE.MeshStandardMaterial({ map: signTexture("小心地滑", "#1d1d1d", "#d9ab22"), roughness: 0.45 }));
  const yellow = ctx.kit.plain(0xd9ab22, { roughness: 0.45 });
  const panelA = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.012, 0.6), [yellow, yellow, face, yellow, yellow, yellow]);
  panelA.position.set(0, 0.012, 0);
  panelA.castShadow = true;
  panelA.receiveShadow = true;
  g.add(panelA);
  const panelB = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.012, 0.6), yellow);
  panelB.position.set(0.02, 0.1, -0.52);
  panelB.rotation.x = 0.35;
  panelB.castShadow = true;
  g.add(panelB);
  return g;
}

/** 警戒带: 两根隔离柱之间一条微微下垂的黄黑带子。长度取 size[0]。 */
export function buildTape(ctx: BuildContext, def: DecorDef): THREE.Group {
  const g = new THREE.Group();
  const len = def.size?.[0] ?? 2;
  const post = ctx.kit.plain(0x1e1f20, { roughness: 0.5 });
  const cap = ctx.kit.plain(0xb8342a, { roughness: 0.4 });
  for (const sx of [-len / 2, len / 2]) {
    g.add(cylinder(0.025, 0.025, 0.95, post, 8, sx, 0.475, 0));
    g.add(cylinder(0.14, 0.15, 0.03, post, 16, sx, 0.015, 0));
    g.add(cylinder(0.035, 0.035, 0.05, cap, 8, sx, 0.97, 0));
  }
  const texture = stripeTexture();
  const material = ctx.disposer.track(new THREE.MeshStandardMaterial({ map: texture, roughness: 0.5, side: THREE.DoubleSide }));
  const segs = 12;
  const geometry = new THREE.PlaneGeometry(len, 0.07, segs, 1);
  const pos = geometry.getAttribute("position");
  const uv = geometry.getAttribute("uv");
  for (let i = 0; i < pos.count; i += 1) {
    const t = pos.getX(i) / len;
    pos.setY(i, pos.getY(i) - (1 - 4 * t * t) * 0.08);
    uv.setX(i, uv.getX(i) * len * 4);
  }
  geometry.computeVertexNormals();
  const ribbon = new THREE.Mesh(geometry, material);
  ribbon.position.y = 0.9;
  ribbon.castShadow = true;
  g.add(ribbon);
  return g;
}
