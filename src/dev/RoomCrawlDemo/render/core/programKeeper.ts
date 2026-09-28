import * as THREE from "three";

/** 32 位 FNV-1a, 只用来给着色器源码做短签名。 */
function hash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36) + ":" + text.length.toString(36);
}

/** 同签名的材质共用同一个 GPU 程序(源码 + defines + GLSL 版本)。 */
function signatureOf(material: THREE.Material): string | null {
  const m = material as THREE.ShaderMaterial;
  if (!m.isShaderMaterial) return null;
  return hash(`${m.glslVersion ?? ""}|${JSON.stringify(m.defines ?? {})}|${m.vertexShader}|${m.fragmentShader}`);
}

/**
 * 着色器程序管家:
 * - compile: 用 KHR_parallel_shader_compile 异步编译(驱动线程里编译, 主线程不卡),
 *   编译时临时绑定离屏目标, 让程序缓存键与实际渲染(都画进离屏目标)一致, 避免上场时二次编译;
 * - retire: 回收材质时, 每种程序留一份已编译的材质常驻不释放, 程序引用计数不归零,
 *   之后同源码的材质(重访区域、守卫、装饰烘焙)直接复用, 不再重编。
 */
export class ProgramKeeper {
  private kept = new Map<string, THREE.Material>();

  constructor(
    private renderer: THREE.WebGLRenderer,
    private camera: THREE.Camera,
    private scene: THREE.Scene,
    private target: THREE.WebGLRenderTarget,
  ) {}

  /** 异步编译这些对象用到的全部材质; 每个对象编译完成时回调一次。 */
  async compile(objects: readonly THREE.Object3D[], onEach?: () => void): Promise<void> {
    const r = this.renderer;
    const prev = r.getRenderTarget();
    r.setRenderTarget(this.target);
    // compileAsync 的同步部分在这里就把程序创建并提交编译了, 之后只是轮询完成状态
    const jobs = objects.map((obj) => r.compileAsync(obj, this.camera, this.scene));
    r.setRenderTarget(prev);
    await Promise.all(jobs.map((job) => job.then(() => onEach?.())));
  }

  /** 代替 material.dispose(): 每种程序的第一份已编译材质留作常驻, 其余正常释放。 */
  retire = (material: THREE.Material): void => {
    const key = signatureOf(material);
    if (key && !this.kept.has(key) && this.isCompiled(material)) {
      this.kept.set(key, material);
      return;
    }
    material.dispose();
  };

  private isCompiled(material: THREE.Material): boolean {
    const props = this.renderer.properties.get(material) as { currentProgram?: unknown };
    return props.currentProgram !== undefined;
  }
}
