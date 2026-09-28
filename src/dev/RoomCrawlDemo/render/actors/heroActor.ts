import * as THREE from "three";
import { CORRIDOR_PLAYER_ART_SOURCES } from "@/ui/art/corridor/corridorPlayerArt";
import { worldY } from "../../data/layout";
import type { HeroPose } from "../../engine/heroAnimator";
import type { PlayerState } from "../../engine/playerMotion";
import { LAYER, orderForZ } from "../core/depthSort";
import type { LightRig } from "../lighting/lightRig";
import { createContactShadow, type ContactShadow } from "./contactShadow";
import { BASE_FRAME, HERO_SCALE } from "./heroCalibration";
import { createHeroMaterials, type HeroMaterials } from "./heroMaterial";
import { buildHeroGeometry, HeroRig } from "./heroRig";

function loadFrames(): THREE.Texture[] {
  const loader = new THREE.TextureLoader();
  return CORRIDOR_PLAYER_ART_SOURCES.map((src) => {
    const tex = src ? loader.load(src) : new THREE.Texture();
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.premultiplyAlpha = true;
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  });
}

/**
 * 玩家角色: 序列帧切件 + 2D 骨骼蒙皮。本体、按主光方向错切的软投影、脚下接触阴影三个网格。
 */
export class HeroActor {
  readonly group = new THREE.Group();
  private frames = loadFrames();
  private rig = new HeroRig();
  private geometry = buildHeroGeometry();
  private mats: HeroMaterials;
  private body: THREE.Mesh;
  private shadow: THREE.Mesh;
  private contact: ContactShadow;
  private flashV = 0;

  constructor(private lights: LightRig) {
    this.mats = createHeroMaterials(this.rig, lights.uniforms);
    this.body = new THREE.Mesh(this.geometry, this.mats.body);
    this.shadow = new THREE.Mesh(this.geometry, this.mats.shadow);
    this.body.frustumCulled = false;
    this.shadow.frustumCulled = false;
    this.shadow.renderOrder = LAYER.shadow + 1;
    this.contact = createContactShadow(46, 12, 0.62);
    this.group.add(this.contact.mesh, this.shadow, this.body);
    this.mats.shared.uBase.value = this.frames[BASE_FRAME];
  }

  setDebug(on: boolean): void {
    this.mats.body.uniforms.uDebug.value = on ? 1 : 0;
  }

  /** 受击白闪(0~1, 自动衰减)。 */
  flash(v: number): void {
    this.flashV = Math.max(this.flashV, v);
  }

  update(p: PlayerState, pose: HeroPose, dt: number): void {
    this.rig.update(pose);
    const s = this.mats.shared;
    s.uGaitA.value = this.frames[pose.gaitA] ?? this.frames[BASE_FRAME];
    s.uGaitB.value = this.frames[pose.gaitB] ?? this.frames[BASE_FRAME];
    s.uGaitMix.value = pose.gaitMix;

    const baseY = worldY(p.z);
    const sx = pose.scaleX * pose.squashX * HERO_SCALE;
    const sy = pose.squashY * HERO_SCALE;
    this.body.position.set(p.x, baseY + p.h, 0);
    this.body.scale.set(sx, sy, 1);
    this.body.renderOrder = orderForZ(p.z, 5);
    const u = this.mats.body.uniforms;
    u.uHero.value.set(p.x, p.h, p.z);
    u.uFacing.value = Math.sign(sx) || 1;
    u.uBlink.value = pose.blink;
    this.flashV = Math.max(0, this.flashV - dt * 3.5);
    u.uFlash.value = this.flashV;

    this.updateShadow(p, sx, sy, baseY);
    const lift = Math.min(1, p.h / 260);
    this.contact.mesh.position.set(p.x, baseY, 0);
    this.contact.mesh.scale.setScalar(1 - lift * 0.45);
    this.contact.uniforms.uStrength.value = 0.62 * (1 - lift * 0.7);
  }

  /** 找出对角色影响最大的一盏灯, 让投影朝背光方向拉长。 */
  private updateShadow(p: PlayerState, sx: number, sy: number, baseY: number): void {
    const u = this.lights.uniforms;
    let best = 0;
    let total = 0;
    let dx = 0.3;
    let dz = 1;
    for (let i = 0; i < u.uLightCount.value; i++) {
      const lp = u.uLightPos.value[i];
      const lc = u.uLightCol.value[i];
      const ex = p.x - lp.x;
      const ez = (p.z - lp.z) * 1.7;
      const dist = Math.hypot(ex, ez, lp.y - 120);
      const x = dist / lp.w;
      const att = x >= 1 ? 0 : ((1 - x ** 4) ** 2) / (1 + 9 * x * x);
      const w = (lc.x * 0.3 + lc.y * 0.59 + lc.z * 0.11) * att;
      total += w;
      if (w > best) {
        best = w;
        const len = Math.hypot(ex, ez) || 1;
        dx = ex / len;
        dz = ez / len;
      }
    }
    const dominance = total > 0 ? best / total : 0;
    const length = 0.55;
    const shearY = -dz * length;
    const shear = this.mats.shadow.uniforms.uShear.value as THREE.Vector2;
    shear.set((dx * length) / Math.sign(sx || 1), Math.abs(shearY) < 0.14 ? -0.14 : shearY);
    this.shadow.position.set(p.x, baseY, 0);
    this.shadow.scale.set(sx, sy, 1);
    const lift = Math.min(1, p.h / 300);
    this.mats.shadow.uniforms.uShadowAlpha.value = (0.18 + 0.32 * Math.min(1, best * 3)) * (0.5 + dominance * 0.5) * (1 - lift);
  }

  dispose(): void {
    this.geometry.dispose();
    this.mats.body.dispose();
    this.mats.shadow.dispose();
    this.contact.mesh.geometry.dispose();
    (this.contact.mesh.material as THREE.Material).dispose();
    this.frames.forEach((t) => t.dispose());
  }
}
