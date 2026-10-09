// 卡组面板右侧的培养舱列: 标题条(准星 + 舱名 + 状态) / 玻璃培养舱(后层素材 + 卡面 + 前层素材) / 信息表。
// 选卡阶段舱内放大展示已放入的卡; 结果阶段由调用方传入 sequence(舱内原地演出)替换静态卡面。
// 舱体为可选素材, 未放入时走 CSS 兜底的玻璃圆舱。
import type { ReactNode } from "react";
import type { Card } from "@/engine";
import { DECK_SERVICE_ART } from "@/ui/art/explore/deckServiceArt";
import { DeckCardFace } from "./parts/DeckCardFace";
import { CheckIcon, ReticleIcon } from "./parts/deckIcons";
import { CHAMBER_ART, CHAMBER_CENTER, CHAMBER_FACTS, CHAMBER_FX, CHAMBER_HEAD, rectStyle } from "./parts/deckGeometry";
import s from "./ReplaceChamber.module.css";

export interface ChamberFact {
  label: string;
  value: string;
  tone?: "warn" | "good";
}

export type ChamberStatus = "idle" | "ready" | "running" | "done";

const STATUS_TEXT: Record<ChamberStatus, string> = {
  idle: "等待放入",
  ready: "已放入",
  running: "处理中",
  done: "已完成",
};

interface Props {
  /** 舱位名称, 如「置换舱」「删除舱」。 */
  label: string;
  card: Card | null;
  facts: ChamberFact[];
  status: ChamberStatus;
  /** 舱位为空时的提示。 */
  emptyText: ReactNode;
  /** 结果阶段的舱内演出; 有则替换静态卡面。 */
  sequence?: ReactNode;
}

const BAY_STYLE = {
  left: CHAMBER_CENTER.x - CHAMBER_FX.w / 2,
  top: CHAMBER_CENTER.y - CHAMBER_FX.h / 2,
  width: CHAMBER_FX.w,
  height: CHAMBER_FX.h,
};

export function ReplaceChamber({ label, card, facts, status, emptyText, sequence }: Props) {
  const lit = status !== "idle";
  return (
    <>
      <header className={s.head} style={rectStyle(CHAMBER_HEAD)}>
        <ReticleIcon className={s.reticle} />
        <span className={s.label}>{label}</span>
        <span className={s.status} data-status={status}>
          {(status === "ready" || status === "done") && <CheckIcon className={s.check} />}
          {STATUS_TEXT[status]}
        </span>
      </header>

      {DECK_SERVICE_ART.chamber
        ? <img className={s.art} src={DECK_SERVICE_ART.chamber} style={rectStyle(CHAMBER_ART)} alt="" draggable={false} aria-hidden />
        : <span className={s.artFallback} style={rectStyle(CHAMBER_ART)} aria-hidden />}
      <span className={s.baseGlow} data-lit={lit ? "" : undefined} style={rectStyle(CHAMBER_ART)} aria-hidden />

      <div className={s.bay} style={BAY_STYLE}>
        {sequence ?? (card ? (
          <div className={s.card} key={card.uid} data-card-detail>
            <div className={s.scale}>
              <DeckCardFace card={card} />
            </div>
            <span className={s.sweep} aria-hidden />
          </div>
        ) : (
          <div className={s.empty}>
            <span className={s.emptyGlyph} aria-hidden>？</span>
            <span>{emptyText}</span>
          </div>
        ))}
      </div>

      {DECK_SERVICE_ART.chamberFront && (
        <img className={s.front} src={DECK_SERVICE_ART.chamberFront} style={rectStyle(CHAMBER_ART)} alt="" draggable={false} aria-hidden />
      )}

      <dl className={s.facts} style={rectStyle(CHAMBER_FACTS)}>
        {facts.map((fact) => (
          <div key={fact.label} className={s.fact} data-tone={fact.tone}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
