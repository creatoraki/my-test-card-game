import type { StatusInstance } from "@/engine";
import { getStatusDef } from "@/engine";
import { cx } from "@/ui/common/cx";
import s from "./StatusPips.module.css";

// 一排状态图标(emoji + 层数), 悬停显示说明。
export function StatusPips({
  statuses,
  className,
}: {
  statuses: StatusInstance[];
  /** 调用方的布局类(这一排在自己的槽位里怎么占位)。图标外观一律由本组件持有。 */
  className?: string;
}) {
  if (statuses.length === 0) return null;
  return (
    <div className={cx(s["status-pips"], className)}>
      {statuses.map((st) => {
        const def = getStatusDef(st.id);
        return (
          <span
            key={st.id}
            className={cx(s["pip"], s[`pip-${def?.kind ?? "buff"}`])}
            title={def ? `${def.name}: ${def.desc}` : st.id}
          >
            {def?.emoji ?? "❓"}
            <b>{st.stacks}</b>
          </span>
        );
      })}
    </div>
  );
}
