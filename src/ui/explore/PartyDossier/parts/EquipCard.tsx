// 单个装备格的装备卡: 左侧大图, 右侧部位 + 稀有度页眉、羁绊词条、「更换」按钮。
// ★ 6 格(3 部位 × 主副)同屏, 所以卡片是横向紧凑版; 未解锁副格用 LockedEquipCard。
// ★ 卡面不写装备名、不列具体属性 —— 悬停大图看物品详情, 整体数值看下方属性面板。
// ★ 点大图或「更换」都会打开背包候选, 候选浮层锚在整张卡上。
import type { CSSProperties } from "react";
import { getBondDef, getItemDef } from "@/data";
import { GEAR_SLOT_LABEL, GEAR_SLOT_UNLOCK, type GearSlot } from "@/items/gearSlots";
import { RARITY_LABEL, type ItemStack } from "@/items/types";
import { LockGlyph } from "@/ui/character/glyphs/deckGlyphs";
import { ArcanaIcon } from "@/ui/common/icon/ArcanaIcon";
import { bondAccent } from "@/ui/common/bond/BondTag";
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
  const style = { "--rr": def ? `var(--rarity-${def.rarity})` : "#5d7177" } as CSSProperties;

  const open = (trigger: HTMLElement) => {
    onHideTooltip();
    onOpen(trigger.closest("article") ?? trigger);
  };

  return (
    <article
      className={cx(s.card, active && s.active, highlighted && s.highlighted)}
      style={style}
      data-empty={stack ? undefined : ""}
      aria-label={`${label}：${def?.name ?? "空槽"}`}
    >
      <header className={s.head}>
        <span className={s.slot}>{label}</span>
        {def && <span className={s.rarity}>{RARITY_LABEL[def.rarity]}</span>}
      </header>

      <button
        type="button"
        className={s.main}
        aria-label={`更换${label}`}
        onClick={(event) => open(event.currentTarget)}
      >
        {stack ? (
          <span
            className={s.icon}
            onMouseEnter={(event) => !active && onShowTooltip(event.currentTarget, stack)}
            onMouseLeave={onHideTooltip}
          >
            <ItemIconFrame itemId={stack.itemId} size="xl" className={s.iconFrame} />
          </span>
        ) : (
          <span className={s.emptyIcon} aria-hidden="true">空</span>
        )}
      </button>

      <footer className={s.foot}>
        {bonds.length > 0 ? (
          <span className={s.bonds}>
            {bonds.map((bond, index) => {
              const accent = bondAccent(bond);
              return (
                <span key={`${bond.id}-${index}`} className={s.bond} style={{ "--bond": accent } as CSSProperties}>
                  <ArcanaIcon id={bond.id} size={26} bare accent={accent} />
                  {bond.name}
                </span>
              );
            })}
          </span>
        ) : (
          <span className={s.noBond}>{stack ? "无羁绊词条" : `未装备${label}`}</span>
        )}
        <button
          type="button"
          className={s.swap}
          data-on={active || undefined}
          onClick={(event) => open(event.currentTarget)}
        >
          {stack ? "更换" : "装备"}
        </button>
      </footer>

    </article>
  );
}

/** 未解锁副格: 虚线暗卡 + 锁 + 解锁等级, 悬浮说明解锁条件。 */
export function LockedEquipCard({ slot }: { slot: GearSlot }) {
  const { point, bind } = useHoverTooltip();
  const label = GEAR_SLOT_LABEL[slot];
  const level = GEAR_SLOT_UNLOCK[slot];
  return (
    <article
      className={cx(s.card, s.locked)}
      style={{ "--rr": "#5d7177" } as CSSProperties}
      data-empty=""
      tabIndex={0}
      aria-label={`${label}：${level}级解锁`}
      {...bind}
    >
      <span className={s.lockIcon} aria-hidden="true"><LockGlyph /></span>
      <header className={s.head}>
        <span className={s.slot}>{label}</span>
      </header>
      <span className={s.lockText}>{level}级解锁</span>
      {point && (
        <HoverTooltip point={point}>
          <TooltipCard title={`${label}未解锁`} desc={`卡组等级达到 ${level} 级后开放此装备格。`} />
        </HoverTooltip>
      )}
    </article>
  );
}
