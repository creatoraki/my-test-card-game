import type { QuirkId } from "@/engine";
import { getQuirkDef } from "@/engine";
import { cx } from "@/ui/common/cx";
import s from "./QuirkPips.module.css";

interface Props {
  quirks: readonly QuirkId[];
  sick?: boolean;
  className?: string;
}

export function QuirkPips({ quirks, sick, className }: Props) {
  if (!sick && quirks.length === 0) return null;
  return (
    <div className={cx(s["quirk-pips"], className)}>
      {sick && (
        <span className={cx(s.pip, s.sick)} title="生病：攻击、防御、先手降低 10%">
          <span aria-hidden>🤒</span>
          <b>生病</b>
        </span>
      )}
      {quirks.map((id) => {
        const def = getQuirkDef(id);
        if (!def) return null;
        return (
          <span key={id} className={cx(s.pip, s.quirk)} title={`${def.name}：${def.desc}`}>
            <span aria-hidden>{def.emoji}</span>
            <b>{def.name}</b>
          </span>
        );
      })}
    </div>
  );
}
