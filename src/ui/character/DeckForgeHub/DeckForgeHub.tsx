import type { CSSProperties } from "react";
import { RULES } from "@/engine";
import { HoverTooltip, useHoverTooltip } from "@/ui/common/HoverTooltip";
import { cx } from "@/ui/common/cx";
import { ModalReveal, modalRevealVars, useModalReveal } from "@/ui/common/ModalReveal";
import s from "./DeckForgeHub.module.css";

export interface DeckForgeCosts {
  draw: number;
  remove: number;
  upgrade: number | null;
}

interface Props {
  deckSize: number;
  deckLevel: number;
  minDeckSize: number;
  exp: number;
  costs: DeckForgeCosts;
  canDraw: boolean;
  canRemove: boolean;
  canUpgrade: boolean;
  drawDisabledReason?: string;
  removeDisabledReason?: string;
  upgradeDisabledReason?: string;
  onDraw: () => void;
  onRemove: () => void;
  onUpgrade: () => void;
  onClose: () => void;
}

export function DeckForgeHub({
  deckSize,
  deckLevel,
  minDeckSize,
  exp,
  costs,
  canDraw,
  canRemove,
  canUpgrade,
  drawDisabledReason,
  removeDisabledReason,
  upgradeDisabledReason,
  onDraw,
  onRemove,
  onUpgrade,
  onClose,
}: Props) {
  const closeReveal = useModalReveal(onClose);
  return (
    <div
      className={s.hub}
      data-closing={closeReveal.closing ? "true" : undefined}
      style={modalRevealVars()}
      role="dialog"
      aria-modal="true"
      aria-label="卡组锻造"
    >
      <button className={s.backdrop} type="button" aria-label="关闭卡组锻造中枢" onClick={closeReveal.requestClose} />
      <ModalReveal closing={closeReveal.closing} className={s.reveal}>
        <section className={s.modal}>
          <header className={s.head}>
            <div>
              <span className={s.kicker}>卡组操作</span>
              <h2 className={s.title}>卡组锻造</h2>
              <p className={s.readout}>
                {deckSize} 张 · Lv.{deckLevel}/{RULES.deck.levelMax} · 下限 {minDeckSize} · 可用经验 {exp}
              </p>
            </div>
            <button className={s.close} type="button" onClick={closeReveal.requestClose} aria-label="关闭卡组锻造中枢">
              ×
            </button>
          </header>

          <div className={s.options}>
            <ForgeOption
              tone="draw"
              icon="＋"
              name="扩充卡组"
              cost={`${costs.draw} 经验`}
              description="从可用卡池中选择一张加入卡组"
              disabled={!canDraw}
              disabledReason={drawDisabledReason ?? "当前无法扩充卡组"}
              onClick={onDraw}
            />
            <ForgeOption
              tone="remove"
              icon="−"
              name="精简卡组"
              cost={`${costs.remove} 经验`}
              description="移除一张卡，让卡组更快找到核心"
              disabled={!canRemove}
              disabledReason={removeDisabledReason ?? "当前无法精简卡组"}
              onClick={onRemove}
            />
            <ForgeOption
              tone="upgrade"
              icon="↑"
              name="升级卡组"
              cost={costs.upgrade == null ? `已满级 Lv.${deckLevel}` : `${costs.upgrade} 经验`}
              description="提升稀有度抽取概率"
              disabled={!canUpgrade}
              disabledReason={upgradeDisabledReason ?? "当前无法升级卡组"}
              onClick={onUpgrade}
            />
          </div>
        </section>
      </ModalReveal>
    </div>
  );
}

function ForgeOption({
  tone,
  icon,
  name,
  cost,
  description,
  disabled,
  disabledReason,
  onClick,
}: {
  tone: "draw" | "remove" | "upgrade";
  icon: string;
  name: string;
  cost: string;
  description: string;
  disabled: boolean;
  disabledReason: string;
  onClick: () => void;
}) {
  const { point, bind } = useHoverTooltip();
  return (
    <div
      className={cx(s.option, s[`is-${tone}`], disabled && s["is-disabled"])}
      tabIndex={disabled ? 0 : -1}
      {...bind}
    >
      <button className={s.optionButton} type="button" disabled={disabled} onClick={onClick}>
        <span className={s.optionIcon} aria-hidden="true">{icon}</span>
        <span className={s.optionName}>{name}</span>
        <span className={s.optionCost}>{cost}</span>
        <span className={s.optionDescription}>{description}</span>
      </button>
      {disabled && point && <HoverTooltip point={point}>{disabledReason}</HoverTooltip>}
    </div>
  );
}