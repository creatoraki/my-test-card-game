import { forwardRef, memo, type CSSProperties, type HTMLAttributes } from "react";
import s from "./SciFiPanel.module.css";

export interface SciFiPanelColors {
  /** 金属底板 */
  armor: string;
  /** 外框及内沿 */
  trim: string;
  /** 青色灯带、角部金属亮面 */
  energy: string;
  /** 四角紫色嵌件 */
  accent: string;
  /** 边框高光 */
  highlight: string;
  /** 内容区网格和电路 */
  circuit: string;
}

export interface SciFiPanelProps extends HTMLAttributes<HTMLDivElement> {
  colors?: Partial<SciFiPanelColors>;
  /** CSS 尺寸；数字为设计 px。高度省略时由内容撑开。 */
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  /** CSS background，支持纯色、透明、渐变和 url()。 */
  background?: CSSProperties["background"];
  /** 安全边距之外的内容留白。 */
  padding?: CSSProperties["padding"];
  /** auto 用于固定高度内滚动；visible 允许内容浮层溢出。 */
  overflow?: CSSProperties["overflow"];
  texture?: boolean;
  contentClassName?: string;
  contentStyle?: CSSProperties;
}

const colorVars: Record<keyof SciFiPanelColors, string> = {
  armor: "--sfp-armor", trim: "--sfp-trim", energy: "--sfp-energy",
  accent: "--sfp-accent", highlight: "--sfp-highlight", circuit: "--sfp-circuit",
};

/** 固定角块 + 弹性边条；全部使用本地 CSS 布局尺寸，不读取屏幕坐标。 */
export const SciFiPanel = forwardRef<HTMLDivElement, SciFiPanelProps>(function SciFiPanel({
  colors, width, height, background, padding, overflow = "auto", texture = true,
  className, style, contentClassName, contentStyle, children, ...rest
}, ref) {
  const variables: Record<string, string> = {};
  for (const key of Object.keys(colorVars) as (keyof SciFiPanelColors)[]) {
    if (colors?.[key] !== undefined) variables[colorVars[key]] = colors[key];
  }
  return (
    <div {...rest} ref={ref} className={[s.root, className].filter(Boolean).join(" ")}
      style={{ ...variables, width, height, ...style } as CSSProperties}>
      <div className={s.surface} style={{ background }} aria-hidden="true">
        {texture && <><div className={s.grid} /><Circuit className={s.circuitStart} /><Circuit className={s.circuitEnd} /></>}
      </div>
      <Frame />
      <div className={[s.content, contentClassName].filter(Boolean).join(" ")}
        style={{ padding, overflow, ...contentStyle }}>
        {children}
      </div>
    </div>
  );
});

// 静态装饰不随 children 更新重复生成；配色通过 CSS 变量继承。
const Frame = memo(function Frame() {
  return (
    <div className={s.frame} aria-hidden="true">
      <Rail className={s.top} /><Rail className={s.bottom} />
      <Side className={s.left} /><Side className={s.right} />
      <Corner className={s.topLeft} /><Corner className={s.topRight} />
      <Corner className={s.bottomLeft} /><Corner className={s.bottomRight} />
      <Badge className={s.topBadge} /><Badge className={s.bottomBadge} />
    </div>
  );
});

function Corner({ className }: { className: string }) {
  return (
    <svg className={className} width="120" height="90" viewBox="0 0 120 90" fill="none" focusable="false">
      <path d="M4 90V38L34 8H120V30H48L26 52V90Z" fill="var(--sfp-armor)" />
      <path d="M4 90V38L34 8H120" stroke="var(--sfp-energy)" strokeWidth="9" opacity=".13" />
      <path d="M6 90V38L36 10H120M22 90V46L46 24H120" stroke="var(--sfp-trim)" strokeWidth="3" />
      <path d="M5 90V40L37 9H120" stroke="var(--sfp-energy)" strokeWidth="1.5" />
      <path d="M11 90V40L39 15H120M30 43L48 28H120" stroke="var(--sfp-highlight)" opacity=".3" />
      <path d="M24 50L51 23H65L59 36L25 69Z" fill="var(--sfp-energy)" />
      <path d="M25 50L51 24H62" stroke="var(--sfp-highlight)" strokeWidth="2" opacity=".7" />
      <path d="M8 33L31 11L40 9L9 41Z" fill="var(--sfp-accent)" />
      <path d="M8 33L31 11" stroke="var(--sfp-highlight)" strokeWidth="2" opacity=".65" />
      <path d="M68 28H76L67 37H59ZM79 28H87L78 37H70ZM90 28H98L89 37H81ZM101 28H109L100 37H92Z" fill="var(--sfp-accent)" />
      <path d="M74 10L86 22H120M44 17H70M32 56V90" stroke="var(--sfp-trim)" opacity=".7" />
    </svg>
  );
}

function Rail({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 100 42" preserveAspectRatio="none" fill="none" focusable="false">
      <path d="M0 8H100V30H0Z" fill="var(--sfp-armor)" />
      <path d="M0 9H100" stroke="var(--sfp-energy)" strokeWidth="7" opacity=".12" />
      <path d="M0 10H100M0 24H100" stroke="var(--sfp-trim)" strokeWidth="3" />
      <path d="M0 9H100" stroke="var(--sfp-energy)" strokeWidth="1.5" />
      <path d="M0 15H100" stroke="var(--sfp-highlight)" opacity=".3" />
      <path d="M0 28H100" stroke="var(--sfp-trim)" opacity=".3" />
    </svg>
  );
}

function Side({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 36 600" preserveAspectRatio="none" fill="none" focusable="false">
      <path d="M4 0H26V170L33 182V418L26 430V600H4Z" fill="var(--sfp-armor)" />
      <path d="M5 0V600" stroke="var(--sfp-energy)" strokeWidth="8" opacity=".12" />
      <path d="M6 0V600M22 0V170L31 182V418L22 430V600" stroke="var(--sfp-trim)" strokeWidth="2" />
      <path d="M5 0V600M10 220V380" stroke="var(--sfp-energy)" strokeWidth="2" />
      <path d="M10 220L15 230V370L10 380Z" fill="var(--sfp-energy)" />
      <path d="M10 227V373" stroke="var(--sfp-highlight)" opacity=".8" />
      <path d="M30 0V140M30 460V600" stroke="var(--sfp-trim)" strokeDasharray="5 7" opacity=".4" />
    </svg>
  );
}

function Badge({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 320 32" preserveAspectRatio="none" fill="none" focusable="false">
      <path d="M2 10L18 5H302L318 10L304 28H20Z" fill="var(--sfp-armor)" stroke="var(--sfp-trim)" strokeWidth="2" />
      <path d="M4 10H316" stroke="var(--sfp-energy)" strokeWidth="7" opacity=".14" />
      <path d="M4 10H316" stroke="var(--sfp-energy)" strokeWidth="2" />
      <path d="M20 25H304" stroke="var(--sfp-highlight)" opacity=".3" />
      <path d="M128 18H132M141 18H146M156 18H168M178 18H182M192 18H196" stroke="var(--sfp-energy)" strokeWidth="2" opacity=".6" />
    </svg>
  );
}

const Circuit = memo(function Circuit({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 260 260" fill="none" focusable="false">
      <path d="M0 115A115 115 0 0 0 115 0M0 160A160 160 0 0 0 160 0M0 180A180 180 0 0 0 180 0M0 208A208 208 0 0 0 208 0" stroke="currentColor" />
      <path d="M0 151A151 151 0 0 0 151 0" stroke="currentColor" strokeWidth="4" strokeDasharray="9 6" />
      <path d="M8 236L28 216H72L216 72V28L236 8M14 248L43 219M219 43L248 14" stroke="currentColor" />
    </svg>
  );
});
