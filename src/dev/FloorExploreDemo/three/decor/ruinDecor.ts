import * as THREE from "three";
import type { DecorDef } from "../../types";
import { box } from "../core/geometryUtils";
import { paperTexture, puddleTexture } from "../textures/decalTextures";
import type { BuildContext } from "../room/buildContext";

/** 塌落的吊顶: 碎成几块的矿棉板、混凝土碎块、一根弯折的龙骨。 */
export function buildDebris(ctx: BuildContext, def: DecorDef): THREE.Group {
  const g = new THREE.Group();
  const [w, d] = def.size ?? [1.6, 1.2];
  const { rng, kit } = ctx;
  const panel = kit.plain(0xbab5a8, { roughness: 0.95 });
  const panelDirty = kit.plain(0x8f897b, { roughness: 0.95 });
  const rubble = kit.surface("concrete", { color: 0xb0aca4, bumpScale: 1 });
  for (let i = 0; i < 5; i += 1) {
    const s = 0.25 + rng() * 0.35;
    const piece = box(s, 0.016, s * (0.6 + rng() * 0.5), i % 2 ? panel : panelDirty, (rng() - 0.5) * w, 0.01 + i * 0.004, (rng() - 0.5) * d);
    piece.rotation.set((rng() - 0.5) * 0.25, rng() * Math.PI, (rng() - 0.5) * 0.25);
    g.add(piece);
  }
  const chunkGeo = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 9; i += 1) {
    const chunk = new THREE.Mesh(chunkGeo, rubble);
    const s = 0.03 + rng() * 0.09;
    chunk.scale.set(s * (0.8 + rng() * 0.6), s * 0.6, s);
    chunk.position.set((rng() - 0.5) * w * 1.1, s * 0.3, (rng() - 0.5) * d * 1.1);
    chunk.rotation.set(rng() * 3, rng() * 3, rng() * 3);
    chunk.castShadow = true;
    chunk.receiveShadow = true;
    g.add(chunk);
  }
  const bar = box(1.2, 0.03, 0.025, kit.plain(0xd0d0cc, { roughness: 0.35, metalness: 0.8 }), 0, 0.2, 0);
  bar.rotation.set(0.2, rng() * Math.PI, 0.32);
  g.add(bar);
  return g;
}

/** 散落的文件: 一只 InstancedMesh 铺满范围, 贴地微微起伏。 */
export function buildPapers(ctx: BuildContext, def: DecorDef): THREE.Group {
  const g = new THREE.Group();
  const [w, d] = def.size ?? [2, 2];
  const count = Math.round(w * d * 5);
  const material = ctx.disposer.track(new THREE.MeshStandardMaterial({ map: paperTexture(), roughness: 0.85, side: THREE.DoubleSide }));
  const geometry = new THREE.PlaneGeometry(0.21, 0.297);
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const tint = new THREE.Color();
  for (let i = 0; i < count; i += 1) {
    // 中心更密, 边缘稀疏
    const r = Math.sqrt(ctx.rng());
    const a = ctx.rng() * Math.PI * 2;
    e.set((ctx.rng() - 0.5) * 0.12, ctx.rng() * Math.PI * 2, (ctx.rng() - 0.5) * 0.12);
    q.setFromEuler(e);
    m.compose(new THREE.Vector3(Math.cos(a) * r * w / 2, 0.004 + ctx.rng() * 0.012, Math.sin(a) * r * d / 2), q, new THREE.Vector3(1, 1, 1));
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, tint.setScalar(0.55 + ctx.rng() * 0.45));
  }
  mesh.receiveShadow = true;
  g.add(mesh);
  return g;
}

/** 积水: 近乎镜面的暗色水面, 反射灯光高光。 */
export function buildPuddle(ctx: BuildContext, def: DecorDef): THREE.Group {
  const g = new THREE.Group();
  const [w, d] = def.size ?? [1.6, 1];
  const material = ctx.disposer.track(new THREE.MeshStandardMaterial({
    color: 0x0b0e10,
    roughness: 0.04,
    metalness: 0.2,
    alphaMap: puddleTexture(Math.round(def.x * 10 + def.z)),
    transparent: true,
    depthWrite: false,
    envMapIntensity: 1.6,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  }));
  const water = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.003;
  water.receiveShadow = true;
  g.add(water);
  return g;
}

/** 碎玻璃: 一堆小三角碎片, 高光闪烁。 */
export function buildGlass(ctx: BuildContext, def: DecorDef): THREE.Group {
  const g = new THREE.Group();
  const [w, d] = def.size ?? [1, 1];
  const shard = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.06, 0, 0.015), new THREE.Vector3(0.02, 0, 0.07),
  ]);
  shard.computeVertexNormals();
  const material = ctx.kit.plain(0xa9c6d2, { roughness: 0.05, metalness: 0.6, side: THREE.DoubleSide, envMapIntensity: 2 });
  const count = Math.round(w * d * 40);
  const mesh = new THREE.InstancedMesh(shard, material, count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  for (let i = 0; i < count; i += 1) {
    q.setFromEuler(new THREE.Euler((ctx.rng() - 0.5) * 0.4, ctx.rng() * Math.PI * 2, (ctx.rng() - 0.5) * 0.4));
    const s = 0.5 + ctx.rng() * 1.6;
    m.compose(new THREE.Vector3((ctx.rng() - 0.5) * w, 0.006, (ctx.rng() - 0.5) * d), q, new THREE.Vector3(s, s, s));
    mesh.setMatrixAt(i, m);
  }
  g.add(mesh);
  return g;
}

/** 从天花板垂下的断电缆, 末端偶尔迸出电火花。 */
export function buildCable(ctx: BuildContext, def: DecorDef): THREE.Group {
  const g = new THREE.Group();
  const swing = new THREE.Group();
  swing.position.y = 3.05;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.08, -0.5, 0.05), new THREE.Vector3(-0.05, -1.1, 0.02), new THREE.Vector3(0.04, -1.55, -0.03),
  ]);
  const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.014, 6), ctx.kit.plain(0x121212, { roughness: 0.55 }));
  cable.castShadow = true;
  swing.add(cable);
  const tip = curve.getPoint(1);
  const sparkMat = ctx.disposer.track(new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd28a), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  const spark = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), sparkMat);
  spark.position.copy(tip);
  swing.add(spark);
  const copper = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 6), ctx.kit.plain(0xc07a3a, { roughness: 0.3, metalness: 0.9 }));
  copper.position.copy(tip).add(new THREE.Vector3(0, -0.02, 0));
  copper.rotation.x = Math.PI;
  swing.add(copper);
  g.add(swing);
  const seed = def.x * 3.1 + def.z;
  ctx.animated.push({
    update: (t) => {
      swing.rotation.z = Math.sin(t * 0.7 + seed) * 0.035;
      swing.rotation.x = Math.sin(t * 0.5 + seed * 2) * 0.03;
      const burst = (t * 0.35 + seed) % 1;
      const flash = burst < 0.05 ? Math.abs(Math.sin(t * 90)) : 0;
      sparkMat.opacity = flash;
      sparkMat.color.setRGB(1, 0.82, 0.54).multiplyScalar(1 + flash * 5);
      spark.scale.setScalar(0.5 + flash * 1.2);
    },
  });
  return g;
}
