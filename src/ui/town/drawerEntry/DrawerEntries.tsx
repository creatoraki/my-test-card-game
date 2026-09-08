import type { CSSProperties, ReactNode } from "react";
import { useEntryRise } from "@/ui/hooks/useEntryRise";
import s from "./DrawerEntry.module.css";

interface Props {
  style?: CSSProperties;
  leaving?: boolean;
  children: ReactNode;
}

export function DrawerEntries({ style, leaving = false, children }: Props) {
  const entryRise = useEntryRise();

  return (
    <div
      className={s.entries}
      {...entryRise}
      data-leaving={leaving ? "" : undefined}
      style={style}
    >
      {children}
    </div>
  );
}
