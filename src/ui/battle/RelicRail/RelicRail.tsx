import { getItemDef } from "@/data";
import type { BattleState } from "@/engine";
import { itemIcon } from "@/ui/art/itemArt";
import { PopoverHead, RailPopover } from "@/ui/common/RailPopover";
import s from "./RelicRail.module.css";

export function RelicRail({ battle, activeRelicId }: { battle: BattleState; activeRelicId?: string | null }) {
  if (!battle.relics.length) return null;
  return (
    <aside className={s.rail} aria-label="遗物" onClick={(event) => event.stopPropagation()}>
      {battle.relics.map((runtime) => {
        const def = getItemDef(runtime.id);
        return (
          <div className={s.item} data-active={activeRelicId === runtime.id || undefined} data-rail-item key={runtime.id} tabIndex={0}>
            <span className={s.icon}>{itemIcon(def)}</span>
            <RailPopover side="bottom-left" className={s.pop}>
              <PopoverHead icon={itemIcon(def)} name={def.name} iconClassName={s["head-icon"]} />
              <p>{def.desc}</p>
            </RailPopover>
          </div>
        );
      })}
    </aside>
  );
}
