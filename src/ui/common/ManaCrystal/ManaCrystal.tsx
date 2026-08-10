import { cx } from "@/ui/common/cx";
import s from "./ManaCrystal.module.css";

interface Props {
  /** 调用方的取景/尺寸类。基础外观由组件自己挂，这里只叠加。 */
  className?: string;
  /** empty 已耗/未获得 · normal 常态 · active 高亮。默认 normal。 */
  state?: "empty" | "normal" | "active";
  /** 关掉 normal 态的循环呼吸，只留静态辉光。卡面费用球用。 */
  still?: boolean;
}

export function ManaCrystal({ className, state = "normal", still }: Props) {
  return (
    <span className={cx(s.crystal, s[`is-${state}`], still && s["is-still"], className)} aria-hidden="true">
      <span className={s.shape} />
    </span>
  );
}