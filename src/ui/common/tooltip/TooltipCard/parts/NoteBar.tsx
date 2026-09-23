// 底部提示条: 与状态底栏同款斜切细边框, 逐行列出补充说明(掉落加成、操作提示、警告)。

import { cx } from "@/ui/common/shared/cx";
import { ChamferPanel } from "./ChamferPanel";
import s from "./NoteBar.module.css";

export type TooltipNote = {
  text: string;
  /** accent = 主题色(默认) / bad = 警示红 / muted = 次要灰蓝。 */
  tone?: "accent" | "bad" | "muted";
};

export function NoteBar({ notes }: { notes: TooltipNote[] }) {
  return (
    <ChamferPanel chamfer={7} className={s.bar}>
      {notes.map((note, index) => (
        <span key={index} className={cx(s.note, s[note.tone ?? "accent"])}>
          <i className={s.mark} aria-hidden="true" />
          {note.text}
        </span>
      ))}
      <svg className={s.decor} width="46" height="5" aria-hidden="true">
        <path className={s.stripe} d="M2 0.5H6L4 3.5H0Z" />
        <path className={s.stripe} d="M10 0.5H18L16 3.5H8Z" />
        <path className={s.stripe} d="M22 0.5H26L24 3.5H20Z" />
        <path className={s.rule} d="M0 4.5H46" />
      </svg>
    </ChamferPanel>
  );
}
