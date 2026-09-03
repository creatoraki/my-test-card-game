import s from "./CharacterNavigator.module.css";

interface Props {
  canPrevious: boolean;
  canNext: boolean;
  disabled?: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg className={s.icon} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      {direction === "left" ? (
        <path d="m18 7-8 9 8 9M11 16h11" />
      ) : (
        <path d="m14 7 8 9-8 9M21 16H11" />
      )}
    </svg>
  );
}

export function CharacterNavigator({
  canPrevious,
  canNext,
  disabled = false,
  onPrevious,
  onNext,
}: Props) {
  return (
    <nav className={s.navigator} aria-label="角色切换">
      <button
        className={`${s.button} ${s.previous}`}
        type="button"
        disabled={disabled || !canPrevious}
        onClick={onPrevious}
        aria-label="上一个角色"
      >
        <ArrowIcon direction="left" />
      </button>
      <button
        className={`${s.button} ${s.next}`}
        type="button"
        disabled={disabled || !canNext}
        onClick={onNext}
        aria-label="下一个角色"
      >
        <ArrowIcon direction="right" />
      </button>
    </nav>
  );
}