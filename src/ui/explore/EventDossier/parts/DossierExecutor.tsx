import type { PartySnapshot } from "@/explore/types";
import { CharacterPortrait } from "@/ui/common/unit/CharacterPortrait";
import { cx } from "@/ui/common/shared/cx";
import s from "./DossierExecutor.module.css";

/** 行动选择页左下的执行者选择条：每次交互都要指定一名存活队员来执行。只显示立绘与血条，名字仅供读屏。 */
export function DossierExecutor({
  party,
  selectedId,
  onSelect,
}: {
  party: PartySnapshot[];
  selectedId: string | null;
  onSelect: (charId: string) => void;
}) {
  return (
    <div className={s.executor} role="radiogroup" aria-label="选择执行者">
      <div className={s.row}>
        {party.map((member) => {
          const selected = member.charId === selectedId;
          const hpRatio = member.maxHp > 0 ? Math.max(0, member.hp) / member.maxHp : 0;
          return (
            <button
              key={member.charId}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${member.name}，生命 ${member.hp}/${member.maxHp}`}
              disabled={!member.alive}
              className={cx(s.member, selected && s.selected)}
              onClick={() => onSelect(member.charId)}
            >
              <span className={s.figure}>
                <CharacterPortrait characterId={member.charId} emoji={member.emoji} alt="" className={s.portrait} />
              </span>
              <i className={s.hp} style={{ width: `${Math.round(hpRatio * 100)}%` }} aria-hidden />
              <i className={s.frame} aria-hidden />
              <span className={s.mark} aria-hidden>
                <svg viewBox="0 0 16 16"><path d="M3 8.5l3.2 3L13 4.5" /></svg>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
