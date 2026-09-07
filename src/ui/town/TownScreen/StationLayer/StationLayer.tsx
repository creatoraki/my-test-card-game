// 空间站全景的建筑热区层 —— 与背景图共用同一套 1920×1080 坐标, 由 TownScreen 同步做相机变换。
//
// ★ 每栋建筑 = 一条手描剪影(见 stationBuildings.ts)。它同时是命中区: 建筑之间的空隙
//   点不亮任何光效, 也点不进设施。
// ★ 光效是同一条 path 的四次复用(晕/边/芯/环绕光), 靠 <use href> 引同一个 <defs> 里的定义,
//   所以轮廓只描一遍, 四层永远对得上。
// ★ 招牌是竖排中文 + 引线锚点, 位置(sign.x/y 与 anchorX/anchorY)也在建筑表里。

import { useId, type KeyboardEvent } from "react";
import {
  SCENE_HEIGHT,
  SCENE_WIDTH,
  STATION_BUILDINGS,
  type BuildingId,
  type StationBuilding,
} from "../stationBuildings";
import s from "./StationLayer.module.css";

function BuildingBillboard({ building, index }: { building: StationBuilding; index: number }) {
  const { x, y, anchorX, anchorY } = building.sign;
  const height = building.label.length * 32 + 64;

  return (
    <g className={s.billboard} aria-hidden="true">
      <path
        className={s.signConnector}
        d={`M ${x} ${y + height} V ${y + height + 14} L ${anchorX} ${anchorY}`}
      />
      <circle className={s.signAnchor} cx={anchorX} cy={anchorY} r="4" />
      <g transform={`translate(${x - 32} ${y})`}>
        <path
          className={s.signPanel}
          d={`M 10 0 H 64 V ${height - 10} L 54 ${height} H 0 V 10 Z`}
        />
        <path
          className={s.signRail}
          d={`M 0 42 V 12 L 10 2 H 34 M 64 ${height - 42} V ${height - 12} L 54 ${height - 2} H 30`}
        />
        <text className={s.signIndex} x="32" y="22" textAnchor="middle">
          {String(index + 1).padStart(2, "0")}
        </text>
        <path className={s.signDivider} d="M 17 32 H 47" />
        <text className={s.signName} textAnchor="middle">
          {Array.from(building.label).map((character, i) => (
            <tspan key={i} x="32" y={61 + i * 32}>
              {character}
            </tspan>
          ))}
        </text>
        <path className={s.signDivider} d={`M 22 ${height - 18} H 42`} />
        <circle className={s.signLight} cx="32" cy={height - 9} r="2" />
      </g>
    </g>
  );
}

export interface StationLayerProps {
  /** 点击(或键盘确认)建筑时触发, 用于进入对应设施。 */
  onEnter: (building: StationBuilding) => void;
  /** 已被点中的建筑: 亮一下当作「就是它」的确认反馈, 再随全景一起推走。 */
  pickedId?: BuildingId | null;
}

export function StationLayer({ onEnter, pickedId = null }: StationLayerProps) {
  const id = useId().replace(/:/g, "");

  const handleKeyDown = (event: KeyboardEvent<SVGGElement>, building: StationBuilding) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onEnter(building);
  };

  return (
    <svg className={s.scene} viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`} aria-label="空间站全景">
      <defs>
        {STATION_BUILDINGS.map((building) => (
          <path key={building.id} id={`${id}-${building.id}`} d={building.path} />
        ))}
      </defs>
      {STATION_BUILDINGS.map((building, index) => {
        const href = `#${id}-${building.id}`;
        return (
          <g
            key={building.id}
            className={s.building}
            tabIndex={0}
            role="button"
            aria-label={`${building.label}，进入${building.label}`}
            data-building={building.id}
            data-picked={pickedId === building.id}
            onClick={() => onEnter(building)}
            onKeyDown={(event) => handleKeyDown(event, building)}
          >
            <use href={href} className={s.hitArea} />
            <g className={s.highlight} aria-hidden="true">
              <use href={href} className={s.halo} />
              <use href={href} className={s.edge} />
              <use href={href} className={s.core} />
              <use href={href} className={s.orbit} />
            </g>
            <BuildingBillboard building={building} index={index} />
          </g>
        );
      })}
    </svg>
  );
}
