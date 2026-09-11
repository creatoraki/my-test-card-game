// 详情立绘窗：静态场景、矢量边框与信息底栏分层，矩形仍由 FIGURE_RECT 下发。
// 取景沿用飞行层的 cover / 50% 6%，交接期间由 hidden 让位。
import type { CSSProperties } from "react";
import type { QuirkId } from "@/engine";
import { FORMATION_BG_ART } from "@/ui/art/sceneArt";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import { HpBar } from "@/ui/common/HpBar/HpBar";
import { PollutionMeter } from "@/ui/common/PollutionMeter/PollutionMeter";
import { QuirkPips } from "@/ui/common/QuirkPips/QuirkPips";
import { cx } from "@/ui/common/cx";
import { FigureFrame } from "./FigureFrame";
import { FigureProgress } from "./FigureProgress";
import { figureThemeStyle } from "./figureThemes";
import { FIGURE_ART_WIDTH } from "@/ui/character/CharacterDetailView/detailLayout";
import s from "./FigureStage.module.css";

interface Props {
  characterId: string;
  characterColor: string;
  emoji: string;
  name: string;
  deckLevel: number;
  exp: number;
  upgradeCost: number | null;
  upgradeDisabled: boolean;
  onUpgrade: () => void;
  vitals: { hp: number; hpLimit: number; maxHp: number };
  pollution: number;
  sick: boolean;
  quirks: readonly QuirkId[];
  /** 悬浮卡面时用遮罩压暗，避免整栏模糊滤镜。 */
  dimmed: boolean;
  hidden: boolean;
  style?: CSSProperties;
}

export function FigureStage({
  characterId, characterColor, emoji, name, deckLevel, exp, upgradeCost,
  upgradeDisabled, onUpgrade, vitals, pollution, sick, quirks,
  dimmed, hidden, style,
}: Props) {
  return (
    <section
      className={cx(s.stage, hidden && s["is-hidden"], dimmed && s["is-dimmed"])}
      style={{ ...figureThemeStyle(characterId, characterColor), "--figure-art-width": `${FIGURE_ART_WIDTH}px`, ...style } as CSSProperties}
      aria-label={`${name}角色档案`}
    >
      <div className={s.scenery} aria-hidden="true">
        <img className={s.background} src={FORMATION_BG_ART} alt="" />
        <div className={s.light} />
      </div>
      <div className={s.art}>
        <CharacterPortrait characterId={characterId} emoji={emoji} alt={name} className={s.portrait} />
      </div>
      <div className={s.identity}>
        <h2 className={s.name}>{name}</h2>
        <FigureProgress
          level={deckLevel}
          exp={exp}
          cost={upgradeCost}
          disabled={upgradeDisabled || hidden || dimmed}
          onUpgrade={onUpgrade}
        />
        <div className={s.vitals}>
          <HpBar hp={vitals.hp} hpLimit={vitals.hpLimit} maxHp={vitals.maxHp} flush animated={false} />
          <PollutionMeter value={pollution} />
        </div>
        <QuirkPips sick={sick} quirks={quirks} className={s.quirks} />
      </div>
      <FigureFrame />
      <div className={s.dimmer} aria-hidden="true" />
    </section>
  );
}
