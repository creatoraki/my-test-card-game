// 单个部位的大装备卡: 部位 + 稀有度页眉、居中大图、底栏羁绊词条 + 「更换」按钮。
// ★ 卡面不写装备名、不列具体属性 —— 悬停大图看物品详情, 整体数值看下方属性面板。
// ★ 点大图或「更换」都会打开背包候选, 候选浮层锚在整张卡上。
// 背包里点「装备」带进来的同部位装备会在卡底部长出「待换上」条, 一键换上。
import type { CSSProperties } from "react";
import { getBondDef, getItemDef } from "@/data";
import { RARITY_LABEL, SLOT_LABEL, type EquipSlot, type ItemStack } from "@/items/types";
import { ArcanaIcon, getArcanaAccent } from "@/ui/common/icon/ArcanaIcon";
import ItemIconFrame from "@/ui/common/item/ItemIconFrame";
import { cx } from "@/ui/common/shared/cx";
import s from "./EquipCard.module.css";

interface Props {
  slot: EquipSlot;
  stack: ItemStack | null;
  /** 背包「装备」带进来的同部位装备。 */
  pending: ItemStack | null;
  active: boolean;
  lockedReason?: string;
  onOpen: (anchor: HTMLElement) => void;
  onEquipPending: () => void;
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
  pending,
  active,
  lockedReason,
  onOpen,
  onEquipPending,
  onShowTooltip,
  onHideTooltip,
}: Props) {
  const def = stack ? getItemDef(stack.itemId) : null;
  const bonds = stack ? bondsOf(stack) : [];
  const pendingDef = pending ? getItemDef(pending.itemId) : null;
  const style = { "--rr": def ? `var(--rarity-${def.rarity})` : "#5d7177" } as CSSProperties;

  const open = (trigger: HTMLElement) => {
    onHideTooltip();
    onOpen(trigger.closest("article") ?? trigger);
  };

  return (
    <article
      className={cx(s.card, active && s.active)}
      style={style}
      data-empty={stack ? undefined : ""}
      data-pending={pending ? "" : undefined}
      aria-label={`${SLOT_LABEL[slot]}：${def?.name ?? "空槽"}`}
    >
      <header className={s.head}>
        <span className={s.slot}>{SLOT_LABEL[slot]}</span>
        {def && <span className={s.rarity}>{RARITY_LABEL[def.rarity]}</span>}
      </header>

      <button
        type="button"
        className={s.main}
        aria-label={`更换${SLOT_LABEL[slot]}`}
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
              const accent = getArcanaAccent(bond.id) ?? bond.color;
              return (
                <span key={`${bond.id}-${index}`} className={s.bond} style={{ "--bond": accent } as CSSProperties}>
                  <ArcanaIcon id={bond.id} size={26} bare accent={accent} />
                  {bond.name}
                </span>
              );
            })}
          </span>
        ) : (
          <span className={s.noBond}>{stack ? "无羁绊词条" : `未装备${SLOT_LABEL[slot]}`}</span>
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

      {pending && pendingDef && (
        <div className={s.pending} style={{ "--pr": `var(--rarity-${pendingDef.rarity})` } as CSSProperties}>
          <span className={s.pendingLabel}>待换上</span>
          <span
            className={s.pendingIcon}
            onMouseEnter={(event) => onShowTooltip(event.currentTarget, pending)}
            onMouseLeave={onHideTooltip}
          >
            <ItemIconFrame itemId={pending.itemId} size="sm" />
          </span>
          <span className={s.pendingName}>{pendingDef.name}</span>
          <button
            type="button"
            className={s.pendingButton}
            disabled={Boolean(lockedReason)}
            onClick={() => {
              onHideTooltip();
              onEquipPending();
            }}
          >
            {lockedReason ?? "换上"}
          </button>
        </div>
      )}
    </article>
  );
}
