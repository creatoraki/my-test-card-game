import s from "./SettingsGearButton.module.css";

export interface SettingsGearButtonProps {
  onClick: () => void;
}

export function SettingsGearButton({ onClick }: SettingsGearButtonProps) {
  return (
    <button className={s.button} type="button" aria-label="打开据点设置" onClick={onClick}>
      <svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M42 27.2v-6.4l-4.3-1.1a14.7 14.7 0 0 0-1.2-2.9l2.3-3.8-4.5-4.5-3.8 2.3c-.9-.5-1.9-.9-2.9-1.2L26.5 5h-5l-1.1 4.6c-1 .3-2 .7-2.9 1.2l-3.8-2.3-4.5 4.5 2.3 3.8c-.5.9-.9 1.9-1.2 2.9L6 20.8v6.4l4.3 1.1c.3 1 .7 2 1.2 2.9l-2.3 3.8 4.5 4.5 3.8-2.3c.9.5 1.9.9 2.9 1.2l1.1 4.6h5l1.1-4.6c1-.3 2-.7 2.9-1.2l3.8 2.3 4.5-4.5-2.3-3.8c.5-.9.9-1.9 1.2-2.9z"
          strokeWidth="1.6"
        />
        <circle cx="24" cy="24" r="5.2" strokeWidth="1.8" />
      </svg>
    </button>
  );
}
