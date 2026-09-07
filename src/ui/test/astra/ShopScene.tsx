import s from "./ShopScene.module.css";

export interface ShopSceneProps {
  /** 点击返回按钮时触发，用于切回上一层场景。 */
  onBack: () => void;
}

export function ShopScene({ onBack }: ShopSceneProps) {
  return (
    <div className={s.root}>
      <button type="button" className={s.back} aria-label="返回空间站" onClick={onBack}>
        <span className={s.backArrow} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M15 4 7 12l8 8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className={s.backLabel}>返回</span>
      </button>
    </div>
  );
}
