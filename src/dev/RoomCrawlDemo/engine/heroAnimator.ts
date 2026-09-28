import { clamp, damp, Spring } from "./springBone";
import { MOTION, type JumpPhase } from "./playerMotion";

/** 步态序列帧的校准信息(由渲染层的校准表传入, 这里不依赖 three)。 */
export interface GaitTable {
  /** 一个完整步态循环依次使用的帧号。 */
  frames: readonly number[];
  /** 静止时使用的帧号(双腿并拢)。 */
  idleFrame: number;
  /** 腾空上升 / 下落时使用的帧号。 */
  airRiseFrame: number;
  airFallFrame: number;
  /** 每帧胯部相对基准帧的偏移(源图 px, x 向右, y 向下), 以帧号索引。 */
  hipOffset: readonly (readonly [number, number])[];
  /** 世界中走完一个循环的距离(px)。 */
  cycleLength: number;
}

/** 动画器每帧的输入。 */
export interface AnimInput {
  dt: number;
  /** 本帧实际位移(px)。 */
  travel: number;
  vx: number;
  vh: number;
  /** 速度占行走速度的比例(0~1)。 */
  speed: number;
  facing: 1 | -1;
  jump: JumpPhase;
  phaseT: number;
  knocked: boolean;
}

/** 一帧的角色姿态, 角度为弧度(正值逆时针, 以角色面朝右为准)。 */
export interface HeroPose {
  gaitA: number;
  gaitB: number;
  gaitMix: number;
  /** 上半身跟随步态的胯部偏移(源图 px, y 向下)。 */
  hipX: number;
  hipY: number;
  /** 额外的整体起伏(源图 px, 向上为正)。 */
  bob: number;
  lean: number;
  breath: number;
  spine: number;
  head: number;
  nearArm: number;
  farArm: number;
  hairBack: number;
  hairFront: number;
  ribbon: number;
  /** 眼睑闭合程度 0~1。 */
  blink: number;
  /** 整体横向缩放(转身压扁, 已含朝向符号)。 */
  scaleX: number;
  /** 跳跃的压扁 / 拉伸(1 为原样)。 */
  squashX: number;
  squashY: number;
}

const TURN_TIME = 0.1;
/** 满速行走时前倾 / 发丝拖拽取最大幅度的比例。 */
const WALK_REACH = 0.55;

export class HeroAnimator {
  private phase = 0;
  private time = 0;
  private blinkTimer = 2.2;
  private blinkT = -1;
  private doubleBlink = false;
  private visualFacing: 1 | -1;
  private turnT = 1;
  private speedS = 0;
  private leanS = 0;
  private prevVx = 0;
  private prevJump: JumpPhase = "ground";
  private hairBack = new Spring(0, 70, 7);
  private hairFront = new Spring(0, 110, 9);
  private ribbon = new Spring(0, 55, 5.5);
  private headS = new Spring(0, 90, 12);
  private landSquash = new Spring(0, 260, 16);
  readonly pose: HeroPose;

  constructor(private gait: GaitTable, facing: 1 | -1) {
    this.visualFacing = facing;
    const idle = gait.idleFrame;
    this.pose = {
      gaitA: idle, gaitB: idle, gaitMix: 0, hipX: 0, hipY: 0, bob: 0, lean: 0, breath: 0, spine: 0, head: 0,
      nearArm: 0, farArm: 0, hairBack: 0, hairFront: 0, ribbon: 0, blink: 0, scaleX: facing, squashX: 1, squashY: 1,
    };
  }

  /** 瞬移(换房间、击退结束)后清掉惯性。 */
  snap(facing: 1 | -1): void {
    this.visualFacing = facing;
    this.turnT = 1;
    this.speedS = 0;
    this.leanS = 0;
    this.prevVx = 0;
    for (const s of [this.hairBack, this.hairFront, this.ribbon, this.headS, this.landSquash]) s.reset();
  }

  update(input: AnimInput): HeroPose {
    const { dt } = input;
    const p = this.pose;
    this.time += dt;
    const t = this.time;
    const airborne = input.jump === "air";
    this.speedS = damp(this.speedS, airborne ? this.speedS : input.speed, 10, dt);
    const moving = clamp(this.speedS * 1.76, 0, 1);

    // 转身: 先压扁到很窄, 再翻面展开
    if (input.facing !== this.visualFacing && this.turnT >= 1) this.turnT = 0;
    if (this.turnT < 1) {
      this.turnT = Math.min(1, this.turnT + dt / TURN_TIME);
      if (this.turnT >= 0.5) this.visualFacing = input.facing;
    }
    const squeeze = this.turnT < 1 ? Math.max(0.08, Math.abs(Math.cos(this.turnT * Math.PI))) : 1;

    // 步态相位由实际位移驱动, 保证脚不打滑
    if (!airborne) this.phase = (this.phase + input.travel / this.gait.cycleLength) % 1;
    this.pickGaitFrames(input, moving);

    const cyc = this.phase * Math.PI * 2;
    // 步态每个循环两步: 起伏与摆臂都是双频
    const stepWave = Math.sin(cyc * 2);
    const breathW = Math.sin(t * 2.1);
    p.breath = breathW * (1 - moving * 0.6) * 0.018;
    p.bob = (1 - moving) * breathW * 0.6;

    const accel = (input.vx - this.prevVx) / Math.max(dt, 1e-4);
    this.prevVx = input.vx;
    const dirVx = input.vx * this.visualFacing;
    const reach = (dirVx / MOTION.WALK_X) * WALK_REACH;
    const leanTarget = clamp(reach, -0.4, 1) * 0.07 - clamp(accel * this.visualFacing / 9000, -0.05, 0.05);
    this.leanS = damp(this.leanS, airborne ? leanTarget * 0.4 : leanTarget, 9, dt);
    p.lean = -this.leanS;
    p.spine = -Math.sin(cyc * 2 + 0.6) * 0.012 * moving;

    // 手臂反向摆动: 近侧手与远侧手相位相反
    const swing = 0.16 * moving;
    p.nearArm = Math.sin(cyc) * swing;
    p.farArm = -Math.sin(cyc) * swing * 0.8;
    if (airborne) {
      const up = clamp(input.vh / 600, -1, 1);
      p.nearArm = -0.35 * up - 0.1;
      p.farArm = 0.28 * up + 0.1;
    }

    // 头部: 待机时微倾, 移动时抵消身体前倾, 由弹簧平滑
    const idleTilt = Math.sin(t * 0.7) * 0.025 + Math.sin(t * 0.23 + 1.3) * 0.02;
    p.head = this.headS.step(idleTilt * (1 - moving) + this.leanS * 0.45 + Math.sin(cyc * 2) * 0.01 * moving, dt);

    // 二次运动: 头发、飘带朝运动反方向拖拽, 下落时向外上甩(背后的部件顺时针为外甩, 身前的逆时针为外甩)
    const drag = clamp(reach, -1, 1);
    const vert = clamp(input.vh / 700, -1, 1);
    p.hairBack = this.hairBack.step(-drag * 0.2 + vert * 0.12 + Math.sin(t * 1.3) * 0.015 + stepWave * 0.02 * moving, dt);
    p.hairFront = this.hairFront.step(-drag * 0.14 - vert * 0.1 + Math.sin(t * 1.7 + 0.5) * 0.02, dt);
    p.ribbon = this.ribbon.step(-drag * 0.35 + vert * 0.25 + Math.sin(t * 1.1 + 2) * 0.03 + stepWave * 0.05 * moving, dt);

    this.updateJumpShape(input);
    this.updateBlink(dt);
    p.scaleX = this.visualFacing * squeeze;
    return p;
  }

  private pickGaitFrames(input: AnimInput, moving: number): void {
    const p = this.pose;
    const g = this.gait;
    let a: number;
    let b: number;
    let mix: number;
    if (input.jump === "air") {
      a = input.vh > 120 ? g.airRiseFrame : g.airFallFrame;
      b = a;
      mix = 0;
    } else {
      const n = g.frames.length;
      const f = this.phase * n;
      const i = Math.floor(f) % n;
      a = g.frames[i];
      b = g.frames[(i + 1) % n];
      mix = f - Math.floor(f);
      // 几乎静止时淡回并拢站姿
      if (moving < 0.05) {
        a = g.idleFrame;
        b = g.idleFrame;
        mix = 0;
      }
    }
    p.gaitA = a;
    p.gaitB = b;
    p.gaitMix = mix;
    const oa = g.hipOffset[a] ?? [0, 0];
    const ob = g.hipOffset[b] ?? [0, 0];
    p.hipX = oa[0] + (ob[0] - oa[0]) * mix;
    p.hipY = oa[1] + (ob[1] - oa[1]) * mix;
  }

  /** 蓄力压缩 → 腾空拉伸 → 落地压扁回弹。 */
  private updateJumpShape(input: AnimInput): void {
    const p = this.pose;
    if (input.jump === "land" && this.prevJump === "air") this.landSquash.kick(-3.6);
    if (input.knocked && this.prevJump !== "air") this.landSquash.kick(-0.6);
    this.prevJump = input.jump;
    const land = this.landSquash.step(0, input.dt);
    let sy = 1 + land * 0.12;
    if (input.jump === "crouch") sy = 1 - 0.13 * clamp(input.phaseT / 0.075, 0, 1);
    else if (input.jump === "air") sy = 1 + clamp(input.vh / 660, -0.4, 1) * 0.07;
    p.squashY = sy;
    p.squashX = 1 / Math.sqrt(Math.max(0.5, sy));
  }

  /** 随机间隔眨眼, 偶尔连眨两下。 */
  private updateBlink(dt: number): void {
    const p = this.pose;
    if (this.blinkT < 0) {
      this.blinkTimer -= dt;
      if (this.blinkTimer <= 0) {
        this.blinkT = 0;
        this.doubleBlink = Math.random() < 0.22;
      }
      p.blink = 0;
      return;
    }
    this.blinkT += dt;
    const dur = 0.16;
    const k = this.blinkT / dur;
    // 闭眼快、睁眼慢
    p.blink = k < 0.35 ? k / 0.35 : Math.max(0, 1 - (k - 0.35) / 0.65);
    if (k >= 1) {
      this.blinkT = this.doubleBlink ? 0 : -1;
      this.doubleBlink = false;
      this.blinkTimer = 2 + Math.random() * 3.5;
    }
  }
}
