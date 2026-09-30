// 装配弹窗「03 装配详情」: 模组铭牌(图标槽 + 名字) → 装配效果 / 装配条件 → 目标与提示 → 确认 / 取消。
import { getCardModule, getItemDef } from "@/data";
import type { Card } from "@/engine";
import type { ItemStack } from "@/items/types";
import { itemIcon } from "@/ui/art/items/itemArt";
import { TerminalPanel } from "@/ui/common/frame/TerminalPanel";
import { cx } from "@/ui/common/shared/cx";
import s from "./InstallDetailPanel.module.css";

interface Props {
  stack: ItemStack;
  kicker: string;
  returnTo: string;
  selectedCard: Card | null;
  confirmDisabled: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function InstallDetailPanel({
  stack,
  kicker,
  returnTo,
  selectedCard,
  confirmDisabled,
  onConfirm,
  onClose,
}: Props) {
  const def = getItemDef(stack.itemId);
  const moduleDef = getCardModule(stack.itemId);
  const replacedName = selectedCard?.cardModule ? getItemDef(selectedCard.cardModule.itemId).name : null;
  const replacing = Boolean(replacedName && !confirmDisabled);
  const state = !selectedCard ? "empty" : confirmDisabled ? "invalid" : replacing ? "replace" : "ready";

  const note = !selectedCard
    ? "在卡组中选择一张卡牌"
    : confirmDisabled
      ? "这张牌装不了该模组"
      : replacing
        ? `将顶替「${replacedName}」，旧模组退回${returnTo}`
        : "满足装配条件，可以装配";

  return (
    <TerminalPanel
      index="03"
      title="装配详情"
      deco="DETAILS"
      rule="hot"
      ariaLabel="模组装配详情"
      extra={
        <button className={s.close} type="button" onClick={onClose} aria-label="关闭装配窗口">
          <CloseIcon />
        </button>
      }
      bodyClassName={s.body}
    >
      <div className={s.plate} data-state={state}>
        <span className={s.slot} aria-hidden="true">
          <span className={s.icon}>{itemIcon(def)}</span>
        </span>
        <div className={s.plateText}>
          <span className={s.kicker}>{kicker}</span>
          <strong className={s.moduleName}>{def.name}</strong>
        </div>
      </div>

      <dl className={s.info}>
        <div className={s.row}>
          <dt>装配效果</dt>
          <dd>{def.desc}</dd>
        </div>
        <div className={s.row}>
          <dt>装配条件</dt>
          <dd>{moduleDef?.equipText ?? "无"}</dd>
        </div>
        <div className={s.row}>
          <dt>目标卡牌</dt>
          <dd className={cx(!selectedCard && s.placeholder)}>{selectedCard?.name ?? "未选择"}</dd>
        </div>
      </dl>

      <p className={s.note} data-state={state} aria-live="polite">
        {note}
      </p>

      <div className={s.actions}>
        <button className={cx(s.btn, s.primary)} type="button" disabled={confirmDisabled} onClick={onConfirm}>
          {replacing ? "确认顶替" : "确认装配"}
        </button>
        <button className={s.btn} type="button" onClick={onClose}>
          取消
        </button>
      </div>
    </TerminalPanel>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
    </svg>
  );
}
