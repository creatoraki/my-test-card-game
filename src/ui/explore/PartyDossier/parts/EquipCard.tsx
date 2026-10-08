// 单个装备格的装备卡(琥珀工业): 左侧图标格, 右侧 部位名 / 装备名(稀有度色) / 「装备 · 更换」按钮。
// ★ 6 格(3 部位 × 主副)同屏; 未解锁副格用 LockedEquipCard。
// ★ 卡面写装备名 + 部位名右侧的羁绊色签; 属性词条悬停图标看物品详情, 整体数值看下方属性账本。
// ★ 点图标格或按钮都会打开背包候选, 候选浮层锚在整张卡上。
import type { CSSProperties } from "react";
import { getBondDef, getItemDef } from "@/data";
import { GEAR_SLOT_KIND, GEAR_SLOT_LABEL, GEAR_SLOT_UNLOCK, type GearSlot } from "@/items/gearSlots";
import type { ItemStack } from "@/items/types";
import { PARTY_DOSSIER_SLOT_ART } from "@/ui/art/explore/partyDossierArt";
import { LockGlyph } from "@/ui/character/glyphs/deckGlyphs";
import { BondTag } from "@/ui/common/bond/BondTag";
import ItemIconFrame from "@/ui/common/item/ItemIconFrame";
import { cx } from "@/ui/common/shared/cx";
import { HoverTooltip, useHoverTooltip } from "@/ui/common/tooltip/HoverTooltip";
import { TooltipCard } from "@/ui/common/tooltip/TooltipCard";
import s from "./EquipCard.module.css";

interface Props {
  slot: GearSlot;
  stack: ItemStack | null;
  active: boolean;
  highlighted?: boolean;
  onOpen: (anchor: HTMLElement) => void;
  onShowTooltip: (element: HTMLElement, stack: ItemStack) => void;
  onHideTooltip: () => void;
}

/** 一件装备身上的羁绊词条: 定义自带的固定羁绊 + 掉落时 roll 出的随机羁绊(与 bondCountsOf 同口径)。 */
function bondsOf(stack: ItemStack) {
  return [getItemDef(stack.itemId).affinity, stack.affinity]
    .map((id) => (id ? getBondDef(id) : undefined))
    .filter((def): def is NonNullable<typeof def> => Boolean(def));
}

export function EquipCard({
  slot,
  stack,
  active,
  highlighted,
  onOpen,
  onShowTooltip,
  onHideTooltip,
}: Props) {
  const def = stack ? getItemDef(stack.itemId) : null;
  const bonds = stack ? bondsOf(stack) : [];
  const label = GEAR_SLOT_LABEL[slot];
  const bondText = bonds.length ? `，羁绊：${bonds.map((bond) => bond.name).join("、")}` : "";
  const style = def ? ({ "--rr": `var(--rarity-${def.rarity})` } as CSSProperties) : undefined;

  const open = (trigger: HTMLElement) => {
    onHideTooltip();
    onOpen(trigger.closest("article") ?? trigger);
  };

  return (
    <article
      className={cx(s.card, active && s.active, highlighted && s.highlighted)}
      style={style}
      data-empty={stack ? undefined : ""}
      aria-label={`${label}：${def?.name ?? "空槽"}${bondText}`}
    >
      <button
        type="button"
        className={s.well}
        aria-label={`更换${label}`}
        onClick={(event) => open(event.currentTarget)}
      >
        {stack ? (
          <span
            className={s.icon}
            onMouseEnter={(event) => !active && onShowTooltip(event.currentTarget, stack)}
            onMouseLeave={onHideTooltip}
          >
            <ItemIconFrame itemId={stack.itemId} size="md" className={s.iconFrame} />
          </span>
        ) : (
          <img className={s.silhouette} src={PARTY_DOSSIER_SLOT_ART[GEAR_SLOT_KIND[slot]]} alt="" draggable={false} />
        )}
      </button>

      <div className={s.titleRow}>
        <span className={s.slot}>{label}</span>
        {bonds.map((bond, index) => (
          <BondTag key={`${bond.id}-${index}`} def={bond} className={s.bondTag} />
        ))}
      </div>
      <span className={s.sub} data-item={def ? "" : undefined}>{def?.name ?? `未装备${label}`}</span>
      <button
        type="button"
        className={s.swap}
        data-on={active || undefined}
        onClick={(event) => open(event.currentTarget)}
      >
        {stack ? "更换" : "装备"}
      </button>
    </article>
  );
}

/** 未解锁副格: 暗化卡 + 锁 + 解锁等级, 悬浮说明解锁条件。 */
export function LockedEquipCard({ slot }: { slot: GearSlot }) {
  const { point, bind } = useHoverTooltip();
  const label = GEAR_SLOT_LABEL[slot];
  const level = GEAR_SLOT_UNLOCK[slot];
  return (
    <article
      className={cx(s.card, s.locked)}
      data-empty=""
      tabIndex={0}
      aria-label={`${label}：${level}级解锁`}
      {...bind}
    >
      <span className={s.well} aria-hidden="true">
        <span className={s.lockIcon}><LockGlyph /></span>
      </span>
      <div className={s.titleRow}>
        <span className={s.slot}>{label}</span>
      </div>
      <span className={s.sub}>{level}级解锁</span>
      {point && (
        <HoverTooltip point={point}>
          <TooltipCard title={`${label}未解锁`} desc={`卡组等级达到 ${level} 级后开放此装备格。`} />
        </HoverTooltip>
      )}
    </article>
  );
}
