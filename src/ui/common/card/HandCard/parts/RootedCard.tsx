import { RailPopover } from "@/ui/common/tooltip/RailPopover";
import { TooltipCard } from "@/ui/common/tooltip/TooltipCard";
import s from "./RootedCard.module.css";

export function RootedCard({ uid, onRelease, disabled }: {
  uid: string;
  onRelease?: (uid: string) => void;
  disabled?: boolean;
}) {
  return <div className={s.roots} data-rail-item tabIndex={0} onClick={(event) => event.stopPropagation()}>
    <span className={s.vines} aria-hidden="true" />
    <span className={s.label}>缠根</span>
    {onRelease && <button type="button" className={s.release} disabled={disabled}
      onClick={(event) => { event.stopPropagation(); onRelease(uid); }}>解缠 · 1 水晶</button>}
    <RailPopover side="top"><TooltipCard title="缠根" desc="不能打出或操作。下次我方回合开始自动解除；也可支付 1 枚法力水晶立即解缠，不推进时刻。被蟹搬走后只能击杀取回。" /></RailPopover>
  </div>;
}
