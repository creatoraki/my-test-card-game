import { useLayoutEffect, useRef, type ReactNode } from "react";
import { cx } from "@/ui/common/shared/cx";
import { useTypewriter } from "@/ui/hooks/useTypewriter";
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

/**
 * 左栏正文：逐字打出，一句一行；超出区域时跟着打字自动下滚，不显示滚动条(滚轮仍可回看)。
 * notesFrom 之后的行是结算条目，用强调色区分。size 决定区域高度，由下方是否有信息框 / 物品栏决定。
 */
export function DossierBody({
  lines,
  notesFrom = lines.length,
  size = "tall",
}: {
  lines: string[];
  notesFrom?: number;
  size?: "short" | "tall";
}) {
  const typed = useTypewriter(lines.join("\n"), 260);
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [typed.shown]);
  return (
    <div ref={ref} className={s.body} data-size={size}>
      {typed.shown.split("\n").map((text, index) => (
        <p key={index} className={cx(index >= notesFrom && s.bodyNote)}>{text}</p>
      ))}
    </div>
  );
}

/** 左下信息框(消耗 / 警示 / 结算条目共用)。tone 决定描边与图标色。 */
export function DossierInfoBox({
  icon,
  tone = "accent",
  variant = "default",
  children,
}: {
  icon?: ReactNode;
  tone?: "accent" | "danger";
  variant?: "default" | "executor";
  children: ReactNode;
}) {
  return (
    <div className={s.info} data-tone={tone} data-variant={variant}>
      <svg className={s.infoFrame} viewBox={variant === "executor" ? "0 0 466 288" : "0 0 466 128"} aria-hidden>
        {variant === "executor" ? (
          <>
            <path className={s.infoLine} d="M.5.5h453l12 12v263l-12 12H12.5l-12-12Z" />
            <path className={s.infoGlow} d="M.5 26V.5H26M.5 256v19.5l12 12H30M442 .5h11.5l12 12V34" />
          </>
        ) : (
          <>
            <path className={s.infoLine} d="M.5.5h453l12 12v103l-12 12H12.5l-12-12Z" />
            <path className={s.infoGlow} d="M.5 26V.5H26M.5 96v19.5l12 12H30M442 .5h11.5l12 12V34" />
          </>
        )}
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
