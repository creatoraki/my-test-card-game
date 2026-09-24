import * as THREE from "three";

export interface ClickMarker {
  group: THREE.Group;
  show(x: number, z: number): void;
  /** 目标仍有效(还在走)时保持中心光点。 */
  hold(on: boolean): void;
  update(dt: number): void;
  dispose(): void;
}

/** 点击地面的反馈: 两道先后扩散的光环 + 目的地一颗呼吸的光点。 */
export function createClickMarker(): ClickMarker {
  const group = new THREE.Group();
  group.visible = false;
  const color = new THREE.Color(0xffd08a);
  const make = (geometry: THREE.BufferGeometry) => {
    const material = new THREE.MeshBasicMaterial({ color: color.clone(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.02;
    mesh.userData.fx = true;
    group.add(mesh);
    return { mesh, material };
  };
  const rings = [make(new THREE.RingGeometry(0.2, 0.25, 48)), make(new THREE.RingGeometry(0.2, 0.23, 48))];
  const dot = make(new THREE.CircleGeometry(0.07, 24));
  let age = 99;
  let holding = false;
  let dotLevel = 0;
  return {
    group,
    show: (x, z) => {
      group.position.set(x, 0, z);
      group.visible = true;
      age = 0;
    },
    hold: (on) => { holding = on; },
    update: (dt) => {
      age += dt;
      rings.forEach((ring, i) => {
        const k = Math.min(1, Math.max(0, (age - i * 0.14) / 0.6));
        ring.mesh.scale.setScalar(0.6 + k * 1.6);
        ring.material.opacity = k > 0 && k < 1 ? (1 - k) * 0.9 : 0;
      });
      dotLevel += ((holding ? 1 : 0) - dotLevel) * Math.min(1, dt * 8);
      dot.material.opacity = dotLevel * (0.55 + Math.sin(age * 6) * 0.25);
      if (age > 1 && dotLevel < 0.01) group.visible = false;
    },
    dispose: () => {
      for (const part of [...rings, dot]) {
        part.mesh.geometry.dispose();
        part.material.dispose();
      }
    },
  };
}
