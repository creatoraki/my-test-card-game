import { useState } from "react";
import { getItemDef, type TechCostMaterialCheck } from "@/data";
import type { ItemStack } from "@/items/types";
import ItemSlot from "@/ui/common/item/ItemSlot";
import ItemTooltip, {
  tooltipPointFromElement,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import { cx } from "@/ui/common/cx";
import s from "./TechCostMaterials.module.css";

interface Props {
  materials: TechCostMaterialCheck[];
  done: boolean;
}

interface HoveredMaterial {
  stack: ItemStack;
  point: TooltipPoint;
}

export function TechCostMaterials({ materials, done }: Props) {
  const [hovered, setHovered] = useState<HoveredMaterial | null>(null);

  const clearTooltip = () => setHovered(null);

  return (
    <>
      <div className={s.materials}>
        {materials.map((material) => {
          const def = getItemDef(material.itemId);
          const stack: ItemStack = {
            uid: `shop-tech-cost-${material.itemId}`,
            itemId: material.itemId,
            count: Math.max(1, material.have),
          };
          const lacking = !done && !material.ok;

          return (
            <div
              key={material.itemId}
              className={cx(s.material, lacking && s["is-lacking"])}
              onPointerEnter={(event) => setHovered({
                stack,
                point: tooltipPointFromElement(event.currentTarget, "left"),
              })}
              onPointerLeave={clearTooltip}
              onFocus={(event) => setHovered({
                stack,
                point: tooltipPointFromElement(event.currentTarget, "left"),
              })}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) clearTooltip();
              }}
            >
              <ItemSlot
                stack={stack}
                showName={false}
                showCount={false}
                disabled={!material.have}
                aria-label={`${def.name}，持有 ${material.have}，需要 ${material.need}`}
                className={s.materialSlot}
              />
              <span className={s.materialName}>{def.name}</span>
              <span className={s.amount}>{material.have} / {material.need}</span>
            </div>
          );
        })}
      </div>
      {hovered && <ItemTooltip stack={hovered.stack} point={hovered.point} />}
    </>
  );
}
