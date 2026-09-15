import type { ReactNode } from "react";
import s from "./ShopHeader.module.css";

interface Props {
  title: string;
  subtitle?: string;
  credits?: number;
  level?: number;
  stats?: ReactNode;
  onBack?: () => void;
  closeLabel?: string;
}

export function ShopHeader({
  title,
  subtitle = "精选星际物资，强化你的旅程。",
  credits,
  level,
  stats,
  onBack,
  closeLabel = "关闭商店，返回据点",
}: Props) {
  return (
    <header className={s.header}>
      <h2 className={s.title}>{title}</h2>
      <p className={s.subtitle}>{subtitle}</p>
      {stats !== undefined ? <div className={s.stats}>{stats}</div> : <>
        {credits !== undefined && <div className={s.credits}><span className={s.coin} aria-hidden="true">◈</span><strong>{credits.toLocaleString()}</strong><span>积分</span></div>}
        {level !== undefined && <div className={s.level}><strong>等级 {level}</strong><span className={s.indicator} aria-hidden="true"><i /></span></div>}
      </>}
      {onBack && <button className={s.close} type="button" aria-label={closeLabel} onClick={onBack}>×</button>}
    </header>
  );
}
