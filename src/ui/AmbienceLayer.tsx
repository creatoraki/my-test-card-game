import { useEffect, useMemo, useRef } from "react";
import { ambience, type AmbienceDef, type EmitterDef } from "./ambience";
import { STAGE } from "./stage";
import "./AmbienceLayer.css";

// ============================================================================
// 场景氛围层: 按地图预设(ui/ambience.ts)在世界里跑一套 Canvas 粒子。
//
// 为什么是 Canvas 而不是一堆 div: 上百个粒子各自持续位移, 用 DOM 会产生同样数量的
// 合成层与样式重算; Canvas 只有两张位图, 更新成本与粒子数近似无关。
//
// 两张画布(far/near)夹着 .battle-stage —— 近景粒子画在敌我单位**之上**并整层失焦,
// 这是纵深的全部来源。两张画布由**同一个** rAF 循环驱动(不是两个循环)。
//
// 画布挂在 .battle-world 内 ⇒ 跟随分镜相机推近/平移/漂移/震屏, 粒子与场景是一体的。
// CSS 尺寸恒为设计画布尺寸(1920×1080), 位图分辨率按 devicePixelRatio 上浮但封顶 1.5 ——
// 粒子都是软边色块, 相机推到 1.55× 也看不出这点差别, 没必要为它烧填充率。
// ============================================================================

const MAX_RES = 1.5;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number; // 正弦摆动相位(仅 drift > 0 的粒子用)
}

// 按发射器分组: 同组共用颜色/线宽/精灵, 绘制时每组只设一次状态。
interface Group {
  def: EmitterDef;
  sprite: HTMLCanvasElement | null; // dust/mist 的软点精灵(rain 走描边, 不需要)
  items: Particle[];
}

const rand = ([a, b]: [number, number]) => a + Math.random() * (b - a);

// 软点精灵: 一张 64×64 的径向渐变。逐粒子现算 createRadialGradient 太贵,
// 预渲染一次后靠 drawImage 缩放到各自尺寸即可。
function makeDotSprite(color: string): HTMLCanvasElement {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, color);
  g.addColorStop(0.45, color);
  g.addColorStop(1, "transparent");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  return c;
}

// 生成/回收一个粒子。initial=true 时铺满整屏(进场即满天雨), 否则从入场边界外重新投放。
function spawn(p: Particle, def: EmitterDef, initial: boolean): void {
  const W = STAGE.width, H = STAGE.height;
  p.size = rand(def.size);
  p.alpha = rand(def.opacity);
  p.phase = Math.random() * Math.PI * 2;
  const speed = rand(def.speed);
  switch (def.kind) {
    case "rain": {
      const a = def.angle ?? 0;
      p.vx = Math.sin(a) * speed;
      p.vy = Math.cos(a) * speed;
      // 横向多铺一屏: 倾斜下落会把粒子整体推向一侧, 不留余量则迎风侧会空出一条
      p.x = -W * 0.2 + Math.random() * W * 1.4;
      p.y = initial ? Math.random() * H : -p.size - Math.random() * H * 0.3;
      break;
    }
    case "dust": {
      p.vx = 0;
      p.vy = -speed; // 光尘向上飘
      p.x = Math.random() * W;
      p.y = initial ? Math.random() * H : H + p.size;
      break;
    }
    case "mist": {
      p.vx = speed;
      p.vy = 0;
      p.x = initial ? Math.random() * W : -p.size;
      p.y = H * 0.45 + Math.random() * H * 0.55; // 雾贴着地面, 不糊到天上
      break;
    }
  }
}

export function AmbienceLayer({ mapId, paused }: { mapId: string | null; paused: boolean }) {
  // 系统「减少动态效果」: 整层不挂载(连 rAF 都不起), 而不是挂载后再静止。
  // 检查放在外壳组件里, 内部组件的 hook 才不会变成条件调用。
  if (prefersReducedMotion()) return null;
  return <AmbienceCanvases mapId={mapId} paused={paused} />;
}

function AmbienceCanvases({ mapId, paused }: { mapId: string | null; paused: boolean }) {
  const def = ambience(mapId);
  const farRef = useRef<HTMLCanvasElement>(null);
  const nearRef = useRef<HTMLCanvasElement>(null);
  const groupsRef = useRef<Group[]>([]);
  // 顿帧(hitstop)期间跳过位置更新但照常重绘 —— 走 ref 而非依赖, 免得每次开关都重建循环。
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // 每层的失焦半径取该层各发射器的最大值, 作为整张画布的 CSS filter 下发。
  // 逐粒子设 ctx.filter 会让每次绘制都重建滤镜链, 而"近景整体失焦"本就是层级属性。
  const blur = useMemo(() => layerBlur(def), [def]);

  // 粒子池: 换地图才重建。数组长度恒定, 出界即就地复用同一个对象(无 GC 压力)。
  useEffect(() => {
    groupsRef.current = def.emitters.map((e) => ({
      def: e,
      sprite: e.kind === "rain" ? null : makeDotSprite(e.color),
      items: Array.from({ length: e.count }, () => {
        const p: Particle = { x: 0, y: 0, vx: 0, vy: 0, size: 0, alpha: 0, phase: 0 };
        spawn(p, e, true);
        return p;
      }),
    }));
  }, [def]);

  useEffect(() => {
    const far = farRef.current, near = nearRef.current;
    if (!far || !near) return;
    const res = Math.min(window.devicePixelRatio || 1, MAX_RES);
    const ctxOf = (c: HTMLCanvasElement) => {
      c.width = Math.round(STAGE.width * res);
      c.height = Math.round(STAGE.height * res);
      const ctx = c.getContext("2d");
      ctx?.setTransform(res, 0, 0, res, 0, 0); // 之后一律用设计 px 作图
      return ctx;
    };
    const farCtx = ctxOf(far), nearCtx = ctxOf(near);
    if (!farCtx || !nearCtx) return;

    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); // 封顶 50ms: 切回标签页时不让粒子瞬移
      last = now;
      if (!pausedRef.current) update(groupsRef.current, dt);
      draw(farCtx, nearCtx, groupsRef.current);
    };

    const start = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    // 后台标签页不烧 CPU(浏览器虽会降频 rAF, 但显式停更省电且避免恢复时的时间跳变)
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    start();
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, []);

  const style = { width: `${STAGE.width}px`, height: `${STAGE.height}px` };
  return (
    <>
      {def.flicker && (
        <div
          className="battle-flicker"
          style={
            {
              "--flicker-color": def.flicker.color,
              animationDuration: `${def.flicker.period}ms`,
            } as React.CSSProperties
          }
        />
      )}
      <canvas
        className="battle-ambience far"
        ref={farRef}
        style={{ ...style, filter: blur.far ? `blur(${blur.far}px)` : undefined }}
      />
      <canvas
        className="battle-ambience near"
        ref={nearRef}
        style={{ ...style, filter: blur.near ? `blur(${blur.near}px)` : undefined }}
      />
    </>
  );
}

function layerBlur(def: AmbienceDef): { far: number; near: number } {
  const max = (layer: "far" | "near") =>
    def.emitters.reduce((m, e) => (e.layer === layer ? Math.max(m, e.blur ?? 0) : m), 0);
  return { far: max("far"), near: max("near") };
}

// 推进一帧。出界的粒子就地重投(spawn 复用同一个对象), 故池子长度恒定。
function update(groups: Group[], dt: number): void {
  const W = STAGE.width, H = STAGE.height;
  for (const g of groups) {
    for (const p of g.items) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (g.def.drift) p.phase += dt;
      switch (g.def.kind) {
        case "rain":
          if (p.y - p.size > H) spawn(p, g.def, false);
          break;
        case "dust":
          if (p.y + p.size < 0) spawn(p, g.def, false);
          break;
        case "mist":
          if (p.x - p.size > W) spawn(p, g.def, false);
          break;
      }
    }
  }
}

function draw(farCtx: CanvasRenderingContext2D, nearCtx: CanvasRenderingContext2D, groups: Group[]): void {
  farCtx.clearRect(0, 0, STAGE.width, STAGE.height);
  nearCtx.clearRect(0, 0, STAGE.width, STAGE.height);
  for (const g of groups) {
    const ctx = g.def.layer === "near" ? nearCtx : farCtx;
    const d = g.def;
    if (d.kind === "rain") {
      // 雨丝: 沿速度方向往回拉一条线段 —— 线长即"曝光时间", 故 size 就是视觉上的速度感
      ctx.strokeStyle = d.color;
      ctx.lineWidth = d.layer === "near" ? 2 : 1;
      ctx.lineCap = "round";
      for (const p of g.items) {
        const inv = 1 / Math.max(1, Math.hypot(p.vx, p.vy));
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * inv * p.size, p.y - p.vy * inv * p.size);
        ctx.stroke();
      }
    } else if (g.sprite) {
      // 光尘/雾团: 预渲染软点缩放贴上。dust 横向摆、mist 纵向起伏 —— 都是垂直于行进方向,
      // 直线运动加一条正弦偏移就足够像"被气流带着"。
      const sway = d.drift ?? 0;
      for (const p of g.items) {
        const off = sway ? Math.sin(p.phase) * sway : 0;
        const x = d.kind === "mist" ? p.x : p.x + off;
        const y = d.kind === "mist" ? p.y + off : p.y;
        ctx.globalAlpha = p.alpha;
        ctx.drawImage(g.sprite, x - p.size, y - p.size, p.size * 2, p.size * 2);
      }
    }
  }
  farCtx.globalAlpha = 1;
  nearCtx.globalAlpha = 1;
}

// 屏幕空间调色层: 暗角 / 色偏 / 扫描线。
// ⚠ 必须渲染在 .battle-scene **之外** —— 这是「镜头」而非「场景」, 跟着相机一起放大的话
// 暗角就会被推出画面而失效。参数同样来自 ui/ambience.ts 的地图登记。
export function AmbienceGrade({ mapId }: { mapId: string | null }) {
  const grade = ambience(mapId).grade;
  if (!grade) return null;
  return (
    <div
      className="battle-grade"
      style={
        {
          "--grade-vignette": grade.vignette,
          "--grade-tint": grade.tint ?? "transparent",
          "--grade-scanline": grade.scanline ?? 0,
        } as React.CSSProperties
      }
    />
  );
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
