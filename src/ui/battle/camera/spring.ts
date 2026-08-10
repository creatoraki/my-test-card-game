export interface SpringTuning {
  stiffness: number;
  damping: number;
}

export class Spring {
  value: number;
  velocity = 0;

  constructor(value = 0) {
    this.value = value;
  }

  step(target: number, dt: number, tuning: SpringTuning): number {
    const safeDt = Math.min(Math.max(dt, 0), 1 / 60);
    const acceleration = (target - this.value) * tuning.stiffness - this.velocity * tuning.damping;
    this.velocity += acceleration * safeDt;
    this.value += this.velocity * safeDt;
    return this.value;
  }

  snap(value: number): void {
    this.value = value;
    this.velocity = 0;
  }
}

export class Impulse {
  value = 0;
  velocity = 0;
  private age = 0;
  private readonly frequency: number;
  private readonly decay: number;
  private readonly duration: number;

  constructor(frequency = 34, decay = 12, duration = 0.42) {
    this.frequency = frequency;
    this.decay = decay;
    this.duration = duration;
  }

  inject(amount: number): void {
    this.velocity += amount;
    this.age = 0;
  }

  step(dt: number): number {
    if (this.age >= this.duration) return 0;
    this.age += Math.max(0, dt);
    const t = this.age;
    const envelope = Math.exp(-this.decay * t);
    this.value = this.velocity * envelope * Math.sin(this.frequency * t);
    if (this.age >= this.duration) {
      this.value = 0;
      this.velocity = 0;
    }
    return this.value;
  }
}
