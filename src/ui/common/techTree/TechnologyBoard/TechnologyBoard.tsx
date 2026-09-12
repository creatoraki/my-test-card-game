import { cx } from "@/ui/common/cx";
import { TechnologyDetail } from "@/ui/common/techTree/TechnologyDetail";
import { TechnologyFooter } from "@/ui/common/techTree/TechnologyFooter";
import { TechnologyGraph } from "@/ui/common/techTree/TechnologyGraph";
import type { TechnologyCore, TechnologyNode } from "../TechnologyTree/types";
import s from "./TechnologyBoard.module.css";

export interface TechnologyBoardProps {
  nodes: TechnologyNode[];
  core: TechnologyCore;
  canvas: { width: number; height: number };
  selectedId: string | null;
  credits: number;
  returnLabel: string;
  onSelect: (id: string) => void;
  onResearch: (id: string) => void;
  onClose: () => void;
  className?: string;
}

/** 无外框科技树主体，供已有窗口容器嵌入。 */
export function TechnologyBoard({ nodes, core, canvas, selectedId, credits, returnLabel, onSelect, onResearch, onClose, className }: TechnologyBoardProps) {
  const selected = nodes.find((node) => node.id === selectedId) ?? null;
  const completed = nodes.filter((node) => node.state === "done").length;

  return (
    <div className={cx(s.board, className)}>
      <div className={s.body}>
        <TechnologyGraph nodes={nodes} core={core} canvas={canvas} selectedId={selectedId} onSelect={onSelect} />
        <TechnologyDetail node={selected} />
      </div>
      <TechnologyFooter credits={credits} completed={completed} total={nodes.length} selected={selected} returnLabel={returnLabel} onResearch={onResearch} onClose={onClose} />
    </div>
  );
}
