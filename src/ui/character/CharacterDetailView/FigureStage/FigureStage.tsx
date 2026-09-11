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
import { figureCopy } from "./figureCopy";
import s from "./FigureStage.module.css";

interface Props {
  characterId: string;
  emoji: string;
  name: string;
  color: string;
  badgeName?: string;
  deckLevel: number;
  exp: number;
  upgradeCost: number | null;
  upgradeDisabled: boolean;
  onUpgrade: () => void;
  vitals: { hp: number; hpLimit: number; maxHp: number };
  pollution: number;
  sick: boolean;
  quirks: readonly QuirkId[];
  onField: boolean;
  /** 悬浮卡面时用遮罩压暗，避免整栏模糊滤镜。 */
  dimmed: boolean;
  hidden: boolean;
  style?: CSSProperties;
}

export function FigureStage({
  characterId, emoji, name, color, badgeName, deckLevel, exp, upgradeCost,
  upgradeDisabled, onUpgrade, vitals, pollution, sick, quirks, onField,
  dimmed, hidden, style,
}: Props) {
  const copy = figureCopy(characterId);

  return (
    <section
      className={cx(s.stage, hidden && s["is-hidden"], dimmed && s["is-dimmed"])}
      style={{ "--figure-accent": color, ...style } as CSSProperties}
      aria-label={`${name}角色档案`}
    >
      <div className={s.scenery} aria-hidden="true">
        <img className={s.background} src={FORMATION_BG_ART} alt="" />
        <div className={s.light} />
      </div>
      <div className={s.art}>
        <CharacterPortrait characterId={characterId} emoji={emoji} alt={name} className={s.portrait} />
      </div>
      <div className={s.heading}>
        <span className={s["top-name"]}>{name}</span>
        <span className={s.specialty}>{copy.specialty}</span>
        <span className={s.diamond} aria-hidden="true">◇</span>
        <p className={s.quote}>“{copy.quote}”</p>
      </div>
      <div className={s.insignia} aria-hidden="true">
        <svg viewBox="0 0 80 100" fill="currentColor">
          <path d="m40 5 12 15-12 14-12-14ZM8 20l27 25v22L8 43Zm64 0L45 45v22l27-24ZM8 53l27 25v17L8 73Zm64 0L45 78v17l27-22Z" />
        </svg>
        <span>霓虹都市</span>
        <span>战术档案</span>
      </div>
      <div className={s.signature} aria-hidden="true">{name}</div>
      <div className={s.identity}>
        <div className={s["name-row"]}>
          <h2 className={s.name}>{name}</h2>
          <span className={cx(s.tag, onField && s["is-on"])}>{onField ? "出战中" : "待命"}</span>
        </div>
        <div className={s.badge}>
          <span className={s["badge-mark"]} aria-hidden="true">✧</span>
          <span>{badgeName ?? "未启用徽章"}</span>
        </div>
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
