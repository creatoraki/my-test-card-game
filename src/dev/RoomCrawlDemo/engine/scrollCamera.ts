import { DESIGN_W } from "../data/layout";
import { damp } from "./springBone";

/** 朝面向方向多看一点的前瞻距离。 */
const LOOK_AHEAD = 170;

/** 横向卷轴相机: 跟随玩家、前瞻、边缘夹紧, 另带衰减震屏。 */
export class ScrollCamera {
  x = 0;
  private lead = 0;
  private shakeAmp = 0;
  private shakeT = 0;
  shakeX = 0;
  shakeY = 0;

  constructor(private width: number) {}

  private clampX(x: number): number {
    return Math.min(Math.max(0, this.width - DESIGN_W), Math.max(0, x));
  }

  /** 换房间后直接对准玩家。 */
  snap(width: number, playerX: number, facing: number): void {
    this.width = width;
    this.lead = facing * LOOK_AHEAD * 0.5;
    this.x = this.clampX(playerX - DESIGN_W / 2 + this.lead);
    this.shakeAmp = 0;
  }

  shake(amount: number): void {
    this.shakeAmp = Math.max(this.shakeAmp, amount);
  }

  update(dt: number, playerX: number, facing: number, speedRatio: number): void {
    this.lead = damp(this.lead, facing * LOOK_AHEAD * (0.35 + speedRatio * 0.36), 3.5, dt);
    this.x = damp(this.x, this.clampX(playerX - DESIGN_W / 2 + this.lead), 8, dt);
    this.shakeT += dt;
    this.shakeAmp = damp(this.shakeAmp, 0, 6, dt);
    const a = this.shakeAmp;
    this.shakeX = (Math.sin(this.shakeT * 71) + Math.sin(this.shakeT * 43 + 1.7) * 0.6) * a;
    this.shakeY = (Math.sin(this.shakeT * 59 + 0.4) + Math.sin(this.shakeT * 37 + 2.2) * 0.6) * a;
  }
}
