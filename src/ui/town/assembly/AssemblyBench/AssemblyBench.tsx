import type { Card } from "@/engine";
import { canEquipModule, getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import type { PointerEvent as ReactPointerEvent } from "react";
import { itemIcon } from "@/ui/art/itemArt";
import { cx } from "@/ui/common/cx";
import s from "./AssemblyBench.module.css";

interface Props {
  card?: Card;
  installedStack: ItemStack | null;
  candidate: ItemStack | null;
  className?: string;
  onShowTooltip?: (event: ReactPointerEvent<HTMLDivElement>, stack: ItemStack) => void;
  onHideTooltip?: () => void;
}

export function AssemblyBench({ card, installedStack, candidate, className, onShowTooltip, onHideTooltip }: Props) {
  const candidateUsable = Boolean(card && candidate && canEquipModule(card, candidate.itemId));
  const state = installedStack
    ? "installed"
    : candidate && !candidateUsable
      ? "invalid"
      : candidateUsable
        ? "ready"
        : "empty";
  const moduleStack = installedStack ?? candidate;

  return (
    <section className={cx(s.bench, className)} data-state={state} aria-label="中央装配台">
      <div className={s.benchGrid} aria-hidden="true" />
      <div className={s.benchFrame} aria-hidden="true">
        <span>01</span>
        <span>BENCH<br />STATUS</span>
      </div>
      <svg className={s.benchDiagram} viewBox="0 0 480 360" fill="none" aria-hidden="true">
        <path className={s.diagramCard} d="M36 82h74l17 17v162l-17 17H36l-17-17V99Z" />
        <path className={s.diagramCardDetail} d="M39 113h48M39 132h34M39 151h55M39 215h37" />
        <path className={s.diagramPipe} d="M127 180h73m150 0h74" />
        <path className={s.diagramPipeNode} d="M184 180h16v-16h80v16h16" />
        <path className={s.diagramModule} d="m352 99 46 26v110l-46 26-46-26V125Z" />
        <path className={s.diagramModuleDetail} d="m352 133 20 12v40l-20 12-20-12v-40Z" />
        <circle className={s.diagramCore} cx="352" cy="165" r="6" />
      </svg>

      <div className={s.cardNode}>
        <span className={s.nodeKicker}>CARD INSTANCE</span>
        <strong>{card?.name ?? "NO CARD"}</strong>
      </div>
      <div className={s.moduleNode}>
        <span className={s.nodeKicker}>MODULE INPUT</span>
        {moduleStack ? <span className={s.moduleIcon}>{itemIcon(getItemDef(moduleStack.itemId))}</span> : <strong>NO MODULE</strong>}
        {candidate && !candidateUsable && !installedStack && <small>TYPE MISMATCH</small>}
      </div>
      <div
        className={s.benchSlot}
        onPointerEnter={(event) => installedStack && onShowTooltip?.(event, installedStack)}
        onPointerLeave={onHideTooltip}
      >
        {installedStack ? (
          <span className={s.slotIcon}>{itemIcon(getItemDef(installedStack.itemId))}</span>
        ) : (
          <span className={s.slotOrb} aria-hidden="true" />
        )}
        <span className={s.slotLabel}>{installedStack ? "INSTALLED" : "SLOT / A-01"}</span>
      </div>
      <div className={s.benchCaption}>
        <span>ARCHIVE / {card?.name ?? "UNASSIGNED"}</span>
        <strong>{state === "invalid" ? "MODULE REJECTED" : state === "empty" ? "AWAITING INPUT" : "LINK READY"}</strong>
      </div>
    </section>
  );
}