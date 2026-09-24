import { PLATFORMS } from "../../../engine/level";
import { SCREEN_H, WORLD_PX_W, toPx } from "../../core/grid";
import { FOG } from "../../core/palette";
import { PixelBuffer, pack } from "../../core/pixelBuffer";
import { postProcess, tintAll } from "../../core/spritePost";
import { floatingPlatform, groundSegment, type Span } from "./groundTiles";
import { backTree, balustrade, lampPost, layoutDecor, planter, ruinedArch } from "./terrainDecor";
import { WORLD_LINE, type TerrainLight } from "./terrainKit";

// 世界层地形烘焙：远排装饰、近排装饰、可站立地形分三块缓冲各自描边，再按前后顺序合成。

export interface TerrainBake {
  canvas: HTMLCanvasElement;
  lights: TerrainLight[];
}

function spanOf(p: (typeof PLATFORMS)[number]): Span {
  return { x0: toPx(p.x), x1: toPx(p.x + p.w), top: toPx(p.y), seed: p.x + 101 };
}

export function bakeTerrain(): TerrainBake {
  const lights: TerrainLight[] = [];
  const back = new PixelBuffer(WORLD_PX_W, SCREEN_H);
  const mid = new PixelBuffer(WORLD_PX_W, SCREEN_H);
  const ground = new PixelBuffer(WORLD_PX_W, SCREEN_H);

  for (const p of PLATFORMS) {
    const span = spanOf(p);
    if (p.kind === "float") {
      floatingPlatform(ground, span, lights);
      continue;
    }
    for (const item of layoutDecor(span)) {
      if (item.kind === "arch") ruinedArch(back, item.x, span.top, item.seed);
      else if (item.kind === "tree") backTree(back, item.x, span.top, item.seed);
      else if (item.kind === "lamp") lampPost(mid, item.x, span.top, item.seed, lights);
      else planter(mid, item.x, span.top, item.seed);
    }
    balustrade(mid, span);
    groundSegment(ground, span, lights);
  }

  postProcess(back, { outline: 0.6, rim: 0.35, shade: 0.3 });
  tintAll(back, pack(FOG.island), 0.18);
  postProcess(mid, WORLD_LINE);
  postProcess(ground, WORLD_LINE);
  back.blit(mid, 0, 0);
  back.blit(ground, 0, 0);
  return { canvas: back.toCanvas(), lights };
}
