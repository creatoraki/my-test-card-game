import type { SortieStep } from "@/store/sortie/sortieStore";
import { SortieFrame } from "@/ui/sortie/SortieFrame";
import { SortieGlyph } from "@/ui/sortie/SortieGlyph";
import s from "./SortieNav.module.css";

/** rest = 静息(首次挂载时播一次升起); enter = 步骤过场里的新一组; exit = 退场中的旧一组。
 *  ★ 过场中的输入屏蔽交给 CSS 的 pointer-events, 不走 disabled —— disabled 自带半透明,
 *    过场结束摘掉时按钮会闪一下亮度。disabled 只表达真实状态(不可确认 / 已出击)。 */
export type NavGroupPhase = "rest" | "enter" | "exit";

interface Props {
  step: SortieStep;
  phase: NavGroupPhase;
  disabled: boolean;
  canConfirmMap: boolean;
  onBack: () => void;
  onNext: () => void;
}

export function SortieNavButtons({ step, phase, disabled, canConfirmMap, onBack, onNext }: Props) {
  const exiting = phase === "exit";
  const nextDisabled = disabled || (step === "map" && !canConfirmMap);

  return (
    <div className={s.group} data-step={step} data-phase={phase} aria-hidden={exiting || undefined}>
      <button
        className={s.back}
        type="button"
        data-sfx="back"
        onClick={onBack}
        disabled={disabled}
        tabIndex={exiting ? -1 : undefined}
      >
        <SortieFrame width={step === "map" ? 216 : 280} height={56} notch={10} />
        <span className={s.buttonCopy}>
          <SortieGlyph name="back" className={s.buttonIcon} />{step === "map" ? "返回据点" : "返回选择目标层"}
        </span>
      </button>
      <button
        className={s.confirm}
        type="button"
        data-sfx="confirm"
        onClick={onNext}
        disabled={nextDisabled}
        tabIndex={exiting ? -1 : undefined}
      >
        <SortieFrame width={206} height={56} notch={10} selected={step === "map" && !nextDisabled} />
        <span className={s.buttonCopy}>
          {step === "map" ? "确认" : "出击"}<SortieGlyph name="next" className={s.buttonIcon} />
        </span>
      </button>
    </div>
  );
}
