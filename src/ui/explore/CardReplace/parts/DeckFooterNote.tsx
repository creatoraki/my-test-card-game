// 卡组面板底栏提示条: 圆圈感叹号 + 一行提示; danger = 失败 / 不可用转红, good = 演出结论转绿。
import type { ReactNode } from "react";
import { AlertIcon, CheckIcon } from "./deckIcons";
import { FOOT_NOTE, rectStyle } from "./deckGeometry";
import s from "./DeckFooterNote.module.css";

export function DeckFooterNote({ tone, children }: { tone?: "danger" | "good"; children: ReactNode }) {
  return (
    <p className={s.note} data-tone={tone} style={rectStyle(FOOT_NOTE)} aria-live="polite">
      {tone === "good" ? <CheckIcon className={s.icon} /> : <AlertIcon className={s.icon} />}
      <span className={s.text}>{children}</span>
    </p>
  );
}
