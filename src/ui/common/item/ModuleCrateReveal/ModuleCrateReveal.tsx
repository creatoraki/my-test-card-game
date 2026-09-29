// 开模组箱演出 —— 箱子抖动 → 光爆 → 模组亮相(图标 + 名称 + 稀有度 + 效果) → 操作按钮。
// 探索背包与据点仓库共用; 开箱结算在调用方已经完成, 这里只负责「看」。
//
// 时间轴(CSS 动画延时, 见 .module.css):
//   0 ~ 720ms  箱子蓄力抖动    720ms 光爆 + 箱子崩散    820ms 模组弹出、光芒旋转
//   1080ms 文案淡入           1240ms 按钮淡入

import { useEffect, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { getCardModule, getItemDef } from "@/data";
import { RARITY_LABEL, type ItemStack } from "@/items/types";
import { itemIcon } from "@/ui/art/items/itemArt";
import { ItemActionButton } from "@/ui/common/item/ItemActionCard";
import s from "./ModuleCrateReveal.module.css";

interface Props {
  /** 被打开的箱子(只用来画图)。 */
  crateItemId: string;
  /** 开出的模组。 */
  opened: ItemStack;
  /** 收下后模组的去向说明, 例如「已放进背包」「已存入仓库」。 */
  placeNote: string;
  /** 传了就显示「立即装载」。 */
  onInstall?: () => void;
  onClose: () => void;
}

export function ModuleCrateReveal({ crateItemId, opened, placeNote, onInstall, onClose }: Props) {
  const crate = getItemDef(crateItemId);
  const def = getItemDef(opened.itemId);
  const equipText = getCardModule(opened.itemId)?.equipText;

  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={s.layer}
      role="dialog"
      aria-modal="true"
      aria-label={`开出 ${def.name}`}
      style={{ "--rr": `var(--rarity-${def.rarity})`, "--rg": `var(--rarity-${def.rarity}-glow)` } as CSSProperties}
    >
      <div className={s.backdrop} aria-hidden />
      <div className={s.stage}>
        <div className={s.altar} aria-hidden>
          <span className={s.rays} />
          <span className={s.ring} />
          <span className={s.flash} />
          <span className={s.crate}>{itemIcon(crate)}</span>
          <span className={s.shards}>
            {Array.from({ length: 10 }, (_, index) => (
              <i key={index} style={{ "--i": index } as CSSProperties} />
            ))}
          </span>
          <span className={s.module}>{itemIcon(def)}</span>
        </div>

        <div className={s.copy}>
          <span className={s.kicker}>开箱获得</span>
          <strong className={s.name}>{def.name}</strong>
          <span className={s.rarity}>{RARITY_LABEL[def.rarity]}</span>
          <p className={s.desc}>{def.desc}</p>
          {equipText && <p className={s.cond}>装配条件：{equipText}</p>}
          <p className={s.place}>{placeNote}</p>
        </div>

        <div className={s.actions}>
          {onInstall && (
            <ItemActionButton label="立即装载" tone="module" icon="install" order={0} onClick={onInstall} />
          )}
          <ItemActionButton label="收好" tone="primary" icon="take" order={1} onClick={onClose} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
