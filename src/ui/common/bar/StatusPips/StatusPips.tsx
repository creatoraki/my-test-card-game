import type { ReactNode } from "react";
import type { StatusInstance, Team } from "@/engine";
import { getStatusDef } from "@/engine";
import { statusArtOf } from "@/ui/art/battle/statusArt";
import { statusAccentOf } from "@/ui/art/battle/statusAccent";
import { TooltipCard, type BuffStat } from "@/ui/common/tooltip/TooltipCard";
import { cx } from "@/ui/common/shared/cx";
import { RailPopover } from "@/ui/common/tooltip/RailPopover";
import { ShieldIcon } from "./icons";
import { StatusFrame } from "./StatusFrame";
import s from "./StatusPips.module.css";

export function StatusPips({
  statuses,
  className,
  detail = false,
  shield = 0,
  reverse = false,
  vertical = false,
  popoverSide,
  team = "player",
  frame,
}: {
  statuses: StatusInstance[];
  /** 调用方的布局类(这一排在自己的槽位里怎么占位)。图标外观一律由本组件持有。 */
  className?: string;
  /** 开启 RailPopover 详情；关闭时仅保留无障碍标签。 */
  detail?: boolean;
  /** 护盾作为状态条首项渲染。 */
  shield?: number;
  /** 从右往左排列，换行后继续向下。 */
  reverse?: boolean;
  /** 从右上角起竖排，排满一列后向左换列。 */
  vertical?: boolean;
  /** 详情浮层在图标上方的对齐方式。 */
  popoverSide?: "left" | "top" | "top-right" | "top-left";
  /** 状态持有者阵营, 用于将节拍解释为回合或敌人行动。 */
  team?: Team;
  /** 四角 L 型白金边框, 层数随之压到右下角上。 */
  frame?: boolean;
}) {
  if (statuses.length === 0 && shield <= 0) return null;

  const durationUnit = team === "enemy" ? "次行动" : "回合";

  const statsOf = (stacks: number, duration?: number, extra: BuffStat[] = []): BuffStat[] => {
    const stats: BuffStat[] = [{ label: "当前层数", value: stacks }];
    if (duration != null) stats.push({ label: "剩余", value: duration, suffix: durationUnit });
    return [...stats, ...extra];
  };

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
    detailIcon,
    accent,
    extraStats,
  }: {
    key: string;
    emoji?: string;
    icon?: ReactNode;
    detailIcon?: ReactNode;
    name: string;
    desc: string;
    stacks: number;
    kind: "buff" | "debuff";
    duration?: number;
    shieldPip?: boolean;
    accent: string;
    extraStats?: BuffStat[];
  }) => (
    <span
      key={key}
      className={cx(
        s.pip,
        s[`pip-${kind}`],
        frame && s["pip-framed"],
        shieldPip && s["pip-shield"],
        !shieldPip && stacks === 1 && duration != null && s["pip-duration"],
      )}
      data-rail-item={detail ? "" : undefined}
      tabIndex={detail ? 0 : undefined}
      aria-label={
        shieldPip
          ? `护盾，当前层数 ${stacks}`
          : `${name}，当前层数 ${stacks}${duration != null ? `，剩余 ${duration} ${durationUnit}` : ""}`
      }
    >
      {frame && <StatusFrame />}
      {icon ?? emoji}
      {/* 护盾值即层数, 哪怕只剩 1 点也要标出来。 */}
      {(shieldPip || stacks > 1) && <b>{stacks}</b>}
      {!shieldPip && stacks === 1 && duration != null && <b>{duration}</b>}
      {detail && (
        <RailPopover side={popoverSide ?? "top"}>
          <TooltipCard
            icon={detailIcon}
            title={name}
            desc={desc}
            accent={accent}
            stats={statsOf(stacks, duration, extraStats)}
          />
        </RailPopover>
      )}
    </span>
  );

  return (
    <div className={cx(s["status-pips"], reverse && s.reverse, vertical && s.vertical, className)}>
      {shield > 0 && renderPip({
        key: "shield",
        icon: <ShieldIcon className={s["shield-icon"]} />,
        detailIcon: <ShieldIcon />,
        name: "护盾",
        desc: "每层吸收 1 点伤害，受到伤害时优先扣除层数。",
        stacks: shield,
        kind: "buff",
        shieldPip: true,
        accent: statusAccentOf("shield"),
      })}
      {statuses.map((st) => {
        const def = getStatusDef(st.id);
        const art = statusArtOf(st.id);
        return renderPip({
          key: st.id,
          icon: art ? (
            <img className={s["status-icon"]} src={art} alt="" aria-hidden />
          ) : undefined,
          emoji: def?.emoji ?? "❓",
          detailIcon: art ? <img src={art} alt="" aria-hidden /> : (def?.emoji ?? "❓"),
          name: def?.name ?? st.id,
          desc: def?.desc ?? "暂无说明",
          stacks: st.stacks,
          kind: def?.kind ?? "buff",
          duration: st.duration,
          accent: statusAccentOf(st.id, def?.kind),
          extraStats: def?.detailStats?.(st),
        });
      })}
    </div>
  );
}
