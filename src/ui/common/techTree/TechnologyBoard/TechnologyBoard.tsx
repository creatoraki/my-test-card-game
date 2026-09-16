import { cx } from "@/ui/common/cx";
import { TechnologyDetail } from "@/ui/common/techTree/TechnologyDetail";
import { TechnologyFooter } from "@/ui/common/techTree/TechnologyFooter";
import { TechnologyGraph } from "@/ui/common/techTree/TechnologyGraph";
import { TechnologyTabs } from "@/ui/common/techTree/TechnologyTabs";
import type { TechnologyCore, TechnologyNode, TechnologyTab } from "../TechnologyTree/types";
import s from "./TechnologyBoard.module.css";

export interface TechnologyBoardProps {
  nodes: TechnologyNode[];
  core: TechnologyCore;
  canvas: { width: number; height: number };
  selectedId: string | null;
  credits: number;
  /** 不传则不渲染返回按钮（常驻页内不需要返回）。 */
  returnLabel?: string;
  onSelect: (id: string) => void;
  onResearch: (id: string) => void;
  onClose?: () => void;
  /** 顶部分类页签；不传则整行不渲染，布局与单树调用方完全一致。 */
  tabs?: readonly TechnologyTab[];
  activeTabId?: string;
  onTabChange?: (id: string) => void;
  tabsLabel?: string;
  /** 进度读数的自定义口径，例如多级科技树的「已投入等级」。 */
  progressLabel?: string;
  progressValue?: string;
  className?: string;
}

/** 无外框科技树主体，供已有窗口容器嵌入。 */
export function TechnologyBoard({
  nodes,
  core,
  canvas,
  selectedId,
  credits,
  returnLabel,
  onSelect,
  onResearch,
  onClose,
  tabs,
  activeTabId,
  onTabChange,
  tabsLabel = "科技分类",
  progressLabel,
  progressValue,
  className,
}: TechnologyBoardProps) {
  const selected = nodes.find((node) => node.id === selectedId) ?? null;
  const completed = nodes.filter((node) => node.state === "done").length;
  const showTabs = !!tabs?.length && !!activeTabId && !!onTabChange;

  return (
    <div className={cx(s.board, showTabs && s["has-tabs"], className)}>
      {showTabs && (
        <TechnologyTabs tabs={tabs} activeId={activeTabId} ariaLabel={tabsLabel} onChange={onTabChange} />
      )}
      <div className={s.body}>
        <TechnologyGraph nodes={nodes} core={core} canvas={canvas} selectedId={selectedId} onSelect={onSelect} />
        <TechnologyDetail node={selected} />
      </div>
      <TechnologyFooter
        credits={credits}
        completed={completed}
        total={nodes.length}
        selected={selected}
        returnLabel={returnLabel}
        progressLabel={progressLabel}
        progressValue={progressValue}
        onResearch={onResearch}
        onClose={onClose}
      />
    </div>
  );
}
