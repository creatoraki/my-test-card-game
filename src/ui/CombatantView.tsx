import type { Ally, Combatant, Enemy } from "../engine";
import { StatusPips } from "./StatusPips";
import { ANIM, type HitFx } from "./animations";
import { CharacterPortrait } from "./CharacterPortrait";

interface Props {
  cmb: Combatant;
  currentTick: number;
  targetable: boolean; // 当前是否是合法的点选目标
  isAggroTarget?: boolean; // 是否是敌人预计攻击的我方目标(仇恨最高)
  attacking?: boolean; // 是否是当前出牌的施法者(前冲动画)
  hit?: HitFx | null; // 命中时刻下发的受击/首击特效
  onClick?: () => void;
}

export function CombatantView({
  cmb,
  currentTick,
  targetable,
  isAggroTarget,
  attacking,
  hit,
  onClick,
}: Props) {
  const hpPct = Math.max(0, (cmb.hp / cmb.maxHp) * 100);
  const dead = !cmb.alive;

  const preset = hit ? ANIM[hit.anim] : null;
  // 攻击 → 受击抖动闪光; 辅助 → 柔和光晕
  const reactClass = preset ? (preset.kind === "attack" ? "hit-react" : "bless-react") : "";

  return (
    <div
      data-cmb-id={cmb.id}
      className={[
        "combatant",
        cmb.team,
        dead ? "dead" : "",
        targetable ? "targetable" : "",
        isAggroTarget ? "aggro-target" : "",
        attacking ? "attacking" : "",
        reactClass,
      ].join(" ")}
      // 特效主色: 供闪光/冲击环/光晕/飘字着色
      style={preset ? ({ ["--vfx-color" as string]: preset.color } as React.CSSProperties) : undefined}
      onClick={(e) => {
        e.stopPropagation();
        if (targetable && onClick) onClick();
      }}
    >
      {cmb.team === "enemy" && !dead && <EnemyIntent enemy={cmb as Enemy} currentTick={currentTick} />}

      {/* 首击特效(斩击/火爆/柔光…) + 伤害/治疗飘字, 命中时刻挂载 */}
      {hit && preset && (
        <div className={`vfx vfx-${hit.anim} vfx-${preset.kind}`} key={hit.seq} aria-hidden>
          <span className="vfx-emoji">{preset.emoji}</span>
        </div>
      )}
      {hit?.float && (
        <div key={`f${hit.seq}`} className={`float-num float-${hit.float.tone}`}>
          {hit.float.text}
        </div>
      )}

      <div className="combatant-statuses">
        <StatusPips statuses={cmb.statuses} />
      </div>

      <div className="combatant-figure">
        <CharacterPortrait
          characterId={cmb.team === "player" ? (cmb as Ally).charId : undefined}
          emoji={cmb.emoji}
          alt={`${cmb.name}立绘`}
          className="combatant-portrait"
        />
      </div>

      <div className="combatant-info">
        <div className="cmb-name">
          {cmb.name}
          {cmb.team === "player" && <span className="threat" title="仇恨值">🎯{(cmb as Ally).threat}</span>}
        </div>

        <div className="combatant-vitals">
          <div className="hp-bar">
            <div className="hp-fill" style={{ width: `${hpPct}%` }} />
            <span className="hp-text">
              {Math.max(0, cmb.hp)}/{cmb.maxHp}
            </span>
          </div>
          {cmb.block > 0 && (
            <span className="block-badge" title="护盾">
              🛡️{cmb.block}
            </span>
          )}
        </div>
      </div>

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
