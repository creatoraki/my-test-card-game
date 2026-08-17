import { splitCardKeywords } from "@/engine";
import s from "./CardTextRich.module.css";

export function CardTextRich({ text }: { text: string }) {
  return (
    <>
      {splitCardKeywords(text).map((segment, index) =>
        segment.keyword ? (
          <b key={`${segment.text}-${index}`} className={s.kw}>
            {segment.text}
          </b>
        ) : (
          <span key={`${segment.text}-${index}`}>{segment.text}</span>
        ),
      )}
    </>
  );
}