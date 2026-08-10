import type { StatusInstance } from "@/engine";
import { getStatusDef } from "@/engine";
import { cx } from "@/ui/common/cx";
import s from "./StatusPips.module.css";

// 一排状态图标(emoji + 层数), 悬停显示说明。
export function StatusPips({
  statuses,
  className,
  detail = false,
}: {
  statuses: StatusInstance[];
  /** 调用方的布局类(这一排在自己的槽位里怎么占位)。图标外观一律由本组件持有。 */
  className?: string;
  /** 战斗敌人开启后显示自有详情浮层；默认保留原生 title。 */
  detail?: boolean;
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
            tabIndex={detail ? 0 : undefined}
            title={detail ? undefined : def ? `${def.name}: ${def.desc}` : st.id}
          >
            {def?.emoji ?? "❓"}
            <b>{st.stacks}</b>
            {detail && (
              <span className={s["pip-tip"]} role="tooltip">
                <strong>{def?.name ?? st.id}</strong>
                <span>{def?.desc ?? "暂无说明"}</span>
                <b>当前层数 {st.stacks}</b>
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
