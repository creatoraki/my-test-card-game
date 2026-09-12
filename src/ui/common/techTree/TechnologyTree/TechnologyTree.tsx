import { useEffect, useRef } from "react";
import { cx } from "@/ui/common/cx";
import { DetailFrame } from "@/ui/common/DetailFrame";
import { TechnologyDetail } from "@/ui/common/techTree/TechnologyDetail";
import { TechnologyFooter } from "@/ui/common/techTree/TechnologyFooter";
import { TechnologyGraph } from "@/ui/common/techTree/TechnologyGraph";
import type { TechnologyCore, TechnologyNode } from "./types";
import s from "./TechnologyTree.module.css";

export interface TechnologyTreeProps {
  title: string;
  description: string;
  credits: number;
  level: number;
  nodes: TechnologyNode[];
  core: TechnologyCore;
  canvas: { width: number; height: number };
  selectedId: string | null;
  returnLabel?: string;
  onSelect: (id: string) => void;
  onResearch: (id: string) => void;
  onClose: () => void;
  className?: string;
}

/** 完整的受控科技树面板；节点状态、材料和效果均由调用方提供，不读取业务 store。 */
export function TechnologyTree({ title, description, credits, level, nodes, core, canvas, selectedId, returnLabel = "返回", onSelect, onResearch, onClose, className }: TechnologyTreeProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const selected = nodes.find((node) => node.id === selectedId) ?? null;
  const completed = nodes.filter((node) => node.state === "done").length;

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);

  return (
    <div ref={dialogRef} className={cx(s.panel, className)} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); onClose(); }
        if (event.key !== "Tab") return;
        const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first?.focus();
        }
      }}>
      <DetailFrame tone="gold" />
      <header className={s.header}>
        <h2 className={s.title}>{title}</h2>
        <p className={s.description}>{description}</p>
        <div className={s.credits}><span className={s.coin} aria-hidden="true">◈</span><strong>{credits}</strong><span>积分</span></div>
        <div className={s.level}><strong>等级 {level}</strong><span className={s.levelLine} /></div>
        <button className={s.close} type="button" onClick={onClose} aria-label={`关闭${title}`}>×</button>
      </header>
      <div className={s.body}>
        <TechnologyGraph nodes={nodes} core={core} canvas={canvas} selectedId={selectedId} onSelect={onSelect} />
        <TechnologyDetail node={selected} />
      </div>
      <TechnologyFooter credits={credits} completed={completed} total={nodes.length} selected={selected} returnLabel={returnLabel} onResearch={onResearch} onClose={onClose} />
    </div>
  );
}
