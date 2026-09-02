// 编队页的常驻顶带 —— 返回角标 + 小队徽章盘 + 小队羁绊。
//
// ★★ 它**跨越两种态**: 编队态与详情态共用同一份 DOM, 重组过场期间原地不动。
//   「不动的东西」才让中间那一场重组显得是重组 —— 若连边框角落一起飞, 观众就失去了参照系。
// ★ 返回角标只有一个箭头, 没有文字: 这一页要留给队伍列表。
//   ⚠ 悬浮提示走 HoverTooltip 组件, 不用原生 title(全项目铁律)。

import type { CSSProperties } from "react";
import type { SquadBadgeDef } from "@/data";
import type { CharacterState } from "@/store/townStore";
import { HoverTooltip, useHoverTooltip } from "@/ui/common/HoverTooltip";
import { SquadBondBar } from "@/ui/common/SquadBondBar";
import { cx } from "@/ui/common/cx";
import { SquadBadgeDial } from "../SquadBadgeDial";
import s from "./SquadHud.module.css";

interface Props {
  /** 返回上一层: 编队态回据点, 详情态回编队。 */
  onBack: () => void;
  backLabel: string;
  badge: SquadBadgeDef | undefined;
  remaining: number;
  total: number;
  onBadgeClick: () => void;
  characters: Record<string, CharacterState>;
  party: string[];
  className?: string;
  style?: CSSProperties;
}

export function SquadHud({
  onBack,
  backLabel,
  badge,
  remaining,
  total,
  onBadgeClick,
  characters,
  party,
  className,
  style,
}: Props) {
  const { point, bind } = useHoverTooltip();

  return (
    <div className={cx(s.hud, className)} style={style}>
      <span className={s["back-slot"]} {...bind}>
        <button className={s.back} type="button" onClick={onBack} aria-label={backLabel}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
            <path
              d="M15 5 8 12l7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {point && (
          <HoverTooltip point={point}>
            <strong>{backLabel}</strong>
            <p>也可以按 Esc</p>
          </HoverTooltip>
        )}
      </span>

      <SquadBadgeDial
        className={s.dial}
        badge={badge}
        remaining={remaining}
        total={total}
        onClick={onBadgeClick}
      />

      <SquadBondBar className={s.bonds} characters={characters} party={party} />
    </div>
  );
}
