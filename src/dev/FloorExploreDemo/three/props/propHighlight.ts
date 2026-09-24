import * as THREE from "three";
import type { Disposer } from "../core/disposer";
import { radialTexture } from "../textures/decalTextures";

export interface PropHighlight {
  group: THREE.Group;
  setFocus(on: boolean): void;
  update(t: number, dt: number): void;
}

const GOLD = new THREE.Color(0xffc56a);

/**
 * 可交互物体的提示: 头顶常驻一颗微光菱形(靠近时变亮、加速旋转),
 * 靠近时脚下亮起呼吸的光圈。
 */
export function createPropHighlight(disposer: Disposer, radius: number, markerHeight: number): PropHighlight {
  const group = new THREE.Group();
  const additive = (opacity: number, map?: THREE.Texture) => disposer.track(new THREE.MeshBasicMaterial({
    color: GOLD.clone(), transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, alphaMap: map ?? null,
  }));

  const ringMat = additive(0);
  const ring = new THREE.Mesh(new THREE.RingGeometry(radius * 0.92, radius, 64), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.015;
  group.add(ring);
  const poolMat = additive(0, radialTexture());
  const pool = new THREE.Mesh(new THREE.CircleGeometry(radius * 1.15, 48), poolMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.012;
  group.add(pool);

  const markerMat = disposer.track(new THREE.MeshBasicMaterial({ color: GOLD.clone().multiplyScalar(1.4) }));
  const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), markerMat);
  marker.scale.set(1, 1.6, 1);
  marker.position.y = markerHeight;
  group.add(marker);
  const haloMat = disposer.track(new THREE.SpriteMaterial({
    map: radialTexture(), color: GOLD.clone(), transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  const halo = new THREE.Sprite(haloMat);
  halo.scale.set(0.6, 0.6, 1);
  halo.position.y = markerHeight;
  group.add(halo);

  let focus = 0;
  let target = 0;
  return {
    group,
    setFocus: (on) => { target = on ? 1 : 0; },
    update: (t, dt) => {
      focus += (target - focus) * Math.min(1, dt * 6);
      const breathe = 0.75 + Math.sin(t * 3.2) * 0.25;
      ringMat.opacity = focus * 0.85 * breathe;
      poolMat.opacity = focus * 0.28 * breathe;
      ring.scale.setScalar(1 + (1 - focus) * 0.25);
      marker.position.y = markerHeight + Math.sin(t * 2) * 0.06;
      marker.rotation.y += dt * (0.8 + focus * 2.4);
      markerMat.color.copy(GOLD).multiplyScalar(0.9 + focus * 2.2);
      halo.position.y = marker.position.y;
      haloMat.opacity = 0.16 + focus * 0.3;
    },
  };
}
