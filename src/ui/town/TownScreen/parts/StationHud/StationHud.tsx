// 全景上的常驻 HUD: 左上角据点终端面板。
//   左: 生存日刻度盘(DayDial)
//   右: 标题行 → 资源行(居民积分 + 三色水晶) → 队伍行(上阵 / 在编 / 疗养 / 净化 / 阵亡)
// ★ 数据由 useStationStatus 自取, 每枚读数都带组件式悬浮说明(项目禁用原生 title)。
// 飞出时序与位移由 TownScreen/facilityScenes 统一编排, 本组件只负责面板本身;
// ⚠ 飞出变量挂在最外层 section 上, 面板必须保持单根节点。

import type { CSSProperties } from "react";
import { cx } from "@/ui/common/shared/cx";
import { DayDial } from "./DayDial";
import { HudChip } from "./HudChip";
import { useStationStatus } from "./useStationStatus";
import s from "./StationHud.module.css";

export interface StationHudProps {
  /** 飞出动画的类名与面板的 CSS 变量, 由 TownScreen 在演出期间下发。 */
  flyingClassName?: string;
  statusStyle?: CSSProperties;
}

export function StationHud({ flyingClassName, statusStyle }: StationHudProps) {
  const status = useStationStatus();
  const partyFull = status.partyCount >= status.partySize;

  return (
    <section className={cx(s.status, flyingClassName)} style={statusStyle} aria-label="据点终端状态">
      <span className={s.rim} aria-hidden />
      <DayDial day={status.day} />

      <div className={s.main}>
        <header className={s.head}>
          <span className={s.dot} aria-hidden />
          <strong className={s.title}>据点终端</strong>
          <span className={s.state}>运转中</span>
          <span className={s.deco} aria-hidden>
            STATION // ONLINE
          </span>
        </header>

        <div className={s.row}>
          <HudChip
            variant="big"
            glyph="credit"
            tone="gold"
            label="居民积分"
            value={status.loot.toLocaleString()}
            tipTitle="居民积分"
            tipDesc="主要来自远征带回的废料出售，用于商店采购、复苏阵亡队员与疗养。"
          />
          {status.crystals.map((crystal) => (
            <HudChip
              key={crystal.itemId}
              variant="big"
              glyph="crystal"
              tone={crystal.tone}
              value={crystal.count}
              dim={crystal.count === 0}
              tipTitle={crystal.name}
              tipDesc={`仓库持有 ${crystal.count} 枚，用于升级建筑和装备养成。`}
            />
          ))}
        </div>

        <div className={cx(s.row, s.squad)}>
          <HudChip
            glyph="party"
            tone="cyan"
            label="上阵"
            value={`${status.partyCount}/${status.partySize}`}
            tipTitle="上阵队员"
            tipDesc={partyFull ? "出击队伍已满员。" : `出击队伍还能再编入 ${status.partySize - status.partyCount} 人，可在编队页调整。`}
          />
          <HudChip
            glyph="roster"
            tone="violet"
            label="在编"
            value={status.rosterCount}
            tipTitle="在编队员"
            tipDesc="已唤醒、可参与编队的全部队员。"
          />
          <HudChip
            glyph="pod"
            tone="blue"
            label="疗养"
            value={status.resting}
            dim={status.resting === 0}
            tipTitle="疗养中"
            tipDesc="正在疗养舱中恢复体力上限的队员，次日结算后自动离舱。"
          />
          <HudChip
            glyph="font"
            tone="green"
            label="净化"
            value={status.purifying}
            dim={status.purifying === 0}
            tipTitle="净化中"
            tipDesc="正在圣水池中净化的诅咒遗物，到期后转化为祝福。"
          />
          <HudChip
            glyph="fallen"
            tone="red"
            label="阵亡"
            value={status.fallenCount}
            dim={status.fallenCount === 0}
            alert={status.fallenCount > 0}
            tipTitle="阵亡队员"
            tipDesc={
              status.fallenCount > 0
                ? "有队员阵亡，可前往医疗室的复苏舱花费居民积分唤醒。"
                : "目前没有阵亡队员。"
            }
          />
        </div>
      </div>
    </section>
  );
}
