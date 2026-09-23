import { cx } from "@/ui/common/shared/cx";
import type { TechnologyNode } from "@/ui/common/techTree/TechnologyTree/types";
import s from "./TechnologyFooter.module.css";

interface Props {
  credits: number;
  completed: number;
  total: number;
  selected: TechnologyNode | null;
  /** 不传则不渲染返回按钮。 */
  returnLabel?: string;
  /** 进度读数口径，缺省为「已解锁节点」。 */
  progressLabel?: string;
  progressValue?: string;
  onResearch: (id: string) => void;
  onClose?: () => void;
  className?: string;
}

function actionLabelOf(selected: TechnologyNode | null): string {
  if (!selected) return "解锁节点";
  if (selected.actionLabel) return selected.actionLabel;
  switch (selected.state) {
    case "done": return "已解锁";
    case "locked": return "前置未解锁";
    case "lacking": return "材料不足";
    default: return "解锁节点";
  }
}

export function TechnologyFooter({
  credits,
  completed,
  total,
  selected,
  returnLabel,
  progressLabel = "已解锁节点",
  progressValue,
  onResearch,
  onClose,
  className,
}: Props) {
  return (
    <footer className={cx(s.footer, className)}>
      <div className={s.progress}>
        <strong className={s.heading}>研发进度信息</strong>
        <span className={s.readout}>可用积分：<b>{credits}</b></span>
        <span className={s.readout}>{progressLabel}：<em>{progressValue ?? `${completed} / ${total}`}</em></span>
      </div>
      <div className={s.actions}>
        <button className={s.action} type="button" disabled={selected?.state !== "available"} onClick={() => selected && onResearch(selected.id)}>
          <span className={s.symbol} aria-hidden="true">⟳</span>
          <strong>{actionLabelOf(selected)}</strong>
          {selected && <span className={s.cost}>{selected.costLabel}</span>}
        </button>
        {returnLabel && onClose && (
          <button className={cx(s.action, s.return)} type="button" onClick={onClose}>
            <svg className={s.backArrow} viewBox="0 0 36 36" aria-hidden="true"><path d="M22 4 8 18l14 14M8 18h24" /></svg>
            <strong>{returnLabel}</strong>
          </button>
        )}
      </div>
    </footer>
  );
}
