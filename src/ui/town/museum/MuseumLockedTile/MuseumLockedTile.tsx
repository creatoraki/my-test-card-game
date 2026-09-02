import { cx } from "@/ui/common/cx";
import s from "./MuseumLockedTile.module.css";

export function MuseumLockedTile({ className }: { className?: string }) {
  return (
    <div className={cx(s["locked-tile"], className)} role="img" aria-label="未收录">
      <span className={s["locked-mark"]}>?</span>
    </div>
  );
}
