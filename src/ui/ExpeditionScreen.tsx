// 远征 —— 选择一张地图出发。地图 = 一条线性的遭遇战序列(见 data/maps.ts)。

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
        <p className="muted">选定一片区域。一旦出发, 需连续清除全部战区才算完成。</p>

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
              <span className="map-meta">{m.sequence.length} 场战斗</span>
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
