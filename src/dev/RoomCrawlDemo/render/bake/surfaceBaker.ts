import * as THREE from "three";

/** 世界坐标下的矩形(左下角 + 宽高, 单位设计 px)。 */
export interface BakeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 一次烘焙的结果: 多张贴图共用一个渲染目标, 换房间时整体释放。 */
export interface BakedSurface {
  textures: THREE.Texture[];
  /** (x, y, w, h), 供实时着色器由世界坐标换算 uv。 */
  rect: THREE.Vector4;
  dispose(): void;
}

/**
 * 一项待烘焙的工作: 已摆好世界位置的面片 + 烘焙区域。
 * 烘完后 apply 把结果回填给实时材质; 烘焙材质与几何体由调用方随后回收。
 */
export interface BakeJob {
  mesh: THREE.Mesh;
  rect: BakeRect;
  count: number;
  /** 每设计 px 的纹素数。 */
  density: number;
  apply(baked: BakedSurface): void;
}

/** 烘焙完成前实时材质先挂的 1×1 透明占位贴图(编译不依赖贴图内容)。 */
export const BLANK_TEXTURE = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
BLANK_TEXTURE.needsUpdate = true;

/** 固定抗锯齿宽度在 1 纹素 = 1 设计 px 时的取值(与 fwidth 版本的 0.75 倍一致)。 */
const AA_BASE = 0.75;
/** 分块烘焙的块宽(纹素): 每块渲染后让出一帧, 避免单次超长的 GPU 占用。 */
const TILE_W = 1024;

/** 烘焙专用材质: GLSL3(片元自行声明多目标输出)、不混合、不透明, 抗锯齿用固定宽度(FIXED_AA)。 */
export function bakeMaterial(vertexShader: string, fragmentShader: string, uniforms: Record<string, THREE.IUniform>, defines?: Record<string, string | number>): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader,
    fragmentShader,
    uniforms: { ...uniforms, uAAWidth: { value: AA_BASE } },
    defines: { ...defines, FIXED_AA: 1 },
    transparent: false,
    blending: THREE.NoBlending,
    depthTest: false,
    depthWrite: false,
  });
}

/** 等到下一帧。 */
export function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/**
 * 程序化表面烘焙器: 把「已摆好世界位置」的面片用正交相机正好框住, 渲染进多目标贴图(MRT)。
 * 烘焙材质须为 GLSL3 并自行声明 layout(location = n) 输出, 且不混合。
 * 渲染目标不带深度缓冲; 烘焙前后恢复渲染器原本的目标与清屏色。
 */
export class SurfaceBaker {
  private camera = new THREE.OrthographicCamera(0, 1, 1, 0, -10, 10);
  private scene = new THREE.Scene();
  private clearColor = new THREE.Color();

  constructor(private renderer: THREE.WebGLRenderer) {}

  /** 按列分块烘焙, 每块之间让出一帧。isStale 返回 true 时中途放弃(结果已释放)。 */
  async bakeAsync(job: BakeJob, isStale: () => boolean, onTile?: () => void): Promise<BakedSurface | null> {
    const { target, d } = this.prepare(job);
    const width = target.width;
    const baked: BakedSurface = {
      textures: target.textures,
      rect: new THREE.Vector4(job.rect.x, job.rect.y, job.rect.w, job.rect.h),
      dispose: () => target.dispose(),
    };
    for (let x = 0; x < width; x += TILE_W) {
      if (isStale()) {
        baked.dispose();
        return null;
      }
      target.scissor.set(x, 0, Math.min(TILE_W, width - x), target.height);
      target.scissorTest = true;
      this.render(job, target, d, x === 0);
      onTile?.();
      await nextFrame();
    }
    target.scissorTest = false;
    if (isStale()) {
      baked.dispose();
      return null;
    }
    return baked;
  }

  /** 该工作要分成几块(进度统计用)。 */
  tilesOf(job: BakeJob): number {
    return Math.max(1, Math.ceil((job.rect.w * this.densityOf(job)) / TILE_W));
  }

  private densityOf(job: BakeJob): number {
    const max = this.renderer.capabilities.maxTextureSize;
    return Math.min(job.density, max / job.rect.w, max / job.rect.h);
  }

  private prepare(job: BakeJob): { target: THREE.WebGLRenderTarget; d: number } {
    const d = this.densityOf(job);
    const target = new THREE.WebGLRenderTarget(Math.max(1, Math.ceil(job.rect.w * d)), Math.max(1, Math.ceil(job.rect.h * d)), {
      count: job.count,
      depthBuffer: false,
      stencilBuffer: false,
      type: THREE.UnsignedByteType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: false,
    });
    return { target, d };
  }

  private render(job: BakeJob, target: THREE.WebGLRenderTarget, d: number, clear: boolean): void {
    const r = this.renderer;
    const { rect, mesh } = job;
    const cam = this.camera;
    cam.left = rect.x;
    cam.right = rect.x + rect.w;
    cam.bottom = rect.y;
    cam.top = rect.y + rect.h;
    cam.updateProjectionMatrix();

    const aa = (mesh.material as THREE.ShaderMaterial).uniforms?.uAAWidth;
    if (aa) aa.value = AA_BASE / d;

    const prevTarget = r.getRenderTarget();
    const prevAlpha = r.getClearAlpha();
    r.getClearColor(this.clearColor);
    const prevAutoClear = r.autoClear;
    this.scene.add(mesh);
    r.setRenderTarget(target);
    if (clear) {
      // 整张清一次(清屏也受 scissor 约束, 先关掉)
      const scissor = target.scissorTest;
      target.scissorTest = false;
      r.setRenderTarget(target);
      r.setClearColor(0x000000, 0);
      r.clear(true, false, false);
      target.scissorTest = scissor;
      r.setRenderTarget(target);
    }
    r.autoClear = false;
    r.render(this.scene, cam);
    r.autoClear = prevAutoClear;
    r.setRenderTarget(prevTarget);
    r.setClearColor(this.clearColor, prevAlpha);
    this.scene.remove(mesh);
  }
}
