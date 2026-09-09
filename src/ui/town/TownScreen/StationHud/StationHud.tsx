// 全景上的常驻 HUD: 左上一条终端状态带。
// 飞出时序与位移由 TownScreen/facilityScenes 统一编排, 本组件只负责状态带本身。

import type { CSSProperties } from "react";
import { cx } from "@/ui/common/cx";
import s from "./StationHud.module.css";

export interface StationHudProps {
  day: number;
  credits: number;
  facilityCount: number;
  /** 飞出动画的类名与状态带的 CSS 变量, 由 TownScreen 在演出期间下发。 */
  flyingClassName?: string;
  statusStyle?: CSSProperties;
}

export function StationHud({
  day,
  credits,
  facilityCount,
  flyingClassName,
  statusStyle,
}: StationHudProps) {
  return (
    <>
      <section className={cx(s.status, flyingClassName)} style={statusStyle} aria-label="据点终端状态">
        <span className={s.rim} aria-hidden />
        <div className={s.item}>
          <span className={s.label}>生存时间</span>
          <strong className={s.value}>第 {day} 日</strong>
        </div>
        <div className={s.item}>
          <span className={s.label}>终端积分</span>
          <strong className={s.value}>{credits.toLocaleString()}</strong>
        </div>
        <div className={s.item}>
          <span className={s.label}>启用设施</span>
          <strong className={s.value}>
            {facilityCount} / {facilityCount}
          </strong>
        </div>
      </section>

    </>
  );
}
