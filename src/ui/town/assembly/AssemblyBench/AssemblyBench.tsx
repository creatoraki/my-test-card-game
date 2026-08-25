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
  const moduleStack = installedStack ?? candidate;

  return (
    <section className={cx(s.bench, className)} data-state={state} aria-label="紧凑装配台">
      <div className={s.benchHeader}>
        <div>
          <span className={s.kicker}>ASSEMBLY BENCH</span>
          <strong>模组连接控制台</strong>
        </div>
        <span className={s.state} aria-live="polite">{stateLabel}</span>
      </div>
      <div className={s.benchSurface}>
        <div className={s.cardStage}>
          <span className={s.cardTag}>CARD SUMMARY</span>
          <strong className={s.cardName}>{card?.name ?? "未选择卡牌"}</strong>
          <div className={s.cardMeta}>
            <span>{card ? (card.cardType === "fast" ? "速攻" : "普通") : "等待选择"}</span>
            <span className={s.cardCost}>{card?.cost ?? "--"}</span>
          </div>
        </div>
        <div className={s.connection} aria-hidden="true">
          <span className={s.connectionLine} />
          <span className={s.connectionNode} />
          <span className={s.connectionNode} />
          <span className={s.connectionNode} />
        </div>
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
            {moduleStack ? (
              <span className={s.moduleIcon}>{itemIcon(getItemDef(moduleStack.itemId))}</span>
            ) : (
              <span className={s.slotPlaceholder} aria-hidden="true" />
            )}
            <span className={s.slotMark}>{installedStack ? "装配中" : "模组槽"}</span>
          </div>
          <span className={s.moduleTag}>MODULE</span>
        </div>
      </div>
      <div className={s.benchFooter}>
        <span className={s.footerHint}>{state === "invalid" ? "当前卡牌无法接入此模组" : "选择候选模组后确认"}</span>
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