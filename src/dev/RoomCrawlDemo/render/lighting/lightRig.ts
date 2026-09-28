import * as THREE from "three";
import type { FlickerMode, LightDef } from "../../types";
import { MAX_LIGHTS } from "../glsl/lighting";
import { flickerValue } from "./flicker";

/** 区域的环境光与雾设定。 */
export interface AmbientStyle {
  ambient: number;
  ambientTop: number;
  fogColor: number;
  fogDensity: number;
}

/** 运行中可增删的动态光(提灯、宝箱溢光、传送门)。 */
export interface DynamicLight {
  x: number;
  h: number;
  z: number;
  color: THREE.Color;
  intensity: number;
  radius: number;
}

interface StaticLight {
  def: LightDef;
  color: THREE.Color;
  seed: number;
  level: number;
}

/**
 * 全场景共享的灯光 uniforms。所有 ShaderMaterial 通过 `rig.uniforms` 引用同一批对象,
 * 每帧只在这里写一次, 风格与明暗就能在所有层之间保持一致。
 */
export class LightRig {
  readonly uniforms = {
    uLightPos: { value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector4()) },
    uLightCol: { value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector4()) },
    uLightCount: { value: 0 },
    /** 前 uStaticCount 盏是房间固定灯(有灯具外形), 之后是动态光。 */
    uStaticCount: { value: 0 },
    uAmbient: { value: new THREE.Color() },
    uAmbientTop: { value: new THREE.Color() },
    uFogColor: { value: new THREE.Color() },
    uFogDensity: { value: 0 },
    uTime: { value: 0 },
    uCamX: { value: 0 },
  };
  private statics: StaticLight[] = [];
  private dynamics = new Set<DynamicLight>();

  setRoom(lights: readonly LightDef[], style: AmbientStyle): void {
    this.statics = lights.map((def, i) => ({ def, color: new THREE.Color(def.color), seed: i * 7.31 + def.x * 0.013, level: 1 }));
    this.dynamics.clear();
    this.uniforms.uAmbient.value.set(style.ambient);
    this.uniforms.uAmbientTop.value.set(style.ambientTop);
    this.uniforms.uFogColor.value.set(style.fogColor);
    this.uniforms.uFogDensity.value = style.fogDensity;
  }

  addDynamic(light: DynamicLight): DynamicLight {
    this.dynamics.add(light);
    return light;
  }

  removeDynamic(light: DynamicLight): void {
    this.dynamics.delete(light);
  }

  /** 第 i 盏静态灯当前的亮度倍率(灯具发光与闪烁同步用)。 */
  levelOf(i: number): number {
    return this.statics[i]?.level ?? 0;
  }

  get staticLights(): readonly LightDef[] {
    return this.statics.map((s) => s.def);
  }

  update(t: number, camX: number): void {
    const u = this.uniforms;
    u.uTime.value = t;
    u.uCamX.value = camX;
    let n = 0;
    for (const s of this.statics) {
      if (n >= MAX_LIGHTS) break;
      const mode: FlickerMode = s.def.flicker ?? "steady";
      s.level = flickerValue(mode, t, s.seed);
      const k = s.def.intensity * s.level;
      u.uLightPos.value[n].set(s.def.x, s.def.h, s.def.z, s.def.radius);
      u.uLightCol.value[n].set(s.color.r * k, s.color.g * k, s.color.b * k, s.level);
      n++;
    }
    u.uStaticCount.value = n;
    for (const d of this.dynamics) {
      if (n >= MAX_LIGHTS) break;
      if (d.intensity <= 0.001) continue;
      u.uLightPos.value[n].set(d.x, d.h, d.z, d.radius);
      u.uLightCol.value[n].set(d.color.r * d.intensity, d.color.g * d.intensity, d.color.b * d.intensity, 1);
      n++;
    }
    u.uLightCount.value = n;
  }
}

export type RigUniforms = LightRig["uniforms"];
