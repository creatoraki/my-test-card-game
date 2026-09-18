// 医疗室左侧导航图标: 复苏舱 / 疗养舱 / 圣水池。线条走 currentColor, 由导航牌统一染色。
import type { CryoPage } from "./CryoPanel";

export function CryoNavIcon({ page }: { page: CryoPage }) {
  if (page === "revive") {
    return (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden="true">
        <path d="M14 14h20v30H14z" strokeWidth={2} strokeLinejoin="round" opacity={0.45} />
        <circle cx="24" cy="26" r="4.5" strokeWidth={2.4} />
        <path d="M17 40c0-4.4 3.1-7.5 7-7.5s7 3.1 7 7.5M24 4v5M15.5 6.5l2.5 4M32.5 6.5L30 10.5" strokeWidth={2.4} />
      </svg>
    );
  }
  if (page === "nutrition") {
    return (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden="true">
        <path d="M14 6h20v36H14z" strokeWidth={2} strokeLinejoin="round" opacity={0.45} />
        <path d="M18 29c3-7 9-7 12 0M24 15v13M20 19h8" strokeWidth={2.4} />
        <path d="M19 35h10" strokeWidth={2} opacity={0.72} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 22 24 15l15 7-15 7-15-7Z" strokeWidth={2} opacity={0.5} />
      <path d="M9 22v11l15 7 15-7V22" strokeWidth={2} opacity={0.8} />
      <path d="M13 25v6l11 5 11-5v-6" strokeWidth={2.2} />
      <path d="M17 20c0-2 1.2-3 1.2-4.8M25 17c0-2.2 1.3-3.2 1.3-5M31 21c0-1.6 1-2.5 1-4" strokeWidth={2} />
    </svg>
  );
}
