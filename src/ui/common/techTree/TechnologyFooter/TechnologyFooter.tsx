import { cx } from "@/ui/common/cx";
import type { TechnologyNode } from "@/ui/common/techTree/TechnologyTree/types";
import s from "./TechnologyFooter.module.css";

interface Props {
  credits: number;
  completed: number;
  total: number;
  selected: TechnologyNode | null;
  returnLabel: string;
  onResearch: (id: string) => void;
  onClose: () => void;
  className?: string;
}

export function TechnologyFooter({ credits, completed, total, selected, returnLabel, onResearch, onClose, className }: Props) {
  const actionLabel = selected?.state === "done" ? "已解锁" : selected?.state === "locked" ? "前置未解锁" : selected?.state === "lacking" ? "材料不足" : "解锁节点";
  return (
    <footer className={cx(s.footer, className)}>
      <div className={s.progress}>
        <strong className={s.heading}>研发进度信息</strong>
        <span className={s.readout}>可用积分：<b>{credits}</b></span>
        <span className={s.readout}>已解锁节点：<em>{completed} / {total}</em></span>
      </div>
      <div className={s.actions}>
        <button className={s.action} type="button" disabled={selected?.state !== "available"} onClick={() => selected && onResearch(selected.id)}>
          <span className={s.symbol} aria-hidden="true">⟳</span>
          <strong>{actionLabel}</strong>
          {selected && <span className={s.cost}>{selected.costLabel}</span>}
        </button>
        <button className={cx(s.action, s.return)} type="button" onClick={onClose}>
          <svg className={s.backArrow} viewBox="0 0 36 36" aria-hidden="true"><path d="M22 4 8 18l14 14M8 18h24" /></svg>
          <strong>{returnLabel}</strong>
        </button>
      </div>
    </footer>
  );
}
