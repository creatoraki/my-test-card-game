import * as THREE from "three";
import { DESIGN_H, DESIGN_W, FLOOR_DEPTH, WALL_BASE_WY } from "../../data/layout";
import type { RoomDef } from "../../types";
import { BLANK_TEXTURE, type BakedSurface, type BakeJob } from "../bake/surfaceBaker";
import { LAYER } from "../core/depthSort";
import { makeQuad, placeMesh } from "../core/quad";
import type { RigUniforms } from "../lighting/lightRig";
import type { ZoneShaders } from "../zones";
import { atmosphereMaterial } from "./atmosphereShader";
import { farMaterial } from "./farShader";
import { FLOOR_BAKE_LIP, floorBakeMaterial, floorLiveMaterial } from "./floorShader";
import { foreMaterial } from "./foregroundShader";
import { wallBakeMaterial, wallLiveMaterial } from "./wallShader";

/** 震屏时屏幕边缘多画出来的余量。 */
const PAD = 48;

export interface RoomUniforms {
  [key: string]: THREE.IUniform;
  uWidth: THREE.IUniform<number>;
  uSeed: THREE.IUniform<number>;
  uUpDoorX: THREE.IUniform<number>;
  uDownDoorX: THREE.IUniform<number>;
  uLocked: THREE.IUniform<number>;
}

export interface RoomLayers {
  group: THREE.Group;
  uniforms: RoomUniforms;
  /** 后墙、地面的烘焙工作(烘完回填实时材质的贴图; 贴图归烘焙缓存所有)。 */
  bakeJobs: BakeJob[];
  /** 跟随相机的全屏层(背景 / 空气 / 前景)每帧对齐到相机。 */
  follow(camX: number): void;
}

/** 实时材质读取烘焙结果所需的 uniforms; 烘焙前先挂占位贴图。 */
function gbufUniforms(): Record<string, THREE.IUniform> {
  return {
    tG0: { value: BLANK_TEXTURE },
    tG1: { value: BLANK_TEXTURE },
    tG2: { value: BLANK_TEXTURE },
    tG3: { value: BLANK_TEXTURE },
    uBakeRect: { value: new THREE.Vector4(0, 0, 1, 1) },
  };
}

function applyGbuf(target: Record<string, THREE.IUniform>, baked: BakedSurface): void {
  const [g0, g1, g2, g3] = baked.textures;
  target.tG0.value = g0;
  target.tG1.value = g1;
  target.tG2.value = g2;
  target.tG3.value = g3;
  target.uBakeRect.value = baked.rect;
}

/**
 * 搭出一个房间的五层: 背景层、后墙、地面、空气层、前景层。
 * 后墙与地面的程序化材质以烘焙工作的形式返回, 由房间统一分帧烘焙; 每帧只做光照与动画发光。
 */
export function buildRoomLayers(room: RoomDef, zone: ZoneShaders, rig: RigUniforms): RoomLayers {
  const up = room.doors.find((d) => d.side === "up");
  const down = room.doors.find((d) => d.side === "down");
  const uniforms: RoomUniforms = {
    uWidth: { value: room.width },
    uSeed: { value: room.seed },
    uUpDoorX: { value: up ? up.x ?? room.width / 2 : -1 },
    uDownDoorX: { value: down ? down.x ?? room.width / 2 : -1 },
    uLocked: { value: 0 },
  };
  const group = new THREE.Group();
  const screenQuad = () => makeQuad(DESIGN_W + PAD * 2, DESIGN_H + PAD * 2, -PAD, -PAD);
  const spanW = room.width + PAD * 2;

  const wallH = DESIGN_H + PAD - WALL_BASE_WY;
  const wallRect = { x: -PAD, y: WALL_BASE_WY, w: spanW, h: wallH };
  const bakeDepth = FLOOR_DEPTH + FLOOR_BAKE_LIP;
  const floorRect = { x: -PAD, y: WALL_BASE_WY - bakeDepth, w: spanW, h: bakeDepth };

  const wallGbuf = gbufUniforms();
  const floorGbuf = gbufUniforms();
  const farWall = { tWallG0: { value: BLANK_TEXTURE as THREE.Texture }, uWallRect: { value: new THREE.Vector4(0, 0, 1, 1) } };

  const far = placeMesh(screenQuad(), farMaterial(zone, rig, uniforms, farWall), 0, 0, LAYER.far);
  const wall = placeMesh(makeQuad(spanW, wallH, -PAD, 0), wallLiveMaterial(zone, rig, uniforms, wallGbuf), 0, WALL_BASE_WY, LAYER.wall);
  const floor = placeMesh(makeQuad(spanW, WALL_BASE_WY + PAD, -PAD, -WALL_BASE_WY - PAD), floorLiveMaterial(zone, rig, uniforms, floorGbuf), 0, WALL_BASE_WY, LAYER.floor);
  const atmos = placeMesh(screenQuad(), atmosphereMaterial(rig, uniforms), 0, 0, LAYER.atmosphere);
  const fore = placeMesh(screenQuad(), foreMaterial(zone, rig, uniforms), 0, 0, LAYER.foreground);
  group.add(far, wall, floor, atmos, fore);

  // 烘焙面片: 摆在世界矩形上, 由烘焙器用正交相机正好框住
  const bakeMesh = (material: THREE.ShaderMaterial, rect: typeof wallRect) => placeMesh(makeQuad(rect.w, rect.h, 0, 0), material, rect.x, rect.y, 0);
  const bakeJobs: BakeJob[] = [
    {
      key: "wall",
      mesh: bakeMesh(wallBakeMaterial(zone, rig, uniforms), wallRect),
      rect: wallRect,
      count: 4,
      density: 1,
      apply: (baked) => {
        applyGbuf(wallGbuf, baked);
        farWall.tWallG0.value = baked.textures[0];
        farWall.uWallRect.value = baked.rect;
      },
    },
    {
      key: "floor",
      mesh: bakeMesh(floorBakeMaterial(zone, rig, uniforms), floorRect),
      rect: floorRect,
      count: 4,
      density: 1,
      apply: (baked) => applyGbuf(floorGbuf, baked),
    },
  ];

  return {
    group,
    uniforms,
    bakeJobs,
    follow: (camX) => {
      far.position.x = camX;
      atmos.position.x = camX;
      fore.position.x = camX;
    },
  };
}
