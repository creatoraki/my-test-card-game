// 档案左栏: 立绘 + 三段血量 + 污染 + 怪癖 + (战斗内)临时状态。
// 纯展示, 全部数据由 CharacterModal 透传。

import type { QuirkId, StatusInstance } from "@/engine";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import { HpBar } from "@/ui/common/HpBar";
import { PollutionMeter } from "@/ui/common/PollutionMeter";
import { QuirkPips } from "@/ui/common/QuirkPips";
import { StatusPips } from "@/ui/common/StatusPips";
import type { CharacterVitals } from "../CharacterModal";
import s from "../CharacterModal.module.css";

interface Props {
  charId: string;
  name: string;
  emoji: string;
  vitals: CharacterVitals;
  pollution: number;
  sick: boolean;
  quirks: readonly string[];
  statuses?: StatusInstance[];
  down: boolean;
}

export function ModalProfile({
  charId,
  name,
  emoji,
  vitals,
  pollution,
  sick,
  quirks,
  statuses,
  down,
}: Props) {
  const shield = vitals.shield ?? 0;
  return (
    <div className={s["cm-profile"]}>
      <div className={s["cm-vitrine"]} data-down={down ? "" : undefined}>
        <CharacterPortrait
          characterId={charId}
          emoji={emoji}
          alt={`${name}立绘`}
          className={s["cm-bust"]}
        />
        {down && <span className={s["cm-down-label"]}>阵亡</span>}
      </div>

      <div className={s["cm-vitals"]}>
        <div className={s["cm-vitals-readout"]}>
          <span className={s["cm-vitals-label"]}>生命</span>
          <strong>
            {Math.max(0, Math.round(vitals.hp))} / {Math.round(vitals.hpLimit)}
          </strong>
          {vitals.hpLimit < vitals.maxHp && (
            <span className={s["cm-vitals-note"]}>体力极限 {Math.round(vitals.maxHp)}</span>
          )}
        </div>
        <HpBar hp={vitals.hp} hpLimit={vitals.hpLimit} maxHp={vitals.maxHp} flush />
        <PollutionMeter value={pollution} />
      </div>

      {(statuses?.length || shield > 0) && (
        <div className={s["cm-block"]}>
          <span className={s["cm-block-title"]}>当前状态</span>
          <StatusPips
            statuses={statuses ?? []}
            shield={shield}
            detail
            popoverSide="top-left"
            className={s["cm-status-pips"]}
          />
        </div>
      )}

      {(sick || quirks.length > 0) && (
        <div className={s["cm-block"]}>
          <span className={s["cm-block-title"]}>身体状况</span>
          <QuirkPips sick={sick} quirks={quirks as QuirkId[]} className={s["cm-quirks"]} />
        </div>
      )}
    </div>
  );
}
