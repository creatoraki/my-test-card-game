// 外框角部装饰: 左上琥珀亮段、右下切角辉光、左右缘细导轨。全部 aria-hidden, 不接收指针。
// 折角描边本体由 explorePanel 的 panel-box::after 画, 这里只叠加亮段。
import s from "./DossierFrameDecor.module.css";

export function DossierFrameDecor() {
  return (
    <div className={s.decor} aria-hidden="true">
      <i className={s.topLeftH} />
      <i className={s.topLeftV} />
      <i className={s.topLeftCut} />
      <i className={s.bottomRightH} />
      <i className={s.bottomRightV} />
      <i className={s.bottomRightCut} />
      <i className={s.leftRail} />
    </div>
  );
}
