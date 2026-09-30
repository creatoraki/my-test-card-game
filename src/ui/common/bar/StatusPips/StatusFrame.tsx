import s from "./StatusFrame.module.css";

/** 状态图标的四角 L 型渐变边框, 铺满父元素(父元素需为定位容器)。 */
export function StatusFrame() {
  return (
    <span className={s.frame} aria-hidden>
      <span className={s.corners} />
    </span>
  );
}
