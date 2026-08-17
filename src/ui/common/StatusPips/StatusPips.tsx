import type { ReactNode } from "react";
import type { StatusInstance } from "@/engine";
import { getStatusDef } from "@/engine";
import { cx } from "@/ui/common/cx";
import { RailPopover } from "@/ui/common/RailPopover";
import { ShieldIcon, STATUS_ICONS } from "./icons";
import s from "./StatusPips.module.css";

export function StatusPips({
  statuses,
  className,
  detail = false,
  shield = 0,
  reverse = false,
  popoverSide,
}: {
  statuses: StatusInstance[];
  /** 调用方的布局类(这一排在自己的槽位里怎么占位)。图标外观一律由本组件持有。 */
  className?: string;
  /** 开启 RailPopover 详情；关闭时保留原生 title。 */
  detail?: boolean;
  /** 护盾作为状态条首项渲染。 */
  shield?: number;
  /** 从右往左排列，换行后继续向下。 */
  reverse?: boolean;
  /** 详情浮层在图标上方的对齐方式。 */
  popoverSide?: "top" | "top-right" | "top-left";
}) {
  if (statuses.length === 0 && shield <= 0) return null;

  const renderPip = ({
    key,
    emoji,
    name,
    desc,
    stacks,
    kind,
    duration,
    shieldPip = false,
    icon,
  }: {
    key: string;
    emoji?: string;
    icon?: ReactNode;
    name: string;
    desc: string;
    stacks: number;
    kind: "buff" | "debuff";
    duration?: number;
    shieldPip?: boolean;
  }) => (
    <span
      key={key}
      className={cx(s.pip, s[`pip-${kind}`], shieldPip && s["pip-shield"])}
      data-rail-item={detail ? "" : undefined}
      tabIndex={detail ? 0 : undefined}
      title={detail ? undefined : `${name}: ${desc}`}
      aria-label={shieldPip ? `护盾，当前 ${stacks}` : `${name}，当前层数 ${stacks}`}
    >
      {icon ?? emoji}
      {!shieldPip && stacks > 1 && <b>{stacks}</b>}
      {detail && (
        <RailPopover side={popoverSide ?? "top"}>
          <strong>{name}</strong>
          <p>{desc}</p>
          <small>
            {shieldPip ? "护盾值" : "当前层数"} {stacks}
            {duration != null && <> · 剩余 {duration} 回合</>}
          </small>
        </RailPopover>
      )}
    </span>
  );

  return (
    <div className={cx(s["status-pips"], reverse && s.reverse, className)}>
      {shield > 0 && renderPip({
        key: "shield",
        icon: <ShieldIcon className={s["shield-icon"]} />,
        name: "护盾",
        desc: "吸收伤害的护盾值。",
        stacks: shield,
        kind: "buff",
        shieldPip: true,
      })}
      {statuses.map((st) => {
        const def = getStatusDef(st.id);
        const StatusIcon = STATUS_ICONS[st.id];
        return renderPip({
          key: st.id,
          icon: StatusIcon ? <StatusIcon className={s["status-icon"]} /> : undefined,
          emoji: def?.emoji ?? "❓",
          name: def?.name ?? st.id,
          desc: def?.desc ?? "暂无说明",
          stacks: st.stacks,
          kind: def?.kind ?? "buff",
          duration: st.duration,
        });
      })}
    </div>
  );
}
