// 统一的悬浮详情卡(以状态 BUFF 详情卡为标准, 设计图 333.png 等比还原)。
// 布局: 头部 → 正文斜切面板(数字高亮) → 可选底栏(沙漏读数 / 提示条)。
//   · 有 icon      → 大头部(徽章 + 38px 标题 + 星形徽记), 卡宽固定 480
//   · 仅 title     → 紧凑头部(标题 + 下划线 + 斜条纹), 卡宽随内容 280~420
//   · 都没有       → 只有正文面板
// 本组件只管外观; 悬停显隐与定位交给 RailPopover / HoverTooltip / 宿主自己的 CSS。

import type { ReactNode } from "react";
import { cx } from "@/ui/common/shared/cx";
import { HEAD_HEIGHT } from "./geometry";
import { ChamferPanel } from "./parts/ChamferPanel";
import { CompactHead } from "./parts/CompactHead";
import { DescText } from "./parts/DescText";
import { HeroHead } from "./parts/HeroHead";
import { NoteBar, type TooltipNote } from "./parts/NoteBar";
import { StatsBar, type BuffStat } from "./parts/StatsBar";
import { TooltipShell } from "./TooltipShell";
import s from "./TooltipCard.module.css";

export function TooltipCard({
  icon,
  title,
  meta,
  desc,
  children,
  stats,
  notes,
  accent,
  className,
}: {
  /** 徽章中心内容: 状态图 img / 描边 svg / emoji。有它就走大头部。 */
  icon?: ReactNode;
  title?: ReactNode;
  /** 标题旁的副信息(如羁绊「3 点 · Lv.2」)。 */
  meta?: ReactNode;
  /** 正文; 其中的数字按主题色高亮。 */
  desc?: string;
  /** 自定义正文(接在 desc 之后, 同在正文面板内)。 */
  children?: ReactNode;
  /** 沙漏读数底栏(层数 / 持续)。 */
  stats?: BuffStat[];
  /** 底部提示条。 */
  notes?: TooltipNote[];
  /** 主题色: 下划线、数字高亮、底栏点缀。 */
  accent?: string;
  className?: string;
}) {
  const hero = icon != null;
  const compact = !hero && title != null;
  const headHeight = hero ? HEAD_HEIGHT.hero : compact ? HEAD_HEIGHT.compact : HEAD_HEIGHT.none;
  const hasBody = !!desc || children != null;
  const hasStats = !!stats && stats.length > 0;
  const hasNotes = !!notes && notes.length > 0;

  return (
    <TooltipShell
      accent={accent}
      headHeight={headHeight}
      className={cx(s.card, hero ? s["is-hero"] : s["is-compact"], !hasBody && s["is-bare"], hasStats && s["has-stats"], headHeight === 0 && s["is-headless"], className)}
    >
      {hero && <HeroHead icon={icon} title={title} meta={meta} />}
      {compact && <CompactHead title={title} meta={meta} />}
      {hasBody && (
        <ChamferPanel chamfer={6} className={s.body}>
          {desc && (
            <div className={s.desc}>
              <DescText text={desc} numberClassName={s.num} />
            </div>
          )}
          {children != null && <div className={s.extra}>{children}</div>}
        </ChamferPanel>
      )}
      {stats && hasStats && <StatsBar stats={stats} />}
      {notes && hasNotes && <NoteBar notes={notes} />}
    </TooltipShell>
  );
}
