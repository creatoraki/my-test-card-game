// 小队徽章盘 —— 编队页左上那枚徽章 + 训练点读数。
//
// ★ 它是本页的**待办提醒位**: 训练点来自已唤醒角色中等级最高的五人
//   (store/townStore.squadTrainingPoints),
//   队员一升卡组就会多出可分配的点, 而分配入口原先只藏在据点的训练室设施里。
//   有未分配点时这里整枚徽章转金呼吸 + 角标脉冲, 点一下直接开天赋树弹窗。
// ★ 徽章图形/配色**复用训练室那一套**(BadgeGlyph + badgeThemeVars), 两处必须是同一枚徽章。

import type { CSSProperties } from "react";
import type { SquadBadgeDef } from "@/data";
import { BadgeGlyph } from "@/ui/town/training/BadgeSelectModal/badgeGlyphs";
import { badgeThemeVars } from "@/ui/town/training/styles/badgeTheme";
import { cx } from "@/ui/common/cx";
import s from "./SquadBadgeDial.module.css";

interface Props {
  badge: SquadBadgeDef | undefined;
  /** 尚未分配的训练点。选中徽章且 > 0 时整枚徽章进入金色提醒态。 */
  remaining: number;
  /** 全队可用训练点总数(= 已唤醒角色中等级最高的五人卡组等级之和)。 */
  total: number;
  onClick: () => void;
  className?: string;
  style?: CSSProperties;
}

export function SquadBadgeDial({ badge, remaining, total, onClick, className, style }: Props) {
  const urgent = !badge;
  const alert = !!badge && remaining > 0;
  const themeVars = badge ? badgeThemeVars(badge.id) : undefined;

  return (
    <div
      className={cx(s.dial, urgent && s["is-urgent"], alert && s["is-alert"], className)}
      style={{ ...themeVars, ...style }}
    >
      <button
        className={s.disc}
        type="button"
        onClick={onClick}
        aria-label={badge ? `小队徽章 ${badge.name}，打开训练点分配` : "选择小队徽章"}
      >
        <span className={s.ring} aria-hidden="true" />
        {badge ? (
          <BadgeGlyph badgeId={badge.id} className={s.glyph} />
        ) : (
          <span className={s.blank} aria-hidden="true">
            ?
          </span>
        )}
        {(urgent || alert) && (
          <span className={cx(s.pip, urgent && s["is-urgent"])}>{urgent ? "!" : remaining}</span>
        )}
      </button>

      <div className={s.readout}>
        <span className={cx(s.name, urgent && s["is-urgent"])}>{badge ? badge.name : "未启用徽章"}</span>
        {badge ? (
          <span className={cx(s.points, alert && s["is-alert"])}>
            训练点 {total - remaining}/{total}
            {alert && <b className={s.pending}>+{remaining} 待分配</b>}
          </span>
        ) : (
          <span className={cx(s.points, s["is-urgent"])}>
            点击选择一枚徽章
            <b className={cx(s.pending, s["is-urgent"])}>!</b>
          </span>
        )}
      </div>
    </div>
  );
}
