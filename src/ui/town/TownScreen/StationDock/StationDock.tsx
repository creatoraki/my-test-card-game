// 右下角的常驻操作坞: 编队 + 出击。
//
// ★ 这两件事**不是设施**: 点下去不播进设施演出, 而是直接切到顶层全屏页
//   (runStore.openFormation / openSortie), 所以它们不在建筑表里, 而是浮在全景上的一组按钮。
// ★ 出击是这一页唯一的主行动, 视觉权重刻意压过其它一切; 编队是它的副手, 同款切角、低一档亮度。

import s from "./StationDock.module.css";

function FormationIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4 20 10h-8Z" />
      <path d="M8 15 12 21H4Z" opacity=".8" />
      <path d="M24 15 28 21h-8Z" opacity=".8" />
      <path d="M16 12v6M10 21h12" opacity=".45" />
      <path d="M16 24v4" opacity=".45" />
    </svg>
  );
}

export interface StationDockProps {
  onFormation: () => void;
  onSortie: () => void;
  formationPending?: boolean;
}

export function StationDock({ onFormation, onSortie, formationPending = false }: StationDockProps) {
  return (
    <div className={s.dock}>
      <div className={s.row}>
        <button
          type="button"
          className={s.formation}
          aria-label={formationPending ? "编队，有未处理的编排" : undefined}
          onClick={onFormation}
        >
          <span className={s.formationSurface} aria-hidden="true" />
          {formationPending && <span className={s.formationDot} aria-hidden="true" />}
          <span className={s.formationIcon} aria-hidden="true">
            <FormationIcon />
          </span>
          <span className={s.formationCopy}>
            <span className={s.formationTitle}>编队</span>
            <span className={s.formationSubtitle} aria-hidden="true">SQUAD MANAGEMENT</span>
          </span>
          <span className={s.formationArrow} aria-hidden="true">›</span>
        </button>

        <button type="button" className={s.sortie} aria-label="出击，前往选择远征目标" onClick={onSortie}>
          <span className={s.sortieSurface} aria-hidden="true" />
          <span className={s.reactor} aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none">
              <circle className={s.reactorOrbit} cx="32" cy="32" r="27" />
              <circle cx="32" cy="32" r="21" stroke="currentColor" strokeOpacity=".3" />
              <path d="m34 12-15 23h12l-2 17 16-25H33z" fill="currentColor" />
            </svg>
          </span>
          <span className={s.sortieTitle}>出击</span>
          <span className={s.arrows} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </button>
      </div>
    </div>
  );
}
