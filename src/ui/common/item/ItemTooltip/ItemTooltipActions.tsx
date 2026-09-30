// 物品详情卡的「操作栏」—— 物品格点击进入交互模式后, 在卡片最下方展开的一条底栏。
//
// 外观就是 TooltipCard 底栏(沙漏读数 / 提示条)同款的斜切细框, 按钮也按卡片的细线语言画, 不另起一块板子。
// 卡片按底边定位(见 useTooltipPlacement 的 bottom), 底栏一展开, 卡片就整体向上加高, 不会压到格子。
// 带 confirmLabel 的走原地二次确认; 置灰理由写成底栏里一行提示(项目禁用原生 title)。
// 关闭: 点卡片与格子以外的地方 / 执行完一个动作(装载 / 拆箱会接着拉起弹窗, 卡片不该还挂着)。

import { useEffect, useState, type CSSProperties, type MouseEvent, type RefObject } from "react";
import type { SlotAction } from "@/ui/common/item/ItemActionMask";
import { ActionIcon } from "@/ui/common/item/ItemActionCard";
import { ChamferPanel } from "@/ui/common/tooltip/TooltipCard";
import { cx } from "@/ui/common/shared/cx";
import s from "./ItemTooltipActions.module.css";

interface Props {
  actions: readonly SlotAction[];
  /** 物品格的包裹层 —— 点它不算「点外部」。 */
  anchor: HTMLElement;
  /** 整张浮层的根节点 —— 点浮层内任何地方都不收起。 */
  rootRef: RefObject<HTMLElement | null>;
  onDismiss: () => void;
}

export function ItemTooltipActions({ actions, anchor, rootRef, onDismiss }: Props) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const hints = actions.filter((action) => action.disabled && action.hint).map((action) => action.hint!);

  // pointerdown 而非 click: 点另一格时先收起这张, 再由那一格的 click 打开新的。
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || rootRef.current?.contains(target) || anchor.contains(target)) return;
      onDismiss();
    };
    window.addEventListener("pointerdown", outside, true);
    return () => window.removeEventListener("pointerdown", outside, true);
  }, [anchor, rootRef, onDismiss]);

  const fire = (event: MouseEvent<HTMLButtonElement>, action: SlotAction) => {
    event.stopPropagation();
    if (action.confirmLabel && confirming !== action.key) {
      setConfirming(action.key);
      return;
    }
    setConfirming(null);
    action.onSelect();
    onDismiss();
  };

  return (
    <div className={s.drawer} onClick={(event) => event.stopPropagation()}>
      <div className={s.clip}>
        <ChamferPanel chamfer={7} className={s.bar}>
          <div className={s.actions}>
            {actions.map((action, index) => {
              const armed = confirming === action.key;
              return (
                <button
                  key={action.key}
                  type="button"
                  className={cx(s.btn, armed && s.armed)}
                  data-tone={armed ? "danger" : action.tone ?? "default"}
                  disabled={action.disabled}
                  style={{ "--order": index } as CSSProperties}
                  onClick={(event) => fire(event, action)}
                >
                  <span className={s.face}>
                    {action.icon && <ActionIcon name={armed ? "confirm" : action.icon} className={s.icon} />}
                    <span className={s.label}>{armed && action.confirmLabel ? action.confirmLabel : action.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {hints.length > 0 && (
            <p className={s.hint}>
              <i className={s.mark} aria-hidden="true" />
              {hints.join("；")}
            </p>
          )}
          <svg className={s.decor} width="46" height="5" aria-hidden="true">
            <path className={s.stripe} d="M2 0.5H6L4 3.5H0Z" />
            <path className={s.stripe} d="M10 0.5H18L16 3.5H8Z" />
            <path className={s.stripe} d="M22 0.5H26L24 3.5H20Z" />
            <path className={s.rule} d="M0 4.5H46" />
          </svg>
        </ChamferPanel>
      </div>
    </div>
  );
}
