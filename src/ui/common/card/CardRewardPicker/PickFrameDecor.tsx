// 三选一外框的纯装饰层: 斜切角高光、上下亮边、外侧角标、竖向扫描线与底纹。
// 全部 aria-hidden + pointer-events:none, 不参与布局与命中; 外框本体(描边 + 底色)在 CardRewardPicker.module.css。
import s from "./PickFrameDecor.module.css";

export function PickFrameDecor() {
  return (
    <span className={s.decor} aria-hidden>
      <span className={s.grid} />
      <span className={s.scan} />
      <span className={s.chamferTl} />
      <span className={s.chamferBr} />
      <span className={s.edgeTop} />
      <span className={s.edgeBottom} />
      <span className={s.tickTr} />
      <span className={s.tickBl} />
      <span className={s.rail} />
    </span>
  );
}
