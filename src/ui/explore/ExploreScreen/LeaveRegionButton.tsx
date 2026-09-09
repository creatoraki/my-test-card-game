import { cx } from "@/ui/common/cx";
import s from "./LeaveRegionButton.module.css";

interface LeaveRegionButtonProps {
  choosingEntry: boolean;
  routeComplete?: boolean;
  onClick: () => void;
  className?: string;
}

export function LeaveRegionButton({ choosingEntry, routeComplete = false, onClick, className }: LeaveRegionButtonProps) {
  return (
    <button
      type="button"
      className={cx(s.button, routeComplete && s.routeComplete, choosingEntry && s.secondary, className)}
      onClick={onClick}
    >
      <span>前往下一区域</span>
      <svg className={s.arrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M4 12h15m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
