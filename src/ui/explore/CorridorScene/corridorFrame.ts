import { CORRIDOR_LAYOUT, cameraX } from "./corridorLayout";

export interface CorridorFrameNodes {
  world: HTMLElement | null;
  farStrip: HTMLElement | null;
  player: HTMLElement | null;
}

/** 把行走帧的连续位置直接写入合成层，避免每帧触发 React 协调与布局。 */
export function applyCorridorFrame(nodes: CorridorFrameNodes, x: number, width: number): void {
  const camera = cameraX(x, width);
  nodes.world?.style.setProperty("transform", `translate3d(${-camera}px, 0, 0)`);
  nodes.player?.style.setProperty("transform", `translate3d(${x}px, 0, 0)`);
  const farOffset = (camera * CORRIDOR_LAYOUT.farParallax) % CORRIDOR_LAYOUT.farTileWidth;
  nodes.farStrip?.style.setProperty("transform", `translate3d(${-farOffset}px, 0, 0)`);
}
