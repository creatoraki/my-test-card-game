import type { ReactNode } from "react";

export type SortieGlyphName = "beacon" | "lock" | "skull" | "abyss" | "gift" | "box" | "sliders" | "link" | "back" | "next";

const paths: Record<SortieGlyphName, ReactNode> = {
  beacon: <><path d="m24 3 8 16 11 5-11 5-8 16-8-16L5 24l11-5Z" /><path d="m24 12 4 12-4 12-4-12Z" fill="currentColor" stroke="none" /><path d="m8 24 8-2m16 4 8-2" /></>,
  lock: <><path d="M16 22v-8a8 8 0 0 1 16 0v8" strokeWidth="3.5" /><path d="M12 21h24v23H12z" fill="currentColor" stroke="none" /><path d="M24 29v8" stroke="#10202b" strokeWidth="3" /><circle cx="24" cy="29" r="3" fill="#10202b" stroke="none" /></>,
  skull: <><path d="M24 4C11 4 6 13 8 25l6 7v8l6 3 4-3 4 3 6-3v-8l6-7C42 13 37 4 24 4Z" fill="currentColor" stroke="none" /><path d="m13 20 8 3-3 6-6-3Zm22 0-8 3 3 6 6-3ZM24 29l-3 5h6Z" fill="#0c151c" stroke="none" /><path d="M19 35v6m5-6v5m5-5v6" stroke="#0c151c" /></>,
  abyss: <><path d="M15 17C6 14 5 9 7 4-1 13 5 23 14 25m19-8c9-3 10-8 8-13 8 9 2 19-7 21" fill="currentColor" stroke="none" /><path d="M24 10c-10 0-15 7-13 16l5 6v8l5 3 3-4 3 4 5-3v-8l5-6c2-9-3-16-13-16Z" fill="currentColor" stroke="none" /><path d="m15 23 7 2-4 5-4-4Zm18 0-7 2 4 5 4-4ZM24 30l-3 5h6Z" fill="#0c151c" stroke="none" /></>,
  gift: <><path d="M6 20h36v8H6zm4 8v16h28V28M24 20v24" strokeWidth="3" /><path d="M24 19C9 20 9 7 15 7c6 0 9 12 9 12Zm0 0C39 20 39 7 33 7c-6 0-9 12-9 12Z" strokeWidth="3" /></>,
  box: <><path d="m5 13 19-8 19 8-19 8Zm3 9v17l16 6 16-6V22M24 22v23M15 10l19 8M15 26v7m18-7v7" strokeWidth="3" /></>,
  sliders: <><path d="M12 5v38M24 5v38M36 5v38M7 15h10m2 18h10m2-22h10" strokeWidth="3" /></>,
  link: <><path d="m19 29-3 3a7 7 0 0 1-10-10L19 9a7 7 0 0 1 10 10l-3 3m3-3 3-3a7 7 0 0 1 10 10L29 39a7 7 0 0 1-10-10l3-3M16 32l16-16" strokeWidth="3" /></>,
  back: <path d="M39 24H9m12-12L9 24l12 12" strokeWidth="3" />,
  next: <path d="m12 12 12 12-12 12m12-24 12 12-12 12" strokeWidth="2.6" />,
};

export function SortieGlyph({ name, className }: { name: SortieGlyphName; className?: string }) {
  return <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
