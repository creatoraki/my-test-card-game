// 状态 / 全局增益的悬浮详情卡(设计图 333.png 等比还原, 480 宽)。
// 布局: 头部(徽章 + 标题 + 装饰) → 正文面板(数字高亮) → 可选底栏(层数/持续)。
// 本组件只管外观; 悬停显隐与定位由外层 RailPopover(bare) 负责。

import type { CSSProperties, ReactNode } from "react";
import { useBoxSize } from "@/ui/common/HudFrame";
import { CardFrame } from "./parts/CardFrame";
import { ChamferPanel } from "./parts/ChamferPanel";
import { DescText } from "./parts/DescText";
import { HeaderDecor } from "./parts/HeaderDecor";
import { IconMedallion } from "./parts/IconMedallion";
import { StatsBar, type BuffStat } from "./parts/StatsBar";
import s from "./BuffDetailCard.module.css";

export function BuffDetailCard({
  icon,
  name,
  desc,
  accent,
  stats,
}: {
  /** 徽章中心内容: 状态图 img / 描边 svg / emoji。 */
  icon: ReactNode;
  name: ReactNode;
  desc: string;
  /** 主题色: 徽章光环、下划线、数字高亮、沙漏。 */
  accent: string;
  /** 底栏读数; 缺省则不渲染底栏。 */
  stats?: BuffStat[];
}) {
  const { ref, size } = useBoxSize<HTMLDivElement>();
  const hasStats = !!stats && stats.length > 0;

  return (
    <div
      ref={ref}
      className={s.card}
      data-stats={hasStats ? "" : undefined}
      style={{ "--accent": accent } as CSSProperties}
    >
      <CardFrame width={size.width} height={size.height} />
      <div className={s.head}>
        <IconMedallion>{icon}</IconMedallion>
        <div className={s.name}>{name}</div>
        <HeaderDecor />
      </div>
      <ChamferPanel chamfer={6} className={s.body}>
        <div className={s.desc}>
          <DescText text={desc} numberClassName={s.num} />
        </div>
      </ChamferPanel>
      {stats && hasStats && <StatsBar stats={stats} />}
    </div>
  );
}
