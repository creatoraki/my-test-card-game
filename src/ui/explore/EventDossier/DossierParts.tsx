import type { ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import s from "./DossierParts.module.css";

/** "02 / 行动阶段" 阶段行。 */
export function DossierPhase({ no, label }: { no: string; label: string }) {
  return (
    <div className={s.phase}>
      <i aria-hidden />
      <b>{no}</b>
      <span className={s.phaseSlash} aria-hidden>/</span>
      <span>{label}</span>
    </div>
  );
}

/** 左栏正文：固定在阶段行下方，超出三行后在区域内滚动。 */
export function DossierBody({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <div className={cx(s.body, wide && s.bodyWide)}>{children}</div>;
}

/** 左下信息框(消耗 / 警示 / 结算条目共用)。tone 决定描边与图标色。 */
export function DossierInfoBox({
  icon,
  tone = "accent",
  children,
}: {
  icon?: ReactNode;
  tone?: "accent" | "danger";
  children: ReactNode;
}) {
  return (
    <div className={s.info} data-tone={tone}>
      <svg className={s.infoFrame} viewBox="0 0 466 128" aria-hidden>
        <path className={s.infoLine} d="M.5.5h453l12 12v103l-12 12H12.5l-12-12Z" />
        <path className={s.infoGlow} d="M.5 26V.5H26M.5 96v19.5l12 12H30M442 .5h11.5l12 12V34" />
      </svg>
      {icon && <span className={s.infoIcon}>{icon}</span>}
      <div className={cx(s.infoContent, !icon && s.infoContentBare)}>{children}</div>
    </div>
  );
}

/** 警示 / 提示的主副两行排版(与消耗信息同一套字号)。 */
export function DossierNotice({ title, note }: { title: string; note: string }) {
  return (
    <>
      <p className={s.costMain}>{title}</p>
      <p className={s.costNote}>{note}</p>
    </>
  );
}

/** 消耗信息的主副两行排版。 */
export function DossierCost({ lead, amount, note }: { lead: string; amount: number; note: string }) {
  return (
    <>
      <p className={s.costMain}>{lead}<em>{amount}</em><span>点净化粒子</span></p>
      <p className={s.costNote}>{note}</p>
    </>
  );
}
