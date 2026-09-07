import { getItemDef, type CostCheck } from "@/data";
import type { ItemStack } from "@/items/types";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { cx } from "@/ui/common/cx";
import s from "./EquipCostRack.module.css";

interface Props {
  check: CostCheck | null;
  onShowTooltip: (element: HTMLElement, stack: ItemStack) => void;
  onHideTooltip: () => void;
}

export function EquipCostRack({ check, onShowTooltip, onHideTooltip }: Props) {
  return (
    <section className={s.rack} aria-label="装备养成消耗">
      <div className={s.heading}>
        <span className={s.kicker}>消耗清单</span>
        <span className={s.state}>{check?.ok ? "资源充足" : "资源不足"}</span>
      </div>
      {check ? (
        <>
          <div className={s.materials}>
            {check.materials.map((material) => {
              const stack: ItemStack = {
                uid: `cost-${material.itemId}`,
                itemId: material.itemId,
                count: Math.max(1, material.have),
              };
              return (
                <div
                  key={material.itemId}
                  className={cx(s.material, !material.ok && s.lacking)}
                  onPointerEnter={(event) => onShowTooltip(event.currentTarget, stack)}
                  onPointerLeave={onHideTooltip}
                  onFocus={(event) => onShowTooltip(event.currentTarget, stack)}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onHideTooltip();
                  }}
                >
                  <ItemSlot
                    stack={stack}
                    showName={false}
                    disabled={!material.have}
                    className={s.slot}
                    aria-label={`${getItemDef(material.itemId).name}，持有 ${material.have}，需要 ${material.need}`}
                  />
                  <span className={s.materialName}>{getItemDef(material.itemId).name}</span>
                  <span className={s.amount}>{material.have} / {material.need}</span>
                </div>
              );
            })}
          </div>
          {check.loot && (
            <div className={cx(s.loot, !check.loot.ok && s.lacking)}>
              <span>居民积分</span>
              <strong>{check.loot.have.toLocaleString()} / {check.loot.need.toLocaleString()}</strong>
            </div>
          )}
        </>
      ) : (
        <p className={s.empty}>选择一件装备查看所需资源。</p>
      )}
    </section>
  );
}