import * as THREE from "three";

/**
 * 房间级资源回收: 卸载房间时遍历场景子树销毁几何体, 并销毁登记过的专属材质 / 贴图。
 * 共享材质(MaterialKit 缓存)不在这里销毁。
 */
export class Disposer {
  private owned = new Set<{ dispose(): void }>();

  track<T extends { dispose(): void }>(resource: T): T {
    this.owned.add(resource);
    return resource;
  }

  disposeTree(root: THREE.Object3D): void {
    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const light = child as THREE.Light;
      if (light.isLight) light.dispose();
    });
    for (const resource of this.owned) resource.dispose();
    this.owned.clear();
  }
}
