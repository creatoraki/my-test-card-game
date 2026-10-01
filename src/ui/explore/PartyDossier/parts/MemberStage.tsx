// 左栏上半: 大立绘舞台 + 名牌 + 生命 / 污染 + 身体状况。纯展示, 数据由 PartyDossier 透传。
import type { QuirkId } from "@/engine";
import { HpBar } from "@/ui/common/bar/HpBar";
import { PollutionMeter } from "@/ui/common/bar/PollutionMeter";
import { QuirkPips } from "@/ui/common/bar/QuirkPips";
import { CharacterPortrait } from "@/ui/common/unit/CharacterPortrait";
import s from "./MemberStage.module.css";

export interface MemberVitals {
  hp: number;
  hpLimit: number;
  maxHp: number;
}

interface Props {
  charId: string;
  name: string;
  emoji: string;
  vitals: MemberVitals;
  pollution: number;
  sick: boolean;
  quirks: readonly string[];
  down: boolean;
}

export function MemberStage({ charId, name, emoji, vitals, pollution, sick, quirks, down }: Props) {
  return (
    <>
      <div className={s.stage} data-down={down || undefined}>
        <span className={s.slashes} aria-hidden="true" />
        {/* key=charId: 换人时立绘重新入场, 而不是在同一个节点上直接换图。 */}
        <CharacterPortrait key={charId} characterId={charId} emoji={emoji} alt={`${name}立绘`} className={s.portrait} />
        <div className={s.nameplate}>
          <strong className={s.name}>{name}</strong>
          {down && <span className={s.down}>阵亡</span>}
        </div>
      </div>

      <div className={s.vitals}>
        <div className={s.readout}>
          <span className={s.label}>生命</span>
          <strong className={s.value}>
            {Math.max(0, Math.round(vitals.hp))}
            <i> / {Math.round(vitals.hpLimit)}</i>
          </strong>
          {vitals.hpLimit < vitals.maxHp && <span className={s.note}>体力极限 {Math.round(vitals.maxHp)}</span>}
        </div>
        <HpBar hp={vitals.hp} hpLimit={vitals.hpLimit} maxHp={vitals.maxHp} flush animated={false} />
        <PollutionMeter value={pollution} />
        {(sick || quirks.length > 0) && <QuirkPips sick={sick} quirks={quirks as QuirkId[]} className={s.quirks} />}
      </div>
    </>
  );
}
