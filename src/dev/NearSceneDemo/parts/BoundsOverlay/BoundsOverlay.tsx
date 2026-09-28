import { memo } from "react";
import { buildingLabel, NEAR_SCENE_GEOMETRY, streetLabel, type NearScenePlan, type StreetPlacement } from "@/ui/art/proceduralNear";
import s from "./BoundsOverlay.module.css";

const { baseY, tileWidth, height } = NEAR_SCENE_GEOMETRY;
/** 设施框的高度只作示意，不代表真实包围盒。 */
const ITEM_BOX_H = 120;

function ItemBox({ item, className }: { item: StreetPlacement; className: string }) {
  return <div className={`${s.box} ${className}`} style={{ left: item.x, top: item.ground - ITEM_BOX_H, width: item.width, height: ITEM_BOX_H }}>
    <span className={s.label}>{streetLabel(item.kind)}</span>
  </div>;
}

/** 调试层：前排建筑占地框、身后设施框、前景设施框（各带中文名），以及分块接缝线。 */
export const BoundsOverlay = memo(function BoundsOverlay({ plan }: { plan: NearScenePlan }) {
  const seams = Array.from({ length: Math.ceil(plan.width / tileWidth) - 1 }, (_, i) => (i + 1) * tileWidth);
  return <div className={s.overlay} aria-hidden>
    {plan.front.map((b, i) => {
      const top = Math.max(0, b.top);
      return <div key={i} className={s.box} style={{ left: b.x, top, width: b.width, height: baseY - top }}>
        <span className={s.label}>{buildingLabel(b.kind)}</span>
      </div>;
    })}
    {plan.street.map((item, i) => <ItemBox key={`s${i}`} item={item} className={s.street} />)}
    {plan.fore.map((item, i) => <ItemBox key={`f${i}`} item={item} className={s.fore} />)}
    {seams.map((x, i) => <div key={x} className={s.seam} style={{ left: x, height }}>
      <span className={s.seamLabel}>接缝 {i + 1}</span>
    </div>)}
  </div>;
});
