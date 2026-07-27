import type { StatusInstance } from "../engine";
import { getStatusDef } from "../engine";
import "./StatusPips.css";

// 一排状态图标(emoji + 层数), 悬停显示说明。
export function StatusPips({ statuses }: { statuses: StatusInstance[] }) {
  if (statuses.length === 0) return null;
  return (
    <div className="status-pips">
      {statuses.map((s) => {
        const def = getStatusDef(s.id);
        return (
          <span
            key={s.id}
            className={`pip pip-${def?.kind ?? "buff"}`}
            title={def ? `${def.name}: ${def.desc}` : s.id}
          >
            {def?.emoji ?? "❓"}
            <b>{s.stacks}</b>
          </span>
        );
      })}
    </div>
  );
}
