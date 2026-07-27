// 区域危险度仪表 —— 5 格档位条 + 当前数值。
// 悬停手牌时传入 preview, 仪表会预演打出后的落点: 决策发生在「跨档的那一手」,
// 所以"再打一张会不会跳档"必须一眼可见(见 explore/rules.ts 对分档的说明)。

import { DANGER_TIERS } from "../explore/rules";
import { dangerTier, toNextTier } from "../explore/session";
import "./DangerMeter.css";

export function DangerMeter({ danger, preview }: { danger: number; preview?: number | null }) {
  const cur = dangerTier(danger);
  const shown = preview ?? danger;
  const previewTier = dangerTier(shown);
  const crossing = preview != null && previewTier.tier !== cur.tier;
  const gap = toNextTier(danger);

  return (
    <div className="danger-meter" style={{ ["--danger-color" as string]: cur.color }}>
      <span className="danger-label">区域危险度</span>
      <div className="danger-bars">
        {DANGER_TIERS.map((t) => {
          const filled = cur.tier >= t.tier;
          const ghost = !filled && previewTier.tier >= t.tier; // 预演会点亮的格子
          return (
            <span
              key={t.tier}
              className={`danger-bar ${filled ? "on" : ""} ${ghost ? "ghost" : ""}`}
              style={{ ["--bar-color" as string]: t.color }}
              title={t.name}
            />
          );
        })}
      </div>
      <span className={`danger-tier ${crossing ? "crossing" : ""}`}>
        {crossing ? `${cur.name} → ${previewTier.name}` : cur.name}
      </span>
      <span className="danger-num">
        {danger}
        {preview != null && preview !== danger && (
          <em className={preview > danger ? "up" : "down"}>
            {preview > danger ? " ▲" : " ▼"}
            {shown}
          </em>
        )}
      </span>
      {gap != null && !crossing && <span className="danger-gap">再 +{gap} 跳档</span>}
    </div>
  );
}
