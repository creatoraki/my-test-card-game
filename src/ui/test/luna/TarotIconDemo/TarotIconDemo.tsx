import { useState, type ReactNode } from "react";
import s from "./TarotIconDemo.module.css";

type TarotId = "strength" | "chariot" | "fool" | "priestess" | "judgement" | "tower";

type TarotCard = {
  id: TarotId;
  name: string;
  roman: string;
  code: string;
  accent: string;
  description: string;
  backdrop: ReactNode;
  art: ReactNode;
};

const TAROT_CARDS: TarotCard[] = [
  {
    id: "strength",
    name: "力量",
    roman: "VIII",
    code: "ARC / 08",
    accent: "#d6f238",
    description: "稳定的意志，驯服失控的能量。",
    backdrop: (
      <>
        <ellipse cx="32" cy="32" rx="24" ry="15" transform="rotate(-24 32 32)" strokeWidth={0.9} strokeDasharray="1 3" />
      </>
    ),
    art: (
      <>
        <circle cx="32" cy="31" r="21" strokeWidth={0.8} strokeDasharray="1 4" opacity={0.45} />
        <path d="m32 11 5.3 9.4 10.7 2.2-7.4 7.7 1.3 10.9L32 37l-9.9 4.2 1.3-10.9-7.4-7.7 10.7-2.2Z" strokeWidth={1.6} />
        <path d="m32 20 8 11-8 14-8-14Z" strokeWidth={1.2} />
        <path d="M14 28c3-5 6-7 10-8M50 28c-3-5-6-7-10-8M16 41c4 4 9 6 16 6s12-2 16-6" strokeWidth={1.1} opacity={0.78} />
        <path d="m28 31 4-4 4 4-4 7Z" fill="currentColor" stroke="none" opacity={0.34} />
        <circle cx="13" cy="28" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="51" cy="28" r="1.5" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    id: "chariot",
    name: "战车",
    roman: "VII",
    code: "ARC / 07",
    accent: "#ff9d4d",
    description: "向前的冲势，把分裂的方向拉成一线。",
    backdrop: (
      <>
        <path d="m32 5 25 27-25 27L7 32Z" strokeWidth={0.9} strokeDasharray="1 3" />
      </>
    ),
    art: (
      <>
        <path d="m32 9 15 10v26L32 55 17 45V19Z" strokeWidth={1.55} />
        <path d="M25 24h14l5 8-5 8H25l-5-8Z" strokeWidth={1.3} />
        <path d="M25 32h16M35 26l7 6-7 6" strokeWidth={1.45} />
        <circle cx="11" cy="32" r="4.5" strokeWidth={1.2} />
        <circle cx="53" cy="32" r="4.5" strokeWidth={1.2} />
        <path d="M6.5 32H3M60.5 32H57" strokeWidth={1.05} opacity={0.72} />
      </>
    ),
  },
  {
    id: "fool",
    name: "愚者",
    roman: "0",
    code: "ARC / 00",
    accent: "#63d6d1",
    description: "在未知边缘迈步，轻装而不失方向。",
    backdrop: (
      <>
        <path d="M11 18c8-10 25-12 37-3 7 7 4 17-5 19-10 2-17-6-13-13 4-7 17-8 25 2" strokeWidth={0.9} strokeDasharray="1 3" />
      </>
    ),
    art: (
      <>
        <path d="M11 44c4-8 8-13 15-17 7-4 13-8 17-16" strokeWidth={1.2} strokeDasharray="1 3" opacity={0.72} />
        <path d="m38 9 8 5-1 10-8 5-8-5 1-10Z" strokeWidth={1.55} />
        <path d="m38 9 2 9-3 11M38 9l-8 5 7 4 8-4M31 18l6 2 7-6" strokeWidth={1.05} opacity={0.82} />
        <path d="m38 15 3 3-3 4-3-4Z" fill="currentColor" stroke="none" opacity={0.5} />
        <path d="M16 42h31M20 38h13M25 34h8" strokeWidth={1.35} />
        <circle cx="11" cy="44" r="2" strokeWidth={1.1} />
        <path d="m15 14 2-5 2 5 5 2-5 2-2 5-2-5-5-2Z" strokeWidth={1.05} opacity={0.74} />
      </>
    ),
  },
  {
    id: "priestess",
    name: "女祭司",
    roman: "II",
    code: "ARC / 02",
    accent: "#b18ac8",
    description: "帷幕之后的静默知识，等待被看见。",
    backdrop: (
      <>
        <path d="M16 7c-9 8-9 19 0 25s9 17 0 25M48 7c9 8 9 19 0 25s-9 17 0 25" strokeWidth={0.9} />
      </>
    ),
    art: (
      <>
        <path d="M12 49V17l20-9 20 9v32" strokeWidth={1.45} />
        <path d="M18 49V21l14-7 14 7v28M32 8v41" strokeWidth={1.05} opacity={0.82} />
        <path d="M22 30c3.2-5.2 16.8-5.2 20 0-3.2 5.2-16.8 5.2-20 0Z" strokeWidth={1.55} />
        <circle cx="32" cy="30" r="3.2" strokeWidth={1.25} />
        <path d="M32 26.8V33.2M28.8 30h6.4M16 21l7 4M48 21l-7 4M17 43h7M47 43h-7" strokeWidth={1.05} opacity={0.78} />
        <path d="m32 28 2 2-2 2-2-2Z" fill="currentColor" stroke="none" opacity={0.48} />
      </>
    ),
  },
  {
    id: "judgement",
    name: "审判",
    roman: "XX",
    code: "ARC / 20",
    accent: "#f783ac",
    description: "旧信号穿透噪声，唤醒被封存的答案。",
    backdrop: (
      <>
        <path d="M7 33c7-15 15-22 25-22s18 7 25 22c-7 15-15 22-25 22S14 48 7 33Z" strokeWidth={0.9} />
        <path d="M13 33c5-9 11-14 19-14s14 5 19 14" strokeWidth={0.6} strokeDasharray="1 3" opacity={0.46} />
      </>
    ),
    art: (
      <>
        <path d="M32 8v8M32 48v8M8 32h8M48 32h8" strokeWidth={1.15} opacity={0.72} />
        <path d="m32 12 8 10v18l-8 12-8-12V22Z" strokeWidth={1.6} />
        <path d="m32 20 5 6v10l-5 7-5-7V26Z" strokeWidth={1.1} opacity={0.82} />
        <path d="m32 23 3 5-3 6-3-6Z" fill="currentColor" stroke="none" opacity={0.46} />
        <path d="M17 18c4 2 6 5 6 9M13 13c7 3 11 8 11 15M47 18c-4 2-6 5-6 9M51 13c-7 3-11 8-11 15" strokeWidth={1.35} />
        <circle cx="17" cy="18" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="47" cy="18" r="1.6" fill="currentColor" stroke="none" />
        <path d="M20 49h24M24 53h16" strokeWidth={1.2} opacity={0.8} />
      </>
    ),
  },
  {
    id: "tower",
    name: "高塔",
    roman: "XVI",
    code: "ARC / 16",
    accent: "#ff6c5c",
    description: "结构在闪光中崩解，真相从裂缝中露出。",
    backdrop: (
      <>
        <path d="m32 6 12 5 12 9-3 15-10 15-11 8-13-8-10-15-3-15 12-9Z" strokeWidth={0.9} strokeDasharray="1 3" />
        <path d="m32 15 8 4 7 6-2 8-6 9-7 5" strokeWidth={0.6} opacity={0.48} />
      </>
    ),
    art: (
      <>
        <path d="m22 48 3-24 7-9 7 9 3 24Z" strokeWidth={1.55} />
        <path d="m25 24 7 4 7-4M27 32l5 3 5-3M25 41l7-4 7 4" strokeWidth={1.05} opacity={0.78} />
        <path d="m32 4-5 9h5l-4 8 9-11h-5Z" strokeWidth={1.6} strokeLinejoin="round" />
        <path d="m17 51 5-3M47 51l-5-3M12 45l5-2M52 45l-5-2" strokeWidth={1.2} />
        <path d="M16 12 22 8M48 12l-6-4M10 29l7 2M54 29l-7 2" strokeWidth={1.05} opacity={0.72} />
        <path d="m32 29 3 3-3 5-3-5Z" fill="currentColor" stroke="none" opacity={0.42} />
      </>
    ),
  },
];

function TarotArtwork({ card }: { card: TarotCard }) {
  return (
    <svg className={s.artwork} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-label={`${card.name}图案`} role="img">
      <g className={s.artShadow} transform="translate(0 1.2)">{card.art}</g>
      <g>{card.art}</g>
    </svg>
  );
}

function TarotBackdrop({ card }: { card: TarotCard }) {
  return (
    <svg className={s.backdrop} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {card.backdrop}
    </svg>
  );
}

export function TarotIconDemo() {
  const [activeId, setActiveId] = useState<TarotId>("strength");
  const activeCard = TAROT_CARDS.find((card) => card.id === activeId) ?? TAROT_CARDS[0];

  return (
    <section className={s.root} style={{ "--active-accent": activeCard.accent } as React.CSSProperties}>
      <header className={s.header}>
        <div>
          <span className={s.kicker}>LUNA / TAROT ICON STUDY</span>
          <h1>塔罗牌图标</h1>
          <p>以事件插图占位区的扫描网格与线框光效，整理六枚 1:1 题材图标。</p>
        </div>
        <div className={s.headerStamp}>
          <span>VECTOR PLATE</span>
          <strong>06 / 06</strong>
        </div>
      </header>

      <div className={s.content}>
        <div className={s.cardGrid} role="list" aria-label="塔罗牌图标候选">
          {TAROT_CARDS.map((card, index) => (
            <button
              key={card.id}
              type="button"
              role="listitem"
              className={`${s.card} ${activeId === card.id ? s.cardActive : ""}`}
              style={{ "--card-accent": card.accent, "--card-index": index } as React.CSSProperties}
              onClick={() => setActiveId(card.id)}
              aria-pressed={activeId === card.id}
            >
              <span className={s.cardArt}>
                <span className={s.cardGridLines} />
                <span className={s.cardCorner}>0{index + 1}</span>
                <TarotBackdrop card={card} />
                <TarotArtwork card={card} />
              </span>
              <span className={s.cardMeta}>
                <span className={s.cardRoman}>{card.roman}</span>
                <strong>{card.name}</strong>
                <small>{card.code}</small>
              </span>
            </button>
          ))}
        </div>

        <aside className={s.detail} aria-live="polite">
          <div className={s.detailLabel}>SELECTED ARCHIVE / {activeCard.code}</div>
          <div className={s.statePreviewGroup}>
            <div
              className={`${s.card} ${s.stateCard} ${s.stateCardActive}`}
              style={{ "--card-accent": activeCard.accent } as React.CSSProperties}
              aria-label={`${activeCard.name}激活状态`}
            >
              <span className={s.cardArt}>
                <span className={s.cardGridLines} />
                <TarotBackdrop card={activeCard} />
                <TarotArtwork card={activeCard} />
                <span className={s.previewState}>ACTIVE</span>
              </span>
              <span className={s.stateCardMeta}>
                <strong>{activeCard.name}</strong>
                <span className={s.activeLevel}>
                  <small>LV</small>
                  <b>5</b>
                </span>
              </span>
            </div>
            <div
              className={`${s.card} ${s.stateCard} ${s.stateCardInactive}`}
              style={{ "--card-accent": activeCard.accent } as React.CSSProperties}
              aria-label={`${activeCard.name}未激活状态`}
            >
              <span className={s.cardArt}>
                <span className={s.cardGridLines} />
                <TarotBackdrop card={activeCard} />
                <TarotArtwork card={activeCard} />
                <span className={s.previewState}>INACTIVE</span>
              </span>
              <span className={s.stateCardMeta}>
                <strong>{activeCard.name}</strong>
                <small>未激活</small>
              </span>
            </div>
          </div>
          <div className={s.detailCopy}>
            <span>{activeCard.roman} / MAJOR ARCANA</span>
            <h2>{activeCard.name}</h2>
            <p>{activeCard.description}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}