import { cx } from "@/ui/common/cx";
import ItemIconFrame from "@/ui/common/item/ItemIconFrame";
import type { TechnologyNode } from "@/ui/common/techTree/TechnologyTree/types";
import s from "./TechnologyMaterials.module.css";

export function TechnologyMaterials({ materials, done, className }: {
  materials: TechnologyNode["materials"];
  done: boolean;
  className?: string;
}) {
  return (
    <div className={cx(s.materials, className)}>
      {materials.map((material) => <div key={material.itemId} className={s.material} data-lacking={!done && material.have < material.need || undefined}>
        <ItemIconFrame
          className={s.icon}
          itemId={material.itemId}
          size="lg"
          tooltip
          aria-label={`${material.name}，需要 ${material.need}，持有 ${material.have}`}
        />
        <span className={s.name}>{material.name}</span>
        <strong className={s.need}>× {material.need}</strong>
        <span className={s.have}>持有 {material.have}</span>
      </div>)}
      {!materials.length && <span className={s.empty}>无需消耗材料</span>}
    </div>
  );
}
