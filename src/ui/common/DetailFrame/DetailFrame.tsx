import { cx } from "@/ui/common/cx";
import s from "./DetailFrame.module.css";

/** 纯装饰边框。宿主需 position: relative；不裁切宿主，保留外侧辉光。 */
export function DetailFrame({
  subtle = false,
  tone = "blue",
}: {
  subtle?: boolean;
  tone?: "blue" | "gold";
}) {
  return (
    <span className={cx(s.frame, subtle && s.subtle, tone === "gold" && s.gold)} aria-hidden="true">
      <span className={s.outer} />
      <span className={s.inner} />
      <span className={s.corners} />
    </span>
  );
}
