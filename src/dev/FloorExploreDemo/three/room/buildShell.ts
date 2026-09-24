import * as THREE from "three";
import { STRUCTURE } from "../../data";
import { isBackWall } from "../../engine/doorGeometry";
import type { WallSide } from "../../types";
import { worldUv } from "../core/geometryUtils";
import { radialTexture } from "../textures/decalTextures";
import type { BuildContext } from "./buildContext";

interface Opening { c0: number; c1: number; bottom: number; top: number }

/** 各面墙沿墙方向的跨度(转角归属: 后墙包住后角与两侧前角的端头, 让剖面落在前方)。 */
function wallSpan(side: WallSide, w: number, d: number, t: number): [number, number] {
  if (side === "x0") return [-t, d + t];
  if (side === "z0") return [0, w + t];
  if (side === "x1") return [0, d + t];
  return [0, w];
}

function openingsOf(ctx: BuildContext, side: WallSide, height: number): Opening[] {
  const list: Opening[] = [];
  for (const door of ctx.room.doors) {
    if (door.side !== side) continue;
    list.push({ c0: door.offset - door.width / 2, c1: door.offset + door.width / 2, bottom: 0, top: STRUCTURE.doorHeight });
  }
  for (const win of ctx.room.windows) {
    if (win.side !== side || win.bottom >= height) continue;
    list.push({ c0: win.offset - win.width / 2, c1: win.offset + win.width / 2, bottom: win.bottom, top: win.top });
  }
  return list.sort((a, b) => a.c0 - b.c0);
}

/** 墙沿线段 [c0,c1] × 高度 [y0,y1] 的一块实体。 */
function wallPiece(ctx: BuildContext, side: WallSide, c0: number, c1: number, y0: number, y1: number, materials: THREE.Material[]): THREE.Mesh {
  const { width, depth } = ctx.room;
  const t = STRUCTURE.wallThickness;
  const len = c1 - c0;
  const h = y1 - y0;
  const alongX = side === "z0" || side === "z1";
  const geometry = alongX ? new THREE.BoxGeometry(len, h, t) : new THREE.BoxGeometry(t, h, len);
  const mid = (c0 + c1) / 2;
  const cy = (y0 + y1) / 2;
  const position = side === "x0" ? new THREE.Vector3(-t / 2, cy, mid)
    : side === "x1" ? new THREE.Vector3(width + t / 2, cy, mid)
      : side === "z0" ? new THREE.Vector3(mid, cy, -t / 2)
        : new THREE.Vector3(mid, cy, depth + t / 2);
  worldUv(geometry, ctx.kit.meters("wall"), position);
  const mesh = new THREE.Mesh(geometry, materials);
  mesh.position.copy(position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function buildWall(ctx: BuildContext, side: WallSide, group: THREE.Group): void {
  const { width, depth, wallTint } = ctx.room;
  const t = STRUCTURE.wallThickness;
  const back = isBackWall(side);
  const height = back ? STRUCTURE.wallHeight : STRUCTURE.cutHeight;
  const wall = ctx.kit.surface("wall", { color: wallTint, bumpScale: 1.6 });
  const cut = ctx.kit.surface("cut", { color: 0xd8d2c4, bumpScale: 0.8 });
  const alongX = side === "z0" || side === "z1";
  // BoxGeometry 面顺序: +x, -x, +y, -y, +z, -z。长面用墙漆, 端头与顶面用剖切断面。
  const materials = alongX ? [cut, cut, cut, cut, wall, wall] : [wall, wall, cut, cut, cut, cut];
  const [a, b] = wallSpan(side, width, depth, t);
  let cursor = a;
  for (const hole of openingsOf(ctx, side, height)) {
    if (hole.c0 > cursor) group.add(wallPiece(ctx, side, cursor, hole.c0, 0, height, materials));
    if (hole.bottom > 0) group.add(wallPiece(ctx, side, hole.c0, hole.c1, 0, Math.min(hole.bottom, height), materials));
    if (hole.top < height) group.add(wallPiece(ctx, side, hole.c0, hole.c1, hole.top, height, materials));
    cursor = hole.c1;
  }
  if (cursor < b) group.add(wallPiece(ctx, side, cursor, b, 0, height, materials));
  if (back) buildBaseboard(ctx, side, group, a, b);
}

/** 后墙内侧的踢脚线, 门洞处断开。 */
function buildBaseboard(ctx: BuildContext, side: WallSide, group: THREE.Group, a: number, b: number): void {
  const material = ctx.kit.plain(0x1c1f20, { roughness: 0.6 });
  const alongX = side === "z0";
  const holes = openingsOf(ctx, side, STRUCTURE.wallHeight).filter((hole) => hole.bottom === 0);
  let cursor = Math.max(a, 0);
  const end = alongX ? Math.min(b, ctx.room.width) : Math.min(b, ctx.room.depth);
  const add = (c0: number, c1: number) => {
    if (c1 - c0 < 0.05) return;
    const len = c1 - c0;
    const mesh = new THREE.Mesh(alongX ? new THREE.BoxGeometry(len, 0.12, 0.025) : new THREE.BoxGeometry(0.025, 0.12, len), material);
    mesh.position.set(alongX ? (c0 + c1) / 2 : 0.0125, 0.06, alongX ? 0.0125 : (c0 + c1) / 2);
    mesh.receiveShadow = true;
    group.add(mesh);
  };
  for (const hole of holes) {
    add(cursor, hole.c0);
    cursor = hole.c1;
  }
  add(cursor, end);
}

/** 楼板: 顶面是房间地面, 四周露出剖切断面; 底下一圈柔和的暗光把房间托在虚空里。 */
function buildSlab(ctx: BuildContext, group: THREE.Group): THREE.Mesh {
  const { width, depth, floor } = ctx.room;
  const s = STRUCTURE.slabThickness;
  const t = STRUCTURE.wallThickness;
  const w = width + t * 2;
  const d = depth + t * 2;
  const geometry = new THREE.BoxGeometry(w, s, d);
  const position = new THREE.Vector3(width / 2, -s / 2, depth / 2);
  worldUv(geometry, ctx.kit.meters(floor), position);
  const floorMat = ctx.kit.surface(floor, { bumpScale: floor === "carpet" ? 2.2 : 1.1, envMapIntensity: floor === "tile" ? 1 : 0.7 });
  const cut = ctx.kit.surface("cut", { color: 0xcfc9bb, bumpScale: 0.8 });
  const slab = new THREE.Mesh(geometry, [cut, cut, floorMat, cut, cut, cut]);
  slab.position.copy(position);
  slab.receiveShadow = true;
  slab.name = "floor";
  group.add(slab);

  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 2.6, d * 2.6),
    ctx.disposer.track(new THREE.MeshBasicMaterial({
      color: new THREE.Color(ctx.room.mood.fog).multiplyScalar(0.22),
      alphaMap: radialTexture(),
      transparent: true,
      depthWrite: false,
    })),
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.set(width / 2, -s - 0.6, depth / 2);
  group.add(halo);
  return slab;
}

export function buildShell(ctx: BuildContext): THREE.Group {
  const group = new THREE.Group();
  group.name = "shell";
  buildSlab(ctx, group);
  for (const side of ["x0", "z0", "x1", "z1"] as const) buildWall(ctx, side, group);
  return group;
}
