import * as THREE from "three";
import { DESIGN_H, DESIGN_W, FLOOR_BACK, worldY } from "../../data/layout";

/**
 * 2.5D 投影: 正交相机覆盖 1920×1080 设计画布, 世界 y 向上。
 * 地面点 (x, z) 与离地高 h 的屏幕位置: screenY = FLOOR_BACK + z − h, 不做近大远小。
 */
export function createStageCamera(): THREE.OrthographicCamera {
  const camera = new THREE.OrthographicCamera(0, DESIGN_W, DESIGN_H, 0, -10, 10);
  camera.position.set(0, 0, 5);
  return camera;
}

/** 横向卷轴 + 震屏。相机对齐整像素: 墙面 / 地面烘焙贴图 1 纹素 = 1 px, 对齐后采样不会忽糊忽清。 */
export function placeCamera(camera: THREE.OrthographicCamera, camX: number, shakeX: number, shakeY: number): void {
  camera.position.x = Math.round(camX + shakeX);
  camera.position.y = Math.round(shakeY);
  camera.updateMatrixWorld();
}

/** 世界点 → 设计画布 px(左上角为原点), 给 DOM 浮层定位。 */
export function toScreen(x: number, z: number, h: number, camX: number): { x: number; y: number } {
  return { x: x - camX, y: FLOOR_BACK + z - h };
}

/** 世界点 → 世界坐标(面片摆放用)。 */
export function toWorld(x: number, z: number, h = 0): THREE.Vector2 {
  return new THREE.Vector2(x, worldY(z, h));
}
