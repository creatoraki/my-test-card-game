// 商店物品详情的数据组装层。视觉外壳统一由 ShopDetailCard 承载。

import { memo, useMemo, type CSSProperties } from "react";
import { getBondDef, getItemDef } from "@/data";
import { STAT_KEYS } from "@/engine";
import type { ItemStack } from "@/items/types";
import { rollPerfectness, rollToFlat } from "@/items/equipRoll";
import { CATEGORY_LABEL, RARITY_LABEL, SLOT_LABEL } from "@/items/types";
import { STAT_LABEL } from "@/ui/common/item/ItemDetail";
import { BondIcon } from "@/ui/common/BondIcon";
import { BondTooltip } from "@/ui/common/BondTooltip";
import { RailPopover } from "@/ui/common/RailPopover";
import { itemIcon } from "@/ui/art/itemArt";
import { isPercentStat } from "@/ui/common/statGroups";
import { ShopDetailCard } from "../ShopDetailCard";
import detailStyles from "../ShopDetailCard/ShopDetailCard.module.css";
import s from "./ShopItemCard.module.css";

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

interface Props {
  stack: ItemStack | null;
  placeholder?: string;
}

function ShopItemCard({ stack, placeholder }: Props) {
  if (!stack) {
    return <ShopDetailCard animKey="empty" placeholder={placeholder ?? "选择一件商品查看详情"} />;
  }

  return <ShopItemCardBody stack={stack} />;
}

const ShopItemCardBody = memo(function ShopItemCardBody({ stack }: { stack: ItemStack }) {
  const def = getItemDef(stack.itemId);
  const bond = getBondDef(stack.affinity ?? def.affinity ?? "");
  const rows = useMemo(() => {
    const flatMods = stack.roll ? rollToFlat(stack.roll) : def.mods?.flat;
    const pctMods = def.mods?.pct;
    const nextRows: { label: string; value: string; good: boolean }[] = [];
    for (const key of STAT_KEYS) {
      const flat = flatMods?.[key];
      const pct = pctMods?.[key];
      if (flat) {
        nextRows.push({
          label: STAT_LABEL[key] ?? key,
          value: `${signed(flat)}${isPercentStat(key) ? "%" : ""}`,
          good: flat > 0,
        });
      }
      if (pct) {
        nextRows.push({
          label: STAT_LABEL[key] ?? key,
          value: `${signed(pct)}${isPercentStat(key) ? "%" : ""}`,
          good: pct > 0,
        });
      }
    }
    return nextRows;
  }, [def, stack]);

  return (
    <ShopDetailCard
      animKey={stack.uid}
      tone={def.rarity}
      stage={itemIcon(def)}
      title={(
        <>
          {def.name}
          {stack.count > 1 && <span className={detailStyles["sx-card-mult"]}> ×{stack.count}</span>}
        </>
      )}
      titleMeta={(
        <>
          {stack.roll && (
            <span
              className={detailStyles["sx-card-chip"]}
              aria-label={`完美度 ${rollPerfectness(def, stack.roll)}`}
            >
              完美度 {rollPerfectness(def, stack.roll)}
            </span>
          )}
          {bond && (
            <span
              className={s["sx-card-bond"]}
              style={{ "--sx-bond": bond.color } as CSSProperties}
              aria-label={`${bond.name}（${bond.arcana}）· ${bond.desc}`}
              data-rail-item
              tabIndex={0}
              role="group"
            >
              <span className={s["sx-card-bond-trigger"]}>
                <BondIcon bondId={bond.id} className={s["sx-card-bond-icon"]} />
                <span className={s["sx-card-bond-name"]}>{bond.name}</span>
              </span>
              <RailPopover side="bottom-right" className={s["sx-card-bond-popover"]}>
                <BondTooltip def={bond} count={1} tierIndex={-1} next={bond.tiers[0]} />
              </RailPopover>
            </span>
          )}
        </>
      )}
      tags={(
        <>
          <span className={detailStyles["sx-card-rarity"]}>{RARITY_LABEL[def.rarity]}</span>
          <span>{CATEGORY_LABEL[def.category]}</span>
          {def.slot && <span>{SLOT_LABEL[def.slot]}</span>}
        </>
      )}
      desc={def.desc}
      rows={rows}
      foot={(
        <>
          {def.affinityRollable && !bond && (
            <span className={`${detailStyles["sx-card-note"]} ${detailStyles["is-locked"]}`}>
              这件装备没有羁绊词条。
            </span>
          )}
        </>
      )}
    />
  );
});

export default memo(ShopItemCard);
