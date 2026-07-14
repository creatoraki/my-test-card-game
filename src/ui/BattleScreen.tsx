import { useEffect, useMemo, useRef, useState } from "react";
import { canPlay, RULES, type AnimFrame, type BattleState, type CardAnim } from "../engine";
import { getEnemyDef } from "../data";
import { useBattleStore } from "../store/battleStore";
import { useRunStore } from "../store/runStore";
import { CombatantView } from "./CombatantView";
import { HandCard } from "./HandCard";
import { CardDetailDrawer } from "./CardDetailDrawer";
import { ANIM, cardAnim, moveAnim, type HitFx } from "./animations";
import { ManaCrystalIcon } from "./ManaCrystalIcon";

export function BattleScreen() {
  const battle = useBattleStore((s) => s.battle);
  const play = useBattleStore((s) => s.play);
  const end = useBattleStore((s) => s.end);
  const commit = useBattleStore((s) => s.commit);
  const resolveBattle = useRunStore((s) => s.resolveBattle);
  const runIndex = useRunStore((s) => s.index);

  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [hoveredUid, setHoveredUid] = useState<string | null>(null);

  // —— 出牌动画编排(纯 UI): 施法者前冲 → 命中时刻结算+特效 → 归位/解锁 ——
  const [attackerId, setAttackerId] = useState<string | null>(null); // 正在前冲的施法者
  const [hits, setHits] = useState<Record<string, HitFx>>({}); // 各目标当前的受击特效
  const [animating, setAnimating] = useState(false); // 动画期间锁输入
  const animatingRef = useRef(false); // 同步守卫(避免同一时刻重复触发)
  const seqRef = useRef(0); // 批次序号, 用于取消旧动画批次的定时器回调
  const hitSeqRef = useRef(0); // 受击特效序号, 递增以强制 React 重放同一目标的连续特效
  const timersRef = useRef<number[]>([]);
  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  // 换战斗时清空选择/悬浮/动画(并让在途动画批次失效)
  useEffect(() => {
    setSelectedUid(null);
    setHoveredUid(null);
    clearTimers();
    seqRef.current++;
    animatingRef.current = false;
    setAnimating(false);
    setAttackerId(null);
    setHits({});
  }, [runIndex]);

  // 卸载时清理计时器
  useEffect(() => () => clearTimers(), []);

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
  const b = battle; // 非空别名: 供下方事件处理/setTimeout 闭包安全引用(收窄不跨闭包)

  const isPlayerTurn = battle.phase === "player";
  const selectedCard = selectedUid ? battle.cards[selectedUid] : null;
  const needsFoe = selectedCard?.targeting === "foe";
  const needsAlly = selectedCard?.targeting === "ally";
  const mana = battle.resources[RULES.resource.name] ?? 0;

  // 本次出牌"接收特效"的目标单位(攻击→敌人受击; 辅助→友军柔光)
  function fxTargets(uid: string, primaryId?: string): string[] {
    const card = b.cards[uid];
    switch (card.targeting) {
      case "foe":
      case "ally":
        return primaryId ? [primaryId] : [];
      case "self":
        return [card.ownerCharId];
      case "allFoes":
        return b.enemyIds.filter((id) => b.combatants[id].alive);
      case "allAllies":
        return b.playerIds.filter((id) => b.combatants[id].alive);
      default:
        return [];
    }
  }

  // ── 统一动画帧队列 ──
  // 一"步"= 一个施法者的一次动作: 前冲蓄力 → 命中(提交该动作后的状态快照 + 受击特效/飘字) → 下一步。
  // 玩家出牌是第 0 步, 随后接续它触发的每个敌人行动; 结束回合则是冲刷的敌人行动逐步。
  interface AnimStep {
    actorId: string; // 前冲的施法者
    anim: CardAnim; // 表现动画类型(UI 侧解析)
    snapshot: BattleState; // 该动作结算后的完整状态
    hits: { id: string; hpDelta: number }[]; // 受击/受益目标(hpDelta>0 掉血, <0 回血, 0 仅闪特效)
  }

  // 引擎产出的敌人动画帧 → 一步(动画表现在 UI 侧按招式解析)。
  function stepFromFrame(f: AnimFrame): AnimStep {
    const def = getEnemyDef(f.enemyDefId);
    const move = def.moves.find((m) => m.id === f.moveId) ?? def.moves[0];
    return { actorId: f.actorId, anim: moveAnim(move), snapshot: f.snapshot, hits: f.hits };
  }

  // 逐步回放动画。seq 为本批次代号: 切战斗/发起新动作会使旧批次的定时器回调失效。
  function runSteps(steps: AnimStep[], final: BattleState, seq: number) {
    let i = 0;
    const next = () => {
      if (seqRef.current !== seq) return;
      if (i >= steps.length) {
        commit(final); // 落到最终态(下一回合起始 / 出牌后终态)
        setAttackerId(null);
        setHits({});
        animatingRef.current = false;
        setAnimating(false);
        return;
      }
      const step = steps[i++];
      const preset = ANIM[step.anim];
      setAttackerId(step.actorId); // 施法者前冲(CSS 过渡驱动)

      // 命中时刻: 提交该动作后的状态(扣血/加盾/状态在此可见), 同步目标特效 + 飘字
      const tHit = window.setTimeout(() => {
        if (seqRef.current !== seq) return;
        commit(step.snapshot);
        const hitSeq = ++hitSeqRef.current;
        const map: Record<string, HitFx> = {};
        for (const h of step.hits) {
          const fx: HitFx = { anim: step.anim, seq: hitSeq };
          if (preset.kind === "attack" && h.hpDelta > 0) fx.float = { text: `-${h.hpDelta}`, tone: "dmg" };
          else if (preset.kind === "support" && h.hpDelta < 0)
            fx.float = { text: `+${-h.hpDelta}`, tone: "heal" };
          map[h.id] = fx;
        }
        setHits(map);
      }, preset.windup);

      // 施法者归位
      const tBack = window.setTimeout(() => {
        if (seqRef.current === seq) setAttackerId(null);
      }, preset.windup + 140);

      // 本步特效播完 → 下一步
      const tNext = window.setTimeout(next, preset.windup + preset.hold);
      timersRef.current.push(tHit, tBack, tNext);
    };
    next();
  }

  // 开启一个动画批次: 上锁 + 清选择, 逐步回放。空步数则直接落到终态。
  function startBatch(steps: AnimStep[], final: BattleState) {
    const seq = ++seqRef.current;
    animatingRef.current = true;
    setAnimating(true);
    setSelectedUid(null);
    runSteps(steps, final, seq);
  }

  // 出牌: 先算出动画计划(含触发的敌人行动), 玩家出牌为第 0 步, 敌人行动依次接续。
  function triggerPlay(uid: string, primaryId?: string) {
    if (animatingRef.current) return;
    const card = b.cards[uid];
    const anim = cardAnim(card);
    const targets = fxTargets(uid, primaryId);
    const before: Record<string, number> = {};
    for (const id of targets) before[id] = b.combatants[id]?.hp ?? 0;

    const plan = play(uid, primaryId);
    if (!plan) return;

    const cardHits = targets.map((id) => ({
      id,
      hpDelta: before[id] - (plan.cardSnapshot.combatants[id]?.hp ?? before[id]),
    }));
    const steps: AnimStep[] = [
      { actorId: card.ownerCharId, anim, snapshot: plan.cardSnapshot, hits: cardHits },
      ...plan.frames.map(stepFromFrame),
    ];
    startBatch(steps, plan.final);
  }

  // 结束回合: 逐步播放冲刷的敌人行动, 最后落到下一回合起始态。
  function triggerEndTurn() {
    if (animatingRef.current) return;
    const plan = end();
    if (!plan) return;
    startBatch(plan.frames.map(stepFromFrame), plan.final);
  }

  function onCardClick(uid: string) {
    if (!isPlayerTurn || animating) return;
    if (!canPlay(b, uid)) return;
    const card = b.cards[uid];
    if (card.targeting === "foe" || card.targeting === "ally") {
      setSelectedUid((prev) => (prev === uid ? null : uid));
    } else {
      triggerPlay(uid);
    }
  }

  function onCombatantClick(id: string) {
    if (!selectedUid || !selectedCard || animating) return;
    const t = b.combatants[id];
    if (!t.alive) return;
    if (needsFoe && t.team === "enemy") triggerPlay(selectedUid, id);
    else if (needsAlly && t.team === "player") triggerPlay(selectedUid, id);
  }

  const enemies = battle.enemyIds.map((id) => battle.combatants[id]);
  const allies = battle.playerIds.map((id) => battle.combatants[id]);
  const hand = battle.hand.map((uid) => battle.cards[uid]);

  // 详情抽屉展示的卡: 优先当前悬浮, 其次已选中(选目标期间保持展示)
  const previewUid = hoveredUid ?? selectedUid;
  const previewCard = previewUid && battle.cards[previewUid] ? battle.cards[previewUid] : null;

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
          <ManaCrystalBar mana={mana} max={RULES.resource.perRound} />
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
            attacking={e.id === attackerId}
            hit={hits[e.id] ?? null}
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
            attacking={a.id === attackerId}
            hit={hits[a.id] ?? null}
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

      {/* 左侧手牌条 */}
      <div className="side" onClick={(e) => e.stopPropagation()}>
        <div className="side-title">手牌 {hand.length}</div>
        <div className="hand-strip">
          {hand.length === 0 && <div className="empty-hand">(手牌为空)</div>}
          {hand.map((c) => (
            <HandCard
              key={c.uid}
              card={c}
              playable={isPlayerTurn && canPlay(battle, c.uid)}
              selected={c.uid === selectedUid}
              onClick={() => onCardClick(c.uid)}
              onHover={(h) => setHoveredUid(h ? c.uid : null)}
            />
          ))}
        </div>
      </div>

      {/* 结束回合按钮(浮动右下角) */}
      <button
        className="end-turn-float"
        disabled={!isPlayerTurn || animating}
        onClick={(e) => {
          e.stopPropagation();
          triggerEndTurn();
        }}
      >
        结束回合
      </button>

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

      {/* 右侧卡牌详情抽屉 */}
      <CardDetailDrawer card={previewCard} />
    </div>
  );
}

function ManaCrystalBar({ mana, max }: { mana: number; max: number }) {
  const total = Math.max(max, mana);
  return (
    <div className="mana-bar" title="法力水晶（每回合的出牌资源）">
      <span className="mana-label">
        <ManaCrystalIcon className="mana-crystal mana-crystal-label" />
        {RULES.resource.label}
      </span>
      {Array.from({ length: total }).map((_, i) => (
        <ManaCrystalIcon key={i} className={`mana-crystal mana-pip ${i < mana ? "on" : "off"}`} />
      ))}
      <span className="mana-num">{mana}</span>
    </div>
  );
}
