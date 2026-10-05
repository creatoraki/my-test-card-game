// 装备升阶演出 —— 旧装备蓄能抖动 → 光爆 → 新阶装备亮相(名称 + 阶位 + 完美度 + 词条变化) → 确认按钮。
// 参考 common/item/ModuleCrateReveal 的开箱演出; 升阶结算在调用方已经完成, 这里只负责「看」。
//
// 时间轴(CSS 动画延时, 见 .module.css):
//   0 ~ 760ms  旧装备蓄能抖动 + 能量汇聚    760ms 光爆 + 旧装备崩散    860ms 新装备弹出、光芒旋转
//   1100ms 文案淡入    1300ms 完美度跳字    1400ms 起词条逐行进场    按钮最后淡入

import { useEffect, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { rollPerfectness } from "@/items/equipRoll";
import { RARITY_LABEL, type EquipRoll, type ItemDef } from "@/items/types";
import { itemIcon } from "@/ui/art/items/itemArt";
import { ItemActionButton } from "@/ui/common/item/ItemActionCard";
import { cx } from "@/ui/common/shared/cx";
import { upgradeChangeRows } from "../upgradeMessage";
import s from "./EquipUpgradeReveal.module.css";

interface Props {
  fromDef: ItemDef;
  toDef: ItemDef;
  before: EquipRoll;
  after: EquipRoll;
  onClose: () => void;
}

const SPARK_COUNT = 12;
const SHARD_COUNT = 12;

export function EquipUpgradeReveal({ fromDef, toDef, before, after, onClose }: Props) {
  const perfectBefore = rollPerfectness(fromDef, before);
  const perfectAfter = rollPerfectness(toDef, after);
  const changes = upgradeChangeRows(before, after);

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
      aria-label={`${toDef.name} 升阶成功`}
      style={{
        "--ro": `var(--rarity-${fromDef.rarity})`,
        "--rr": `var(--rarity-${toDef.rarity})`,
        "--rg": `var(--rarity-${toDef.rarity}-glow)`,
      } as CSSProperties}
    >
      <div className={s.backdrop} aria-hidden />
      <div className={s.stage}>
        <div className={s.altar} aria-hidden>
          <span className={s.rays} />
          <span className={s.ring} />
          <span className={s.sparks}>
            {Array.from({ length: SPARK_COUNT }, (_, index) => (
              <i key={index} style={{ "--i": index } as CSSProperties} />
            ))}
          </span>
          <span className={s.flash} />
          <span className={s.from}>{itemIcon(fromDef)}</span>
          <span className={s.shards}>
            {Array.from({ length: SHARD_COUNT }, (_, index) => (
              <i key={index} style={{ "--i": index } as CSSProperties} />
            ))}
          </span>
          <span className={s.to}>{itemIcon(toDef)}</span>
        </div>

        <div className={s.copy}>
          <span className={s.kicker}>升阶成功</span>
          <strong className={s.name}>{toDef.name}</strong>
          <span className={s.tier}>
            <span className={s.tierFrom}>{RARITY_LABEL[fromDef.rarity]}</span>
            <span className={s.arrow} aria-hidden>▶</span>
            <span className={s.tierTo}>{RARITY_LABEL[toDef.rarity]}</span>
          </span>
        </div>

        <div className={s.perfect}>
          <span className={s.perfectLabel}>完美度</span>
          <span className={s.perfectFrom}>{perfectBefore}</span>
          <span className={s.arrow} aria-hidden>▶</span>
          <span className={s.perfectTo}>{perfectAfter}</span>
          <span className={s.perfectGain}>+{perfectAfter - perfectBefore}</span>
        </div>

        {changes.length > 0 && (
          <ul className={s.changes}>
            {changes.map((row, index) => (
              <li key={row.stat} className={cx(s.change, row.worse && s.worse)} style={{ "--n": index } as CSSProperties}>
                <span className={s.changeLabel}>{row.label}</span>
                <span className={s.changeFrom}>{row.before}</span>
                <span className={s.arrow} aria-hidden>▶</span>
                <span className={s.changeTo}>{row.after}</span>
              </li>
            ))}
          </ul>
        )}

        <div className={s.actions} style={{ "--rows": changes.length } as CSSProperties}>
          <ItemActionButton label="确定" tone="primary" icon="take" order={0} onClick={onClose} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
