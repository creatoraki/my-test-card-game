import { cardKeywordsIn } from "@/engine";
import { cx } from "@/ui/common/cx";
import s from "./CardKeywordNotes.module.css";

interface Props {
  text: string;
  className?: string;
}

export function CardKeywordNotes({ text, className }: Props) {
  const keywords = cardKeywordsIn(text);
  if (keywords.length === 0) return null;

  return (
    <div className={cx(s.notes, className)}>
      {keywords.map((keyword) => (
        <div key={keyword.id} className={s.note}>
          <strong>{keyword.name}</strong>
          <span>{keyword.desc}</span>
        </div>
      ))}
    </div>
  );
}