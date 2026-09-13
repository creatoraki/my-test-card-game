import { SQUAD_BUFF_DEFS, squadBuffIds, type BattleState } from "@/engine";
import { ASSEMBLE_ACCENT, AssembleIcon } from "@/ui/common/AssembleIcon";
import { PopoverHead, RailPopover } from "@/ui/common/RailPopover";
import s from "./SquadBuffBar.module.css";

interface Props {
  battle: BattleState;
}

export function SquadBuffBar({ battle }: Props) {
  const owned = squadBuffIds(battle);
  if (owned.length === 0) return null;

  return (
    <aside className={s.bar} aria-label="组装部件" onClick={(event) => event.stopPropagation()}>
      {owned.map((id) => {
          const def = SQUAD_BUFF_DEFS[id];
          return (
            <div
              key={id}
              className={s.item}
              data-rail-item
              tabIndex={0}
              aria-label={def.name}
              style={{ ["--assemble-accent" as string]: ASSEMBLE_ACCENT[id] }}
            >
              <AssembleIcon id={id} />
              <RailPopover side="top-left">
                <PopoverHead icon={<AssembleIcon id={id} />} name={def.name} iconClassName={s["pop-icon"]} />
                <p>{def.desc}</p>
              </RailPopover>
            </div>
          );
        })}
    </aside>
  );
}
