import { useEffect, useRef } from "react";
import type { AttackArt } from "./catalog";
import { drawSlash } from "./slash";
import { drawArrow } from "./arrow";
import { drawPoison } from "./poison";
import { drawFire } from "./fire";
import { drawOracle } from "./oracle";
import s from "./AttackArtsFx.module.css";

const DRAW = {
  "moon-cleave": drawSlash, "rift-cleave": drawSlash,
  "comet-arrow": drawArrow, "rain-arrow": drawArrow,
  "venom-bloom": drawPoison, "toxic-bind": drawPoison,
  "ember-brand": drawFire, "solar-pyre": drawFire,
  "oracle-verdict": drawOracle, "fate-wheel": drawOracle,
};

/** 目标中心为原点，挂载即播、卸载即停；只绘制特效，不承载伤害和镜头逻辑。
 * 未传 rate 时读取祖先 --fx-rate，与现有战斗特效保持一致。
 */
export function AttackArtsFx({ art, rate, className }: { art: AttackArt; rate?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const c = canvas?.getContext("2d");
    if (!canvas || !c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = 1200 * dpr; canvas.height = 900 * dpr;
    const inherited = parseFloat(getComputedStyle(canvas).getPropertyValue("--fx-rate"));
    const requestedRate = rate ?? inherited;
    const speed = Number.isFinite(requestedRate) ? Math.max(0.25, requestedRate) : 1;
    let frame = 0;
    const start = performance.now();
    const draw = (now: number) => {
      // 使用绝对时间，与外部受击反馈及循环周期一致；掉帧不积累时序误差。
      const time = (now - start) * speed;
      c.setTransform(dpr, 0, 0, dpr, 600 * dpr, 450 * dpr);
      c.clearRect(-600, -450, 1200, 900);
      if (time >= art.durationMs) return;
      c.save(); c.globalCompositeOperation = "lighter";
      DRAW[art.id](c, time, art); c.restore();
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [art, rate]);
  return <canvas ref={ref} className={[s.canvas, className].filter(Boolean).join(" ")} aria-hidden />;
}
