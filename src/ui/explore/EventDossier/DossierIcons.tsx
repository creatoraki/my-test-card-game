/** 事件档案面板用到的内联图标。颜色一律走 currentColor，由按钮状态决定。 */

export type DossierIconName = "claim" | "upgrade" | "detail" | "leave" | "offer" | "back" | "confirm" | "bag" | "discard" | "warn";

export function DossierIcon({ name }: { name: DossierIconName }) {
  switch (name) {
    case "claim":
      return <svg viewBox="0 0 40 40" aria-hidden>
        <path fill="currentColor" d="M20 3 36 10v19l-16 8-16-8V10Zm0 4.4L9.6 11.6 20 16.2l10.4-4.6Zm-12 7.7v12.2l10 5v-12.6Zm14 4.6v12.6l10-5V15.1Z" />
        <path fill="currentColor" d="M11 20.5h4.4v6.2L11 24.5Zm13.6 0H29v4l-4.4 2.2Z" opacity="0.55" />
      </svg>;
    case "upgrade":
      return <svg viewBox="0 0 40 40" aria-hidden>
        <path fill="currentColor" d="M20 3 36 17.5l-4.6 4.4L20 11.6 8.6 21.9 4 17.5Z" />
        <path fill="currentColor" d="M20 18 36 32.5 31.4 37 20 26.6 8.6 37 4 32.5Z" />
      </svg>;
    case "detail":
      return <svg viewBox="0 0 40 40" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.6">
        <path d="M8 3.5h24v33H8Z" />
        <path d="M14 13h12M14 20h12M14 27h12" strokeLinecap="square" />
      </svg>;
    case "leave":
      return <svg viewBox="0 0 40 40" aria-hidden>
        <path fill="currentColor" d="M3 5 20 20 3 35ZM20 5l17 15-17 15Z" />
      </svg>;
    case "offer":
      return <svg viewBox="0 0 40 40" aria-hidden>
        <path fill="currentColor" d="M17 2h6v10h6L20 21l-9-9h6Z" />
        <path fill="currentColor" d="M4 20h9l4 5h6l4-5h9v17H4Zm4 4v9h24v-9h-3l-4 5H15l-4-5Z" />
      </svg>;
    case "back":
      return <svg viewBox="0 0 40 40" aria-hidden>
        <path fill="currentColor" d="M37 5 20 20l17 15ZM20 5 3 20l17 15Z" />
      </svg>;
    case "confirm":
      return <svg viewBox="0 0 40 40" aria-hidden fill="none" stroke="currentColor" strokeWidth="4">
        <path d="m6 21 9 9L34 10" strokeLinecap="square" />
      </svg>;
    case "bag":
      return <svg viewBox="0 0 40 40" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.6">
        <path d="M6 12h28v24H6Z" />
        <path d="M14 12V6h12v6M6 21h28M17 21v5h6v-5" />
      </svg>;
    case "discard":
      return <svg viewBox="0 0 40 40" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.6">
        <path d="M5 10h30M15 10V5h10v5M9 10l2 26h18l2-26" />
        <path d="M16 17v12M24 17v12" strokeLinecap="square" />
      </svg>;
    case "warn":
      return <svg viewBox="0 0 40 40" aria-hidden>
        <path fill="currentColor" d="M20 3 38 36H2Zm-2.4 11v11h4.8V14Zm0 14v4.4h4.8V28Z" fillRule="evenodd" />
      </svg>;
  }
}

export function ChevronGlyph() {
  return <svg viewBox="0 0 12 22" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.4">
    <path d="M1.5 1.5 10.5 11l-9 9.5" />
  </svg>;
}
