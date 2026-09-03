import { useRef, useCallback, useEffect, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import {
  animateValue,
  buildGlowVars,
  buildGradientVars,
  easeInCubic,
  easeOutCubic,
  isLightColor,
  pointerGeometry,
} from "./borderGlowUtils";
import s from "./BorderGlow.module.css";
import { useGlowScale } from "./useGlowScale";

export interface BorderGlowProps {
  children?: ReactNode;
  className?: string;
  /** 外部内联样式：与组件自己写的 CSS 变量合并（如放进 grid 时指定 grid-area） */
  style?: CSSProperties;
  /** 根节点标签：默认 div；传 button 时内部固定 type="button" */
  as?: "div" | "button";
  onClick?: () => void;
  ariaLabel?: string;
  /** 边缘灵敏度：越大越贴近边缘才发光 */
  edgeSensitivity?: number;
  /** 发光色，"色相 饱和度 亮度" 数值串 */
  glowColor?: string;
  /** 卡面底色；毛玻璃模式下应传半透明色 */
  backgroundColor?: string;
  /** 毛玻璃卡面：对背后画面做模糊与提饱和 */
  glass?: boolean;
  /** 毛玻璃模糊半径（px） */
  glassBlur?: number;
  /** 强制指定卡面明暗；不传则按 backgroundColor 自动判断 */
  lightSurface?: boolean;
  borderRadius?: number;
  glowRadius?: number;
  glowIntensity?: number;
  coneSpread?: number;
  /** 挂载时自动播放一圈扫光 */
  animated?: boolean;
  /** 绘制长度的缩放语义：design 跟随画布缩放，screen 在屏幕上保持像素恒定 */
  scaleMode?: "design" | "screen";
  /** 内容层铺满宿主并裁切，继承宿主圆角 */
  fill?: boolean;
  /** 强制点亮，等同 hover 态 */
  active?: boolean;
  /** 常亮边缘光效；悬浮时仍切换为跟随指针的光锥 */
  persistent?: boolean;
  /** 悬浮时边缘光是否跟随指针；关掉后 persistent 的整圈常亮在悬浮期间也不会塌成光锥 */
  followPointer?: boolean;
  colors?: string[];
  fillOpacity?: number;
}

export function BorderGlow({
  children,
  className = "",
  style,
  as = "div",
  onClick,
  ariaLabel,
  edgeSensitivity = 30,
  glowColor = "40 80 80",
  backgroundColor = "#120F17",
  glass = false,
  glassBlur = 18,
  lightSurface,
  borderRadius = 28,
  glowRadius = 40,
  glowIntensity = 1.0,
  coneSpread = 25,
  animated = false,
  scaleMode = "design",
  fill = false,
  active = false,
  persistent = false,
  followPointer = true,
  colors = ["#c084fc", "#f472b6", "#38bdf8"],
  fillOpacity = 0.5,
}: BorderGlowProps) {
  const cardRef = useRef<HTMLElement>(null);
  const remeasure = useGlowScale(cardRef, scaleMode === "screen");

  // 扫光 effect 的依赖只收敛到 [animated]，active/persistent 用 ref 读最新值，
  // 避免点击/常亮态翻转触发 effect 重跑、在演出中途重播入场扫光。
  const activeRef = useRef(active);
  activeRef.current = active;
  const persistentRef = useRef(persistent);
  persistentRef.current = persistent;
  // 入场扫光是否仍在播放 + 它的取消句柄：指针一动就终止扫光、交还控制权，
  // 否则动画的 rAF 会逐帧覆盖 --cursor-angle/--edge-proximity，光锥被动画拽着走。
  const sweepRunningRef = useRef(false);
  const sweepCancelRef = useRef<(() => void) | null>(null);

  const handlePointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!followPointer) return;
      const card = cardRef.current;
      if (!card) return;

      // 入场扫光未播完时指针已介入：终止扫光，让光锥立即跟随指针。
      if (sweepRunningRef.current) {
        sweepRunningRef.current = false;
        sweepCancelRef.current?.();
        sweepCancelRef.current = null;
        card.classList.remove(s.sweepActive);
      }

      const { edge, angle } = pointerGeometry(card, e.clientX, e.clientY);

      card.style.setProperty("--edge-proximity", `${(edge * 100).toFixed(3)}`);
      card.style.setProperty("--cursor-angle", `${angle.toFixed(3)}deg`);
    },
    [followPointer],
  );

  const handlePointerLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    if (persistentRef.current) card.style.setProperty("--edge-proximity", "100");
    else card.style.removeProperty("--edge-proximity");
  }, []);

  useEffect(() => {
    if (!animated || !cardRef.current) return;
    const card = cardRef.current;
    const angleStart = 110;
    const angleEnd = 465;
    const setAngle = (v: number) => {
      card.style.setProperty("--cursor-angle", `${(angleEnd - angleStart) * (v / 100) + angleStart}deg`);
    };

    card.classList.add(s.sweepActive);
    card.style.setProperty("--cursor-angle", `${angleStart}deg`);
    sweepRunningRef.current = true;

    const cancels = [
      animateValue({ duration: 500, onUpdate: (v) => card.style.setProperty("--edge-proximity", `${v}`) }),
      animateValue({ ease: easeInCubic, duration: 1500, end: 50, onUpdate: setAngle }),
      animateValue({ ease: easeOutCubic, delay: 1500, duration: 2250, start: 50, end: 100, onUpdate: setAngle }),
      animateValue({
        ease: easeInCubic,
        delay: 2500,
        duration: 1500,
        start: 100,
        end: 0,
        onUpdate: (v) => card.style.setProperty("--edge-proximity", `${v}`),
        onEnd: () => {
          card.style.setProperty("--edge-proximity", persistentRef.current ? "100" : "0");
          card.classList.remove(s.sweepActive);
          sweepRunningRef.current = false;
          sweepCancelRef.current = null;
        },
      }),
    ];
    sweepCancelRef.current = () => cancels.forEach((cancel) => cancel());

    return () => {
      cancels.forEach((cancel) => cancel());
      sweepRunningRef.current = false;
      sweepCancelRef.current = null;
      if (!activeRef.current) card.classList.remove(s.sweepActive);
    };
  }, [animated]);

  const isLight = lightSurface ?? isLightColor(backgroundColor);
  const classNames = [
    s.borderGlowCard,
    glass ? s.glass : "",
    isLight ? s.light : "",
    scaleMode === "screen" ? s.pixelFixed : "",
    fill ? s.fill : "",
    active ? s.sweepActive : "",
    persistent ? s.persistent : "",
    !followPointer ? s.lockGlow : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const rootStyle = {
    ...style,
    "--card-bg": backgroundColor,
    "--glass-blur": `${glassBlur}px`,
    "--edge-proximity": active || persistent ? "100" : undefined,
    "--edge-sensitivity": edgeSensitivity,
    "--border-radius": `${borderRadius}px`,
    "--glow-padding": `${glowRadius}px`,
    "--cone-spread": coneSpread,
    "--fill-opacity": fillOpacity,
    ...buildGlowVars(glowColor, glowIntensity),
    ...buildGradientVars(colors),
  } as CSSProperties;

  const content = (
    <>
      <span className={s.edgeLight} data-glow-layer="edge" />
      <span className={s.inner} data-glow-layer="inner">{children}</span>
    </>
  );

  if (as === "button") {
    return (
      <button
        ref={cardRef as React.RefObject<HTMLButtonElement>}
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
        onPointerEnter={remeasure}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className={classNames}
        style={rootStyle}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      ref={cardRef as React.RefObject<HTMLDivElement>}
      aria-label={ariaLabel}
      onClick={onClick}
      onPointerEnter={remeasure}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={classNames}
      style={rootStyle}
    >
      {content}
    </div>
  );
}

export default BorderGlow;
