import { getItemDef } from "@/data";
import type { BattleState } from "@/engine";
import { itemIcon } from "@/ui/art/items/itemArt";
import { RailPopover } from "@/ui/common/tooltip/RailPopover";
import { TooltipCard } from "@/ui/common/tooltip/TooltipCard";
import s from "./RelicRail.module.css";

/** 遗物详情的强调色 —— 与遗物栏的金色一致。 */
const RELIC_ACCENT = "#ffe49a";

export function RelicRail({ battle, activeRelicId }: { battle: BattleState; activeRelicId?: string | null }) {
  if (!battle.relics.length) return null;
  return (
    <aside className={s.rail} aria-label="遗物" onClick={(event) => event.stopPropagation()}>
      {battle.relics.map((runtime) => {
        const def = getItemDef(runtime.id);
        return (
          <div className={s.item} data-active={activeRelicId === runtime.id || undefined} data-rail-item key={runtime.id} tabIndex={0}>
            <span className={s.icon}>{itemIcon(def)}</span>
            <RailPopover side="bottom-left">
              <TooltipCard icon={itemIcon(def)} title={def.name} desc={def.desc} accent={RELIC_ACCENT} />
            </RailPopover>
          </div>
        );
      })}
    </aside>
  );
}
