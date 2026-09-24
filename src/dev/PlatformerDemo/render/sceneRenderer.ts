import type { LayerName } from "../engine/camera";
import type { WorldState } from "../engine/world";
import { SCREEN_H, SCREEN_W, cameraPx, layerOffset } from "./core/grid";
import { bakeVignette, drawLights } from "./fx/lighting";
import { bakeDome } from "./scene/domeLayer";
import { bakeForeground } from "./scene/foregroundLayer";
import { bakeIslands } from "./scene/islandLayer";
import { bakeSky } from "./scene/skyLayer";
import { bakeTerrain } from "./scene/terrain/terrainLayer";
import { bakeTowers } from "./scene/towerLayer";
import type { TerrainLight } from "./scene/terrain/terrainKit";

// 场景合成：挂载时一次性烘焙全部静态图层，之后每帧按像素对齐的镜头位置平移贴图。

export interface BakedScene {
  sky: HTMLCanvasElement;
  layers: readonly { name: LayerName; canvas: HTMLCanvasElement }[];
  terrain: HTMLCanvasElement;
  lights: readonly TerrainLight[];
  foreground: HTMLCanvasElement;
  vignette: HTMLCanvasElement;
}

let cached: BakedScene | undefined;

/** 烘焙结果只与种子有关，模块级缓存，重置场景或重新挂载都不再重复烘焙。 */
export function bakeScene(): BakedScene {
  if (cached) return cached;
  const terrain = bakeTerrain();
  cached = {
    sky: bakeSky(),
    layers: [
      { name: "dome", canvas: bakeDome() },
      { name: "tower", canvas: bakeTowers() },
      { name: "island", canvas: bakeIslands() },
    ],
    terrain: terrain.canvas,
    lights: terrain.lights,
    foreground: bakeForeground(),
    vignette: bakeVignette(),
  };
  return cached;
}

function prepare(ctx: CanvasRenderingContext2D) {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, SCREEN_W, SCREEN_H);
}

/** 世界层中的动态角色，按镜头像素位置自行绘制。 */
export type ActorDrawer = (ctx: CanvasRenderingContext2D, camPx: number) => void;

/** 后景画布：天空 → 远/中/近视差层 → 世界地形 → 角色 → 光晕。 */
export function drawBack(ctx: CanvasRenderingContext2D, scene: BakedScene, world: WorldState, actors: readonly ActorDrawer[]) {
  prepare(ctx);
  const cam = cameraPx(world.camera);
  ctx.drawImage(scene.sky, 0, 0);
  for (const layer of scene.layers) ctx.drawImage(layer.canvas, -layerOffset(cam, layer.name), 0);
  ctx.drawImage(scene.terrain, -cam, 0);
  for (const draw of actors) draw(ctx, cam);
  drawLights(ctx, scene.lights, cam, world.time);
}

/** 前景画布：前景剪影 + 暗角，位于角色之上。 */
export function drawFront(ctx: CanvasRenderingContext2D, scene: BakedScene, world: WorldState) {
  prepare(ctx);
  const cam = cameraPx(world.camera);
  ctx.drawImage(scene.foreground, -layerOffset(cam, "foreground"), 0);
  ctx.drawImage(scene.vignette, 0, 0);
}
