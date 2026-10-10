import { useMemo } from "react";
import placeholderArt from "@/assets/占位素材.webp";
import { CURSOR_STATES, CURSOR_VIEWBOX, cursorCss, cursorDataUri, type CursorScheme } from "./cursors";
import s from "./SvgCursorShowcase.module.css";

/** 放大预览边长（像素）。 */
const PREVIEW = 96;

interface Props {
  scheme: CursorScheme;
  size: number;
  applied: boolean;
  onApply: () => void;
}

/** 单套指针方案：三态放大图（红点为热点）+ 三块不同底色的试用区。 */
export function CursorSchemeCard({ scheme, size, applied, onApply }: Props) {
  const states = useMemo(() => CURSOR_STATES.map((state) => {
    const glyph = scheme.glyphs[state.id];
    return { ...state, glyph, preview: cursorDataUri(glyph, PREVIEW), cursor: cursorCss(glyph, state.id, size) };
  }), [scheme, size]);
  const [base, pointer, aim] = states;
  return (
    <section className={`${s.card} ${applied ? s.cardApplied : ""}`} style={{ borderTopColor: scheme.accent }}>
      <header className={s.cardHeader}>
        <h2 className={s.cardTitle} style={{ color: scheme.accent }}>{scheme.name}</h2>
        <button type="button" className={`${s.applyButton} ${applied ? s.applyButtonOn : ""}`} onClick={onApply}>
          {applied ? "已应用到整页" : "应用到整页"}
        </button>
      </header>
      <p className={s.cardSummary}>{scheme.summary}</p>

      <div className={s.glyphRow}>
        {states.map((state) => (
          <figure key={state.id} className={s.glyphTile}>
            <div className={s.glyphFrame}>
              <img src={state.preview} width={PREVIEW} height={PREVIEW} alt={`${scheme.name}${state.label}指针`} draggable={false} />
              <i className={s.hotspot} style={{
                left: (state.glyph.hotspot[0] / CURSOR_VIEWBOX) * PREVIEW,
                top: (state.glyph.hotspot[1] / CURSOR_VIEWBOX) * PREVIEW,
              }} />
            </div>
            <figcaption className={s.glyphLabel}>{state.label}</figcaption>
          </figure>
        ))}
      </div>

      <div className={s.trial}>
        <div className={`${s.zone} ${s.zoneDark}`} style={{ cursor: base.cursor }}>
          <span>默认 · 暗底</span>
        </div>
        <div className={`${s.zone} ${s.zoneLight}`} style={{ cursor: base.cursor }}>
          <span>默认 · 亮底</span>
          <span className={s.fakeButton} style={{ cursor: pointer.cursor }}>可交互按钮</span>
        </div>
        <div className={`${s.zone} ${s.zoneEnemy}`} style={{ cursor: base.cursor }}>
          <span>瞄准 · 敌人</span>
          <img className={s.enemy} src={placeholderArt} alt="敌人占位" draggable={false} style={{ cursor: aim.cursor }} />
        </div>
      </div>
    </section>
  );
}
