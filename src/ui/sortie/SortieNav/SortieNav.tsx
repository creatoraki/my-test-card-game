import type { SortieStep } from "@/store/sortieStore";
import s from "./SortieNav.module.css";

interface Props {
  step: SortieStep;
  disabled: boolean;
  canConfirmMap: boolean;
  onBackToTown: () => void;
  onBackToMap: () => void;
  onConfirmMap: () => void;
  onStartExpedition: () => void;
}

export function SortieNav({
  step,
  disabled,
  canConfirmMap,
  onBackToTown,
  onBackToMap,
  onConfirmMap,
  onStartExpedition,
}: Props) {
  const onBack = step === "map" ? onBackToTown : onBackToMap;
  const onNext = step === "map" ? onConfirmMap : onStartExpedition;
  const nextDisabled = disabled || (step === "map" && !canConfirmMap);
  const backLabel = disabled
    ? step === "map"
      ? "← 返回选择目标层"
      : "← 返回据点"
    : step === "map"
      ? "← 返回据点"
      : "← 返回选择目标层";

  return (
    <nav className={s.nav} data-step={step} aria-label="出击流程导航">
      <button
        className={s.back}
        type="button"
        onClick={onBack}
        disabled={disabled}
      >
        <span className={s.buttonCopy}>
          {backLabel}
        </span>
      </button>
      <button
        className={s.confirm}
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
      >
        <span className={s.buttonCopy}>
          {step === "map" ? "确认" : "出击"} <span aria-hidden>▸</span>
        </span>
      </button>
    </nav>
  );
}