// 远征 —— 选择一张地图出发。选定后进入的是「探索牌局」而非直接开打(见 ui/ExploreScreen.tsx)。

import { MAPS } from "../data";
import { useRunStore } from "../store/runStore";
import { TerminalNav } from "./TerminalNav";

export function ExpeditionScreen() {
  const startExpedition = useRunStore((s) => s.startExpedition);
  const backToTown = useRunStore((s) => s.backToTown);

  return (
    <div className="screen expedition terminal-screen">
      <TerminalNav active="远征" />
      <main className="expedition-main">
        <div className="screen-kicker">作战司令部 / 目标选定</div>
        <h1 className="terminal-heading">远征</h1>
        <p className="muted">
          选定一片区域后进入探索。打事件卡会惊动这片区域 —— 危险度越高, 战斗越难、收获越厚。
        </p>

        <div className="map-list">
          {MAPS.map((m, i) => (
            <button key={m.id} className="map-card" onClick={() => startExpedition(m.id)}>
              <span className="choice-index">SECTOR-{String(i + 1).padStart(2, "0")}</span>
              <span className="map-emoji">{m.emoji}</span>
              <span className="map-name">{m.name}</span>
              <span className="map-difficulty" title={`难度 ${m.difficulty} / 5`}>
                {"★".repeat(m.difficulty)}
                <span className="dim">{"★".repeat(5 - m.difficulty)}</span>
              </span>
              <small className="map-desc">{m.desc}</small>
              <span className="map-meta">
                {m.encounterCount} 场 + BOSS · 探索卡 {m.explorePool.length}
              </span>
            </button>
          ))}
        </div>

        <div className="expedition-footer">
          <button onClick={() => backToTown()}>返回城镇</button>
        </div>
      </main>
    </div>
  );
}
