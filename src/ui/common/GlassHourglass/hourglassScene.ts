import {
  BRASS,
  BOT,
  DRAIN_MS,
  H,
  PARTICLE_COUNT,
  REFILL_MS,
  R,
  TOP,
  W,
  lighten,
  rgba,
  shade,
} from "./hourglassConstants";
import { bulbHalfWidth, glassPath } from "./hourglassGeometry";
import {
  createParticles,
  drawParticles,
  updateParticles,
  type HourglassParticle,
} from "./hourglassParticles";

interface HourglassUpdate {
  time: number;
  dt: number;
  color: string;
  intensity: number;
  staticFrame?: boolean;
}

export interface HourglassScene {
  layout(cssWidth: number, cssHeight: number, dpr: number): void;
  update(update: HourglassUpdate): void;
  render(): void;
  dispose(): void;
}

type Phase = "drain" | "refill";

function parseHexColor(value: string): number[] {
  const normalized = value.trim().replace(/^#/, "");
  const hex = normalized.length === 3
    ? normalized.split("").map((part) => `${part}${part}`).join("")
    : normalized;
  if (!/^[\da-f]{6}$/i.test(hex)) return [255, 255, 255];
  const number = Number.parseInt(hex, 16);
  return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
}

export function createHourglassScene(
  canvas: HTMLCanvasElement,
  initialColor: string,
): HourglassScene {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas is unavailable");

  const initial = parseHexColor(initialColor);
  const currentColor = [...initial];
  const targetColor = [...initial];
  const particles = createParticles(PARTICLE_COUNT);
  let cssWidth = 0;
  let cssHeight = 0;
  let pixelRatio = 1;
  let laidOut = false;
  let phase: Phase = "drain";
  let phaseStart = 0;
  let currentTime = 0;
  let topFill = 1;
  let intensity = 1;
  let pileApex = BOT;

  const drawSand = (fill: number, opacity = 1) => {
    ctx.save();
    glassPath(ctx);
    ctx.clip();
    ctx.globalAlpha = opacity;

    const bottomHeight = (1 - fill) * 112;
    pileApex = BOT - bottomHeight;
    if (bottomHeight > 0.5) {
      const gradient = ctx.createLinearGradient(0, pileApex, 0, BOT);
      gradient.addColorStop(0, rgba(lighten(currentColor, 0.25), 0.98));
      gradient.addColorStop(1, rgba(shade(currentColor, 0.45), 0.98));
      ctx.fillStyle = gradient;
      const width = 110;
      ctx.beginPath();
      ctx.moveTo(-width - 20, BOT + 20);
      ctx.lineTo(-width - 20, BOT);
      ctx.quadraticCurveTo(-width * 0.45, pileApex + bottomHeight * 0.22, 0, pileApex);
      ctx.quadraticCurveTo(width * 0.45, pileApex + bottomHeight * 0.22, width, BOT);
      ctx.lineTo(width + 20, BOT + 20);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(0,0,0,.10)";
      ctx.lineWidth = 1;
      for (let index = 1; index <= 3; index += 1) {
        const y = pileApex + (bottomHeight * index) / 3.6;
        const ratio = (y - pileApex) / bottomHeight;
        const lineWidth = width * (0.9 * ratio * (1 - ratio) + ratio * ratio);
        ctx.beginPath();
        ctx.moveTo(-lineWidth, y + 3);
        ctx.quadraticCurveTo(0, y - 2, lineWidth, y + 3);
        ctx.stroke();
      }
    }

    if (fill > 0.002) {
      const surfaceY = -12 - 140 * fill;
      const craterY = 4;
      const dip = craterY - surfaceY;
      const surfaceWidth = bulbHalfWidth(surfaceY) + 4;
      const baseY = Math.max(surfaceY, -28);
      const pileWidth = Math.max(12, bulbHalfWidth(baseY) * 0.92);
      const steps = 30;

      const gradient = ctx.createLinearGradient(0, surfaceY, 0, 8);
      gradient.addColorStop(0, rgba(lighten(currentColor, 0.2), 0.98));
      gradient.addColorStop(1, rgba(shade(currentColor, 0.5), 0.98));
      ctx.fillStyle = gradient;

      ctx.beginPath();
      ctx.moveTo(-surfaceWidth, surfaceY);
      ctx.quadraticCurveTo(0, surfaceY + 2, surfaceWidth, surfaceY);
      for (let index = 1; index <= steps; index += 1) {
        const ratio = index / steps;
        const y = surfaceY + (baseY - surfaceY) * ratio;
        const wallWidth = index === steps ? pileWidth : bulbHalfWidth(y);
        ctx.lineTo(wallWidth, y);
      }
      ctx.quadraticCurveTo(pileWidth * 0.52, baseY + 2, 0, craterY);
      ctx.quadraticCurveTo(-pileWidth * 0.52, baseY + 2, -pileWidth, baseY);
      for (let index = steps - 1; index >= 1; index -= 1) {
        const ratio = index / steps;
        const y = surfaceY + (baseY - surfaceY) * ratio;
        ctx.lineTo(-bulbHalfWidth(y), y);
      }
      ctx.lineTo(-surfaceWidth, surfaceY);
      ctx.closePath();
      ctx.fill();

      const craterRadius = Math.max(14, surfaceWidth * 0.38);
      const craterGradient = ctx.createRadialGradient(
        0,
        craterY,
        1,
        0,
        craterY,
        craterRadius * 0.9,
      );
      craterGradient.addColorStop(0, "rgba(0,0,0,.10)");
      craterGradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = craterGradient;
      ctx.fillRect(-surfaceWidth, surfaceY - 4, surfaceWidth * 2, dip + 20);
    }

    ctx.restore();
  };

  const drawStream = (timestamp: number) => {
    const isRefill = phase === "refill";
    const duration = isRefill ? REFILL_MS : DRAIN_MS;
    const progress = Math.min(1, ((currentTime - phaseStart) * 1000) / duration);
    if (progress <= 0.002 || progress >= 0.999) return;

    const startY = isRefill ? pileApex + 2 : 3;
    const endY = isRefill ? 3 : pileApex - 2;
    const streamLength = Math.max(8, Math.abs(endY - startY));
    const gradient = ctx.createLinearGradient(0, startY, 0, endY);
    gradient.addColorStop(0, rgba(shade(currentColor, 0.6), 0.9));
    gradient.addColorStop(1, rgba(lighten(currentColor, 0.2), 0.9));
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, startY);
    ctx.lineTo(0, endY);
    ctx.stroke();

    ctx.save();
    ctx.shadowColor = rgba(currentColor, 0.9);
    ctx.shadowBlur = 6;
    ctx.fillStyle = rgba(lighten(currentColor, 0.35), 1);
    for (let index = 0; index < 9; index += 1) {
      const offset = 2 + ((timestamp * 0.26) + index * 47) % (streamLength - 4);
      const y = isRefill ? startY - offset : startY + offset;
      const x = Math.sin(timestamp * 0.02 + index * 1.7) * 1.2;
      ctx.beginPath();
      ctx.arc(x, y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const metalRing = (
    y: number,
    ringWidth: number,
    ringHeight: number,
    height: number,
    top: string,
    middle: string,
    bottom: string,
  ) => {
    ctx.fillStyle = bottom;
    ctx.beginPath();
    ctx.ellipse(0, y + height, ringWidth, ringHeight, 0, 0, Math.PI * 2);
    ctx.fill();
    const gradient = ctx.createLinearGradient(0, y, 0, y + height);
    gradient.addColorStop(0, middle);
    gradient.addColorStop(1, bottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(-ringWidth, y, ringWidth * 2, height);
    ctx.fillStyle = top;
    ctx.beginPath();
    ctx.ellipse(0, y, ringWidth, ringHeight, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, y, ringWidth, ringHeight, 0, 0, Math.PI * 2);
    ctx.stroke();
  };

  const drawGlassBody = () => {
    const gradient = ctx.createLinearGradient(0, TOP, 0, BOT);
    gradient.addColorStop(0, "rgba(255,255,255,.10)");
    gradient.addColorStop(0.5, "rgba(255,255,255,.03)");
    gradient.addColorStop(1, "rgba(255,255,255,.08)");
    glassPath(ctx);
    ctx.fillStyle = gradient;
    ctx.fill();
    glassPath(ctx);
    ctx.fillStyle = rgba(currentColor, 0.05);
    ctx.fill();
  };

  const drawGlassShine = () => {
    ctx.save();
    glassPath(ctx);
    ctx.clip();
    let gradient = ctx.createLinearGradient(-R, 0, -R + 40, 0);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.45, "rgba(255,255,255,.16)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(-R, TOP, 44, BOT - TOP);
    gradient = ctx.createLinearGradient(R - 24, 0, R, 0);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.6, "rgba(255,255,255,.10)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(R - 26, TOP, 26, BOT - TOP);
    ctx.restore();

    glassPath(ctx);
    ctx.strokeStyle = "rgba(255,255,255,.5)";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    glassPath(ctx);
    ctx.strokeStyle = "rgba(255,255,255,.10)";
    ctx.lineWidth = 5;
    ctx.stroke();
  };

  return {
    layout(width, height, dpr) {
      cssWidth = Math.max(1, width);
      cssHeight = Math.max(1, height);
      pixelRatio = Math.max(1, dpr);
      canvas.width = Math.max(1, Math.round(cssWidth * pixelRatio));
      canvas.height = Math.max(1, Math.round(cssHeight * pixelRatio));
      laidOut = true;
    },

    update(update) {
      const nextColor = parseHexColor(update.color);
      targetColor[0] = nextColor[0];
      targetColor[1] = nextColor[1];
      targetColor[2] = nextColor[2];
      const blend = Math.min(1, Math.max(0, update.dt * 6));
      for (let index = 0; index < 3; index += 1) {
        currentColor[index] += (targetColor[index] - currentColor[index]) * blend;
      }

      intensity = Math.max(0, update.intensity);
      if (update.staticFrame) {
        currentColor[0] = targetColor[0];
        currentColor[1] = targetColor[1];
        currentColor[2] = targetColor[2];
        currentTime = 0;
        phase = "drain";
        phaseStart = 0;
        topFill = 0.62;
        return;
      }

      currentTime = update.time;
      const duration = (phase === "drain" ? DRAIN_MS : REFILL_MS) / 1000;
      if (currentTime - phaseStart >= duration) {
        phase = phase === "drain" ? "refill" : "drain";
        phaseStart = currentTime;
      }
      const progress = Math.min(
        1,
        Math.max(0, (currentTime - phaseStart) / duration),
      );
      topFill = phase === "drain" ? 1 - progress : progress;
      updateParticles(particles, update.dt, currentTime * 1000);
    },

    render() {
      if (!laidOut) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(
        (cssWidth / W) * pixelRatio,
        0,
        0,
        (cssHeight / H) * pixelRatio,
        0,
        0,
      );
      ctx.save();
      ctx.translate(W / 2, H / 2);

      let gradient = ctx.createRadialGradient(0, 0, 20, 0, 0, 300);
      gradient.addColorStop(0, rgba(currentColor, Math.min(1, 0.14 * intensity)));
      gradient.addColorStop(1, rgba(currentColor, 0));
      ctx.fillStyle = gradient;
      ctx.fillRect(-300, -320, 600, 640);

      gradient = ctx.createRadialGradient(0, 272, 10, 0, 272, 160);
      gradient.addColorStop(0, "rgba(0,0,0,.5)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.save();
      ctx.translate(0, 272);
      ctx.scale(1, 0.16);
      ctx.beginPath();
      ctx.arc(0, 0, 160, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const breath = 1 + 0.02 * Math.sin(currentTime * 1.6);
      const tilt = 0.055 * Math.sin(currentTime * 0.9);
      ctx.rotate(tilt);
      ctx.scale(breath, breath);

      drawGlassBody();
      drawSand(topFill);
      drawStream(currentTime * 1000);
      drawParticles(ctx, particles, currentColor, intensity);
      drawGlassShine();
      metalRing(TOP - 14, R + 10, 15, 12, ...BRASS);
      metalRing(BOT + 2, R + 10, 15, 12, ...BRASS);
      ctx.restore();
    },

    dispose() {
      particles.length = 0;
    },
  };
}