import type * as THREE from "three";

/** 回收一个材质(通常是 ProgramKeeper.retire: 保留程序以便复用)。 */
export type RetireMaterial = (material: THREE.Material) => void;

/**
 * 房间级资源回收: 卸载房间时销毁子树中的几何体、回收材质, 以及额外登记的资源。
 * 共享几何体(quad 缓存)通过 userData.shared 标记跳过。
 */
export class Disposer {
  private owned = new Set<{ dispose(): void }>();

  constructor(private retire: RetireMaterial) {}

  track<T extends { dispose(): void }>(resource: T): T {
    this.owned.add(resource);
    return resource;
  }

  /** 只回收一个网格的几何体与材质。 */
  disposeMesh(mesh: THREE.Object3D): void {
    const m = mesh as THREE.Mesh;
    if (m.geometry && !m.geometry.userData.shared) m.geometry.dispose();
    const material = m.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(material)) material.forEach(this.retire);
    else if (material) this.retire(material);
  }

  /** 回收子树里全部网格(不含登记的资源)。 */
  disposeObjects(root: THREE.Object3D): void {
    root.traverse((child) => this.disposeMesh(child));
  }

  /** 回收子树与全部登记的资源。 */
  disposeTree(root: THREE.Object3D): void {
    this.disposeObjects(root);
    for (const resource of this.owned) resource.dispose();
    this.owned.clear();
  }
}
