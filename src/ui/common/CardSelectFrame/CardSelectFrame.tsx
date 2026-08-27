import { cx } from "@/ui/common/cx";
import s from "./CardSelectFrame.module.css";

interface Props {
  className?: string;
}

export function CardSelectFrame({ className }: Props) {
  return (
    <span className={cx(s.frame, className)} aria-hidden>
      <span className={cx(s.corner, s["is-tl"])} />
      <span className={cx(s.corner, s["is-tr"])} />
      <span className={cx(s.corner, s["is-bl"])} />
      <span className={cx(s.corner, s["is-br"])} />
    </span>
  );
}
