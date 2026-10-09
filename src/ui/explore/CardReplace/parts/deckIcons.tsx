// 卡组面板的内联图标: 舱位准星、已放入勾选、底栏提示、确认按钮双箭头。线条走 currentColor。

/** 舱位标题条左侧的准星齿轮。 */
export function ReticleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
      <circle cx="20" cy="20" r="11" />
      <circle cx="20" cy="20" r="4.5" fill="currentColor" stroke="none" />
      <path d="M20 2 V8 M20 32 V38 M2 20 H8 M32 20 H38" strokeLinecap="round" />
      <path d="M7.5 7.5 L10.5 10.5 M32.5 7.5 L29.5 10.5 M7.5 32.5 L10.5 29.5 M32.5 32.5 L29.5 29.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/** 圆圈勾选。 */
export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M7.5 12.4 L10.6 15.4 L16.6 8.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 圆圈感叹号。 */
export function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 6.8 V13.4" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** 双箭头; dir = left 为「«」。 */
export function ChevronsIcon({ dir, className }: { dir: "left" | "right"; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
      <path
        d={dir === "left" ? "M20 5 L13 12 L20 19 M12 5 L5 12 L12 19" : "M4 5 L11 12 L4 19 M12 5 L19 12 L12 19"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
