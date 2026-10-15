// 竖排招牌: 编号 + 竖排中文名 + 引线锚点, 挂点见 stationBuildings.ts 的 sign。
// 悬停/选中/锁定的外观由 StationLayer.module.css 按父级 .building 的状态切换。

import type { StationBuilding } from "../../stationBuildings";
import s from "./StationLayer.module.css";

export function BuildingBillboard({ building, index }: { building: StationBuilding; index: number }) {
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
