import * as THREE from "three";

/**
 * 按世界坐标重写 UV(平面投影): 让同一张平铺贴图在不同尺寸的墙和地面上保持一致的物理比例。
 * 每个顶点按面法线的主轴选择投影平面。调用前几何体须已平移到最终位置。
 */
export function worldUv(geometry: THREE.BufferGeometry, meters: number, offset: THREE.Vector3 = new THREE.Vector3()): THREE.BufferGeometry {
  const pos = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i) + offset.x;
    const y = pos.getY(i) + offset.y;
    const z = pos.getZ(i) + offset.z;
    const nx = Math.abs(normal.getX(i));
    const ny = Math.abs(normal.getY(i));
    const nz = Math.abs(normal.getZ(i));
    let u: number;
    let v: number;
    if (ny >= nx && ny >= nz) { u = x; v = -z; }
    else if (nx >= nz) { u = z; v = y; }
    else { u = x; v = y; }
    uv[i * 2] = u / meters;
    uv[i * 2 + 1] = v / meters;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geometry;
}

/** 创建一个以 (x,y,z) 为中心的盒子网格。 */
export function box(
  w: number, h: number, d: number,
  material: THREE.Material | THREE.Material[],
  x = 0, y = 0, z = 0,
  shadow: { cast?: boolean; receive?: boolean } = { cast: true, receive: true },
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = shadow.cast ?? true;
  mesh.receiveShadow = shadow.receive ?? true;
  return mesh;
}

export function cylinder(
  rTop: number, rBottom: number, h: number, material: THREE.Material, segments = 12,
  x = 0, y = 0, z = 0,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** 让组内所有网格投射 / 接收阴影。 */
export function enableShadows(root: THREE.Object3D, cast = true, receive = true): void {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
  });
}

/** 把一组放到房间坐标: 位置 + 绕 Y 的朝向。 */
export function place<T extends THREE.Object3D>(object: T, x: number, z: number, rot = 0, y = 0): T {
  object.position.set(x, y, z);
  object.rotation.y = rot;
  return object;
}
