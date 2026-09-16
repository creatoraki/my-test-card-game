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

/** 「模组制造」入口图标 —— 熔炉腔体 + 锤头, 与 AssemblyIcon 同为 48 视图的线条风格。 */
export function CraftIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 17V8h9M31 8h9v9M40 31v9h-9M17 40H8v-9" opacity=".45" />
      <path d="M13 34h22l-3-13H16Z" />
      <path d="M18 21V16a6 6 0 0 1 12 0v5" opacity=".7" />
      <path d="M20 27h8" opacity=".6" />
      <path d="M24 34v6M18 40h12" opacity=".5" />
    </svg>
  );
}

/** 「科技树」入口图标 —— 中央研究核心 + 三层分支，保持 48 视图线条风格。 */
export function TechTreeIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 17V8h9M31 8h9v9M40 31v9h-9M17 40H8v-9" opacity=".45" />
      <circle cx="24" cy="24" r="6" />
      <circle cx="24" cy="24" r="2" />
      <path d="M24 18V10M18.8 27 12 33M29.2 27 36 33" />
      <circle cx="24" cy="8" r="3" />
      <circle cx="10" cy="35" r="3" />
      <circle cx="38" cy="35" r="3" />
      <path d="M24 4v4M10 39v4M38 39v4" opacity=".6" />
    </svg>
  );
}
