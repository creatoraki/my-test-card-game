// 轨迹 —— 已打出的卡横向排开, 右端是 BOSS。
// 「地图不用画, 它自己长出来」: 一趟远征结束时, 这一排卡就是完整的故事 ——
// 哪里贪了、哪里怂了、危险度是怎么一步步爬上去的, 一眼看完。

import { useEffect, useRef } from "react";
import { dangerTier } from "../explore/session";
import type { TrailEntry } from "../explore/types";
import "./TrailStrip.css";

interface Props {
  trail: TrailEntry[];
  bossRevealed: boolean;
  bossPreview?: string; // BOSS 揭示后按当前危险度算出的强度/掉落预览
}

export function TrailStrip({ trail, bossRevealed, bossPreview }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // 新卡落到末端后自动滚到最右 —— 玩家的注意力应该始终在"最新一步"上
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [trail.length, bossRevealed]);

  return (
    <div className="trail-wrap">
      <div className="trail-head">
        <span className="hud-label">走过的路</span>
        <span className="trail-count">{trail.length} 步</span>
      </div>
      <div className="trail-strip" ref={ref}>
        {trail.length === 0 && <span className="trail-empty">还没有踏出第一步</span>}
        {trail.map((t, i) => {
          const delta = t.dangerAfter - t.dangerBefore;
          const tier = dangerTier(t.dangerAfter);
          return (
            <div
              key={i}
              className={`trail-card trail-${t.kind}`}
              style={{ ["--trail-color" as string]: tier.color }}
              title={`${t.name}｜${t.note}｜危险度 ${t.dangerBefore} → ${t.dangerAfter}`}
            >
              <span className="trail-emoji">{t.emoji}</span>
              <span className="trail-name">{t.name}</span>
              <span className={`trail-delta ${delta > 0 ? "up" : delta < 0 ? "down" : "flat"}`}>
                {delta > 0 ? `+${delta}` : delta < 0 ? delta : "—"}
              </span>
              <span className="trail-danger">{t.dangerAfter}</span>
            </div>
          );
        })}

        <div className={`trail-card trail-bossmark ${bossRevealed ? "revealed" : ""}`}>
          <span className="trail-emoji">{bossRevealed ? "🩸" : "❓"}</span>
          <span className="trail-name">{bossRevealed ? "已惊动" : "潜伏"}</span>
          <span className="trail-boss-preview">{bossRevealed ? bossPreview : "深处之物"}</span>
        </div>
      </div>
    </div>
  );
}
