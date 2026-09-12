// 属性面板 —— 三组只读面板属性, 每组一个独立玻璃框。
//
// ★ 角色不设等级也不加点(角色养成设计.md 第一章), 故这里刻意没有任何 ＋ 按钮:
//   这些数字进游戏后只由装备与羁绊改变。
// ★ 分组、副标题与 ref 旋钮住在 common/statGroups.ts —— 与角色档案 Modal 共用同一份, 两处不各写一遍。
//   ⚠ ref 是**纯展示旋钮**: 只决定底部那条微条画多长, 不参与任何结算。
// ★ 本文件只管栅格与错峰节拍; 框由 StatGroupCard 画, 行由 AttrRow 画。

import type { StatBlock } from "@/engine";
import { REF_DEFAULT_PCT, STAT_GROUPS } from "@/ui/common/statGroups";
import { AttrRow } from "./AttrRow";
import { StatGroupCard } from "./StatGroupCard";
import s from "./StatsPanel.module.css";

// 内容错峰入场的起点(ms)与步长。⚠ 与 StatGroupCard.module.css 里 statGroupIn 的
// animation-delay 算式是同两个数, 改一处要改两处 —— JS 这边只有数值滚动的起跑时间要对齐。
const CONTENT_DELAY_MS = 160;
const STAGGER_MS = 55;

export function StatsPanel({ stats, preview = null }: { stats: StatBlock; preview?: StatBlock | null }) {
  return (
    <div className={s.groups}>
      {STAT_GROUPS.map((group, gi) => (
        <StatGroupCard key={group.title} title={group.title} subtitle={group.subtitle} index={gi} wide={group.wide}>
          {group.rows.map((row) => (
            <AttrRow
              key={row.key}
              statKey={row.key}
              label={row.label}
              value={stats[row.key]}
              next={preview?.[row.key]}
              pct={row.pct}
              ref100={row.ref ?? (row.pct ? REF_DEFAULT_PCT : undefined)}
              delay={CONTENT_DELAY_MS + gi * STAGGER_MS}
              compact={group.wide}
            />
          ))}
        </StatGroupCard>
      ))}
    </div>
  );
}
