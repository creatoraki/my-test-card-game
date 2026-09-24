import * as THREE from "three";
import { box, cylinder } from "../core/geometryUtils";
import { createLightShaft } from "../fx/lightShafts";
import { PALETTE, type MaterialKit } from "../materials/materialKit";
import { radialTexture } from "../textures/decalTextures";

/** 探索者的骨架节点, 供程序化动画驱动。 */
export interface ExplorerRig {
  root: THREE.Group;
  body: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  hips: [THREE.Group, THREE.Group];
  knees: [THREE.Group, THREE.Group];
  shoulders: [THREE.Group, THREE.Group];
  elbows: [THREE.Group, THREE.Group];
  headlamp: THREE.SpotLight;
  lampGlow: THREE.MeshBasicMaterial;
  shaft: ReturnType<typeof createLightShaft>;
  dispose(): void;
}

function capsule(radius: number, length: number, material: THREE.Material, y: number): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 4, 12), material);
  mesh.position.y = y;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** 一条肢体: 关节枢轴在顶端, 下一节关节挂在末端。 */
function segment(radius: number, length: number, material: THREE.Material): { pivot: THREE.Group; end: THREE.Group } {
  const pivot = new THREE.Group();
  pivot.add(capsule(radius, length - radius * 2, material, -length / 2));
  const end = new THREE.Group();
  end.position.y = -length;
  pivot.add(end);
  return { pivot, end };
}

/**
 * 探索者: 橙色防护夹克 + 胸前背带、大背包与挂着的小提灯、
 * 头盔上的头灯(实时投影的聚光灯, 光锥随头部摆动)、防毒面罩与护目镜。
 * 所有材质为探索者独有, 随演示一起销毁。
 */
export function buildExplorer(kit: MaterialKit): ExplorerRig {
  const owned: { dispose(): void }[] = [];
  const own = <T extends { dispose(): void }>(r: T) => { owned.push(r); return r; };
  const jacket = kit.plain(PALETTE.jacket, { roughness: 0.75 });
  const reflective = kit.plain(0xd8dad6, { roughness: 0.3, metalness: 0.4, emissive: 0x3a3c3a, emissiveIntensity: 0.6 });
  const pants = kit.plain(0x2e3338, { roughness: 0.9 });
  const strap = kit.plain(0x1c1e1f, { roughness: 0.6 });
  const bootMat = kit.plain(0x1a1715, { roughness: 0.65 });
  const glove = kit.plain(0x2a2621, { roughness: 0.8 });
  const helmetMat = kit.plain(0x3d4a42, { roughness: 0.45, metalness: 0.3 });
  const maskMat = kit.plain(0x1d2022, { roughness: 0.5, metalness: 0.2 });
  const lens = kit.plain(0x0b1418, { roughness: 0.05, metalness: 0.6, envMapIntensity: 2 });
  const packMat = kit.plain(0x55603f, { roughness: 0.95 });

  const root = new THREE.Group();
  root.name = "explorer";
  const body = new THREE.Group();
  root.add(body);

  // 贴地的柔和接触阴影
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    own(new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: radialTexture(), transparent: true, opacity: 0.55, depthWrite: false })),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.006;
  root.add(contact);

  // 腿
  const hips: THREE.Group[] = [];
  const knees: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const thigh = segment(0.075, 0.43, pants);
    thigh.pivot.position.set(side * 0.1, 0.9, 0);
    const shin = segment(0.065, 0.42, pants);
    thigh.end.add(shin.pivot);
    const boot = box(0.13, 0.11, 0.24, bootMat, 0, -0.0, 0.04);
    shin.end.add(boot);
    body.add(thigh.pivot);
    hips.push(thigh.pivot);
    knees.push(shin.pivot);
  }
  body.add(box(0.32, 0.14, 0.2, pants, 0, 0.93, 0));

  // 躯干
  const torso = new THREE.Group();
  torso.position.y = 0.95;
  body.add(torso);
  const chest = capsule(0.17, 0.3, jacket, 0.27);
  chest.scale.set(1.05, 1, 0.78);
  torso.add(chest);
  torso.add(box(0.36, 0.035, 0.28, reflective, 0, 0.2, 0, { cast: false }));
  for (const side of [-1, 1]) {
    const band = box(0.045, 0.5, 0.29, strap, side * 0.1, 0.3, 0.005);
    band.rotation.z = side * 0.08;
    torso.add(band);
  }
  torso.add(box(0.16, 0.1, 0.05, strap, 0.05, 0.28, 0.14));
  // 背包 + 睡垫 + 小提灯
  const pack = new THREE.Group();
  pack.position.set(0, 0.3, -0.21);
  pack.add(box(0.36, 0.5, 0.2, packMat, 0, 0, 0));
  pack.add(box(0.3, 0.2, 0.07, kit.plain(0x47512f, { roughness: 0.95 }), 0, -0.1, -0.12));
  const mat = cylinder(0.075, 0.075, 0.44, kit.plain(0x2d4e6e, { roughness: 0.8 }), 14, 0, 0.3, -0.02);
  mat.rotation.z = Math.PI / 2;
  pack.add(mat);
  const lanternGlow = own(new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffb35c).multiplyScalar(2.2) }));
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 10), lanternGlow);
  lantern.position.set(0.2, -0.18, -0.08);
  pack.add(lantern);
  torso.add(pack);

  // 手臂
  const shoulders: THREE.Group[] = [];
  const elbows: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const upper = segment(0.062, 0.3, jacket);
    upper.pivot.position.set(side * 0.22, 0.44, 0);
    const fore = segment(0.055, 0.28, jacket);
    upper.end.add(fore.pivot);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), glove);
    hand.castShadow = true;
    fore.end.add(hand);
    torso.add(upper.pivot);
    shoulders.push(upper.pivot);
    elbows.push(fore.pivot);
  }

  // 头部: 头盔、头灯、防毒面罩、护目镜
  const head = new THREE.Group();
  head.position.y = 0.56;
  torso.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), kit.plain(0x2b2724, { roughness: 0.9 }));
  skull.position.y = 0.1;
  skull.castShadow = true;
  head.add(skull);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.135, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), helmetMat);
  helmet.position.y = 0.13;
  helmet.castShadow = true;
  head.add(helmet);
  head.add(box(0.29, 0.02, 0.3, helmetMat, 0, 0.13, 0.01));
  const mask = box(0.13, 0.09, 0.08, maskMat, 0, 0.05, 0.1);
  head.add(mask);
  for (const side of [-1, 1]) {
    const can = cylinder(0.03, 0.03, 0.06, maskMat, 10, side * 0.07, 0.03, 0.14);
    can.rotation.set(Math.PI / 2, 0, side * 0.5);
    head.add(can);
    const eye = cylinder(0.03, 0.03, 0.02, lens, 12, side * 0.045, 0.12, 0.105);
    eye.rotation.x = Math.PI / 2;
    head.add(eye);
  }
  const lampGlow = own(new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff1d6).multiplyScalar(4) }));
  const lampBody = cylinder(0.03, 0.036, 0.05, maskMat, 12, 0, 0.2, 0.13);
  lampBody.rotation.x = Math.PI / 2;
  head.add(lampBody);
  const lampFace = new THREE.Mesh(new THREE.CircleGeometry(0.028, 16), lampGlow);
  lampFace.position.set(0, 0.2, 0.156);
  head.add(lampFace);

  const headlamp = new THREE.SpotLight(0xfff0d8, 26, 13, 0.52, 0.55, 2);
  headlamp.position.set(0, 0.2, 0.17);
  headlamp.target.position.set(0, -1.5, 3.4);
  headlamp.castShadow = true;
  headlamp.shadow.mapSize.set(1024, 1024);
  headlamp.shadow.camera.near = 0.15;
  headlamp.shadow.camera.far = 12;
  headlamp.shadow.bias = -0.0005;
  headlamp.shadow.normalBias = 0.03;
  headlamp.shadow.radius = 3;
  head.add(headlamp, headlamp.target);
  const shaft = createLightShaft(new THREE.Vector3(0, 0.2, 0.17), new THREE.Vector3(0, -1.5, 3.4), 0.03, 0.95, 0xfff0d8, 0.05);
  owned.push(shaft.material);
  head.add(shaft.mesh);

  // 补光: 让角色在暗处也读得出轮廓
  const fill = new THREE.PointLight(0xffd6a8, 1.1, 3.2, 2);
  fill.position.set(0.3, 1.6, 0.5);
  root.add(fill);

  return {
    root,
    body,
    torso,
    head,
    hips: [hips[0], hips[1]],
    knees: [knees[0], knees[1]],
    shoulders: [shoulders[0], shoulders[1]],
    elbows: [elbows[0], elbows[1]],
    headlamp,
    lampGlow,
    shaft,
    dispose: () => {
      root.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
      });
      headlamp.dispose();
      fill.dispose();
      for (const r of owned) r.dispose();
    },
  };
}
