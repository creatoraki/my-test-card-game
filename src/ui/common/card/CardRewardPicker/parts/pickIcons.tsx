// 卡牌三选一面板的小图标: 页眉标签前的发光短条 + 双尖、提示圆圈、确认按钮实心双箭头。
import { useId } from "react";

/** 页眉小标签前缀: 品红 → 紫的圆头短条 + 两枚渐隐小尖。 */
export function KickerMark({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg className={className} viewBox="0 0 54 14" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7a3cff" />
          <stop offset="1" stopColor="#d27bff" />
        </linearGradient>
      </defs>
      <rect x="1" y="3" width="32" height="8" rx="4" fill={`url(#${id})`} />
      <path d="M38 3 L43 7 L38 11" stroke="#b98cff" strokeWidth="2.2" />
      <path d="M46 3 L51 7 L46 11" stroke="#b98cff" strokeWidth="2.2" opacity="0.55" />
    </svg>
  );
}

export function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 30 30" fill="none" aria-hidden="true">
      <circle cx="15" cy="15" r="13.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="15" cy="9" r="1.8" fill="currentColor" />
      <path d="M15 13 V22" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  );
}

/** 确认按钮的实心双箭头: 前一枚暗紫、后一枚冰白渐变。 */
export function DoubleChevron({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg className={className} viewBox="0 0 38 33" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#8fdcff" />
        </linearGradient>
      </defs>
      <polygon points="0,0 9,0 21,16.5 9,33 0,33 12,16.5" fill="#9a9cff" />
      <polygon points="15,0 24,0 36,16.5 24,33 15,33 27,16.5" fill={`url(#${id})`} />
    </svg>
  );
}
