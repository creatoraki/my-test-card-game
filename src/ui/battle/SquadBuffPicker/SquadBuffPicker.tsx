import { ASSEMBLE_IDS, SQUAD_BUFF_DEFS, type AssembleId, type BattleState } from "@/engine";
import { assembleBuffArtOf } from "@/ui/art/battle/buffArt";
import s from "./SquadBuffPicker.module.css";

interface Props {
  battle: BattleState;
  onPick: (id: string) => void;
  onCancel: () => void;
}

export function SquadBuffPicker({ battle, onPick, onCancel }: Props) {
  const choice = battle.pendingChoice;
  if (choice?.kind !== "pickSquadBuff") return null;

  const options = choice.options.filter((id): id is AssembleId =>
    (ASSEMBLE_IDS as readonly string[]).includes(id),
  );
  const removing = choice.mode === "remove";
  if (!options.length) return null;

  return (
    <div className={s.scrim} role="presentation" onClick={onCancel}>
      <section
        className={s.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="squad-buff-picker-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={s.head}>
          <div>
            <span className={s.kicker}>配方选择</span>
            <h2 id="squad-buff-picker-title">{removing ? "选择要移除的部件" : "选择组装部件"}</h2>
            <p>{removing ? "选择一个当前已拥有的部件" : "选择一个当前尚未获得的部件"}</p>
          </div>
          <button className={s.close} type="button" aria-label="取消选择" onClick={onCancel}>×</button>
        </div>
        <div className={s.options}>
          {options.map((id) => {
            const def = SQUAD_BUFF_DEFS[id];
            return (
              <button
                key={id}
                className={s.option}
                type="button"
                onClick={() => onPick(id)}
                aria-label={`${removing ? "移除" : "获得"}${def.name}`}
              >
                <span className={s.emoji} aria-hidden="true">
                  <img src={assembleBuffArtOf(id)} alt="" />
                </span>
                <span className={s.name}>{def.name}</span>
                <span className={s.desc}>{def.desc}</span>
              </button>
            );
          })}
        </div>
        <button className={s.cancel} type="button" onClick={onCancel}>取消选择</button>
      </section>
    </div>
  );
}
