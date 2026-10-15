// 空间站全景的建筑热区层 —— 与背景图共用同一套 1920×1080 坐标, 由 TownScreen 同步做相机变换。
//
// ★ 每栋建筑 = 一条手描剪影(见 stationBuildings.ts)。它同时是命中区: 建筑之间的空隙
//   点不亮任何光效, 也点不进设施。
// ★ 光效是同一条 path 的四次复用(晕/边/芯/环绕光), 靠 <use href> 引同一个 <defs> 里的定义,
//   所以轮廓只描一遍, 四层永远对得上。
// ★ 招牌是竖排中文 + 引线锚点, 位置(sign.x/y 与 anchorX/anchorY)也在建筑表里。
// ★ 未开放的建筑(locks 里有它): 剪影上盖一层沿轮廓的暗色斜纹蒙版 + 一把 GLSL 锁头;
//   点它不会进设施, 只让锁头抖一下并亮出开放条件。

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import {
  SCENE_HEIGHT,
  SCENE_WIDTH,
  STATION_BUILDINGS,
  type BuildingId,
  type StationBuilding,
} from "../../stationBuildings";
import type { BuildingLocks } from "../../buildingUnlock";
import { BuildingBillboard } from "./BuildingBillboard";
import { BuildingLock } from "./BuildingLock";
import s from "./StationLayer.module.css";

/** 拒绝进入的反馈时长, 与锁头着色器的急抖、条件牌的抖动同拍。 */
const DENY_MS = 420;

export interface StationLayerProps {
  /** 点击(或键盘确认)已开放的建筑时触发, 用于进入对应设施。 */
  onEnter: (building: StationBuilding) => void;
  /** 已被点中的建筑: 亮一下当作「就是它」的确认反馈, 再随全景一起推走。 */
  pickedId?: BuildingId | null;
  /** 未开放的建筑 → 开放条件。 */
  locks: BuildingLocks;
}

export function StationLayer({ onEnter, pickedId = null, locks }: StationLayerProps) {
  const id = useId().replace(/:/g, "");
  const [hoveredId, setHoveredId] = useState<BuildingId | null>(null);
  const [deniedId, setDeniedId] = useState<BuildingId | null>(null);
  const denyTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(denyTimer.current), []);

  const activate = (building: StationBuilding) => {
    if (!locks[building.id]) {
      onEnter(building);
      return;
    }
    window.clearTimeout(denyTimer.current);
    setDeniedId(building.id);
    denyTimer.current = window.setTimeout(() => setDeniedId(null), DENY_MS);
  };

  const handleKeyDown = (event: KeyboardEvent<SVGGElement>, building: StationBuilding) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    activate(building);
  };

  return (
    <div className={s.root}>
      <svg className={s.scene} viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`} aria-label="空间站全景">
        <defs>
          {STATION_BUILDINGS.map((building) => (
            <path key={building.id} id={`${id}-${building.id}`} d={building.path} />
          ))}
          {/* 锁定蒙版的斜纹: 用户坐标铺设, 各栋楼的纹路连成一片, 不会随轮廓错位。 */}
          <pattern
            id={`${id}-hatch`}
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="5" height="16" className={s.hatchStripe} />
          </pattern>
        </defs>
        {STATION_BUILDINGS.map((building, index) => {
          const href = `#${id}-${building.id}`;
          const reason = locks[building.id];
          return (
            <g
              key={building.id}
              className={s.building}
              tabIndex={0}
              role="button"
              aria-label={reason ? `${building.label}，${reason}` : `${building.label}，进入${building.label}`}
              aria-disabled={reason ? true : undefined}
              data-building={building.id}
              data-picked={pickedId === building.id}
              data-locked={!!reason}
              onClick={() => activate(building)}
              onKeyDown={(event) => handleKeyDown(event, building)}
              onPointerEnter={() => setHoveredId(building.id)}
              onPointerLeave={() => setHoveredId((current) => (current === building.id ? null : current))}
              onFocus={() => setHoveredId(building.id)}
              onBlur={() => setHoveredId((current) => (current === building.id ? null : current))}
            >
              <use href={href} className={s.hitArea} />
              {reason ? (
                <g className={s.lockMask} aria-hidden="true">
                  <use href={href} className={s.maskShade} />
                  <use href={href} className={s.maskHatch} fill={`url(#${id}-hatch)`} />
                  <use href={href} className={s.maskEdge} />
                </g>
              ) : (
                <g className={s.highlight} aria-hidden="true">
                  <use href={href} className={s.halo} />
                  <use href={href} className={s.edge} />
                  <use href={href} className={s.core} />
                  <use href={href} className={s.orbit} />
                </g>
              )}
              <BuildingBillboard building={building} index={index} />
            </g>
          );
        })}
      </svg>
      {STATION_BUILDINGS.map((building, index) => {
        const reason = locks[building.id];
        return reason ? (
          <BuildingLock
            key={building.id}
            building={building}
            reason={reason}
            hovered={hoveredId === building.id}
            denying={deniedId === building.id}
            seed={index * 0.37}
          />
        ) : null;
      })}
    </div>
  );
}
