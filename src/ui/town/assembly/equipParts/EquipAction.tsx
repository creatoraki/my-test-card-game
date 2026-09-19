import { MarketActionButton } from "@/ui/town/shop/MarketPanel";
import s from "./EquipAction.module.css";

interface Props {
  disabled?: boolean;
  label: string;
  ariaLabel: string;
  onClick: () => void;
}

export function EquipAction({ disabled = false, label, ariaLabel, onClick }: Props) {
  return <MarketActionButton tone="theme" className={s.action} label={label}
    ariaLabel={ariaLabel} disabled={disabled} onClick={onClick} />;
}
