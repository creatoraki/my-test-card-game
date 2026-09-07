import type { MouseEvent, ReactNode } from "react";
import s from "./StockPanels.module.css";

export function EntryTile({
  icon,
  name,
  desc,
  entryId,
  hidden,
  onClick,
}: {
  icon: ReactNode;
  name: string;
  desc: string;
  entryId?: string;
  hidden: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      className={s.entry}
      type="button"
      data-stock-entry={entryId}
      onClick={onClick}
      style={{ visibility: hidden ? "hidden" : "visible" }}
    >
      <span className={s.rim} aria-hidden />
      <span className={s["entry-icon"]}>{icon}</span>
      <span className={s["entry-text"]}>
        <span className={s["entry-name"]}>{name}</span>
        <span className={s["entry-desc"]}>{desc}</span>
      </span>
      <span className={s["entry-go"]} aria-hidden>
        ▸
      </span>
    </button>
  );
}
