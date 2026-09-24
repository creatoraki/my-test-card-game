import * as THREE from "three";

/** 画布设计尺寸(与 StageCanvas 一致)。 */
export const DESIGN_W = 1920;
export const DESIGN_H = 1080;
/** 底部 HUD 高度(含贴边留白), 焦点要抬到它上方的可视区中间。 */
const HUD_BOTTOM = 332;

const AZIMUTH = Math.PI / 4;
const ELEVATION = THREE.MathUtils.degToRad(40);
const DISTANCE = 40;
/** 画面纵向覆盖的世界尺寸(米)。 */
const VIEW_HEIGHT = 10.2;

export interface IsoCamera {
  camera: THREE.OrthographicCamera;
  /** 立即对准焦点(换房时用)。 */
  snap(focus: THREE.Vector3): void;
  /** 阻尼跟随焦点。 */
  follow(focus: THREE.Vector3, dt: number): void;
}

/**
 * 45° 等轴正交镜头: 从 +x+z 方向斜俯视。
 * 焦点按屏幕纵向平移, 让角色落在底部 HUD 以上可视区的中心。
 */
export function createIsoCamera(): IsoCamera {
  const aspect = DESIGN_W / DESIGN_H;
  const camera = new THREE.OrthographicCamera(-VIEW_HEIGHT * aspect / 2, VIEW_HEIGHT * aspect / 2, VIEW_HEIGHT / 2, -VIEW_HEIGHT / 2, 0.1, 120);
  const offset = new THREE.Vector3(
    Math.cos(ELEVATION) * Math.sin(AZIMUTH),
    Math.sin(ELEVATION),
    Math.cos(ELEVATION) * Math.cos(AZIMUTH),
  ).multiplyScalar(DISTANCE);
  // 屏幕上移量(世界单位): 可视区中心相对画面中心的偏移
  const lift = ((HUD_BOTTOM / 2) / DESIGN_H) * VIEW_HEIGHT;
  const current = new THREE.Vector3();
  const place = () => {
    camera.position.copy(current).add(offset);
    camera.lookAt(current);
    camera.translateY(-lift);
    camera.updateMatrixWorld();
  };
  return {
    camera,
    snap: (focus) => {
      current.copy(focus);
      place();
    },
    follow: (focus, dt) => {
      current.lerp(focus, 1 - Math.exp(-dt * 5));
      place();
    },
  };
}
