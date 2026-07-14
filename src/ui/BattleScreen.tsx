import { useEffect, useMemo, useRef, useState } from "react";
import { canPlay, RULES } from "../engine";
import { useBattleStore } from "../store/battleStore";
import { useRunStore } from "../store/runStore";
import { CombatantView } from "./CombatantView";
import { CardView } from "./CardView";

export function BattleScreen() {
  const battle = useBattleStore((s) => s.battle);
  const play = useBattleStore((s) => s.play);
  const end = useBattleStore((s) => s.end);
  const resolveBattle = useRunStore((s) => s.resolveBattle);
  const runIndex = useRunStore((s) => s.index);

  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  // 换战斗时清空选择
  useEffect(() => setSelectedUid(null), [runIndex]);

  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  });

  // 敌人预计攻击的我方目标(仇恨最高的存活友军), 用于 UI 提示
  const aggroTargetId = useMemo(() => {
    if (!battle) return undefined;
    const allies = battle.playerIds.map((id) => battle.combatants[id]).filter((c) => c.alive);
    if (!allies.length) return undefined;
    return allies.reduce((best, a) =>
      (a as any).threat > (best as any).threat ? a : best,
    ).id;
  }, [battle]);

  if (!battle) return <div className="screen center">加载中…</div>;

  const isPlayerTurn = battle.phase === "player";
  const selectedCard = selectedUid ? battle.cards[selectedUid] : null;
  const needsFoe = selectedCard?.targeting === "foe";
  const needsAlly = selectedCard?.targeting === "ally";
  const light = battle.resources[RULES.resource.name] ?? 0;

  function onCardClick(uid: string) {
    if (!battle || !isPlayerTurn) return;
    if (!canPlay(battle, uid)) return;
    const card = battle.cards[uid];
    if (card.targeting === "foe" || card.targeting === "ally") {
      setSelectedUid((prev) => (prev === uid ? null : uid));
    } else {
      play(uid);
      setSelectedUid(null);
    }
  }

  function onCombatantClick(id: string) {
    if (!battle || !selectedUid || !selectedCard) return;
    const t = battle.combatants[id];
    if (!t.alive) return;
    if (needsFoe && t.team === "enemy") {
      play(selectedUid, id);
      setSelectedUid(null);
    } else if (needsAlly && t.team === "player") {
      play(selectedUid, id);
      setSelectedUid(null);
    }
  }

  const enemies = battle.enemyIds.map((id) => battle.combatants[id]);
  const allies = battle.playerIds.map((id) => battle.combatants[id]);
  const hand = battle.hand.map((uid) => battle.cards[uid]);

  return (
    <div className="screen battle" onClick={() => setSelectedUid(null)}>
      {/* 顶部信息条 */}
      <div className="topbar">
        <div className="topbar-left">
          <span className="chip round-chip">回合 {battle.round}</span>
          <span className="chip tick-chip" title="当前时刻; 每张普通牌 +1, 速攻牌不推进">
            ⏱ 时刻 {battle.tick}
          </span>
        </div>
        <div className="topbar-mid">
          <LightBar light={light} max={RULES.resource.perRound} />
        </div>
        <div className="topbar-right">
          <span className="chip" title="抽牌堆">抽 {battle.draw.length}</span>
          <span className="chip" title="弃牌堆">弃 {battle.discard.length}</span>
        </div>
      </div>

      {/* 敌人 */}
      <div className="row enemy-row">
        {enemies.map((e) => (
          <CombatantView
            key={e.id}
            cmb={e}
            currentTick={battle.tick}
            targetable={isPlayerTurn && !!needsFoe && e.alive}
            onClick={() => onCombatantClick(e.id)}
          />
        ))}
      </div>

      {/* 我方 */}
      <div className="row ally-row">
        {allies.map((a) => (
          <CombatantView
            key={a.id}
            cmb={a}
            currentTick={battle.tick}
            targetable={isPlayerTurn && !!needsAlly && a.alive}
            isAggroTarget={a.id === aggroTargetId && a.alive}
            onClick={() => onCombatantClick(a.id)}
          />
        ))}
      </div>

      {/* 提示条 */}
      <div className="hint-bar">
        {selectedCard
          ? needsFoe
            ? "▶ 选择一个敌人作为目标(再次点击卡牌取消)"
            : needsAlly
              ? "▶ 选择一名友军作为目标(再次点击卡牌取消)"
              : ""
          : isPlayerTurn
            ? "点击卡牌打出。普通牌会推进 1 时刻, 速攻牌不推进。"
            : ""}
      </div>

      {/* 手牌 + 控制 */}
      <div className="bottom">
        <div className="hand" onClick={(e) => e.stopPropagation()}>
          {hand.length === 0 && <div className="empty-hand">(手牌为空)</div>}
          {hand.map((c) => (
            <CardView
              key={c.uid}
              card={c}
              playable={isPlayerTurn && canPlay(battle, c.uid)}
              selected={c.uid === selectedUid}
              onClick={() => onCardClick(c.uid)}
            />
          ))}
        </div>
        <div className="controls">
          <button className="end-turn" disabled={!isPlayerTurn} onClick={() => end()}>
            结束回合
          </button>
        </div>
      </div>

      {/* 战斗日志 */}
      <div className="log" ref={logRef}>
        {battle.log.slice(-60).map((l, i) => (
          <div key={i} className="log-line">
            <span className="log-meta">[R{l.round}·T{l.tick}]</span> {l.text}
          </div>
        ))}
      </div>

      {/* 胜负遮罩 */}
      {!isPlayerTurn && (
        <div className="overlay">
          <div className="overlay-card">
            <h2>{battle.phase === "won" ? "🎉 战斗胜利!" : "💀 战斗失败"}</h2>
            <button className="primary" onClick={() => resolveBattle()}>
              继续
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LightBar({ light, max }: { light: number; max: number }) {
  const total = Math.max(max, light);
  return (
    <div className="light-bar" title="光(每回合的出牌资源)">
      <span className="light-label">💡 {RULES.resource.label}</span>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`light-pip ${i < light ? "on" : "off"}`} />
      ))}
      <span className="light-num">{light}</span>
    </div>
  );
}
