import { TalentEmblem } from "./TalentEmblem";
import s from "./TalentHeader.module.css";

export function TalentHeader({ remaining, total }: { remaining: number; total: number }) {
  return <>
    <header className={s.header}>
      <span className={s.emblem}><TalentEmblem size={101} /></span>
      <h2 className={s.title}>天赋训练</h2>
      <div className={s.points} aria-label={`可用 ${remaining}，总共 ${total} 训练点`}>
        <i aria-hidden="true">◇</i><span>训练点</span><strong>{remaining} / {total}</strong>
      </div>
      <p className={s.description}>以智慧构筑无限可能<br />让每一场战斗，都有新的答案。</p>
    </header>
    <span className={s.leftInscription} aria-hidden="true">天赋 · 策略 · 无限可能</span>
    <span className={s.rightInscription} aria-hidden="true">构筑专属于你的力量</span>
  </>;
}
