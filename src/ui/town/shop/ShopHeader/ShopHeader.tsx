import s from "./ShopHeader.module.css";
interface Props { title: string; credits: number; level: number; onBack?: () => void }

export function ShopHeader({ title, credits, level, onBack }: Props) {
  return (
    <header className={s.header}>
      <h2 className={s.title}>{title}</h2>
      <p className={s.subtitle}>精选星际物资，强化你的旅程。</p>
      <div className={s.credits}><span className={s.coin} aria-hidden="true">◈</span><strong>{credits.toLocaleString()}</strong><span>积分</span></div>
      <div className={s.level}><strong>等级 {level}</strong><span className={s.indicator} aria-hidden="true"><i /></span></div>
      {onBack && <button className={s.close} type="button" aria-label="关闭商店，返回据点" onClick={onBack}>×</button>}
    </header>
  );
}