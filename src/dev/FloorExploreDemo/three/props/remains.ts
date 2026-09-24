import * as THREE from "three";
import { box, cylinder } from "../core/geometryUtils";
import { flickerValue } from "../lighting/flicker";
import { PALETTE } from "../materials/materialKit";
import type { BuildContext } from "../room/buildContext";
import { radialTexture } from "../textures/decalTextures";

function limb(from: THREE.Vector3, to: THREE.Vector3, radius: number, material: THREE.Material): THREE.Mesh {
  const dir = to.clone().sub(from);
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, Math.max(0.01, dir.length() - radius * 2), 4, 10), material);
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * 探险者遗骸: 靠墙瘫坐的人形(破旧防护服、低垂的头盔与骷髅)、身旁翻开的背包与散落物资,
 * 地上一支还在苟延残喘的手电, 斜斜照亮一片地面。本地 -z 贴墙, +z 朝房间。
 */
export function buildRemains(ctx: BuildContext): THREE.Group {
  const g = new THREE.Group();
  const { kit, rng } = ctx;
  const suit = kit.plain(PALETTE.suit, { roughness: 0.95 });
  const suitDark = kit.plain(0x262c31, { roughness: 0.95 });
  const bone = kit.plain(PALETTE.bone, { roughness: 0.7 });
  const helmet = kit.surface("metal", { color: 0xa8842a, metalness: 0.2, roughness: 1, bumpScale: 0.6 });
  const boot = kit.plain(0x1b1a18, { roughness: 0.7 });

  // 身下的深色污渍
  const stain = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 1.1),
    ctx.disposer.track(new THREE.MeshStandardMaterial({ color: 0x0c0806, alphaMap: radialTexture(), transparent: true, depthWrite: false, roughness: 0.3 })),
  );
  stain.rotation.x = -Math.PI / 2;
  stain.position.set(0, 0.003, -0.05);
  g.add(stain);

  const body = new THREE.Group();
  body.position.set(-0.05, 0, -0.38);
  const hip = new THREE.Vector3(0, 0.16, 0.05);
  const chest = new THREE.Vector3(0.06, 0.62, -0.1);
  body.add(limb(hip, chest, 0.17, suit));
  body.add(box(0.36, 0.1, 0.22, suitDark, 0, 0.18, 0.06));
  // 头盔与骷髅, 低垂侧偏
  const head = new THREE.Group();
  head.position.set(0.12, 0.8, -0.02);
  head.rotation.set(0.75, 0.2, -0.35);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 12), bone);
  skull.scale.set(0.9, 1, 1.05);
  skull.castShadow = true;
  head.add(skull);
  const jaw = box(0.1, 0.035, 0.07, bone, 0, -0.085, 0.045);
  jaw.rotation.x = 0.35;
  head.add(jaw);
  const socket = kit.plain(0x0a0908, { roughness: 1 });
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 6), socket);
    eye.position.set(s * 0.038, 0.01, 0.083);
    head.add(eye);
  }
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), helmet);
  shell.position.y = 0.02;
  shell.castShadow = true;
  head.add(shell);
  head.add(box(0.3, 0.015, 0.3, helmet, 0, 0.02, 0.02));
  const lampDead = cylinder(0.025, 0.03, 0.04, kit.plain(0x333333, { roughness: 0.3, metalness: 0.6 }), 10, 0, 0.09, 0.12);
  lampDead.rotation.x = Math.PI / 2;
  head.add(lampDead);
  body.add(head);
  // 腿伸向房间, 一条弯起
  const kneeL = new THREE.Vector3(-0.14, 0.12, 0.5);
  const footL = new THREE.Vector3(-0.2, 0.08, 0.92);
  const kneeR = new THREE.Vector3(0.14, 0.34, 0.4);
  const footR = new THREE.Vector3(0.2, 0.08, 0.62);
  body.add(limb(new THREE.Vector3(-0.1, 0.14, 0.08), kneeL, 0.085, suit), limb(kneeL, footL, 0.07, suit));
  body.add(limb(new THREE.Vector3(0.1, 0.14, 0.08), kneeR, 0.085, suit), limb(kneeR, footR, 0.07, suit));
  for (const foot of [footL, footR]) body.add(box(0.12, 0.12, 0.22, boot, foot.x, 0.06, foot.z + 0.06));
  // 手臂: 一只垂在地上, 一只搭在膝头
  const shoulderL = new THREE.Vector3(-0.15, 0.62, -0.08);
  const elbowL = new THREE.Vector3(-0.3, 0.3, 0.02);
  body.add(limb(shoulderL, elbowL, 0.06, suit), limb(elbowL, new THREE.Vector3(-0.38, 0.05, 0.25), 0.05, suit));
  const shoulderR = new THREE.Vector3(0.26, 0.6, -0.1);
  const elbowR = new THREE.Vector3(0.28, 0.36, 0.18);
  body.add(limb(shoulderR, elbowR, 0.06, suit), limb(elbowR, new THREE.Vector3(0.16, 0.36, 0.38), 0.05, suit));
  for (const hand of [new THREE.Vector3(-0.38, 0.04, 0.3), new THREE.Vector3(0.14, 0.36, 0.42)]) {
    const bones = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), bone);
    bones.position.copy(hand);
    bones.scale.set(1, 0.5, 1.3);
    body.add(bones);
  }
  g.add(body);

  // 背包: 主体 + 卷起的睡垫 + 翻出来的物资
  const pack = new THREE.Group();
  pack.position.set(0.48, 0, -0.25);
  pack.rotation.set(0, -0.4, 0.28);
  const canvas = kit.plain(0x4b5a3a, { roughness: 0.95 });
  pack.add(box(0.36, 0.5, 0.22, canvas, 0, 0.27, 0));
  pack.add(box(0.3, 0.18, 0.08, kit.plain(0x3d4a30, { roughness: 0.95 }), 0, 0.2, 0.14));
  const mat = cylinder(0.08, 0.08, 0.42, kit.plain(0x8a3a2a, { roughness: 0.8 }), 14, 0, 0.58, 0);
  mat.rotation.z = Math.PI / 2;
  pack.add(mat);
  g.add(pack);
  const loot = [0xc9b27a, 0x6a7f95, 0xd9d4c4];
  for (let i = 0; i < 4; i += 1) {
    const item = i === 3
      ? cylinder(0.035, 0.035, 0.11, kit.plain(0x9aa0a0, { roughness: 0.3, metalness: 0.8 }), 10, 0.3 + rng() * 0.3, 0.035, 0.1 + rng() * 0.3)
      : box(0.12 + rng() * 0.06, 0.025, 0.16, kit.plain(loot[i], { roughness: 0.85 }), 0.25 + rng() * 0.35, 0.013, 0.05 + rng() * 0.35);
    if (i === 3) item.rotation.x = Math.PI / 2;
    item.rotation.y = rng() * Math.PI;
    g.add(item);
  }

  // 地上的手电与它最后的光
  const torch = new THREE.Group();
  torch.position.set(-0.42, 0.035, 0.45);
  torch.rotation.y = -0.9;
  const barrel = cylinder(0.03, 0.03, 0.2, kit.plain(0x202224, { roughness: 0.35, metalness: 0.7 }), 12, 0, 0, 0);
  barrel.rotation.x = Math.PI / 2;
  torch.add(barrel);
  const lensMat = ctx.disposer.track(new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffe2b0) }));
  const lens = cylinder(0.038, 0.034, 0.03, lensMat, 12, 0, 0, 0.11);
  lens.rotation.x = Math.PI / 2;
  torch.add(lens);
  const beam = new THREE.SpotLight(0xffd9a0, 3.2, 5, 0.42, 0.6, 2);
  beam.position.set(0, 0.02, 0.13);
  beam.target.position.set(0, -0.35, 2.4);
  beam.castShadow = true;
  beam.shadow.mapSize.set(512, 512);
  beam.shadow.camera.near = 0.05;
  beam.shadow.camera.far = 5;
  beam.shadow.bias = -0.0006;
  torch.add(beam, beam.target);
  g.add(torch);

  ctx.animated.push({
    update: (t) => {
      const f = flickerValue("dying", t, 9.7);
      beam.intensity = 3.2 * f;
      lensMat.color.setRGB(1, 0.89, 0.69).multiplyScalar(0.4 + f * 3);
    },
  });
  return g;
}
