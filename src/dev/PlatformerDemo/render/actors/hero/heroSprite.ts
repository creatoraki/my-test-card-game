import type { PlayerState } from "../../../types";
import { PX } from "../../core/grid";
import { RAMPS } from "../../core/palette";
import { PixelBuffer, mixPacked, pack } from "../../core/pixelBuffer";
import { stampGrid } from "../../core/spriteGrid";
import { postProcess } from "../../core/spritePost";
import { HairChain } from "./heroHair";
import { HERO_RAMPS, heroGrids } from "./heroParts";
import { advancePose, createPose } from "./heroPose";
import { buildRig, type ArmRig, type LegRig, type Pt } from "./heroRig";

// 主角像素精灵：每帧在 64×64 缓冲中按骨骼绘制（朝右），朝左时整体镜像，再做描边与边缘光后贴到主画布。
// 绘制顺序即前后层次：长发 → 后臂 → 后腿 → 前腿 → 躯干 → 头 → 前臂。

const SIZE = 64;
const OX = 32;
const OY = 52;
const INK = pack(RAMPS.ink[0]);
const BACK_DIM = 0.32;
const EDGE = pack(HERO_RAMPS.jacket[0]);

const C = {
  sleeve: pack(HERO_RAMPS.jacket[3]),
  sleeveLight: pack(HERO_RAMPS.jacket[4]),
  cuff: pack(HERO_RAMPS.white[3]),
  cyan: pack(RAMPS.bio[3]),
  hand: pack(HERO_RAMPS.skin[3]),
  stocking: pack(HERO_RAMPS.stocking[2]),
  stockingLight: pack(HERO_RAMPS.stocking[3]),
};

function dim(color: number, back: boolean): number {
  return back ? mixPacked(color, INK, BACK_DIM) : color;
}

function at(p: Pt): Pt {
  return { x: p.x + OX, y: p.y + OY };
}

/** 粗细分明的肢体：底色胶囊 + 左上侧细高光；edge 时先铺一圈暗边，让前侧肢体与躯干分开。 */
function limb(buf: PixelBuffer, a: Pt, b: Pt, r: number, base: number, light: number, edge = false) {
  const pa = at(a);
  const pb = at(b);
  if (edge) buf.capsule(pa.x, pa.y, pb.x, pb.y, r + 1, EDGE);
  buf.capsule(pa.x, pa.y, pb.x, pb.y, r, base);
  buf.capsule(pa.x - 0.5, pa.y - 0.4, pb.x - 0.5, pb.y - 0.4, Math.max(0.5, r * 0.35), light);
}

function drawArm(buf: PixelBuffer, arm: ArmRig, back: boolean) {
  limb(buf, arm.shoulder, arm.elbow, 2, dim(C.sleeve, back), dim(C.sleeveLight, back), !back);
  limb(buf, arm.elbow, arm.hand, 1.7, dim(C.sleeve, back), dim(C.sleeveLight, back), !back);
  const cuffA = { x: arm.elbow.x + (arm.hand.x - arm.elbow.x) * 0.62, y: arm.elbow.y + (arm.hand.y - arm.elbow.y) * 0.62 };
  const cuffB = { x: arm.elbow.x + (arm.hand.x - arm.elbow.x) * 0.82, y: arm.elbow.y + (arm.hand.y - arm.elbow.y) * 0.82 };
  limb(buf, cuffA, cuffB, 1.9, dim(C.cuff, back), dim(C.cuff, back));
  const band = at(cuffA);
  buf.set(Math.round(band.x), Math.round(band.y), dim(C.cyan, back));
  const hand = at(arm.hand);
  buf.ellipse(hand.x, hand.y + 0.6, 1.4, 1.4, dim(C.hand, back));
}

function drawLeg(buf: PixelBuffer, leg: LegRig, back: boolean) {
  limb(buf, leg.hip, leg.knee, 1.9, dim(C.stocking, back), dim(C.stockingLight, back), !back);
  limb(buf, leg.knee, leg.ankle, 1.6, dim(C.stocking, back), dim(C.stockingLight, back), !back);
  const ankle = at(leg.ankle);
  stampGrid(buf, heroGrids().boot, ankle.x, ankle.y - 0.5, back ? BACK_DIM : 0, INK);
}

export class HeroSprite {
  private pose = createPose();
  private hair = new HairChain();
  private blink = { wait: 2.4, left: 0 };
  private shadow = 1;
  private facing: 1 | -1 = 1;
  private pos: Pt = { x: 0, y: 0 };
  private squash = 0;
  private readonly buf = new PixelBuffer(SIZE, SIZE);
  private readonly flip = new PixelBuffer(SIZE, SIZE);
  private readonly canvas: HTMLCanvasElement;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = SIZE;
    this.canvas.height = SIZE;
  }

  update(player: PlayerState, dt: number, time: number) {
    const { sy } = advancePose(this.pose, player, dt, time);
    this.squash = (1 - sy) * 12;
    this.facing = player.facing;
    this.pos = { x: player.x / PX, y: player.y / PX };
    const b = this.blink;
    if (b.left > 0) b.left -= dt;
    else if ((b.wait -= dt) <= 0) {
      b.left = 0.13;
      b.wait = 2 + Math.random() * 2.5;
    }
    this.shadow += ((player.grounded ? 1 : 0) - this.shadow) * Math.min(1, dt * 14);
    const rig = buildRig(this.pose, this.squash);
    this.hair.step({ x: this.pos.x + rig.hairRoot.x * this.facing, y: this.pos.y + rig.hairRoot.y }, this.facing, dt, time);
  }

  private paint() {
    const buf = this.buf;
    buf.data.fill(0);
    const rig = buildRig(this.pose, this.squash);
    const grids = heroGrids();
    const { x: px, y: py } = this.pos;
    this.hair.draw(buf, (p) => at({ x: (p.x - px) * this.facing, y: p.y - py }));
    drawArm(buf, rig.arms[0], true);
    drawLeg(buf, rig.legs[0], true);
    drawLeg(buf, rig.legs[1], false);
    const torso = at({ x: rig.torso.x, y: rig.hip.y + rig.torso.y + 1 });
    stampGrid(buf, grids.torso, torso.x, torso.y);
    const neck = at(rig.neck);
    stampGrid(buf, this.blink.left > 0 ? grids.blink : grids.head, neck.x, neck.y);
    drawArm(buf, rig.arms[1], false);

    let out = buf;
    if (this.facing === -1) {
      const f = this.flip;
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) f.data[y * SIZE + x] = buf.data[y * SIZE + (SIZE - 1 - x)];
      out = f;
    }
    postProcess(out, { outline: 0.75, rim: 0.3, shade: 0.2 });
    this.canvas.getContext("2d")?.putImageData(out.image, 0, 0);
  }

  draw(ctx: CanvasRenderingContext2D, camPx: number) {
    const sx = Math.round(this.pos.x) - camPx;
    const sy = Math.round(this.pos.y);
    if (sx < -SIZE || sx > ctx.canvas.width + SIZE) return;
    this.paint();
    if (this.shadow > 0.05) {
      ctx.fillStyle = `rgba(5, 6, 12, ${(0.4 * this.shadow).toFixed(2)})`;
      ctx.fillRect(sx - 6, sy - 1, 13, 1);
      ctx.fillRect(sx - 4, sy, 9, 1);
    }
    ctx.drawImage(this.canvas, sx - (this.facing === 1 ? OX : SIZE - 1 - OX), sy - OY);
  }
}
