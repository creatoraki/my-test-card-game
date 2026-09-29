import { cx } from "@/ui/common/shared/cx";
import { CardBackArt } from "./CardBackArt";
import s from "./CardBack.module.css";

interface Props {
  className?: string;
}

// 卡背: 外层只负责厚度与投影(filter 必须在 clip-path 之外, 否则会被斜切角一起裁掉),
// 内层 .plate 是带斜切角的蚀刻黑钢板, 矢量细节见 CardBackArt。
export function CardBack({ className }: Props) {
  return (
    <span className={cx(s["card-back"], className)} aria-hidden>
      <span className={s.plate}>
        <CardBackArt />
        <span className={s.sheen} />
      </span>
    </span>
  );
}
