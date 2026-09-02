// 详情态左栏 —— 一张与编队卡共用取景壳的立绘窗, 身份与状态压在图的下半部。
//
// ★ 立绘窗(76,196,434,772)与编队卡保持同高: 卡片飞到左侧后原地横向展宽, 只露出原本被裁掉的
//   部分, 人物大小不变。矩形由 CharacterDetailView 从 morphChoreo.FIGURE_RECT 下发。
// ★ 过场期间(hidden)整栏让位: 此刻画面上的立绘是飞行层的副本, 两份同时在场会露馅。

import type { CSSProperties } from "react";
import type { QuirkId } from "@/engine";
import { CHARACTER_CARD_GLOW, characterGlow } from "@/ui/character/characterGlow";
import { BorderGlow } from "@/ui/common/BorderGlow";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import { HpBar } from "@/ui/common/HpBar/HpBar";
import { PollutionMeter } from "@/ui/common/PollutionMeter/PollutionMeter";
import { QuirkPips } from "@/ui/common/QuirkPips/QuirkPips";
import { cx } from "@/ui/common/cx";
import s from "./FigureStage.module.css";

interface Props {
  characterId: string;
  emoji: string;
  name: string;
  color: string;
  vitals: { hp: number; hpLimit: number; maxHp: number };
  pollution: number;
  sick: boolean;
  quirks: readonly QuirkId[];
  onField: boolean;
  /** 去回程期间由飞行层代演。 */
  hidden: boolean;
  /** 由 CharacterDetailView 从 FIGURE_RECT 下发的设计 px 版面坐标。 */
  style?: CSSProperties;
}

export function FigureStage({
  characterId,
  emoji,
  name,
  color,
  vitals,
  pollution,
  sick,
  quirks,
  onField,
  hidden,
  style,
}: Props) {
  const glow = characterGlow(color);

  return (
    <div
      className={cx(s.stage, hidden && s["is-hidden"])}
      style={{ "--gc-color": color, ...style } as CSSProperties}
    >
      <BorderGlow
        className={s.glow}
        {...CHARACTER_CARD_GLOW}
        {...glow}
        persistent
        followPointer={false}
        animated={false}
        fillOpacity={onField ? 0.3 : 0.2}
      >
        <div className={s.body}>
          <CharacterPortrait characterId={characterId} emoji={emoji} alt={name} className={s.bust} />
          <span className={s.scrim} aria-hidden="true" />

          <div className={s.identity}>
            <div className={s["name-row"]}>
              <h2 className={s.name}>{name}</h2>
              <span className={cx(s.tag, onField && s["is-on"])}>{onField ? "出战中" : "待命"}</span>
            </div>
            <div className={s.bars}>
              <div className={s.hp}>
                <HpBar hp={vitals.hp} hpLimit={vitals.hpLimit} maxHp={vitals.maxHp} flush />
              </div>
              <PollutionMeter value={pollution} />
            </div>
            <QuirkPips sick={sick} quirks={quirks} className={s.quirks} />
          </div>
        </div>
      </BorderGlow>
    </div>
  );
}
