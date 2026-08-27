import { cardKeywordsIn } from "@/engine";
import { cx } from "@/ui/common/cx";
import s from "./CardKeywordNotes.module.css";

interface Props {
  text: string;
  className?: string;
  additionalNotes?: ReadonlyArray<{ id: string; name: string; desc: string }>;
}

export function CardKeywordNotes({ text, className, additionalNotes }: Props) {
  const keywords = cardKeywordsIn(text);
  const notes = [...keywords, ...(additionalNotes ?? [])];
  if (notes.length === 0) return null;

  return (
    <div className={cx(s.notes, className)}>
      {notes.map((keyword) => (
        <div key={keyword.id} className={s.note}>
          <strong>{keyword.name}</strong>
          <span>{keyword.desc}</span>
        </div>
      ))}
    </div>
  );
}