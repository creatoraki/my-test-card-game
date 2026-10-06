import { useMemo } from "react";
import { splitCardKeywords } from "@/engine";
import s from "./CardTextRich.module.css";
import { useAltHeld } from "./useAltHeld";

export function CardTextRich({ text }: { text: string }) {
  const altHeld = useAltHeld();
  // 只在原文变化时解析，ALT 仅选择展示值，不改变动态数值和词条的结构。
  const parts = useMemo(() => text.split(/(⟦[^⟧]+⟧)/g).map((part) => {
    const dynamic = /^⟦([^|]+)\|([^⟧]+)⟧$/.exec(part);
    return dynamic
      ? { value: dynamic[1], scale: dynamic[2], segments: [] }
      : { value: undefined, scale: undefined, segments: splitCardKeywords(part) };
  }), [text]);
  return (
    <>
      {parts.map((part, partIndex) => {
        if (part.value !== undefined) return <span key={`dynamic-${partIndex}`} className={s.dynamic}>{altHeld ? part.scale : part.value}</span>;
        return <span key={`text-${partIndex}`}>{part.segments.map((segment, index) =>
        segment.keyword ? (
          <b key={`${segment.text}-${index}`} className={s.kw}>
            {segment.text}
          </b>
        ) : (
          <span key={`${segment.text}-${index}`}>{segment.text}</span>
        ),
      )}</span>;
      })}
    </>
  );
}
