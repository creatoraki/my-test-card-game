import type { Card } from "@/engine";
import { canEquipModule, getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import { itemIcon } from "@/ui/art/itemArt";
import { EventPanelButton } from "@/ui/common/EventPanel";
import { cx } from "@/ui/common/cx";
import { AssembleIcon, DetachIcon } from "../AssemblyScene/icons";
import s from "./AssemblyBench.module.css";

type BenchState = "empty" | "ready" | "invalid" | "installed";

interface Props {
  card?: Card;
  installedStack: ItemStack | null;
  candidate: ItemStack | null;
  className?: string;
  actionDisabled: boolean;
  onAction: () => void;
  onShowTooltip?: (element: HTMLElement, stack: ItemStack) => void;
  onHideTooltip?: () => void;
}

export function AssemblyBench({
  card,
  installedStack,
  candidate,
  className,
  actionDisabled,
  onAction,
  onShowTooltip,
  onHideTooltip,
}: Props) {
  const candidateUsable = Boolean(card && candidate && canEquipModule(card, candidate.itemId));
  const state: BenchState = installedStack
    ? "installed"
    : candidate && !candidateUsable
      ? "invalid"
      : candidateUsable
        ? "ready"
        : "empty";
  const stateLabel = installedStack
    ? "已装配"
    : !card
      ? "先选择卡牌"
      : candidate
        ? candidateUsable
          ? "可装配"
          : "类型不匹配"
        : "选择模组";
  return (
    <section className={cx(s.bench, className)} data-state={state} aria-label="紧凑装配台">
      <div className={s.benchHeader}>
        <strong>装配台</strong>
        <span className={s.state} aria-live="polite">{stateLabel}</span>
      </div>
      <div className={s.benchSurface}>
        <div className={s.moduleStage}>
          <div
            className={s.moduleSlot}
            tabIndex={installedStack ? 0 : -1}
            role={installedStack ? "button" : undefined}
            aria-label={installedStack ? "查看已装配模组详情" : undefined}
            onPointerEnter={(event) => installedStack && onShowTooltip?.(event.currentTarget, installedStack)}
            onPointerLeave={onHideTooltip}
            onFocus={(event) => installedStack && onShowTooltip?.(event.currentTarget, installedStack)}
            onBlur={onHideTooltip}
          >
            {installedStack ? (
              <span className={s.moduleIcon}>{itemIcon(getItemDef(installedStack.itemId))}</span>
            ) : (
              <span className={s.slotPlaceholder} aria-hidden="true" />
            )}
            <span className={s.slotMark}>{installedStack ? "装配中" : "模组槽"}</span>
          </div>
        </div>
      </div>
      {/* 底部只留动作按钮 —— 原来的提示语和右上角状态标签说的是同一件事, 白占一行。 */}
      <div className={s.benchFooter}>
        <EventPanelButton
          className={s.actionButton}
          tone={installedStack ? "danger" : "primary"}
          disabled={actionDisabled}
          onClick={onAction}
          aria-label={installedStack ? "拆卸当前卡牌模组" : "装配选中的卡牌模组"}
        >
          {installedStack ? <><DetachIcon /> 拆卸</> : <><AssembleIcon /> 装配</>}
        </EventPanelButton>
      </div>
    </section>
  );
}