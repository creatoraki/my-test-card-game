import { useEffect, type CSSProperties, type ReactNode, type Ref } from "react";
import { playSfx } from "@/ui/audio";
import { EventPanelFrame } from "@/ui/common/EventPanel";
import { cx } from "@/ui/common/cx";
import { CLOSE_MS, OPEN_MS, SLIDE_MS, box, type Rect } from "@/ui/common/panelMorph";
import s from "./PanelShell.module.css";

const cn = (...values: Array<string | false | null | undefined>) =>
  cx(...values.map((value) => (typeof value === "string" ? s[value] : value)));

/** 关闭动画时长 —— 调用方要等这么久再卸载弹窗, 否则退场动画会被直接剪掉。 */
export const PANEL_OUT_MS = 600;
export const PANEL_OUT_REDUCED_MS = 180;
export const PANEL_SIZE = { w: 1600, h: 920 };

interface Props {
  /** 传给 EventPanelFrame 的主色。与 themeStyle 里的 --asm-frame 保持一致。 */
  accent: string;
  title: string;
  status?: ReactNode;
  closeLabel: string;
  closing?: boolean;
  onClose: () => void;
  /** 换配色用: 覆盖 --asm-frame / --asm-glow / --asm-select 等变量。缺省沿用装配舱的青蓝。 */
  themeStyle?: CSSProperties;
  /** 面板尺寸(设计 px)。缺省 1600×920, 与装配舱两个弹窗一致。 */
  size?: { w: number; h: number };
  /** 遮罩层的附加类名 —— 各场景据此压自己的 z-index / 定位(公共组件铁律 3)。 */
  className?: string;
  morph?: {
    ref: Ref<HTMLElement>;
    rect: Rect;
    ready: boolean;
    seed?: ReactNode;
    seedLabel?: string;
  };
  children: ReactNode;
}

/**
 * 通用功能弹窗外壳: 遮罩、切角面板、边框装饰层与页眉收口。
 *
 * ★ 原名 AssemblyPanelShell, 住在 town/assembly 下。探索场景的角色档案 Modal 也要这套
 *   视觉语言, 故整体提升到 common/。样式一行未改 —— 只把 --asm-* 变量补上默认值,
 *   装配舱内仍吃场景根上的变量(视觉逐像素不变), 其他场景吃默认值。
 */
export function PanelShell({
  accent,
  title,
  status,
  closeLabel,
  closing = false,
  onClose,
  themeStyle,
  size = PANEL_SIZE,
  className,
  morph,
  children,
}: Props) {
  useEffect(() => {
    playSfx("panel");
  }, []);

  const morphPhase = morph ? (closing ? "closing" : morph.ready ? "open" : "opening") : null;
  const panelStyle = morph ? box(morph.rect) : { width: `${size.w}px`, height: `${size.h}px` };

  return (
    <div
      className={cx(cn("asm-modal", morph && "is-morph", closing && !morph && "is-closing"), className)}
      data-morph={morphPhase ?? undefined}
      onClick={onClose}
      style={
        {
          "--panel-w": `${size.w}px`,
          "--panel-h": `${size.h}px`,
          ...(morph
            ? {
                "--veil-in-ms": `${SLIDE_MS}ms`,
                "--veil-out-ms": `${CLOSE_MS}ms`,
                "--land-delay": `${OPEN_MS}ms`,
                "--seed-delay": `${SLIDE_MS}ms`,
              }
            : {}),
          ...themeStyle,
        } as CSSProperties
      }
    >
      <section
        className={cn("asm-panel", morph && "is-morphing")}
        data-closing={closing}
        onClick={(event) => event.stopPropagation()}
        ref={morph?.ref}
        style={panelStyle as CSSProperties}
      >
        {/* 边框装饰层。独立成层而不是复用 .asm-panel 的伪元素 ——
            ::before 已被左上角光点占用, ::after 则是被明确删掉的氛围灯(见样式里的注释), 都不该动。 */}
        <span className={cn("asm-deco")} aria-hidden>
          <i className={cn("asm-deco-notch", "is-tl")} />
          <i className={cn("asm-deco-notch", "is-br")} />
          <i className={cn("asm-deco-ticks", "is-top")} />
          <i className={cn("asm-deco-ticks", "is-bottom")} />
          <i className={cn("asm-deco-scan", "is-top")} />
          <i className={cn("asm-deco-scan", "is-bottom")} />
        </span>
        {morph && !morph.ready ? (
          <div className={cn("asm-seed")} aria-hidden="true">
            {morph.seed}
            <strong>{morph.seedLabel ?? title}</strong>
          </div>
        ) : (
          <EventPanelFrame
            accent={accent}
            title={title}
            status={status && <span className={cn("asm-panel-status")}>{status}</span>}
            headerExtra={
              <button
                className={cn("asm-close-button")}
                type="button"
                data-sfx="back"
                onClick={onClose}
                aria-label={closeLabel}
              >
                <CloseIcon />
              </button>
            }
            className={cn("asm-event-frame", morph && morph.ready && "is-landed")}
          >
            {children}
          </EventPanelFrame>
        )}
        {morph && <i className={cn("asm-land")} aria-hidden="true" />}
      </section>
    </div>
  );
}

// 关闭叉。与 town/assembly/AssemblyScene/icons.tsx 里那枚同形 —— 公共组件不反向依赖功能域,
// 故在这里自带一份(只有 6 行路径, 不值得为它再开一个公共图标件)。
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" aria-hidden="true">
      <path d="m7 7 10 10M17 7 7 17" />
      <path d="M4 4h4M4 4v4M20 20h-4M20 20v-4" opacity=".5" />
    </svg>
  );
}
