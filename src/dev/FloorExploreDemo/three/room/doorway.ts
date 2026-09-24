import * as THREE from "three";
import { STRUCTURE } from "../../data";
import { doorFrame, isBackWall } from "../../engine/doorGeometry";
import { yawOf } from "../../engine/rect";
import type { DoorDef } from "../../types";
import { box } from "../core/geometryUtils";
import { fadeTexture, signTexture } from "../textures/decalTextures";
import type { BuildContext } from "./buildContext";

/** 以门为原点的本地坐标: x 沿墙, z 指向房内, 墙体占 z∈[-t,0]。 */
function doorRoot(ctx: BuildContext, door: DoorDef): THREE.Group {
  const frame = doorFrame(ctx.room, door, 0);
  const root = new THREE.Group();
  root.position.set(frame.center.x, 0, frame.center.z);
  root.rotation.y = yawOf(frame.inward.x, frame.inward.z);
  return root;
}

function additive(ctx: BuildContext, color: THREE.Color, alphaMap: THREE.Texture, side: THREE.Side = THREE.FrontSide): THREE.MeshBasicMaterial {
  return ctx.disposer.track(new THREE.MeshBasicMaterial({
    color, alphaMap, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side,
  }));
}

/** 门外的一小段走廊: 暗地面 + 两侧短墙, 渐隐进黑暗, 让门洞有纵深。 */
function corridorStub(ctx: BuildContext, root: THREE.Group, w: number, back: boolean): void {
  const t = STRUCTURE.wallThickness;
  const len = 2.4;
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(w + 0.5, len),
    ctx.disposer.track(new THREE.MeshStandardMaterial({ color: 0x1b1d1e, roughness: 0.7, alphaMap: fadeTexture(), transparent: true, depthWrite: false })),
  );
  // 平面本地 +y 转到门外方向: 贴图底端(不透明)贴着门, 越往外越透明。
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.004, -t - len / 2);
  floor.receiveShadow = true;
  root.add(floor);
  if (!back) return;
  const dark = ctx.kit.plain(0x121416, { roughness: 0.9 });
  for (const sign of [-1, 1]) root.add(box(0.12, STRUCTURE.doorHeight, 1.6, dark, sign * (w / 2 + 0.06), STRUCTURE.doorHeight / 2, -t - 0.8));
  root.add(box(w + 0.24, 0.1, 1.6, dark, 0, STRUCTURE.doorHeight + 0.05, -t - 0.8));
}

/** 门后透来的微光 + 门口地面的一道冷光带, 让出口在暗处也读得出来。 */
function doorGlow(ctx: BuildContext, root: THREE.Group, w: number, back: boolean): void {
  const t = STRUCTURE.wallThickness;
  const tint = new THREE.Color(ctx.room.mood.fog).lerp(new THREE.Color(0x9fd8ff), 0.5);
  if (back) {
    const veil = new THREE.Mesh(new THREE.PlaneGeometry(w, STRUCTURE.doorHeight), additive(ctx, tint.clone().multiplyScalar(0.35), fadeTexture()));
    veil.position.set(0, STRUCTURE.doorHeight / 2, -t - 1.2);
    root.add(veil);
  }
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, 1.6), additive(ctx, tint.clone().multiplyScalar(0.22), fadeTexture(), THREE.DoubleSide));
  strip.rotation.x = Math.PI / 2;
  strip.position.set(0, 0.01, 0.8 - t / 2);
  root.add(strip);
}

function doorLeaves(ctx: BuildContext, root: THREE.Group, w: number, variant: number): void {
  const leafMat = ctx.kit.surface("metal", { color: 0x6c7774, bumpScale: 0.6, metalness: 0.3, roughness: 1 });
  const barMat = ctx.kit.plain(0x9aa0a2, { roughness: 0.35, metalness: 0.8 });
  const glassMat = ctx.kit.plain(0x0c1216, { roughness: 0.15, metalness: 0.2 });
  const leafW = w / 2 - 0.02;
  const h = STRUCTURE.doorHeight - 0.05;
  // 左扇大开贴向墙面, 右扇虚掩(按变体决定是否已脱落)。
  const configs: [number, number][] = variant % 2 === 0 ? [[-1, -2.45], [1, 0.4]] : [[-1, -0.55], [1, 2.3]];
  for (const [side, angle] of configs) {
    if (variant % 3 === 2 && side === 1) continue;
    const pivot = new THREE.Group();
    pivot.position.set(side * (w / 2), 0, 0.03);
    pivot.rotation.y = angle;
    const leaf = new THREE.Group();
    leaf.add(box(leafW, h, 0.05, leafMat, 0, h / 2, 0));
    leaf.add(box(0.26, 0.4, 0.06, glassMat, 0, 1.55, 0));
    leaf.add(box(leafW * 0.7, 0.04, 0.05, barMat, 0, 1.02, 0.05));
    leaf.position.x = -side * (leafW / 2 + 0.01);
    pivot.add(leaf);
    root.add(pivot);
  }
}

function exitSign(ctx: BuildContext, root: THREE.Group): void {
  const face = ctx.disposer.track(new THREE.MeshBasicMaterial({ map: signTexture("安全出口", "#4dff9a"), color: new THREE.Color(2.2, 2.2, 2.2) }));
  const shell = ctx.kit.plain(0x1c2420, { roughness: 0.5 });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.2, 0.06), [shell, shell, shell, shell, face, shell]);
  sign.position.set(0, STRUCTURE.doorHeight + 0.26, 0.04);
  root.add(sign);
}

function doorFrameMesh(ctx: BuildContext, root: THREE.Group, w: number, back: boolean): void {
  const t = STRUCTURE.wallThickness;
  const frameMat = ctx.kit.plain(0x2b3033, { roughness: 0.5, metalness: 0.5 });
  const h = back ? STRUCTURE.doorHeight : STRUCTURE.cutHeight + 0.02;
  for (const sign of [-1, 1]) root.add(box(0.08, h, t + 0.06, frameMat, sign * (w / 2 + 0.02), h / 2, -t / 2));
  if (back) root.add(box(w + 0.2, 0.1, t + 0.06, frameMat, 0, STRUCTURE.doorHeight + 0.03, -t / 2));
  root.add(box(w, 0.02, t + 0.1, ctx.kit.plain(0x5d5f5c, { roughness: 0.4, metalness: 0.7 }), 0, 0.01, -t / 2));
}

function hitVolume(ctx: BuildContext, root: THREE.Group, door: DoorDef, back: boolean): void {
  const h = back ? STRUCTURE.doorHeight : 1.2;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(door.width, h, 1.4), ctx.kit.plain(0xffffff));
  mesh.position.set(0, h / 2, -0.35);
  mesh.visible = false;
  mesh.userData.pick = { kind: "door", id: door.id };
  root.add(mesh);
  ctx.pickables.push(mesh);
}

export function buildDoorways(ctx: BuildContext): THREE.Group {
  const group = new THREE.Group();
  group.name = "doorways";
  ctx.room.doors.forEach((door, index) => {
    const back = isBackWall(door.side);
    const root = doorRoot(ctx, door);
    doorFrameMesh(ctx, root, door.width, back);
    corridorStub(ctx, root, door.width, back);
    doorGlow(ctx, root, door.width, back);
    if (back) {
      doorLeaves(ctx, root, door.width, index + ctx.room.id.length);
      exitSign(ctx, root);
    }
    hitVolume(ctx, root, door, back);
    group.add(root);
  });
  return group;
}
