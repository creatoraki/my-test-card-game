import type { SortieStep } from "@/store/sortieStore";
import { SortieFrame } from "@/ui/sortie/SortieFrame";
import { SortieGlyph } from "@/ui/sortie/SortieGlyph";
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
  const backLabel = step === "map" ? "返回据点" : "返回选择目标层";

  return (
    <nav className={s.nav} data-step={step} aria-label="出击流程导航">
      <button
        className={s.back}
        type="button"
        data-sfx="back"
        onClick={onBack}
        disabled={disabled}
      >
        <SortieFrame width={step === "map" ? 216 : 280} height={56} notch={10} />
        <span className={s.buttonCopy}>
          <SortieGlyph name="back" className={s.buttonIcon} />{backLabel}
        </span>
      </button>
      <button
        className={s.confirm}
        type="button"
        data-sfx="confirm"
        onClick={onNext}
        disabled={nextDisabled}
      >
        <SortieFrame width={206} height={56} notch={10} selected={step === "map" && !nextDisabled} />
        <span className={s.buttonCopy}>
          {step === "map" ? "确认" : "出击"}<SortieGlyph name="next" className={s.buttonIcon} />
        </span>
      </button>
    </nav>
  );
}
