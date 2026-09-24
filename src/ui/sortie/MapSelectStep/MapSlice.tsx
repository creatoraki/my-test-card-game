// 选层斜切带里的一张地图卡。转轮每走一格, 只有「当前卡」和「相邻让位方向变了」的卡需要重渲染 ——
// 所以 props 全部是原始值, 交给 memo 做浅比较; 锁定信息由父级按地图预先算好传入。

import { memo, type CSSProperties } from "react";
import { cx } from "@/ui/common/shared/cx";
import { mapArt } from "@/ui/art/explore/mapArt";
import { SortieFrame } from "@/ui/sortie/SortieFrame";
import { SortieGlyph } from "@/ui/sortie/SortieGlyph";
import s from "./MapSlice.module.css";

/** 相邻卡为中央放大卡让出的位移(px)。 */
const NEIGHBOR_SHIFT = 21;

interface Props {
  mapId: string;
  name: string;
  index: number;
  isCurrent: boolean;
  /** -1 = 在当前卡之前(上让), 1 = 之后(下让), 0 = 自己就是当前卡。 */
  neighbor: -1 | 0 | 1;
  /** 承担语义(role/aria/tab)的那一份副本。 */
  semantic: boolean;
  selected: boolean;
  focusable: boolean;
  locked: boolean;
  lockReason: string | null;
  onSelect: (index: number) => void;
}

function MapSlice({
  mapId,
  name,
  index,
  isCurrent,
  neighbor,
  semantic,
  selected,
  focusable,
  locked,
  lockReason,
  onSelect,
}: Props) {
  return (
    <div
      className={s.slot}
      data-current={isCurrent || undefined}
      style={{ "--neighbor-shift": `${neighbor * NEIGHBOR_SHIFT}px` } as CSSProperties}
    >
      <button
        className={cx(s.slice, isCurrent && s.isOn)}
        type="button"
        data-locked={locked ? "true" : undefined}
        role={semantic ? "option" : undefined}
        aria-selected={semantic ? selected : undefined}
        aria-hidden={semantic ? undefined : true}
        tabIndex={semantic && focusable ? 0 : -1}
        aria-label={locked ? `${name}（未开放）` : `选择${name}`}
        onClick={() => onSelect(index)}
      >
        <span className={s.surface}>
          <img className={s.art} src={mapArt(mapId)} alt="" draggable={false} decoding="async" />
        </span>
        <SortieFrame width={isCurrent ? 516 : 474} height={isCurrent ? 188 : 146} selected={isCurrent} />
        <span className={s.detail} aria-hidden="true">···</span>
        {isCurrent && <>
          <span className={s.currentTag}>
            <SortieFrame width={114} height={39} notch={8} metal={false} />
            <span className={s.currentLabel}>当前</span>
          </span>
          <span className={s.locator} />
          <SortieGlyph name="beacon" className={s.currentIcon} />
        </>}
        <span className={s.copy}>
          <strong className={s.name}>{name}</strong>
          {locked && <span className={s.status}>{isCurrent ? lockReason ?? "暂未开放" : "暂未开放"}</span>}
          {isCurrent && <span className={s.currentRule} aria-hidden="true" />}
        </span>
        {locked && <SortieGlyph name="lock" className={s.lock} />}
      </button>
    </div>
  );
}

export default memo(MapSlice);
