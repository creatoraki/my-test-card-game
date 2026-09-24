import * as THREE from "three";
import type { Vec2 } from "../../types";
import type { PickInfo } from "../room/buildContext";

const FLOOR = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

/** 射线拾取: 先测隐形碰撞体(物体 / 门), 再与地面求交。ndc 为 [-1,1] 的标准化设备坐标。 */
export class PointerPick {
  private raycaster = new THREE.Raycaster();
  private hit = new THREE.Vector3();

  constructor(private camera: THREE.Camera) {}

  private aim(ndc: THREE.Vector2): void {
    this.raycaster.setFromCamera(ndc, this.camera);
  }

  target(ndc: THREE.Vector2, pickables: THREE.Object3D[]): PickInfo | null {
    this.aim(ndc);
    // 隐形网格也要参与检测: Raycaster 不看 visible, 但要求矩阵已更新
    const hits = this.raycaster.intersectObjects(pickables, false);
    return (hits[0]?.object.userData.pick as PickInfo | undefined) ?? null;
  }

  floor(ndc: THREE.Vector2): Vec2 | null {
    this.aim(ndc);
    const point = this.raycaster.ray.intersectPlane(FLOOR, this.hit);
    return point ? { x: point.x, z: point.z } : null;
  }
}
