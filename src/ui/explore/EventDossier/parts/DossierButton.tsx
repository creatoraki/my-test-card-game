import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { cx } from "@/ui/common/shared/cx";
import { ChevronGlyph, DossierIcon, type DossierIconName } from "./DossierIcons";
import s from "./DossierButton.module.css";

export interface DossierAction {
  id: string;
  label: ReactNode;
  icon: DossierIconName;
  /** 标签下方的一行小字，例如首领门的"开启后无法返回"。 */
  cost?: ReactNode;
  costTone?: "cyan" | "red";
  /** primary = 常亮的主色实心按钮；danger = 红色描边的危险操作。默认暗色。 */
  tone?: "primary" | "danger";
  disabled?: boolean;
  /** 返回/离开类按钮使用 back 音效。 */
  sfx?: "confirm" | "back";
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function DossierButton({ action, index }: { action: DossierAction; index: number }) {
  return (
    <button
      type="button"
      className={s.button}
      data-tone={action.tone}
      disabled={action.disabled}
      data-sfx={action.sfx}
      style={{ "--enter-delay": `${index * 60 + 120}ms` } as CSSProperties}
      onClick={action.onClick}
    >
      <span className={s.plate} aria-hidden />
      <span className={s.icon}><DossierIcon name={action.icon} /></span>
      <span className={s.text}>
        <strong>{action.label}</strong>
        {action.cost && <em className={cx(s.cost, action.costTone === "red" && s.costRed)}>{action.cost}</em>}
      </span>
      <span className={s.arrow}><ChevronGlyph /></span>
    </button>
  );
}

/** 右下角两列按钮网格：锚定底边，按钮多于 4 个时向上长行并让出左侧信息框。 */
export function DossierActionGrid({ actions, reserveInfo = false }: { actions: DossierAction[]; reserveInfo?: boolean }) {
  return (
    <div className={s.grid} data-dense={actions.length > 4 || undefined} data-info={reserveInfo || undefined}>
      {actions.map((action, index) => <DossierButton key={action.id} action={action} index={index} />)}
    </div>
  );
}
