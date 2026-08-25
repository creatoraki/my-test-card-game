export function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" aria-hidden="true">
      <path d="m7 7 10 10M17 7 7 17" />
      <path d="M4 4h4M4 4v4M20 20h-4M20 20v-4" opacity=".5" />
    </svg>
  );
}

export function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m14 5-7 7 7 7" />
      <path d="M8 12h9" opacity=".55" />
    </svg>
  );
}

export function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m10 5 7 7-7 7" />
      <path d="M7 12h9" opacity=".55" />
    </svg>
  );
}

export function AssembleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h6v8H4zM14 8h6v8h-6z" opacity=".65" />
      <path d="M10 12h4M12 10v4" />
    </svg>
  );
}

export function DetachIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h6v8H4zM14 8h6v8h-6z" opacity=".65" />
      <path d="M10 12h4M12 9v6" />
      <path d="m10 9 2 3-2 3" opacity=".5" />
    </svg>
  );
}

/** 卡面右上角的「已装配模组」徽章图标 —— 芯片本体 + 四面引脚, 小尺寸下轮廓仍然读得出来。 */
export function CardModuleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="1.6" />
      <circle cx="12" cy="12" r="2.1" fill="currentColor" stroke="none" />
      <path d="M10 3.5V7M14 3.5V7M10 17v3.5M14 17v3.5M3.5 10H7M3.5 14H7M17 10h3.5M17 14h3.5" />
    </svg>
  );
}

export function AssemblyIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 17V8h9M31 8h9v9M40 31v9h-9M17 40H8v-9" opacity=".45" />
      <path d="M24 10 35 16v16L24 38 13 32V16Z" />
      <circle cx="24" cy="24" r="7" strokeDasharray="2.5 2.5" opacity=".7" />
      <circle cx="24" cy="24" r="2.5" />
      <path d="M24 4v6M44 24h-9M24 44v-6M4 24h6" opacity=".6" />
    </svg>
  );
}