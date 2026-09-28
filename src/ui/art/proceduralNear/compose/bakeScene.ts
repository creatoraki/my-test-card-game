import { NEAR_SCENE_GEOMETRY, type BakedTile, type BakeOptions, type NearSceneBake, type NearScenePlan } from "../types";
import { drawBuilding } from "../buildings/catalog";
import { drawCable } from "../buildings/links";
import { drawStreet } from "../street/catalog";
import { drawWalkway } from "../floor/walkway";
import { drawUnderbelly } from "../floor/underbelly";
import { drawReflections } from "../floor/reflections";
import { drawMirror } from "../floor/mirror";
import { fogBackRow, foreGround, weatherFore, weatherFront } from "./weathering";

// 分块烘焙：房间按 tileWidth 切成若干 canvas，每帧只画一块，避免长任务卡住页面。
// 每块只画包围盒与之相交的元素；绘制全在世界坐标下进行，所以跨块元素两边完全一致。
// 前景层单独烘焙：只给含前景设施的块建 canvas，挂在角色之上。

const G = NEAR_SCENE_GEOMETRY;
/** 挑出的招牌、光晕、光锥会超出占地，裁剪时多留余量。 */
const PAD = 220;

type Hit = (a: number, b: number) => boolean;

function hitter(x0: number, x1: number): Hit {
  return (a, b) => b >= x0 - PAD && a <= x1 + PAD;
}

function drawTile(ctx: CanvasRenderingContext2D, plan: NearScenePlan, x0: number, x1: number): void {
  const hit = hitter(x0, x1);
  ctx.save();
  ctx.translate(-x0, 0);
  for (const b of plan.back) if (hit(b.x, b.x + b.width * b.scale)) drawBuilding(ctx, b);
  fogBackRow(ctx, x0, x1);
  // 线缆两端藏在前排楼体后面，只露出楼间下垂的一段。
  for (const c of plan.cables) if (hit(Math.min(c.x0, c.x1), Math.max(c.x0, c.x1))) drawCable(ctx, c);
  for (const b of plan.front) if (hit(b.x, b.x + b.width)) drawBuilding(ctx, b);
  weatherFront(ctx, x0, x1);
  drawWalkway(ctx, x0, x1);
  drawMirror(ctx, x0, x1);
  drawUnderbelly(ctx, x0, x1);
  for (const s of plan.street) if (hit(s.x, s.x + s.width)) drawStreet(ctx, s);
  drawReflections(ctx, plan.lamps, x0, x1);
  ctx.restore();
}

function drawForeTile(ctx: CanvasRenderingContext2D, plan: NearScenePlan, x0: number, x1: number): void {
  const hit = hitter(x0, x1);
  ctx.save();
  ctx.translate(-x0, 0);
  for (const s of plan.fore) {
    if (!hit(s.x, s.x + s.width)) continue;
    foreGround(ctx, s.x, s.width);
    drawStreet(ctx, s);
  }
  weatherFore(ctx, x0, x1);
  ctx.restore();
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

function releaseTiles(tiles: readonly BakedTile[]): void {
  tiles.forEach((tile) => {
    tile.canvas.width = 0;
    tile.canvas.height = 0;
  });
}

/** 释放烘焙结果占用的位图内存。 */
export function releaseNearBake(bake: NearSceneBake | null | undefined): void {
  if (!bake) return;
  releaseTiles(bake.tiles);
  releaseTiles(bake.foreTiles);
}

function newTile(x: number, width: number): { tile: BakedTile; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = G.height;
  return { tile: { x, width, canvas }, ctx: canvas.getContext("2d")! };
}

export async function bakeNearScene(plan: NearScenePlan, options: BakeOptions = {}): Promise<NearSceneBake> {
  const { signal, onProgress } = options;
  const count = Math.ceil(plan.width / G.tileWidth);
  const tiles: BakedTile[] = [];
  const foreTiles: BakedTile[] = [];
  let drawMs = 0;
  let slowestTileMs = 0;
  const abort = () => {
    releaseTiles(tiles);
    releaseTiles(foreTiles);
    throw new DOMException("烘焙已取消", "AbortError");
  };
  for (let i = 0; i < count; i++) {
    if (signal?.aborted) abort();
    const x = i * G.tileWidth;
    const width = Math.min(G.tileWidth, plan.width - x);
    const start = performance.now();
    const main = newTile(x, width);
    drawTile(main.ctx, plan, x, x + width);
    tiles.push(main.tile);
    const hit = hitter(x, x + width);
    if (plan.fore.some((s) => hit(s.x, s.x + s.width))) {
      const fore = newTile(x, width);
      drawForeTile(fore.ctx, plan, x, x + width);
      foreTiles.push(fore.tile);
    }
    const spent = performance.now() - start;
    drawMs += spent;
    slowestTileMs = Math.max(slowestTileMs, spent);
    onProgress?.((i + 1) / count);
    await nextFrame();
  }
  if (signal?.aborted) abort();
  return { plan, tiles, foreTiles, drawMs, slowestTileMs };
}
