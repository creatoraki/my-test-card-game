import { useEffect, useRef, type CSSProperties } from "react";
import type { TransitionOrigin } from "./transitionOrigin";
import {
  BATTLE_CRACK_DRAW_MS,
  BATTLE_CRACK_HOLD_MS,
  BATTLE_RIPPLE_EXIT_MS,
  BATTLE_RIPPLE_MS,
} from "./transitions";
import "./BattleTransitionCurtain.css";

interface Props {
  phase: "exit" | "enter";
  origin: TransitionOrigin | null;
}

interface Point {
  x: number;
  y: number;
}

interface Crack {
  points: Point[];
  delay: number;
  duration: number;
  alpha: number;
  width: number;
  highlight: boolean;
}

const MAX_PIXEL_RATIO = 1.5;
const CRACK_WIDTH_SCALE = 3;

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

function createCrack(
  start: Point,
  angle: number,
  length: number,
  delay: number,
  highlight = false,
): Crack {
  const points = [start];
  const steps = Math.round(randomBetween(3, 6));
  let x = start.x;
  let y = start.y;
  let heading = angle;

  for (let index = 0; index < steps; index++) {
    heading += randomBetween(-0.42, 0.42);
    const step = (length / steps) * randomBetween(0.72, 1.18);
    x += Math.cos(heading) * step;
    y += Math.sin(heading) * step;
    points.push({ x, y });
  }

  return {
    points,
    delay,
    duration: randomBetween(130, 230),
    alpha: randomBetween(0.6, 0.94),
    width: randomBetween(0.7, 1.45),
    highlight,
  };
}

function createCracks(origin: Point, width: number, height: number): Crack[] {
  const cracks: Crack[] = [];
  const radius = Math.hypot(width, height) * 0.78;
  const mainCount = 21;
  const ringCount = 2;
  const ringPoints = 13;
  const crackStartRadius = 34;

  for (let index = 0; index < mainCount; index++) {
    const angle = (Math.PI * 2 * index) / mainCount + randomBetween(-0.055, 0.055);
    const startRadius = crackStartRadius + randomBetween(-3.5, 3.5);
    const start = {
      x: origin.x + Math.cos(angle) * startRadius,
      y: origin.y + Math.sin(angle) * startRadius,
    };
    const main = createCrack(
      start,
      angle,
      radius * randomBetween(0.55, 0.95),
      index * 5,
      index % 4 === 0,
    );
    cracks.push(main);

    if (index % 2 === 0 || Math.random() > 0.18) {
      const anchor = main.points[Math.max(1, Math.floor(main.points.length * randomBetween(0.38, 0.8)))];
      const branchAngle = angle + randomBetween(-1.35, 1.35);
      cracks.push(
        createCrack(
          anchor,
          branchAngle,
          radius * randomBetween(0.08, 0.19),
          main.delay + randomBetween(24, 70),
          Math.random() > 0.62,
        ),
      );
    }
  }

  // 不规则环带把相邻放射裂纹连起来，形成镜面龟裂的玻璃片边界。
  for (let ring = 0; ring < ringCount; ring++) {
    const ringRadius = radius * (0.12 + ring * 0.13);
    const points: Point[] = [];
    const offset = randomBetween(-0.12, 0.12);
    for (let index = 0; index <= ringPoints; index++) {
      const angle = (Math.PI * 2 * index) / ringPoints + offset;
      const wobble = randomBetween(0.88, 1.12);
      points.push({
        x: origin.x + Math.cos(angle) * ringRadius * wobble,
        y: origin.y + Math.sin(angle) * ringRadius * wobble,
      });
    }
    cracks.push({
      points,
      delay: 80 + ring * 45,
      duration: 260 + ring * 55,
      alpha: 0.72,
      width: 0.65 + ring * 0.08,
      highlight: ring % 2 === 0,
    });
  }

  return cracks;
}

function drawPartialPath(ctx: CanvasRenderingContext2D, crack: Crack, progress: number): void {
  const visibleSegments = (crack.points.length - 1) * progress;
  const complete = Math.floor(visibleSegments);
  const remainder = visibleSegments - complete;
  const first = crack.points[0];
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);

  for (let index = 1; index <= complete; index++) {
    const point = crack.points[index];
    ctx.lineTo(point.x, point.y);
  }

  if (complete < crack.points.length - 1) {
    const from = crack.points[complete];
    const to = crack.points[complete + 1];
    ctx.lineTo(from.x + (to.x - from.x) * remainder, from.y + (to.y - from.y) * remainder);
  }

  ctx.stroke();
}

function CrackCanvas({ origin }: { origin: TransitionOrigin | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const point = origin ?? { x: width / 2, y: height / 2 };
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const cracks = createCracks(point, width, height);
    let animationFrame = 0;
    const startedAt = performance.now();

    const draw = (now: number) => {
      const elapsed = now - startedAt;
      context.clearRect(0, 0, width, height);

      context.lineCap = "round";
      context.lineJoin = "round";
      context.shadowBlur = 0;

      for (const crack of cracks) {
        const progress = clamp((elapsed - crack.delay) / crack.duration);
        if (progress === 0) continue;
        // 多层描边模拟裂纹的暗色凹口、青色断面与白色边缘高光。
        context.globalAlpha = crack.alpha * 0.62;
        context.strokeStyle = "rgb(5 18 24 / 0.78)";
        context.lineWidth = (crack.width + 5.2) * CRACK_WIDTH_SCALE;
        context.shadowColor = "rgb(0 8 12 / 0.48)";
        context.shadowBlur = 3;
        context.shadowOffsetX = 1;
        context.shadowOffsetY = 1;
        drawPartialPath(context, crack, progress);
        context.shadowBlur = 0;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        context.globalAlpha = crack.alpha * 0.88;
        context.strokeStyle = "rgb(18 86 98 / 0.92)";
        context.lineWidth = (crack.width + 3.2) * CRACK_WIDTH_SCALE;
        drawPartialPath(context, crack, progress);
        context.globalAlpha = crack.alpha;
        context.strokeStyle = crack.highlight ? "rgb(224 255 255 / 0.98)" : "rgb(86 218 231 / 0.96)";
        context.lineWidth = (crack.width + 1.15) * CRACK_WIDTH_SCALE;
        drawPartialPath(context, crack, progress);
        context.globalAlpha = crack.alpha * 0.8;
        context.strokeStyle = crack.highlight ? "rgb(255 255 255 / 0.98)" : "rgb(190 247 248 / 0.92)";
        context.lineWidth = Math.max(0.35, crack.width * 0.38 * CRACK_WIDTH_SCALE);
        drawPartialPath(context, crack, progress);
      }

      const impactProgress = clamp(elapsed / 180);
      if (impactProgress < 1) {
        const impactAlpha = 1 - impactProgress;
        const impactRadius = 7 + impactProgress * 28;
        context.globalAlpha = impactAlpha * 0.9;
        context.strokeStyle = "rgb(156 245 248 / 0.98)";
        context.lineWidth = 3;
        context.shadowColor = "rgb(62 222 235 / 0.82)";
        context.shadowBlur = 16;
        context.beginPath();
        context.arc(point.x, point.y, impactRadius, 0, Math.PI * 2);
        context.stroke();
        context.shadowBlur = 0;
        context.fillStyle = "rgb(224 255 255 / 0.98)";
        context.beginPath();
        context.arc(point.x, point.y, 3.5 + impactProgress * 2, 0, Math.PI * 2);
        context.fill();
      }

      // 裂纹画完后停止 rAF，但保留最后一帧位图，直到黑色涟漪覆盖旧场景。
      if (elapsed < BATTLE_CRACK_DRAW_MS) animationFrame = requestAnimationFrame(draw);
    };

    animationFrame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationFrame);
  }, [origin]);

  return <canvas ref={canvasRef} className="battle-transition-cracks" aria-hidden />;
}

export function battleTransitionVars(origin: TransitionOrigin | null): CSSProperties {
  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? window.innerHeight / 2;
  // 圆只比「点到最远角」所需直径略大，scale: 0 → 1 才会在整个 1.5 秒内保持可见扩张。
  // 若用数百 vmax 的超大圆，极小的 scale 已能盖满屏幕，视觉上会像一瞬间吞没。
  const coverRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const style = {
    "--fx-ox": `${x}px`,
    "--fx-oy": `${y}px`,
    "--btc-cover-size": `${Math.ceil(coverRadius * 2 + 24)}px`,
    "--btc-crack-ms": `${BATTLE_CRACK_DRAW_MS}ms`,
    "--btc-hold-ms": `${BATTLE_CRACK_HOLD_MS}ms`,
    "--btc-ripple-ms": `${BATTLE_RIPPLE_MS}ms`,
    "--btc-exit-ms": `${BATTLE_RIPPLE_EXIT_MS}ms`,
  } as CSSProperties;

  return style;
}

export function BattleTransitionCurtain({ phase, origin }: Props) {
  const style = battleTransitionVars(origin);

  return (
    <div className={`battle-transition-curtain is-${phase}`} style={style} aria-hidden>
      <CrackCanvas origin={origin} />
      <span className="battle-transition-black" />
      <span className="battle-transition-ring" />
      <span className="battle-transition-particles">
        {Array.from({ length: 16 }, (_, index) => (
          <i
            key={index}
            style={{ "--particle-angle": `${(index * 360) / 16}deg` } as CSSProperties}
          />
        ))}
      </span>
    </div>
  );
}