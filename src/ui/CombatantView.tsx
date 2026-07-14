import type { Ally, Combatant, Enemy } from "../engine";
import { StatusPips } from "./StatusPips";

interface Props {
  cmb: Combatant;
  currentTick: number;
  targetable: boolean; // 当前是否是合法的点选目标
  isAggroTarget?: boolean; // 是否是敌人预计攻击的我方目标(仇恨最高)
  onClick?: () => void;
}

export function CombatantView({ cmb, currentTick, targetable, isAggroTarget, onClick }: Props) {
  const hpPct = Math.max(0, (cmb.hp / cmb.maxHp) * 100);
  const dead = !cmb.alive;

  return (
    <div
      className={[
        "combatant",
        cmb.team,
        dead ? "dead" : "",
        targetable ? "targetable" : "",
        isAggroTarget ? "aggro-target" : "",
      ].join(" ")}
      onClick={(e) => {
        e.stopPropagation();
        if (targetable && onClick) onClick();
      }}
    >
      {cmb.team === "enemy" && !dead && <EnemyIntent enemy={cmb as Enemy} currentTick={currentTick} />}

      <div className="portrait">{cmb.emoji}</div>
      <div className="cmb-name">
        {cmb.name}
        {cmb.team === "player" && <span className="threat" title="仇恨值">🎯{(cmb as Ally).threat}</span>}
      </div>

      <div className="hp-bar">
        <div className="hp-fill" style={{ width: `${hpPct}%` }} />
        <span className="hp-text">
          {Math.max(0, cmb.hp)}/{cmb.maxHp}
        </span>
      </div>

      <div className="cmb-badges">
        {cmb.block > 0 && (
          <span className="block-badge" title="护盾">
            🛡️{cmb.block}
          </span>
        )}
      </div>

      <StatusPips statuses={cmb.statuses} />

      {dead && <div className="dead-overlay">☠</div>}
    </div>
  );
}

function EnemyIntent({ enemy, currentTick }: { enemy: Enemy; currentTick: number }) {
  const countdown = Math.max(0, enemy.nextActTick - currentTick);
  const i = enemy.intent;
  return (
    <div className="intent" title={`意图: ${i.name}`}>
      <span className={`intent-badge intent-${i.kind}`}>
        {i.emoji}
        {i.value != null && <b>{i.value}</b>}
      </span>
      <span className={`countdown ${countdown === 0 ? "imminent" : ""}`} title="距离下次行动的时刻">
        ⏱{countdown}
      </span>
    </div>
  );
}
