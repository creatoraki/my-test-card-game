import * as THREE from "three";
import { STRUCTURE } from "../../data";
import { wallCenter } from "../../engine/doorGeometry";
import { yawOf } from "../../engine/rect";
import type { WindowDef } from "../../types";
import { box } from "../core/geometryUtils";
import { fadeTexture } from "../textures/decalTextures";
import type { BuildContext } from "./buildContext";

const INWARD = { x0: [1, 0], x1: [-1, 0], z0: [0, 1], z1: [0, -1] } as const;

/** 窗: 金属窗框 + 十字窗棂 + 脏玻璃(一格已碎), 窗外一块冷色夜空把窗洞点亮。 */
function buildWindow(ctx: BuildContext, win: WindowDef): THREE.Group {
  const t = STRUCTURE.wallThickness;
  const center = wallCenter(ctx.room, win.side, win.offset);
  const [ix, iz] = INWARD[win.side];
  const root = new THREE.Group();
  root.position.set(center.x, 0, center.z);
  root.rotation.y = yawOf(ix, iz);

  const w = win.width;
  const h = win.top - win.bottom;
  const cy = (win.top + win.bottom) / 2;
  const frame = ctx.kit.plain(0x30363a, { roughness: 0.45, metalness: 0.6 });
  for (const sign of [-1, 1]) root.add(box(0.07, h + 0.07, 0.12, frame, sign * (w / 2), cy, -t / 2));
  root.add(box(w + 0.07, 0.07, 0.12, frame, 0, win.top, -t / 2));
  root.add(box(w + 0.18, 0.06, t + 0.14, ctx.kit.plain(0x6c6a64, { roughness: 0.8 }), 0, win.bottom - 0.02, -t / 2 + 0.05));
  root.add(box(0.05, h, 0.08, frame, 0, cy, -t / 2));
  root.add(box(w, 0.05, 0.08, frame, 0, cy + h * 0.12, -t / 2));

  const glass = ctx.disposer.track(new THREE.MeshStandardMaterial({
    color: 0x7f9aa8, roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.18, depthWrite: false,
  }));
  const paneW = w / 2 - 0.05;
  // 左下一格碎了, 只剩边角
  const panes: [number, number, number, number][] = [
    [-w / 4, cy + h * 0.12 + (win.top - cy - h * 0.12) / 2, paneW, win.top - cy - h * 0.12 - 0.04],
    [w / 4, cy + h * 0.12 + (win.top - cy - h * 0.12) / 2, paneW, win.top - cy - h * 0.12 - 0.04],
    [w / 4, (win.bottom + cy + h * 0.12) / 2, paneW, cy + h * 0.12 - win.bottom - 0.04],
  ];
  for (const [x, y, pw, ph] of panes) {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), glass);
    pane.position.set(x, y, -t / 2);
    root.add(pane);
  }
  const shard = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-w / 2 + 0.03, win.bottom + 0.03, 0),
    new THREE.Vector3(-0.04, win.bottom + 0.03, 0),
    new THREE.Vector3(-w / 2 + 0.03, win.bottom + h * 0.4, 0),
  ]), glass);
  shard.geometry.computeVertexNormals();
  shard.position.z = -t / 2;
  root.add(shard);

  // 窗外夜空: 冷蓝色自发光, 底部更亮(远处城市的余光)。
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(w + 0.6, h + 0.6),
    ctx.disposer.track(new THREE.MeshBasicMaterial({ color: new THREE.Color(0x3d5a8c).multiplyScalar(0.9), alphaMap: fadeTexture(), transparent: true, depthWrite: false })),
  );
  sky.position.set(0, cy, -t - 0.6);
  root.add(sky);
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.6, h + 0.6), ctx.kit.glow(0x0e1726, 1));
  backdrop.position.set(0, cy, -t - 0.62);
  root.add(backdrop);
  return root;
}

export function buildWindows(ctx: BuildContext): THREE.Group {
  const group = new THREE.Group();
  group.name = "windows";
  for (const win of ctx.room.windows) group.add(buildWindow(ctx, win));
  return group;
}
