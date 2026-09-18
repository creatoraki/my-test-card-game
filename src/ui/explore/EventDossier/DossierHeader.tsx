import type { CSSProperties } from "react";
import s from "./DossierHeader.module.css";

/** 大标题按设计图 98px 排 5 个字；更长的名字等比缩小，始终落在 496 宽的标题框内。 */
const TITLE_MAX_WIDTH = 480;
const TITLE_SIZE = 98;

function titleSize(title: string): number {
  return Math.min(TITLE_SIZE, Math.floor(TITLE_MAX_WIDTH / Math.max(1, [...title].length)));
}

/** 页眉(EVENT 标签 + 位置) 与大标题区(标题括号框 + 渐变大字 + 英文副标题)。 */
export function DossierHeader({ kicker, title, enTitle }: { kicker: string; title: string; enTitle: string }) {
  return (
    <>
      <div className={s.tag}>
        <svg viewBox="0 0 88 28" aria-hidden>
          <path className={s.tagFill} d="M.75.75h86.3L78 27.25H.75Z" />
          <path className={s.tagBlock} d="M0 0h6v28H0Z" />
        </svg>
        <span>EVENT</span>
      </div>
      <p className={s.kicker}>{kicker}</p>
      <i className={s.kickerRule} aria-hidden />
      <i className={s.tagDots} aria-hidden />

      <svg className={s.titleFrame} viewBox="0 0 496 164" aria-hidden>
        <defs>
          <linearGradient id="dossier-title-frame" x1="0" x2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.55" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path className={s.frameLine} stroke="url(#dossier-title-frame)" d="M32 .5h464M.5 32v131.5h495" />
        <path className={s.frameAccent} d="M.5 32 32 .5M60 .5h24M.5 150v13.5h22" />
      </svg>
      <h2 className={s.title} style={{ "--title-size": `${titleSize(title)}px` } as CSSProperties}>{title}</h2>
      <p className={s.enTitle} aria-hidden>{enTitle}</p>
    </>
  );
}
