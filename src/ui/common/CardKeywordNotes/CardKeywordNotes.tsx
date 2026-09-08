import { cardKeywordsIn, type Card } from "@/engine";
import { getItemDef } from "@/data";
import { cx } from "@/ui/common/cx";
import s from "./CardKeywordNotes.module.css";

interface Props {
  text: string;
  card?: Card;
  className?: string;
  additionalNotes?: ReadonlyArray<{ id: string; name: string; desc: string }>;
}

export function CardKeywordNotes({ text, card, className, additionalNotes }: Props) {
  const keywords = cardKeywordsIn(text);
  const moduleDef = card?.cardModule ? getItemDef(card.cardModule.itemId) : undefined;
  const moduleNotes = moduleDef ? [{ id: moduleDef.id, name: moduleDef.name, desc: moduleDef.desc }] : [];
  const notes = [...moduleNotes, ...keywords, ...(additionalNotes ?? [])];
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
