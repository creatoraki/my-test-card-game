/** 一段片元着色器程序；key 相同的程序整局只编译一次。 */
export interface GlslProgramDef {
  key: string;
  /** 片元主体；公共 uniform 头(uSize/uTime/uPhase/uActive/uSeed/uAA)由宿主自动拼在前面。 */
  fragment: string;
}

/** 自定义 uniform：数字写 float，长度 2/3/4 的数组写 vec2/vec3/vec4。 */
export type GlslUniforms = Readonly<Record<string, number | readonly number[]>>;

/** 注册到共享宿主的一块绘制目标。 */
export interface GlslTarget {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  program: GlslProgramDef;
  /** 设计 px 尺寸。 */
  width: number;
  height: number;
  uniforms: GlslUniforms;
  /** 动画相位偏移，让同屏多个目标不同步。 */
  seed: number;
  /** 播放速率：uPhase 的推进倍数(战斗倍速/慢放)，缺省 1。 */
  rate: number;
  /** 激活目标值(0/1)与平滑后的当前值。 */
  activeGoal: number;
  active: number;
  /** 动画相位(秒)：平时与时间同速，激活时平滑加速到 2 倍；需要随激活变速的动画用它而不是 uTime。 */
  phase: number;
  visible: boolean;
}

export interface GlslTargetInit {
  canvas: HTMLCanvasElement;
  program: GlslProgramDef;
  width: number;
  height: number;
  uniforms: GlslUniforms;
  seed: number;
  rate?: number;
  active: boolean;
}
