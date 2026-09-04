// 中列: 装备大图标 + 羁绊 + 3 样材料 + 积分 + 升阶按钮。
// 这一列是操作主线, 从上到下就是玩家的动作顺序: 看这件东西 → 看要花什么 → 按下去。

import type { CostCheck } from "@/data";
import { getBondDef, getItemDef } from "@/data";
import type { ItemDef, ItemStack } from "@/items/types";
import { RARITY_LABEL, SLOT_LABEL } from "@/items/types";
import { itemIcon } from "@/ui/art/itemArt";
import { BondIcon } from "@/ui/common/BondIcon";
import { EventPanelButton } from "@/ui/common/EventPanel";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { cx } from "@/ui/common/cx";
import s from "./EquipForgeColumn.module.css";

interface Props {
  stack: ItemStack | null;
  def: ItemDef | null;
  nextDef: ItemDef | null;
  check: CostCheck | null;
  loot: number;
  canUpgrade: boolean;
  notice: string;
  onUpgrade: () => void;
  onShowTooltip: (element: HTMLElement, stack: ItemStack) => void;
  onHideTooltip: () => void;
}

export function EquipForgeColumn({
  stack,
  def,
  nextDef,
  check,
  loot,
  canUpgrade,
  notice,
  onUpgrade,
  onShowTooltip,
  onHideTooltip,
}: Props) {
  if (!stack || !def) {
    return (
      <section className={s.column} aria-label="装备升阶">
        <p className={s.idle}>从左侧选择一件装备。</p>
      </section>
    );
  }

  const bond = getBondDef(stack.affinity ?? def.affinity ?? "");

  return (
    <section className={s.column} aria-label="装备升阶">
      <div className={s.stage}>
        <span className={cx(s.icon, s[`r-${def.rarity}`])}>{itemIcon(def)}</span>
      </div>

      <div className={s.title}>
        <h3 className={s.name}>{def.name}</h3>
        <p className={s.tags}>
          <span className={cx(s.rarity, s[`r-${def.rarity}`])}>{RARITY_LABEL[def.rarity]}</span>
          {def.slot && <span>{SLOT_LABEL[def.slot]}</span>}
          {nextDef && (
            <span className={s.step}>
              {RARITY_LABEL[def.rarity]}
              <b className={s.arrow}>→</b>
              <b className={cx(s.rarity, s[`r-${nextDef.rarity}`])}>{RARITY_LABEL[nextDef.rarity]}</b>
            </span>
          )}
        </p>
      </div>

      {bond && (
        <div className={s.bond}>
          <BondIcon bondId={bond.id} className={s.bondIcon} />
          <span className={s.bondName}>
            {bond.name}
            <span className={s.bondArcana}>{bond.arcana}</span>
          </span>
          <span className={s.bondDesc}>{bond.desc}</span>
        </div>
      )}

      <p className={s.notice}>{notice}</p>

      <div className={s.costs}>
        {check?.materials.length ? (
          <div className={s.materials}>
            {check.materials.map((material) => {
              const matStack: ItemStack = {
                uid: `cost-${material.itemId}`,
                itemId: material.itemId,
                count: Math.max(1, material.have),
              };
              return (
                <div
                  key={material.itemId}
                  className={cx(s.material, !material.ok && s.lacking)}
                  onPointerEnter={(event) => onShowTooltip(event.currentTarget, matStack)}
                  onPointerLeave={onHideTooltip}
                  onFocus={(event) => onShowTooltip(event.currentTarget, matStack)}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      onHideTooltip();
                    }
                  }}
                >
                  <ItemSlot
                    stack={matStack}
                    showName={false}
                    showCount={false}
                    disabled={!material.have}
                    aria-label={`${getItemDef(material.itemId).name}，持有 ${material.have}，需要 ${material.need}`}
                  />
                  <span className={s.materialName}>{getItemDef(material.itemId).name}</span>
                  <span className={s.amount}>
                    {material.have} / {material.need}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className={s.noCost}>无需材料。</p>
        )}

        {check?.loot && (
          <div className={cx(s.loot, !check.loot.ok && s.lacking)}>
            <span className={s.lootLabel}>居民积分</span>
            <strong className={s.lootValue}>
              {loot.toLocaleString()} / {check.loot.need.toLocaleString()}
            </strong>
          </div>
        )}
      </div>

      <EventPanelButton
        tone="primary"
        className={s.action}
        disabled={!canUpgrade}
        onClick={onUpgrade}
        aria-label="升阶选中的装备"
      >
        升阶
      </EventPanelButton>
    </section>
  );
}
