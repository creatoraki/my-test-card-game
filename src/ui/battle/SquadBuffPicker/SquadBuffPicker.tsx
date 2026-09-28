import {
  ASSEMBLE_IDS,
  SQUAD_BUFF_DEFS,
  assembleRewardCategoryName,
  type AssembleId,
  type BattleState,
} from "@/engine";
import { assembleBuffArtOf } from "@/ui/art/battle/buffArt";
import s from "./SquadBuffPicker.module.css";

interface Props {
  battle: BattleState;
  onPick: (id: string) => void;
  onCancel: () => void;
}

type PickerMode = "gain" | "remove" | "release" | "keep" | "purify";

// 各模式的标题、说明与按钮动词。keep / purify 是已发生结算的后续选择, 不可取消。
const MODE_COPY: Record<PickerMode, { title: string; hint: string; verb: string; cancelable: boolean }> = {
  gain: { title: "选择组装部件", hint: "选择一个当前尚未获得的部件", verb: "获得", cancelable: true },
  remove: { title: "选择要移除的部件", hint: "选择一个当前已拥有的部件", verb: "移除", cancelable: true },
  release: { title: "选择要拆解的部件", hint: "移除所选部件，并立即结算它的释放效果", verb: "拆解", cancelable: true },
  keep: { title: "贤者之石：选择保留的部件", hint: "组装成功，从本次消耗的部件中保留一种", verb: "保留", cancelable: false },
  purify: { title: "提纯：选择缺失的部件", hint: "所选的缺失部件决定获得哪一类组装奖励", verb: "以此完成", cancelable: false },
};

export function SquadBuffPicker({ battle, onPick, onCancel }: Props) {
  const choice = battle.pendingChoice;
  if (choice?.kind !== "pickSquadBuff") return null;

  const options = choice.options.filter((id): id is AssembleId =>
    (ASSEMBLE_IDS as readonly string[]).includes(id),
  );
  const mode: PickerMode = choice.mode ?? "gain";
  const copy = MODE_COPY[mode];
  const cancel = copy.cancelable ? onCancel : undefined;
  if (!options.length) return null;

  return (
    <div className={s.scrim} role="presentation" onClick={cancel}>
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
            <h2 id="squad-buff-picker-title">{copy.title}</h2>
            <p>{copy.hint}</p>
          </div>
          {cancel && <button className={s.close} type="button" aria-label="取消选择" onClick={cancel}>×</button>}
        </div>
        <div className={s.options}>
          {options.map((id) => {
            const def = SQUAD_BUFF_DEFS[id];
            const desc = mode === "purify" ? `获得${assembleRewardCategoryName(id)}奖励` : def.desc;
            return (
              <button
                key={id}
                className={s.option}
                type="button"
                onClick={() => onPick(id)}
                aria-label={`${copy.verb}${def.name}`}
              >
                <span className={s.emoji} aria-hidden="true">
                  <img src={assembleBuffArtOf(id)} alt="" />
                </span>
                <span className={s.name}>{def.name}</span>
                <span className={s.desc}>{desc}</span>
              </button>
            );
          })}
        </div>
        {cancel && <button className={s.cancel} type="button" onClick={cancel}>取消选择</button>}
      </section>
    </div>
  );
}
