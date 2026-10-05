import type { StatusSample } from "./statusSamples";
import s from "./StatusIconRow.module.css";

export function StatusIconRow({ statuses }: { statuses: StatusSample[] }) {
  return (
    <div className={s.row} aria-label={`${statuses.length} 个增益与减益状态`}>
      {statuses.map((status) => (
        <button key={status.src} type="button" className={s.icon} data-kind={status.kind}
          aria-label={`${status.name}，${status.kind === "buff" ? "增益" : "减益"}，${status.stacks} 层`}>
          <img src={status.src} alt={status.name} />
          <span className={s.count}>{status.stacks}</span>
          <span className={s.tooltip} role="tooltip">
            <strong>{status.name}</strong>
            <span>{status.kind === "buff" ? "增益" : "减益"} · {status.stacks} 层</span>
            <span>视觉演示状态</span>
          </span>
        </button>
      ))}
    </div>
  );
}
