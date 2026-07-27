// ★ 探索牌局主界面 ★
//
// 整个游戏只有一种交互语言: 出牌。探索层因此不做地图/节点图, 而是一场牌局 ——
//   路线牌(遭遇/BOSS/撤退)固定在手, 事件卡靠抽取; 打事件卡累积区域危险度,
//   危险度同时抬高所有战斗的难度与奖励, 并最终决定 BOSS 的强度与掉落。
//
// 玩家每一手真正在想的只有一句: 「这张事件卡, 值不值得我为它把危险度再抬一档?」

import { useState } from "react";
import { EXPLORE_RULES } from "../explore/rules";
import { canUseAbility, dangerTier, previewDanger } from "../explore/session";
import type { AbilityId, ExploreCard } from "../explore/types";
import { getMap } from "../data";
import { useExploreStore } from "../store/exploreStore";
import { useRunStore } from "../store/runStore";
import { DangerMeter } from "./DangerMeter";
import { ExploreCardView } from "./ExploreCardView";
import { TerminalNav } from "./TerminalNav";
import { TrailStrip } from "./TrailStrip";
import "./ExploreScreen.css";

const ABILITIES: { id: AbilityId; name: string; emoji: string; cost: string; gain: string }[] = [
  { id: "scout", name: "搜寻", emoji: "🔦", cost: "危险度 +1", gain: "抽 1 张" },
  { id: "rest", name: "休整", emoji: "🏕️", cost: "弃 2 张", gain: "全队回 25%" },
  { id: "conceal", name: "隐匿", emoji: "🌑", cost: "弃 2 张", gain: "危险度 -1" },
];

export function ExploreScreen() {
  const session = useExploreStore((s) => s.session);
  const playEventCard = useExploreStore((s) => s.playEventCard);
  const ability = useExploreStore((s) => s.ability);
  const pickDiscard = useExploreStore((s) => s.pickDiscard);
  const applyDiscard = useExploreStore((s) => s.applyDiscard);
  const abortDiscard = useExploreStore((s) => s.abortDiscard);
  const enterEncounter = useRunStore((s) => s.enterEncounter);
  const retreat = useRunStore((s) => s.retreat);

  // 悬停预演: 仪表与卡面据此提示「再打这一张会跳档」
  const [hovered, setHovered] = useState<string | null>(null);

  if (!session) return null;
  const map = getMap(session.mapId);
  const tier = dangerTier(session.danger);
  const pd = session.pendingDiscard;
  const preview = hovered ? previewDanger(session, hovered) : null;

  const card = (uid: string): ExploreCard => session.cards[uid];
  const crosses = (uid: string) =>
    dangerTier(previewDanger(session, uid)).tier !== tier.tier;

  const bossPreview = `HP ×${(1 + EXPLORE_RULES.boss.hpPerTier * (tier.tier - 1)).toFixed(2)} · 掉落 ×${(
    1 +
    EXPLORE_RULES.boss.lootPerTier * (tier.tier - 1)
  ).toFixed(1)}`;

  // 弃牌选择模式下, 手牌的点击语义从"打出"变成"勾选"
  const onHandClick = (uid: string) => (pd ? pickDiscard(uid) : playEventCard(uid));

  const onRouteClick = (uid: string) => {
    const c = card(uid);
    if (c.kind === "retreat") retreat();
    else enterEncounter(uid);
  };

  return (
    <div className="screen explore terminal-screen">
      <TerminalNav active="远征" />

      <div className="explore-top">
        <div className="explore-ident">
          <span className="screen-kicker">区域推进 / {map.emoji} </span>
          <h2 className="explore-map">{map.name}</h2>
        </div>
        <DangerMeter danger={session.danger} preview={preview} />
        <div className="explore-stats">
          <span className="loot-chip" title="仅在撤退或通关时落袋；团灭全部丢失">
            💠 残片 {session.loot}
          </span>
          <span className="deck-chip-count" title="打出的卡不洗回牌库">
            🂠 牌库 {session.draw.length}
          </span>
        </div>
      </div>

      <div className="explore-party">
        {session.party.map((p) => (
          <div key={p.charId} className={`ex-party-member ${p.alive ? "" : "down"}`}>
            <span className="ex-party-emoji">{p.emoji}</span>
            <span className="ex-party-name">{p.name}</span>
            <div className="ex-party-bar">
              <div
                className="ex-party-fill"
                style={{ width: `${Math.max(0, (p.hp / p.maxHp) * 100)}%` }}
              />
            </div>
            <span className="ex-party-hp">
              {p.alive ? `${p.hp}/${p.maxHp}` : "阵亡"}
            </span>
          </div>
        ))}
      </div>

      <TrailStrip
        trail={session.trail}
        bossRevealed={session.bossRevealed}
        bossPreview={bossPreview}
      />

      <div className="explore-table">
        <section className="explore-route">
          <span className="hud-label">
            路线 {session.encountersLeft > 0 ? `· 还剩 ${session.encountersLeft} 场` : "· BOSS 已入手"}
          </span>
          <div className="ex-hand-row">
            {session.route.map((uid) => (
              <ExploreCardView
                key={uid}
                card={card(uid)}
                disabled={!!pd}
                onClick={() => onRouteClick(uid)}
              />
            ))}
          </div>
        </section>

        <section className="explore-hand">
          <span className="hud-label">
            手牌 {session.hand.length}/{EXPLORE_RULES.handSize}
          </span>
          <div className="ex-hand-row">
            {session.hand.length === 0 && (
              <span className="ex-hand-empty">
                没有事件卡了 —— 打一场战斗续牌，或用「搜寻」挖一张。
              </span>
            )}
            {session.hand.map((uid) => (
              <ExploreCardView
                key={uid}
                card={card(uid)}
                picked={pd?.picked.includes(uid)}
                crossesTier={!pd && crosses(uid)}
                onClick={() => onHandClick(uid)}
                onHoverChange={(h) => setHovered(h ? uid : null)}
              />
            ))}
          </div>
        </section>
      </div>

      {pd ? (
        <div className="explore-abilities discarding">
          <span className="discard-hint">
            {pd.ability === "rest" ? "休整" : "隐匿"}：选择要弃掉的 {pd.count} 张（
            {pd.picked.length}/{pd.count}）
          </span>
          <button
            className="primary"
            disabled={pd.picked.length !== pd.count}
            onClick={() => applyDiscard()}
          >
            确认
          </button>
          <button onClick={() => abortDiscard()}>取消</button>
        </div>
      ) : (
        <div className="explore-abilities">
          {ABILITIES.map((a) => (
            <button
              key={a.id}
              className="ability-btn"
              disabled={!canUseAbility(session, a.id)}
              onClick={() => ability(a.id)}
            >
              <span className="ability-emoji">{a.emoji}</span>
              <span className="ability-name">{a.name}</span>
              <span className="ability-cost">{a.cost}</span>
              <span className="ability-gain">{a.gain}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
