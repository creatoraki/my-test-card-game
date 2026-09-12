import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { ItemStack } from "@/items/types";
import { cx } from "@/ui/common/cx";
import { TechnologyTree } from "@/ui/common/techTree/TechnologyTree";
import { SHOP_TECHNOLOGY_CANVAS, SHOP_TECHNOLOGY_CORE, shopTechnologyNodes } from "@/ui/town/shop/MarketPanel/UpgradeTree";
import s from "./MarketUpgradePanel.module.css";

interface Props {
  level: number;
  credits: number;
  doneTechs: string[];
  storage: ItemStack[];
  host: HTMLElement;
  origin: { x: number; y: number };
  closing: boolean;
  onResearch: (techId: string) => void;
  onClose: () => void;
  onClosed: () => void;
}

export function MarketUpgradePanel({ level, credits, doneTechs, storage, host, origin, closing, onResearch, onClose, onClosed }: Props) {
  const nodes = useMemo(() => shopTechnologyNodes(doneTechs, storage), [doneTechs, storage]);
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    nodes.find((node) => node.state === "available")?.id
    ?? nodes.find((node) => node.state === "lacking")?.id
    ?? nodes[0]?.id ?? null,
  );

  useEffect(() => {
    if (!closing) return;
    const timeout = window.setTimeout(onClosed, 520);
    return () => window.clearTimeout(timeout);
  }, [closing, onClosed]);

  return createPortal(
    <div
      className={cx(s.overlay, closing && s.closing)}
      style={{ "--from-x": `${origin.x}px`, "--from-y": `${origin.y}px` } as CSSProperties}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget && closing) onClosed();
      }}
    >
      <TechnologyTree
        title="设施升级"
        description="解锁商店科技，提升补货效率与货架容量。"
        credits={credits}
        level={level}
        nodes={nodes}
        core={SHOP_TECHNOLOGY_CORE}
        canvas={SHOP_TECHNOLOGY_CANVAS}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onResearch={onResearch}
        onClose={onClose}
        returnLabel="返回商店"
      />
    </div>,
    host,
  );
}
