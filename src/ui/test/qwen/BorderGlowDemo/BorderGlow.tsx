import { useRef, useCallback, useEffect, type ReactNode, type CSSProperties } from "react";
import {
  animateValue,
  buildGlowVars,
  buildGradientVars,
  easeInCubic,
  easeOutCubic,
  isLightColor,
} from "./borderGlowUtils";
import s from "./BorderGlow.module.css";

export interface BorderGlowProps {
  children?: ReactNode;
  className?: string;
  /** 外部内联样式：与组件自己写的 CSS 变量合并（如放进 grid 时指定 grid-area） */
  style?: CSSProperties;
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
  colors?: string[];
  fillOpacity?: number;
}

export function BorderGlow({
  children,
  className = "",
  style,
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
  colors = ["#c084fc", "#f472b6", "#38bdf8"],
  fillOpacity = 0.5,
}: BorderGlowProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const getCenterOfElement = useCallback((el: HTMLElement) => {
    const { width, height } = el.getBoundingClientRect();
    return [width / 2, height / 2];
  }, []);

  const getEdgeProximity = useCallback(
    (el: HTMLElement, x: number, y: number) => {
      const [cx, cy] = getCenterOfElement(el);
      const dx = x - cx;
      const dy = y - cy;
      let kx = Infinity;
      let ky = Infinity;
      if (dx !== 0) kx = cx / Math.abs(dx);
      if (dy !== 0) ky = cy / Math.abs(dy);
      return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
    },
    [getCenterOfElement],
  );

  const getCursorAngle = useCallback(
    (el: HTMLElement, x: number, y: number) => {
      const [cx, cy] = getCenterOfElement(el);
      const dx = x - cx;
      const dy = y - cy;
      if (dx === 0 && dy === 0) return 0;
      const radians = Math.atan2(dy, dx);
      let degrees = radians * (180 / Math.PI) + 90;
      if (degrees < 0) degrees += 360;
      return degrees;
    },
    [getCenterOfElement],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const edge = getEdgeProximity(card, x, y);
      const angle = getCursorAngle(card, x, y);

      card.style.setProperty("--edge-proximity", `${(edge * 100).toFixed(3)}`);
      card.style.setProperty("--cursor-angle", `${angle.toFixed(3)}deg`);
    },
    [getEdgeProximity, getCursorAngle],
  );

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
        onEnd: () => card.classList.remove(s.sweepActive),
      }),
    ];

    return () => {
      cancels.forEach((cancel) => cancel());
      card.classList.remove(s.sweepActive);
    };
  }, [animated]);

  const isLight = lightSurface ?? isLightColor(backgroundColor);
  const classNames = [s.borderGlowCard, glass ? s.glass : "", isLight ? s.light : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      className={classNames}
      style={
        {
          ...style,
          "--card-bg": backgroundColor,
          "--glass-blur": `${glassBlur}px`,
          "--edge-sensitivity": edgeSensitivity,
          "--border-radius": `${borderRadius}px`,
          "--glow-padding": `${glowRadius}px`,
          "--cone-spread": coneSpread,
          "--fill-opacity": fillOpacity,
          ...buildGlowVars(glowColor, glowIntensity),
          ...buildGradientVars(colors),
        } as React.CSSProperties
      }
    >
      <span className={s.edgeLight} />
      <div className={s.inner}>{children}</div>
    </div>
  );
}

export default BorderGlow;
