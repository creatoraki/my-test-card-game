import { RARITY_CRYSTAL_ART } from "@/ui/art/rarityArt";
import { cx } from "@/ui/common/cx";
import s from "./CardBack.module.css";

interface Props {
  className?: string;
}

export function CardBack({ className }: Props) {
  return (
    <span className={cx(s["card-back"], className)} aria-hidden>
      <span className={s.pattern} />
      <img className={s.crystal} src={RARITY_CRYSTAL_ART.common} alt="" draggable={false} />
      <span className={s.sheen} />
    </span>
  );
}