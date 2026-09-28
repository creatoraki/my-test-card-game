import * as THREE from "three";
import { worldY } from "../../data/layout";
import { guardAlertLevel, type GuardState } from "../../engine/guardBrain";
import { damp } from "../../engine/springBone";
import { LAYER, orderForZ } from "../core/depthSort";
import { makeQuad, placeMesh } from "../core/quad";
import type { RigUniforms } from "../lighting/lightRig";
import { blotMaterial, guardMaterial } from "./guardMaterial";
import { createVisionCone, type VisionCone } from "./visionCone";

/** 黑影守卫的渲染体: 本体 + 脚下暗影斑 + 视野锥。状态全部来自 GuardState。 */
export class GuardActor {
  readonly group = new THREE.Group();
  private body: THREE.Mesh;
  private blot: THREE.Mesh;
  private cone: VisionCone;
  private mat: THREE.ShaderMaterial;
  private blotMat: THREE.ShaderMaterial;
  private phase = 0;
  private move = 0;
  private lunge = 0;
  private alert = 0;
  private blinkT = 2;
  private coneFade = 1;

  constructor(readonly id: string, rig: RigUniforms, seed: number) {
    this.mat = guardMaterial(rig, seed);
    this.body = placeMesh(makeQuad(260, 340, -130, -10), this.mat, 0, 0, 0);
    this.blotMat = blotMaterial(rig, seed);
    this.blot = placeMesh(makeQuad(220, 70, -110, -35), this.blotMat, 0, 0, LAYER.shadow + 2);
    this.cone = createVisionCone(rig);
    this.group.add(this.cone.mesh, this.blot, this.body);
  }

  update(g: GuardState, dt: number): void {
    const u = this.mat.uniforms;
    const speedN = Math.min(1, g.speed / 200);
    this.move = damp(this.move, speedN, 8, dt);
    this.phase += dt * (2.4 + speedN * 7);
    this.lunge = damp(this.lunge, g.mode === "lunge" ? 1 : 0, g.mode === "lunge" ? 14 : 5, dt);
    this.alert = damp(this.alert, guardAlertLevel(g), 10, dt);
    this.blinkT -= dt;
    if (this.blinkT < -0.14) this.blinkT = 1.5 + Math.random() * 3;
    const blink = this.blinkT < 0 ? Math.sin((-this.blinkT / 0.14) * Math.PI) : 0;

    const y = worldY(g.z);
    this.body.position.set(g.x, y, 0);
    this.body.renderOrder = orderForZ(g.z, 4);
    u.uFacing.value = g.facing;
    u.uPhase.value = this.phase;
    u.uMove.value = this.move;
    u.uLunge.value = this.lunge;
    u.uAlert.value = this.alert;
    u.uBlink.value = blink;
    u.uDissolve.value = g.dissolve;
    u.uGuard.value.set(g.x, 0, g.z);

    this.blot.position.set(g.x, y, 0);
    this.blotMat.uniforms.uStrength.value = 0.8 * (1 - g.dissolve);
    this.coneFade = damp(this.coneFade, g.mode === "banished" || g.cooldown > 0 ? 0 : 1, 6, dt);
    this.cone.update(g.x, g.z, g.look, this.alert, this.coneFade);
  }
}
