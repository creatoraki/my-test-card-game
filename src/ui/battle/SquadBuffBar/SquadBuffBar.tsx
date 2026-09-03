import { ASSEMBLE_IDS, SQUAD_BUFF_DEFS, squadBuffIds, type AssembleId, type BattleState } from "@/engine";
import { RailPopover } from "@/ui/common/RailPopover";
import s from "./SquadBuffBar.module.css";

interface Props {
  battle: BattleState;
}

export function SquadBuffBar({ battle }: Props) {
  const owned = squadBuffIds(battle);
  const ownedCount = owned.length;

  return (
    <aside className={s.bar} aria-label="组装部件" onClick={(event) => event.stopPropagation()}>
      <div className={s.heading}>
        <span className={s.label}>组装</span>
        <span className={s.count}>{ownedCount} / 3</span>
      </div>
      <div className={s.items}>
        {ASSEMBLE_IDS.map((id: AssembleId) => {
          const def = SQUAD_BUFF_DEFS[id];
          const order = owned.indexOf(id);
          const active = order >= 0;
          return (
            <div
              key={id}
              className={s.item}
              data-owned={active ? "true" : "false"}
              data-rail-item
              tabIndex={0}
              aria-label={`${def.name}${active ? `，第 ${order + 1} 个` : "，未获得"}`}
            >
              <span className={s.emoji} aria-hidden="true">{def.emoji}</span>
              <span className={s.letter}>{id.slice(-1)}</span>
              {active && <span className={s.order}>{order + 1}</span>}
              <RailPopover side="top-left">
                <strong>{def.name}</strong>
                <p>{def.desc}</p>
                <small>{active ? `已获得 · 第 ${order + 1} 个` : "尚未获得"}</small>
              </RailPopover>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
