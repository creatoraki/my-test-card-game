// 远征结算 —— 通关 / 撤退 / 团灭三种收场共用一页。
// 主角是「轨迹」: 一趟远征结束时那一排卡就是完整的故事, 比任何数字都更值得看。

import { getCharacter, getMap } from "../data";
import { useExploreStore } from "../store/exploreStore";
import { useRunStore } from "../store/runStore";
import { useTownStore } from "../store/townStore";
import { TrailStrip } from "./TrailStrip";
import "./EndScreen.css";

const TITLES = {
  won: { title: "远征完成", kicker: "远征终端 / 最终报告" },
  retreat: { title: "已撤离", kicker: "远征终端 / 中止报告" },
  lost: { title: "远征中断", kicker: "远征终端 / 事故报告" },
} as const;

export function EndScreen() {
  const characters = useTownStore((s) => s.characters);
  const bankedLoot = useTownStore((s) => s.loot);
  const party = useTownStore((s) => s.party);
  const lastResult = useRunStore((s) => s.lastResult);
  const mapId = useRunStore((s) => s.mapId);
  const backToTown = useRunStore((s) => s.backToTown);
  const session = useExploreStore((s) => s.session);

  const result = lastResult ?? "lost";
  const { title, kicker } = TITLES[result];
  const map = mapId ? getMap(mapId) : null;
  const wiped = result === "lost";

  return (
    <div className="screen end terminal-screen center">
      <div className="screen-kicker">{kicker}</div>
      <h1 className="terminal-heading">{title}</h1>
      <p className="muted">
        {map?.name ?? "未知区域"} ——{" "}
        {result === "won"
          ? "深处之物已被清除。"
          : result === "retreat"
            ? "带着已有的收获退了出来。"
            : "全队失去意识，被拖回了城镇。"}
      </p>

      <div className="end-loot">
        {wiped ? (
          <span className="loot-lost">💠 残片全部遗失</span>
        ) : (
          <span className="loot-chip big">💠 残片入账 {session?.loot ?? 0}</span>
        )}
        <span className="muted">城镇余额 {bankedLoot}</span>
        {session && (
          <span className="muted">
            最终危险度 {session.danger} · 走了 {session.trail.length} 步
          </span>
        )}
      </div>

      {session && (
        <TrailStrip trail={session.trail} bossRevealed={session.bossRevealed} bossPreview="" />
      )}

      <div className="deck-summary">
        {party.map((id) => {
          const cs = characters[id];
          if (!cs) return null;
          const c = getCharacter(id);
          return (
            <div key={id} className="deck-summary-char">
              <h3>
                {c.emoji} {c.name} · LV {cs.level} · 个人卡组({cs.deck.length} 张)
              </h3>
              <div className="deck-list">
                {cs.deck.map((card) => (
                  <span key={card.uid} className={`deck-chip ${card.upgraded ? "upgraded" : ""}`}>
                    {card.name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <button className="primary big" onClick={() => backToTown()}>
        返回城镇
      </button>
    </div>
  );
}
