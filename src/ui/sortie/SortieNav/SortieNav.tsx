import { memo } from "react";
import type { SortieStep } from "@/store/sortie/sortieStore";
import { SortieNavButtons } from "./SortieNavButtons";
import s from "./SortieNav.module.css";

interface Props {
  step: SortieStep;
  /** 过场中正在退场的步骤: 它那一组按钮留下来演完下沉淡出。 */
  exitingStep: SortieStep | null;
  transitioning: boolean;
  /** 真实禁用(已出击)。过场期间的输入屏蔽由按钮组自己处理。 */
  disabled: boolean;
  canConfirmMap: boolean;
  onBackToTown: () => void;
  onBackToMap: () => void;
  onConfirmMap: () => void;
  onStartExpedition: () => void;
}

function SortieNav({
  step,
  exitingStep,
  transitioning,
  disabled,
  canConfirmMap,
  onBackToTown,
  onBackToMap,
  onConfirmMap,
  onStartExpedition,
}: Props) {
  const handlersOf = (target: SortieStep) => target === "map"
    ? { onBack: onBackToTown, onNext: onConfirmMap }
    : { onBack: onBackToMap, onNext: onStartExpedition };

  // ★ 两组都按 step 做 key: 旧的一组原地切到 exit 演退场, 新的一组挂载即升起 —— 不重挂载旧组。
  return (
    <nav className={s.nav} aria-label="出击流程导航">
      {exitingStep && exitingStep !== step && (
        <SortieNavButtons
          key={exitingStep}
          step={exitingStep}
          phase="exit"
          disabled={disabled}
          canConfirmMap={canConfirmMap}
          {...handlersOf(exitingStep)}
        />
      )}
      <SortieNavButtons
        key={step}
        step={step}
        phase={transitioning ? "enter" : "rest"}
        disabled={disabled}
        canConfirmMap={canConfirmMap}
        {...handlersOf(step)}
      />
    </nav>
  );
}

const MemoSortieNav = memo(SortieNav);
export { MemoSortieNav as SortieNav };
