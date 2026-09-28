import type { LootNotice } from "../../types";
import s from "./LootToast.module.css";

/** 「获得：××」飘字: 在物体上方弹出、上浮、淡出, 动画结束后由父组件移除。 */
export function LootToast({ items, onDone }: { items: LootNotice[]; onDone(key: number): void }) {
  return <div className={s.layer} aria-live="polite">
    {items.map((item) => <div
      key={item.key}
      className={s.toast}
      style={{ left: item.x, top: item.y }}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) onDone(item.key);
      }}
    >
      <span className={s.spark} aria-hidden />
      <span className={s.text}>{item.text}</span>
    </div>)}
  </div>;
}
