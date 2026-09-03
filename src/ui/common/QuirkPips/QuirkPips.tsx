import type { QuirkId } from "@/engine";
import { getQuirkDef } from "@/engine";
import { RailPopover } from "@/ui/common/RailPopover";
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
        <div
          className={cx(s.pip, s.sick)}
          data-rail-item=""
          tabIndex={0}
          aria-label="生病：攻击、防御、先手降低 10%"
        >
          <span aria-hidden>🤒</span>
          <b>生病</b>
          <RailPopover side="top">
            <strong>生病</strong>
            <p>攻击、防御、先手降低 10%。</p>
          </RailPopover>
        </div>
      )}
      {quirks.map((id) => {
        const def = getQuirkDef(id);
        if (!def) return null;
        return (
          <div
            key={id}
            className={cx(s.pip, s.quirk)}
            data-rail-item=""
            tabIndex={0}
            aria-label={`${def.name}：${def.desc}`}
          >
            <span aria-hidden>{def.emoji}</span>
            <b>{def.name}</b>
            <RailPopover side="top">
              <strong>{def.name}</strong>
              <p>{def.desc}</p>
            </RailPopover>
          </div>
        );
      })}
    </div>
  );
}
