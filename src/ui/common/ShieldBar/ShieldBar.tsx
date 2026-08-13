import { cx } from "@/ui/common/cx";
import s from "./ShieldBar.module.css";

interface Props {
  shield: number;
  maxHp: number;
  flush?: boolean;
  large?: boolean;
  hideEmpty?: boolean;
}

export function ShieldBar({ shield, maxHp, flush, large, hideEmpty }: Props) {
  if (hideEmpty && shield <= 0) return null;

  const shieldPct = Math.min(100, (shield / maxHp) * 100);

  return (
    <div className={cx(s["shield-bar"], flush && s["shield-flush"], large && s["shield-large"])}>
      <div className={s["shield-fill"]} style={{ width: `${shieldPct}%` }} />
    </div>
  );
}