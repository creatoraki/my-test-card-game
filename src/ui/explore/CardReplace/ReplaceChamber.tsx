// 卡组面板右侧的舱位: 放大展示已放入的卡, 并把这次服务会发生什么逐条讲清楚(事实表由调用方按服务给出)。
import type { ReactNode } from "react";
import { type Card } from "@/engine";
import { HandCard } from "@/ui/common/card/HandCard";
import s from "./ReplaceChamber.module.css";

export interface ChamberFact {
  label: string;
  value: string;
  tone?: "warn";
}

interface Props {
  /** 舱位名称, 如「置换舱」「删除舱」。 */
  label: string;
  card: Card | null;
  facts: ChamberFact[];
  /** 已就绪(放入卡牌或选定角色)。 */
  ready: boolean;
  /** 舱位为空时的提示。 */
  emptyText: ReactNode;
}

export function ReplaceChamber({ label, card, facts, ready, emptyText }: Props) {
  return (
    <aside className={s.chamber}>
      <header className={s.head}>
        <span className={s.label}>{label}</span>
        <span className={s.status} data-ready={ready ? "" : undefined}>
          <i aria-hidden />
          {ready ? "目标已锁定" : "等待放入"}
        </span>
      </header>

      <div className={s.bay} data-filled={card ? "" : undefined}>
        <span className={s.bayGrid} aria-hidden />
        <span className={s.bracket} data-at="tl" aria-hidden />
        <span className={s.bracket} data-at="tr" aria-hidden />
        <span className={s.bracket} data-at="bl" aria-hidden />
        <span className={s.bracket} data-at="br" aria-hidden />
        {card ? (
          <div className={s.card} key={card.uid} data-card-detail>
            <div className={s.scale}>
              <HandCard card={card} variant="pile" playable selected={false} />
            </div>
            <span className={s.sweep} aria-hidden />
          </div>
        ) : (
          <div className={s.empty}>
            <span className={s.emptyGlyph} aria-hidden>？</span>
            <span>{emptyText}</span>
          </div>
        )}
      </div>

      <dl className={s.facts}>
        {facts.map((fact) => (
          <div key={fact.label} className={s.fact} data-tone={fact.tone}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
