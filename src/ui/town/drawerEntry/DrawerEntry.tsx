import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import s from "./DrawerEntry.module.css";

export interface DrawerEntryProps {
  icon: ReactNode;
  name: string;
  desc: string;
  entryId: string;
  glow?: string;
  hidden: boolean;
  revealing?: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function DrawerEntry({
  icon,
  name,
  desc,
  entryId,
  glow,
  hidden,
  revealing = false,
  onClick,
}: DrawerEntryProps) {
  return (
    <button
      className={cx(s.entry, revealing && s["is-revealing"])}
      type="button"
      data-drawer-entry={entryId}
      style={{
        ...(glow ? { "--asm-glow": glow } : {}),
        visibility: hidden ? "hidden" : "visible",
      } as CSSProperties}
      onClick={onClick}
    >
      <span className={s.rim} aria-hidden />
      <span className={s.entryIcon} aria-hidden>
        {icon}
      </span>
      <span className={s.entryText}>
        <span className={s.entryName}>{name}</span>
        <span className={s.entryDesc}>{desc}</span>
      </span>
      <span className={s.entryGo} aria-hidden>
        ▸
      </span>
    </button>
  );
}
