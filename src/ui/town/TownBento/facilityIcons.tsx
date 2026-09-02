// ===================== 据点设施线框图标 =====================
// 画法统一: 48×48 视框, 外轮廓 strokeWidth 1.2 + opacity .38 当陪衬, 主体 strokeWidth 1.6。
// 全部 stroke="currentColor", 颜色跟随砖面文字色。

export function FormationIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M5 10h38v28H5z" strokeWidth={1.2} strokeLinejoin="round" opacity={0.38} />
      <circle cx="24" cy="19" r="4" strokeWidth={1.6} />
      <path d="M18 31c0-3.6 2.7-6 6-6s6 2.4 6 6" strokeWidth={1.6} />
      <circle cx="12" cy="21" r="3" strokeWidth={1.4} opacity={0.72} />
      <path d="M7.5 31c0-2.8 2-4.6 4.5-4.6s4.5 1.8 4.5 4.6" strokeWidth={1.4} opacity={0.72} />
      <circle cx="36" cy="21" r="3" strokeWidth={1.4} opacity={0.72} />
      <path d="M31.5 31c0-2.8 2-4.6 4.5-4.6s4.5 1.8 4.5 4.6" strokeWidth={1.4} opacity={0.72} />
    </svg>
  );
}

const CRYO_ARM = "M24 24V7M24 12.5l-4.5-4.5M24 12.5l4.5-4.5M24 18l-3.5-3.5M24 18l3.5-3.5";

export function CryoIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <path
        d="M24 3 5.8 13.5v21L24 45l18.2-10.5v-21L24 3Z"
        strokeWidth={1.2}
        strokeLinejoin="round"
        opacity={0.38}
      />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <path key={deg} d={CRYO_ARM} strokeWidth={1.6} transform={`rotate(${deg} 24 24)`} />
      ))}
    </svg>
  );
}

export function TrainingIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <circle cx="24" cy="24" r="17" strokeWidth={1.2} opacity={0.38} />
      <circle cx="24" cy="24" r="10.5" strokeWidth={1.6} />
      <circle cx="24" cy="24" r="3.4" strokeWidth={1.6} />
      <path d="M24 2.5v8M24 37.5v8M2.5 24h8M37.5 24h8" strokeWidth={1.6} />
    </svg>
  );
}

export function AssemblyIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M24 6 39.6 15v18L24 42 8.4 33V15L24 6Z" strokeWidth={1.2} strokeLinejoin="round" opacity={0.38} />
      <path d="M24 13 33 18.5v11L24 35l-9-5.5v-11L24 13Z" strokeWidth={1.6} strokeLinejoin="round" />
      <circle cx="24" cy="24" r="3" strokeWidth={1.6} />
    </svg>
  );
}

export function WorkOrderIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <rect x="7" y="9" width="34" height="26" rx="2" strokeWidth={1.2} opacity={0.38} />
      <path d="M14 17h13M14 22h20M14 27h9" strokeWidth={1.6} />
      <path d="M19 35v5M29 35v5M15 41h18" strokeWidth={1.4} />
    </svg>
  );
}

export function MedicalIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <rect x="6" y="14" width="36" height="20" rx="10" strokeWidth={1.2} opacity={0.38} />
      <path d="M24 18v12M18 24h12" strokeWidth={1.8} />
      <path d="M2.5 24h3.5M42 24h3.5" strokeWidth={1.4} />
    </svg>
  );
}

export function StorageIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <rect x="8" y="8" width="32" height="32" strokeWidth={1.2} opacity={0.38} />
      <path d="M24 8v32M8 24h32" strokeWidth={1.4} />
      <rect x="11" y="27" width="10" height="10" strokeWidth={1.6} />
    </svg>
  );
}

export function ShopIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M7 20v21h34V20" strokeWidth={1.2} strokeLinejoin="round" opacity={0.38} />
      <path d="M4 20 7.5 9h33L44 20Z" strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M17.3 9v11M30.7 9v11" strokeWidth={1.2} opacity={0.6} />
      <path d="M21 26h9v9h-9z" strokeWidth={1.6} strokeLinejoin="round" />
      <circle cx="27" cy="29.5" r="1.2" strokeWidth={1.4} />
    </svg>
  );
}

export function SortieIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M8 5h32v38H8z" strokeWidth={1.2} strokeLinejoin="round" opacity={0.38} />
      <path d="M14 10h20v17H14z" strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M24 10v27M18 32l6 7 6-7" strokeWidth={1.6} />
    </svg>
  );
}
