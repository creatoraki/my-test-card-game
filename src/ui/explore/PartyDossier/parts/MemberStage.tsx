// 左栏主体: 无框大立绘 + 前景植物 + 名牌(职业徽记 / 名字 / 序号) + 生命 / 污染。纯展示, 数据由 PartyDossier 透传。
// ★ 全部绝对定位在左栏(810×904)里, 坐标见 MemberStage.module.css。
import type { CSSProperties } from "react";
import type { QuirkId } from "@/engine";
import { PARTY_DOSSIER_PLANTS } from "@/ui/art/explore/partyDossierArt";
import { CrewClassGlyph } from "@/ui/character/glyphs/CrewClassGlyph";
import { HpBar } from "@/ui/common/bar/HpBar";
import { PollutionMeter } from "@/ui/common/bar/PollutionMeter";
import { QuirkPips } from "@/ui/common/bar/QuirkPips";
import { CharacterPortrait } from "@/ui/common/unit/CharacterPortrait";
import s from "./MemberStage.module.css";

const pad2 = (value: number) => String(value).padStart(2, "0");

export interface MemberVitals {
  hp: number;
  hpLimit: number;
  maxHp: number;
}

interface Props {
  charId: string;
  name: string;
  emoji: string;
  /** 角色色: 染职业徽记。 */
  color: string;
  rank: { index: number; total: number };
  vitals: MemberVitals;
  pollution: number;
  sick: boolean;
  quirks: readonly string[];
  down: boolean;
}

export function MemberStage({ charId, name, emoji, color, rank, vitals, pollution, sick, quirks, down }: Props) {
  return (
    <div className={s.stage} data-down={down || undefined} style={{ "--char": color } as CSSProperties}>
      {/* key=charId: 换人时立绘重新入场, 而不是在同一个节点上直接换图。 */}
      <CharacterPortrait key={charId} characterId={charId} emoji={emoji} alt={`${name}立绘`} className={s.portrait} />
      <img className={s.plants} src={PARTY_DOSSIER_PLANTS} alt="" draggable={false} />

      <div className={s.info}>
        <div className={s.nameRow}>
          <CrewClassGlyph charId={charId} className={s.glyph} />
          <strong className={s.name}>{name}</strong>
          {down && <span className={s.down}>阵亡</span>}
          {(sick || quirks.length > 0) && <QuirkPips sick={sick} quirks={quirks as QuirkId[]} className={s.quirks} />}
        </div>
        <i className={s.nameRule} aria-hidden="true" />
        <div className={s.rankRow}>
          <span className={s.rank} aria-label={`第 ${rank.index} 名，共 ${rank.total} 名`}>
            {pad2(rank.index)}
            <i> / {pad2(rank.total)}</i>
          </span>
          <svg className={s.signature} viewBox="0 0 150 40" aria-hidden="true">
            <path d="M4 30C12 10 22 4 21 20S30 36 40 19C46 8 51 31 59 21S71 9 75 22C79 33 90 12 97 18S112 29 120 16C126 7 132 12 146 6" />
            <path d="M30 34C60 30 96 31 132 27" />
          </svg>
        </div>

        <div className={s.readout}>
          <span className={s.label}>生命</span>
          <strong className={s.value}>
            {Math.max(0, Math.round(vitals.hp))}
            <i> / {Math.round(vitals.hpLimit)}</i>
          </strong>
          {vitals.hpLimit < vitals.maxHp && <span className={s.note}>体力极限 {Math.round(vitals.maxHp)}</span>}
        </div>
        <div className={s.bars}>
          <HpBar hp={vitals.hp} hpLimit={vitals.hpLimit} maxHp={vitals.maxHp} flush animated={false} />
          <PollutionMeter value={pollution} className={s.pollution} />
        </div>
      </div>
    </div>
  );
}
