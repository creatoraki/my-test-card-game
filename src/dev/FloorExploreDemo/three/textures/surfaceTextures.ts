import * as THREE from "three";
import type { SurfaceLayers } from "./canvasNoise";
import { paintCarpet, paintConcrete, paintTerrazzo, paintTile } from "./floorPainters";
import { paintMetal, paintWall } from "./wallPainters";

export type SurfaceKind = "terrazzo" | "carpet" | "tile" | "concrete" | "cut" | "wall" | "metal";

export interface SurfaceSet {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  /** 一张贴图对应的世界尺寸(米), 世界坐标 UV 按它缩放。 */
  meters: number;
}

const PAINTERS: Record<SurfaceKind, { paint: () => SurfaceLayers; meters: number }> = {
  terrazzo: { paint: () => paintTerrazzo(), meters: 4 },
  carpet: { paint: () => paintCarpet(), meters: 2 },
  tile: { paint: () => paintTile(), meters: 1.2 },
  concrete: { paint: () => paintConcrete(), meters: 3 },
  cut: { paint: () => paintConcrete(57, 0.2), meters: 2 },
  wall: { paint: () => paintWall(), meters: 3 },
  metal: { paint: () => paintMetal(), meters: 1 },
};

function toTexture(canvas: HTMLCanvasElement, srgb: boolean, anisotropy: number): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.anisotropy = anisotropy;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/** 贴图按种类懒生成、整个演示期间复用; 演示卸载时统一销毁。 */
export class SurfaceLibrary {
  private cache = new Map<SurfaceKind, SurfaceSet>();
  constructor(private anisotropy: number) {}

  get(kind: SurfaceKind): SurfaceSet {
    const hit = this.cache.get(kind);
    if (hit) return hit;
    const painter = PAINTERS[kind];
    const layers = painter.paint();
    const set: SurfaceSet = {
      map: toTexture(layers.color, true, this.anisotropy),
      roughnessMap: toTexture(layers.rough, false, this.anisotropy),
      bumpMap: toTexture(layers.height, false, this.anisotropy),
      meters: painter.meters,
    };
    this.cache.set(kind, set);
    return set;
  }

  dispose(): void {
    for (const set of this.cache.values()) {
      set.map.dispose();
      set.roughnessMap.dispose();
      set.bumpMap.dispose();
    }
    this.cache.clear();
  }
}
