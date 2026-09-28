import type { MapDef, MapId } from "../../types";
import s from "./MapSwitch.module.css";

export interface MapSwitchProps {
  maps: readonly MapDef[];
  current: MapId;
  onChange(id: MapId): void;
}

/**
 * 左上角的地图切换分段按钮。按下时不夺走焦点: 否则空格 / E 会再次触发按钮, 而不是交给场景。
 */
export function MapSwitch({ maps, current, onChange }: MapSwitchProps) {
  return <div className={s.root} role="radiogroup" aria-label="切换地图">
    {maps.map((map) => {
      const active = map.id === current;
      return <button
        key={map.id}
        type="button"
        role="radio"
        aria-checked={active}
        className={s.option}
        data-active={active}
        tabIndex={-1}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          if (!active) onChange(map.id);
        }}
      >
        {map.name}
      </button>;
    })}
  </div>;
}
