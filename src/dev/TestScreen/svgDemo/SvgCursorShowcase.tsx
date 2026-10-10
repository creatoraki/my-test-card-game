import { useMemo, useState, type CSSProperties } from "react";
import { CURSOR_SCHEMES, cursorCss } from "./cursors";
import { CursorSchemeCard } from "./CursorSchemeCard";
import { BrassStateGallery } from "./BrassStateGallery";
import s from "./SvgCursorShowcase.module.css";

/** 实际指针输出尺寸档位；浏览器对 32 以上的指针在窗口边缘可能不显示。 */
const SIZES = [32, 40, 48] as const;

/** SVG 演示：三套鼠标指针方案对比，可将任一方案应用到整页试用。 */
export function SvgCursorShowcase() {
  const [size, setSize] = useState<number>(SIZES[0]);
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const applied = CURSOR_SCHEMES.find((scheme) => scheme.id === appliedId);
  const rootStyle = useMemo(() => applied ? {
    "--page-cursor": cursorCss(applied.glyphs.default, "default", size),
    "--page-cursor-pointer": cursorCss(applied.glyphs.pointer, "pointer", size),
  } as CSSProperties : undefined, [applied, size]);
  return (
    <div className={`${s.root} ${applied ? s.rootApplied : ""}`} style={rootStyle}>
      <div className={s.inner}>
        <header className={s.header}>
          <div>
            <h1 className={s.title}>鼠标指针方案</h1>
            <p className={s.subtitle}>每套含默认、可交互、瞄准三态；放大图中红点为点击热点，下方色块可直接悬停试用。</p>
          </div>
          <div className={s.toolbar}>
            <span className={s.toolbarLabel}>指针尺寸</span>
            {SIZES.map((value) => (
              <button key={value} type="button" className={`${s.chip} ${size === value ? s.chipOn : ""}`} onClick={() => setSize(value)}>
                {value} 像素
              </button>
            ))}
            <button type="button" className={s.chip} disabled={!applied} onClick={() => setAppliedId(null)}>恢复全局指针</button>
          </div>
        </header>
        <BrassStateGallery />
        <div className={s.grid}>
          {CURSOR_SCHEMES.map((scheme) => (
            <CursorSchemeCard key={scheme.id} scheme={scheme} size={size} applied={scheme.id === appliedId}
              onApply={() => setAppliedId(scheme.id === appliedId ? null : scheme.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}
