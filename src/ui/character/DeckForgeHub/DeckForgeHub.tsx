import { RULES } from "@/engine";
import { HoverTooltip, useHoverTooltip } from "@/ui/common/HoverTooltip";
import { cx } from "@/ui/common/cx";
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
  busy: boolean;
  drawDisabledReason?: string;
  removeDisabledReason?: string;
  upgradeDisabledReason?: string;
  onDraw: () => void;
  onRemove: () => void;
  onUpgrade: () => void;
  onRequestClose: () => void;
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
  busy,
  drawDisabledReason,
  removeDisabledReason,
  upgradeDisabledReason,
  onDraw,
  onRemove,
  onUpgrade,
  onRequestClose,
}: Props) {
  return (
    <>
      <header className={s.head}>
        <div>
          <span className={s.kicker}>卡组操作</span>
          <h2 className={s.title}>卡组锻造</h2>
          <p className={s.readout}>
            {deckSize} 张 · Lv.{deckLevel}/{RULES.deck.levelMax} · 下限 {minDeckSize} · 可用经验 {exp}
          </p>
        </div>
        <button className={s.close} type="button" disabled={busy} onClick={onRequestClose} aria-label="关闭卡组锻造中枢">
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
          disabled={busy || !canDraw}
          disabledReason={drawDisabledReason ?? "当前无法扩充卡组"}
          onClick={onDraw}
        />
        <ForgeOption
          tone="remove"
          icon="−"
          name="精简卡组"
          cost={`${costs.remove} 经验`}
          description="移除一张卡，让卡组更快找到核心"
          disabled={busy || !canRemove}
          disabledReason={removeDisabledReason ?? "当前无法精简卡组"}
          onClick={onRemove}
        />
        <ForgeOption
          tone="upgrade"
          icon="↑"
          name="升级卡组"
          cost={costs.upgrade == null ? `已满级 Lv.${deckLevel}` : `${costs.upgrade} 经验`}
          description="提升稀有度抽取概率"
          disabled={busy || !canUpgrade}
          disabledReason={upgradeDisabledReason ?? "当前无法升级卡组"}
          onClick={onUpgrade}
        />
      </div>
    </>
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