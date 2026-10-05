// 常驻主城概览，单根节点承接设施进出的飞行动画。
import type { CSSProperties } from "react";
import { DetailFrame } from "@/ui/common/frame/DetailFrame";
import { cx } from "@/ui/common/shared/cx";
import { HudChip } from "./HudChip";
import { useStationStatus } from "./useStationStatus";
import s from "./StationHud.module.css";

export interface StationHudProps {
  flyingClassName?: string;
  statusStyle?: CSSProperties;
}

export function StationHud({ flyingClassName, statusStyle }: StationHudProps) {
  const status = useStationStatus();
  const partyFull = status.partyCount >= status.partySize;

  return (
    <section className={cx(s.status, flyingClassName)} style={statusStyle} aria-label="主城概览">
      <span className={s.surface} aria-hidden="true" />
      <DetailFrame tone="teal" subtle />
      <header className={s.head}>
        <span className={s.diamond} aria-hidden="true" />
        <h2 className={s.title}>主城概览</h2>
      </header>
      <div className={s.readouts}>
        <HudChip tone="blue" label="生存天数" value={status.day.toLocaleString("zh-CN")}
          tipTitle="生存天数" tipDesc="当前的生存日数。" />
        <HudChip glyph="credit" tone="gold" label="居民积分" value={status.loot.toLocaleString("zh-CN")}
          tipTitle="居民积分" tipDesc="主要来自远征废料出售，用于商店采购、复苏与疗养。" />
        <HudChip glyph="party" tone="cyan" label="上阵人数"
          value={<>{status.partyCount}<span className={s.capacity}> / {status.partySize}</span></>}
          tipTitle="上阵队员"
          tipDesc={partyFull ? "出击队伍已满员。" : `还能编入 ${status.partySize - status.partyCount} 人，可前往编队调整。`} />
      </div>
    </section>
  );
}
