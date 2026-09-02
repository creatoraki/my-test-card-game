// 详情态左栏 —— 一张出血到画布边缘的立绘大图, 身份与状态压在图的下半部。
//
// ★ 出血(0,0,780,1080)是刻意的: 编队卡是一扇 276 宽的取景窗, 点进来之后同一张图铺满整个左半屏,
//   "卡片长成了人" 这句话是靠这一步说出来的。⚠ 这个矩形同时是 morphChoreo.FIGURE_RECT ——
//   飞行层的落点常量, 改这里必须一起改那里。
// ★ 过场期间(hidden)整栏让位: 此刻画面上的立绘是飞行层的副本, 两份同时在场会露馅。

import type { CSSProperties } from "react";
import type { QuirkId } from "@/engine";
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
  /** 过场期间由飞行层代演。 */
  hidden: boolean;
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
}: Props) {
  return (
    <div
      className={cx(s.stage, hidden && s["is-hidden"])}
      style={{ "--gc-color": color } as CSSProperties}
    >
      <CharacterPortrait characterId={characterId} emoji={emoji} alt={name} className={s.bust} />
      {/* 顶部往上淡出: 立绘出血到画布顶边, 不收一下会顶到常驻顶带的返回角标与徽章盘。 */}
      <span className={s["fade-top"]} aria-hidden="true" />
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
  );
}
