import * as THREE from "three";
import type { GuardState } from "../../engine/guardPatrol";
import type { Disposer } from "../core/disposer";
import { radialTexture } from "../textures/decalTextures";
import { createSmoke, createVoidMaterial } from "./guardShaders";

export interface GuardView {
  root: THREE.Group;
  update(state: GuardState, t: number, dt: number): void;
}

function hash(n: number): number {
  const s = Math.sin(n * 91.7 + 17.3) * 43758.5453;
  return s - Math.floor(s);
}

/** 下摆: 旋转体轮廓从腰部张开到破碎的裙摆, 底边做参差不齐的撕裂。 */
function robeGeometry(): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(0.001, 0.0), new THREE.Vector2(0.3, 0.02), new THREE.Vector2(0.27, 0.25),
    new THREE.Vector2(0.22, 0.55), new THREE.Vector2(0.18, 0.85), new THREE.Vector2(0.17, 1.0), new THREE.Vector2(0.001, 1.02),
  ];
  const geometry = new THREE.LatheGeometry(profile, 28);
  const pos = geometry.getAttribute("position");
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    if (y > 0.3) continue;
    const a = Math.atan2(pos.getZ(i), pos.getX(i));
    const tear = Math.abs(Math.sin(a * 5)) * 0.12 + Math.abs(Math.sin(a * 11 + 1)) * 0.06;
    pos.setY(i, y + tear * (1 - y / 0.3));
  }
  geometry.computeVertexNormals();
  return geometry;
}

function limbMesh(radius: number, length: number, material: THREE.Material): THREE.Group {
  const pivot = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 4, 10), material);
  mesh.position.y = -length / 2 - radius;
  mesh.castShadow = true;
  pivot.add(mesh);
  return pivot;
}

/**
 * 黑影守卫: 一具像被挖空的人形剪影(不受光照, 只有一圈冷色边缘光),
 * 细长下垂的手臂、微微前探的头、两点发光的眼; 脚下黑烟升腾、地面一片暗影。
 */
export function buildShadowGuard(disposer: Disposer, seed: number, pixelRatio: number): GuardView {
  const root = new THREE.Group();
  root.name = "guard";
  const voidMat = disposer.track(createVoidMaterial(seed));
  const body = new THREE.Group();
  root.add(body);

  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 1.8),
    disposer.track(new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: radialTexture(), transparent: true, opacity: 0.85, depthWrite: false })),
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.008;
  root.add(pool);

  const robe = new THREE.Mesh(robeGeometry(), voidMat);
  robe.castShadow = true;
  body.add(robe);
  const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.42, 4, 14), voidMat);
  chest.position.set(0, 1.28, -0.02);
  chest.scale.set(1.15, 1, 0.75);
  chest.castShadow = true;
  body.add(chest);

  const neck = new THREE.Group();
  neck.position.set(0, 1.6, 0.02);
  neck.rotation.x = 0.35;
  body.add(neck);
  const head = new THREE.Group();
  head.position.set(0, 0.16, 0.04);
  neck.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 14), voidMat);
  skull.scale.set(0.85, 1.25, 0.95);
  skull.castShadow = true;
  head.add(skull);
  const eyeMat = disposer.track(new THREE.MeshBasicMaterial({ color: new THREE.Color(0xbfe0ff).multiplyScalar(5) }));
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), eyeMat);
    eye.position.set(s * 0.045, 0.02, 0.115);
    eye.scale.set(1.4, 0.6, 0.6);
    head.add(eye);
  }

  const arms: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const shoulder = limbMesh(0.055, 0.5, voidMat);
    shoulder.position.set(s * 0.25, 1.48, 0);
    shoulder.rotation.z = s * 0.12;
    const fore = limbMesh(0.045, 0.5, voidMat);
    fore.position.y = -0.6;
    fore.rotation.x = -0.2;
    shoulder.add(fore);
    // 细长的爪指
    for (let f = 0; f < 3; f += 1) {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.18, 5), voidMat);
      claw.position.set((f - 1) * 0.025, -0.68, 0.01);
      claw.rotation.set(Math.PI + (f - 1) * 0.05, 0, (f - 1) * 0.2);
      fore.add(claw);
    }
    body.add(shoulder);
    arms.push(shoulder);
  }

  const smoke = createSmoke(70, pixelRatio);
  disposer.track(smoke.material as THREE.ShaderMaterial);
  root.add(smoke);
  const smokeMat = smoke.material as THREE.ShaderMaterial;

  return {
    root,
    update: (state, t, dt) => {
      root.position.set(state.pos.x, state.def.y ?? 0, state.pos.z);
      root.rotation.y = state.yaw;
      voidMat.uniforms.uTime.value = t;
      smokeMat.uniforms.uTime.value = t;
      const move = state.moving ? 1 : 0;
      body.position.y = 0.04 + Math.sin(t * 1.3 + seed) * 0.03;
      body.rotation.x = 0.1 + move * 0.12;
      body.rotation.z = Math.sin(t * 0.8 + seed) * 0.03;
      arms.forEach((arm, i) => {
        arm.rotation.x = move * 0.35 + Math.sin(t * 1.1 + i * 2 + seed) * 0.06;
      });
      // 偶尔一下神经质的歪头
      const bucket = Math.floor(t * 0.7 + seed);
      const twitch = hash(bucket) > 0.78 ? (hash(bucket + 3) - 0.5) * 1.1 : 0;
      head.rotation.z += (twitch - head.rotation.z) * Math.min(1, dt * (twitch ? 18 : 3));
      head.rotation.y += (state.look - head.rotation.y) * Math.min(1, dt * 4);
      eyeMat.color.setRGB(0.75, 0.88, 1).multiplyScalar(3.5 + Math.sin(t * 2.4 + seed) * 1.5);
    },
  };
}
