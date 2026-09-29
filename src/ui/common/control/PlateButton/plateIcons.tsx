/** 切角板按钮的内联图标。颜色一律走 currentColor, 由按钮状态决定。 */

export type PlateIconName = "reset" | "reward" | "restart" | "retreat" | "back" | "confirm" | "warn";

export function PlateIcon({ name }: { name: PlateIconName }) {
  switch (name) {
    case "reset":
      return <svg viewBox="0 0 40 40" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.6">
        <path d="M5 10h30M15 10V5h10v5M9 10l2 26h18l2-26" />
        <path d="M16 17v12M24 17v12" strokeLinecap="square" />
      </svg>;
    case "reward":
      return <svg viewBox="0 0 40 40" aria-hidden>
        <path fill="currentColor" d="M20 3 36 10v19l-16 8-16-8V10Zm0 4.4L9.6 11.6 20 16.2l10.4-4.6Zm-12 7.7v12.2l10 5v-12.6Zm14 4.6v12.6l10-5V15.1Z" />
        <path fill="currentColor" d="M11 20.5h4.4v6.2L11 24.5Zm13.6 0H29v4l-4.4 2.2Z" opacity="0.55" />
      </svg>;
    case "restart":
      return <svg viewBox="0 0 40 40" aria-hidden fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M32 20a12 12 0 1 1-4-8.9" strokeLinecap="square" />
        <path fill="currentColor" stroke="none" d="M35 4v12H23Z" />
      </svg>;
    case "retreat":
    case "back":
      return <svg viewBox="0 0 40 40" aria-hidden>
        <path fill="currentColor" d="M37 5 20 20l17 15ZM20 5 3 20l17 15Z" />
      </svg>;
    case "confirm":
      return <svg viewBox="0 0 40 40" aria-hidden fill="none" stroke="currentColor" strokeWidth="4">
        <path d="m6 21 9 9L34 10" strokeLinecap="square" />
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
