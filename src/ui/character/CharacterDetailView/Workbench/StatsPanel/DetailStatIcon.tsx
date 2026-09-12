import type { ReactNode } from "react";
import type { StatBlock } from "@/engine";
import { StatIcon } from "@/ui/common/StatIcon";

const shield = "M16 3 27 7v9c0 7-11 13-11 13S5 23 5 16V7Z";
const star = "m16 2 3 10 11 4-11 3-3 11-3-11L2 16l11-4Z";
const icons: Partial<Record<keyof StatBlock, ReactNode>> = {
  maxHp: <><path fill="currentColor" stroke="none" d="M16 28S2 19 2 10C2 2 12 1 16 8 20 1 30 2 30 10c0 9-14 18-14 18Z" /><path stroke="#6877c4" d="M7 15h5l2-5 4 10 2-5h5" /></>,
  attack: <><path d="m5 3 15 14-4 4L3 6V3Zm22 0L12 17l4 4L29 6V3ZM4 21l7 7m10-7 7 7M8 25l-5 5m21-5 5 5" /><path d="m8 5 11 11M24 5 13 16" /></>,
  defense: <><path d={shield} /><path d="m16 7 7 3v6c0 4-7 9-7 9s-7-5-7-9v-6Z" fill="currentColor" fillOpacity=".24" /></>,
  armorPen: <><path d="m5 6 20-2-4 7-7 2-4 13-7 3 5-15Z" /><path d="m11 8 15 4-9 6m-7 5 7-5" /></>,
  healPower: <path fill="currentColor" stroke="none" d="M12 3h8v9h9v8h-9v9h-8v-9H3v-8h9Z" />,
  lowCostMastery: <path d={star} fill="currentColor" stroke="none" />,
  highCostMastery: <><path d="m12 9 3 8 8 3-8 3-3 9-3-9-8-3 8-3Z" fill="currentColor" stroke="none" /><path d="m24 1 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="currentColor" stroke="none" /></>,
  hitRate: <><circle cx="16" cy="16" r="10" /><circle cx="16" cy="16" r="4" fill="currentColor" /><path d="M16 1v7m0 16v7M1 16h7m16 0h7" /></>,
  dodgeRate: <><path d="m3 12 8-6 16-2-3 8-7 2-5 12-8 3 4-11-5-6Z" /><path d="m12 9 6 4-5 6M2 21h3m17-2h7m-9 5h6" /></>,
  critRate: <path d="m16 1 3 10 8-6-5 9 10 2-10 3 6 8-9-5-3 10-3-10-8 6 5-9-10-3 10-2-5-9 8 6Z" fill="currentColor" stroke="none" />,
  critDamage: <><path d="m5 28 18-25-8 19Zm11 1L29 9l-5 16Z" fill="currentColor" stroke="none" /><path d="m3 4 3 4m4-7 1 4M2 16l4-1m19-12 1-2" /></>,
  precision: <><circle cx="16" cy="16" r="7" /><path d="M16 1v9m0 12v9M1 16h9m12 0h9" /><path d="m16 12 4 4-4 4-4-4Z" fill="currentColor" /></>,
  initiative: <><circle cx="16" cy="17" r="11" /><path d="M16 10v8h6M12 3h8m-4-2v5" /></>,
  blockRate: <><path d={shield} /><path d="M16 10v12m-5-6h10" /></>,
  shieldBoost: <><path d={shield} /><path d="M16 10v12m-5-6h10" /><path d="M2 11v8m28-8v8" opacity=".5" /></>,
  healBoost: <><path d={shield} /><path d="m16 9 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="currentColor" /></>,
  ailmentResist: <><path d="m16 2 9 4 5 10-5 10-9 4-9-4-5-10L7 6Z" /><path d="m16 9 3 4 4 3-4 3-3 4-3-4-4-3 4-3Z" fill="currentColor" /></>,
  burdenAdapt: <><path d="M6 14h20v15H6ZM10 14V9a6 6 0 0 1 12 0v5" /><path d="M16 19v6m-3-3 3 3 3-3" /></>,
};

/** 详情页专用的实心与双线徽记，避免影响其他界面的共享图标。 */
export function DetailStatIcon({ statKey, className }: { statKey: keyof StatBlock; className?: string }) {
  const icon = icons[statKey];
  if (!icon) return <StatIcon statKey={statKey} className={className} />;
  return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{icon}</svg>;
}
