// 卡牌三选一面板的小图标: 页眉箭头、提示圆圈、确认按钮双箭头。线条与填充都走 currentColor。

export function KickerArrow({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 52 14" fill="none" aria-hidden="true">
      <path d="M0 7 H30" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
      <path d="M33 2 L39 7 L33 12" stroke="currentColor" strokeWidth="2.4" />
      <path d="M42 2 L48 7 L42 12" stroke="currentColor" strokeWidth="2.4" opacity="0.6" />
    </svg>
  );
}

export function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <circle cx="13" cy="13" r="11.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="13" cy="8" r="1.5" fill="currentColor" />
      <path d="M13 11.5 V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function DoubleChevron({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 26" fill="none" aria-hidden="true">
      <path d="M3 3 L13 13 L3 23" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="miter" opacity="0.55" />
      <path d="M17 3 L27 13 L17 23" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="miter" />
    </svg>
  );
}
