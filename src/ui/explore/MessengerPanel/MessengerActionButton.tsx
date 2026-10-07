import s from "./MessengerActionButton.module.css";

/** 信使面板专用的紫色细框按钮，尺寸由中文文案自然撑开。 */
export function MessengerActionButton({ confirm = false, disabled = false, onClick }: {
  confirm?: boolean; disabled?: boolean; onClick: () => void;
}) {
  return <button type="button" className={`${s.button} ${confirm ? s.confirm : s.cancel}`}
    disabled={disabled} onClick={onClick} data-sfx={confirm ? "confirm" : "back"}>
    <span className={s.content}>
      <svg viewBox="0 0 24 24" aria-hidden="true" className={s.icon}>
        {confirm ? <>
          <path d="M4 20L10 8L22 3L17 10L10 13L19 11L15 16L9 17L12 19L7 21L6 18Z" fill="currentColor" />
          <path d="M4 21L11 11L18 6" fill="none" stroke="var(--messenger-feather-line, #a383d8)" strokeWidth="1" />
        </> : <path d="M6 6L18 18M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
      </svg>
      <span>{confirm ? "确认投递" : "取消"}</span>
    </span>
  </button>;
}
