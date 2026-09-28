/**
 * 一维阻尼弹簧: 头发、飘带这类二次运动的核心。
 * stiffness 决定回弹频率, damping 决定余振多久消失(临界阻尼约为 2√stiffness)。
 */
export class Spring {
  value: number;
  velocity = 0;

  constructor(initial = 0, private stiffness = 120, private damping = 11) {
    this.value = initial;
  }

  /** 以半隐式欧拉积分推进; 大步长拆成子步, 避免掉帧时炸开。 */
  step(target: number, dt: number): number {
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const force = (target - this.value) * this.stiffness - this.velocity * this.damping;
      this.velocity += force * h;
      this.value += this.velocity * h;
    }
    return this.value;
  }

  /** 给弹簧一个瞬时冲量(落地、急停时甩一下)。 */
  kick(impulse: number): void {
    this.velocity += impulse;
  }

  reset(value = 0): void {
    this.value = value;
    this.velocity = 0;
  }
}

/** 帧率无关的指数趋近。 */
export function damp(current: number, target: number, rate: number, dt: number): number {
  return target + (current - target) * Math.exp(-rate * dt);
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
