import { useEffect, useRef } from "react";
import type { ProcFxPreset } from "@/ui/battle/animations";
import {
  DEFAULT_ORIGIN,
  DEFAULT_TARGET,
  TWIN_ARROW_FLIGHT_MS,
  TWIN_ARROW_TIMELINE,
  TWIN_ARROW_WORLD,
  advanceBursts,
  advanceRings,
  advanceSparks,
  bowAlphaAt,
  pullAt,
  spawnArrow,
  spawnBurst,
  spawnRings,
  spawnSparks,
  type ArrowShot,
  type ImpactBurst,
  type ShockRing,
  type Spark,
} from "./twinArrowGeometry";
import {
  drawFlyingArrows,
  drawGlowBow,
  drawImpactBursts,
  drawShockRings,
  drawSparks,
} from "./twinArrowDraw";
import s from "./TwinArrowFx.module.css";

// ============================================================================
// 二连箭(twin-arrow)攻击特效: 单张 Canvas 2D, rAF 驱动, 不循环。
//
// 与 TriSlashFx 同级的 canvas 特效(挂载即播、卸载即停, 换 key 重挂载即重播),
// 但坐标系不同: 它是**跨场景**特效 —— 画布铺满 1920×1080 世界, 从施法者的弓位
// 一直画到目标的命中点, 而不是以目标中心为原点的局部层。
//
// 职责边界(与 KeenEdgeFx / TriSlashFx 一致):
//   · 本组件只画 弓 / 蓄力 / 双箭 / 拖尾 / 冲击环 / 火花 / 命中光爆
//   · 震屏 → 相机; 全屏闪 → screenFx; 目标受击抖动 → 受击反馈类
//   · 背景与立绘属于舞台, 不在特效层里
//
// 两段伤害: 时间轴有两个命中时刻(hit1 / hit2), 消费方用 twinArrowHitTimes()
// 取缩放后的实际毫秒数, 各自结算一次。
// ============================================================================

const { width: WORLD_W, height: WORLD_H } = TWIN_ARROW_WORLD;

/** 时间轴缩放系数: 几何表的 hit1 被拉到 preset.impactMs 上, 其余拍等比跟随。 */
const timeScale = (preset: ProcFxPreset): number =>
  Math.max(preset.impactMs, 1) / TWIN_ARROW_TIMELINE.hit1;

/**
 * 缩放后的两个命中时刻(ms, 相对挂载)。第一箭就是 preset.impactMs 本身,
 * 第二箭按几何表的比例顺推 —— 飘字、掉血、受击反馈都该锚在这两个数上。
 */
export function twinArrowHitTimes(preset: ProcFxPreset): { first: number; second: number } {
  const scale = timeScale(preset);
  return {
    first: TWIN_ARROW_TIMELINE.hit1 * scale,
    second: TWIN_ARROW_TIMELINE.hit2 * scale,
  };
}

/** 特效总时长(ms, 含缩放): 接入战斗时 AnimPreset.hold 不得小于它。 */
export function twinArrowTotalMs(preset: ProcFxPreset): number {
  return TWIN_ARROW_TIMELINE.total * timeScale(preset);
}

export function TwinArrowFx({
  preset,
  origin = DEFAULT_ORIGIN,
  target = DEFAULT_TARGET,
}: {
  preset: ProcFxPreset;
  /** 弓位(世界 px): 施法者的持弓手。 */
  origin?: { x: number; y: number };
  /** 目标中心(世界 px): 两箭各自在它附近错开落点。 */
  target?: { x: number; y: number };
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const res = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(WORLD_W * res);
    canvas.height = Math.round(WORLD_H * res);
    ctx.setTransform(res, 0, 0, res, 0, 0); // 此后一律用世界 px 作图

    // 播放倍速: 挂载时读一次 --fx-rate(与 TriSlashFx / KeenEdgeFx 同一语义, 下限 0.25)。
    const cssRate = parseFloat(getComputedStyle(canvas).getPropertyValue("--fx-rate"));
    const rate = Math.max(0.25, Number.isFinite(cssRate) && cssRate > 0 ? cssRate : 1);

    const scale = timeScale(preset);
    const aimAngle = Math.atan2(target.y - origin.y, target.x - origin.x);

    // 运行期状态: 全部留在 effect 内 —— 卸载即连同 rAF 一起消失, 不留残留粒子。
    let arrows: ArrowShot[] = [];
    let sparks: Spark[] = [];
    let rings: ShockRing[] = [];
    let bursts: ImpactBurst[] = [];
    let fired = 0;
    let tg = 0; // 几何时间(ms): 时间轴与 FLIGHT 都按几何表读, 缩放只体现在步长上

    const hit = (arrow: ArrowShot) => {
      rings = rings.concat(spawnRings(arrow.tx, arrow.ty));
      sparks = sparks.concat(spawnSparks(arrow.tx, arrow.ty, arrow.ang));
      bursts = bursts.concat(spawnBurst(arrow.tx, arrow.ty));
    };

    const update = (dt: number) => {
      if (fired < 1 && tg >= TWIN_ARROW_TIMELINE.fire1) {
        fired = 1;
        arrows.push(spawnArrow(origin, target, aimAngle, 0));
      } else if (fired < 2 && tg >= TWIN_ARROW_TIMELINE.fire2) {
        fired = 2;
        arrows.push(spawnArrow(origin, target, aimAngle, 1));
      }

      const flying: ArrowShot[] = [];
      for (const a of arrows) {
        a.p += (dt * 1000) / TWIN_ARROW_FLIGHT_MS;
        if (a.p >= 1) {
          a.x = a.tx;
          a.y = a.ty;
          hit(a);
          continue;
        }
        a.x = a.sx + (a.tx - a.sx) * a.p;
        a.y = a.sy + (a.ty - a.sy) * a.p;
        flying.push(a);
      }
      arrows = flying;

      sparks = advanceSparks(sparks, dt);
      rings = advanceRings(rings, dt);
      bursts = advanceBursts(bursts, dt);
    };

    const render = () => {
      ctx.clearRect(0, 0, WORLD_W, WORLD_H);
      drawImpactBursts(ctx, bursts);
      drawShockRings(ctx, rings);
      drawSparks(ctx, sparks);
      drawGlowBow(ctx, {
        origin,
        aimAngle,
        pull: pullAt(tg),
        charging: fired < 2,
        alpha: bowAlphaAt(tg),
      });
      drawFlyingArrows(ctx, arrows);
    };

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      // 真实步长 → 几何步长: 倍速越快、时间轴越短, 粒子物理也跟着同步变快。
      const real = Math.min((now - last) / 1000, 0.05);
      last = now;
      const dt = (real * rate) / scale;
      tg += dt * 1000;

      if (tg >= TWIN_ARROW_TIMELINE.total) {
        // 不循环: 演出结束清屏停机, 重播靠外层换 key 重挂载。
        ctx.clearRect(0, 0, WORLD_W, WORLD_H);
        return;
      }

      update(dt);
      render();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [preset.impactMs, origin.x, origin.y, target.x, target.y]);

  return <canvas ref={canvasRef} className={s.canvas} aria-hidden="true" />;
}
