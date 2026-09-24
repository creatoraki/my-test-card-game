import { memo, type CSSProperties } from "react";
import { HoverTooltip, useHoverTooltip } from "@/ui/common/tooltip/HoverTooltip";
import { TooltipCard } from "@/ui/common/tooltip/TooltipCard";
import type { PickupKind } from "../../types";
import { PICKUP_INFO, PICKUP_KINDS } from "../../engine/pickup";
import { PickupIcon } from "../Pickups";
import s from "./Backpack.module.css";

export type BackpackCounts = Record<PickupKind, number>;

export function emptyBackpack(): BackpackCounts {
  return { seedPod: 0, dewFlask: 0, sporeLamp: 0, geneCase: 0, bioCore: 0 };
}

function Slot({ kind, count, register }: { kind: PickupKind; count: number; register: (kind: PickupKind, el: HTMLElement | null) => void }) {
  const info = PICKUP_INFO[kind];
  const { point, bind } = useHoverTooltip("top");
  return (
    <li className={s.slot} data-empty={count === 0} style={{ "--accent": info.accent } as CSSProperties} {...bind} tabIndex={0}>
      <span ref={(el) => register(kind, el)} key={count} className={count > 0 ? `${s.icon} ${s.bump}` : s.icon}>
        <PickupIcon kind={kind} size={68} />
      </span>
      <span className={s.name}>{info.name}</span>
      <span className={s.count}>{count}</span>
      {point && (
        <HoverTooltip point={point}>
          <TooltipCard title={info.name} desc={info.desc} accent={info.accent}>
            <span className={s.tip}>已收集 {count} 个</span>
          </TooltipCard>
        </HoverTooltip>
      )}
    </li>
  );
}

/** 背包栏：五类物件各一格，拾取后计数跳动。 */
export const Backpack = memo(function Backpack({ counts, register }: { counts: BackpackCounts; register: (kind: PickupKind, el: HTMLElement | null) => void }) {
  const total = PICKUP_KINDS.reduce((sum, kind) => sum + counts[kind], 0);
  return (
    <section className={s.backpack} aria-label="背包">
      <header className={s.head}>
        <span className={s.title}>背包</span>
        <span className={s.total}>共 {total} 件</span>
      </header>
      <ul className={s.slots}>
        {PICKUP_KINDS.map((kind) => <Slot key={kind} kind={kind} count={counts[kind]} register={register} />)}
      </ul>
    </section>
  );
});
