import * as THREE from "three";
import { SurfaceLibrary, type SurfaceKind } from "../textures/surfaceTextures";

export interface SurfaceOptions {
  color?: number;
  roughness?: number;
  metalness?: number;
  bumpScale?: number;
  envMapIntensity?: number;
}

export interface PlainOptions {
  roughness?: number;
  metalness?: number;
  emissive?: number;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
  map?: THREE.Texture;
  envMapIntensity?: number;
}

/**
 * 共享材质缓存: 同样参数的材质只建一份, 演示卸载时统一销毁。
 * 需要逐帧改参数的材质(闪烁灯管等)用 unique() 另建, 由房间 Disposer 负责回收。
 */
export class MaterialKit {
  readonly surfaces: SurfaceLibrary;
  private cache = new Map<string, THREE.Material>();

  constructor(anisotropy: number) {
    this.surfaces = new SurfaceLibrary(anisotropy);
  }

  /** 带程序化贴图的表面材质。贴图按世界坐标 UV 取样, 几何体须先 worldUv()。 */
  surface(kind: SurfaceKind, opts: SurfaceOptions = {}): THREE.MeshStandardMaterial {
    const key = `surface:${kind}:${JSON.stringify(opts)}`;
    const hit = this.cache.get(key);
    if (hit) return hit as THREE.MeshStandardMaterial;
    const set = this.surfaces.get(kind);
    const material = new THREE.MeshStandardMaterial({
      map: set.map,
      roughnessMap: set.roughnessMap,
      bumpMap: set.bumpMap,
      bumpScale: opts.bumpScale ?? 1.2,
      color: opts.color ?? 0xffffff,
      roughness: opts.roughness ?? 1,
      metalness: opts.metalness ?? 0,
      envMapIntensity: opts.envMapIntensity ?? 0.6,
    });
    this.cache.set(key, material);
    return material;
  }

  /** 世界尺寸换算: 表面贴图一张覆盖多少米。 */
  meters(kind: SurfaceKind): number {
    return this.surfaces.get(kind).meters;
  }

  plain(color: number, opts: PlainOptions = {}): THREE.MeshStandardMaterial {
    const key = `plain:${color}:${JSON.stringify({ ...opts, map: opts.map?.uuid })}`;
    const hit = this.cache.get(key);
    if (hit) return hit as THREE.MeshStandardMaterial;
    const material = this.unique(color, opts);
    this.cache.set(key, material);
    return material;
  }

  unique(color: number, opts: PlainOptions = {}): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.8,
      metalness: opts.metalness ?? 0,
      emissive: opts.emissive ?? 0x000000,
      emissiveIntensity: opts.emissiveIntensity ?? 1,
      transparent: opts.transparent ?? false,
      opacity: opts.opacity ?? 1,
      side: opts.side ?? THREE.FrontSide,
      map: opts.map ?? null,
      envMapIntensity: opts.envMapIntensity ?? 1,
    });
  }

  /** 纯自发光(不受光照), 给灯管、屏幕等做辉光源。 */
  glow(color: number, intensity = 1): THREE.MeshBasicMaterial {
    const key = `glow:${color}:${intensity}`;
    const hit = this.cache.get(key);
    if (hit) return hit as THREE.MeshBasicMaterial;
    const c = new THREE.Color(color).multiplyScalar(intensity);
    const material = new THREE.MeshBasicMaterial({ color: c, toneMapped: true });
    this.cache.set(key, material);
    return material;
  }

  dispose(): void {
    for (const material of this.cache.values()) material.dispose();
    this.cache.clear();
    this.surfaces.dispose();
  }
}

/** 常用色板: 统一废弃楼层的冷灰基调。 */
export const PALETTE = {
  steelDark: 0x2a2e31,
  steel: 0x7d8286,
  cabinet: 0x8f9186,
  cabinetGreen: 0x5f6d62,
  wood: 0x5a4332,
  woodLight: 0x8a6a4c,
  plastic: 0x2b2d2f,
  fabric: 0x3b4650,
  cardboard: 0x8c6c46,
  paper: 0xd6d1c2,
  bone: 0xcfc4a8,
  rust: 0x6b3a1e,
  jacket: 0xb8662a,
  suit: 0x39424a,
} as const;
