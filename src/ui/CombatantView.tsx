import { getStatus, type Ally, type Combatant, type Enemy } from "../engine";
import { StatusPips } from "./StatusPips";
import { ANIM, type HitFx } from "./animations";
import { CharacterPortrait } from "./CharacterPortrait";
import { EnemySprite } from "./EnemySprite";
import { enemyArt } from "./enemyArt";
import { SpriteFx } from "./SpriteFx";

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

  // 敌人立绘按 enemyDefId 查登记表; 未登记(或我方)则退回 CharacterPortrait
  const enemyDefId = cmb.team === "enemy" ? (cmb as Enemy).enemyDefId : undefined;
  const enemySprite = enemyDefId ? enemyArt(enemyDefId) : undefined;

  const preset = hit ? ANIM[hit.anim] : null;
  // 提出局部 const 保住闭包内的类型窄化(直接在 JSX 里写 preset.sprite! 会丢窄化)
  const sprite = preset?.sprite;
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
      // --vfx-color: 特效主色, 供闪光/冲击环/光晕/飘字着色
      // --vfx-impact: 挂载 → 砸中的偏移, 把受击抖动/闪白推迟到序列帧真正命中那一刻(emoji 系缺省 0, 行为不变)
      style={
        preset
          ? ({
              ["--vfx-color" as string]: preset.color,
              ["--vfx-impact" as string]: `${sprite?.impactMs ?? 0}ms`,
            } as React.CSSProperties)
          : undefined
      }
      onClick={(e) => {
        e.stopPropagation();
        if (targetable && onClick) onClick();
      }}
    >
      {cmb.team === "enemy" && !dead && <EnemyIntent enemy={cmb as Enemy} currentTick={currentTick} />}

      {/* 首击特效(序列帧/斩击/火爆/柔光…) + 伤害/治疗飘字, 命中时刻挂载。
          key={hit.seq}: 连续命中时强制重挂载以重放动画。
          序列帧用 anchorTop 把锚点下移到立绘脚下(剑插地处), emoji 系维持原有 .vfx 定位。 */}
      {hit && preset && (
        <div
          className={`vfx vfx-${hit.anim} vfx-${preset.kind}`}
          key={hit.seq}
          style={sprite ? { top: `${sprite.anchorTop}px` } : undefined}
          aria-hidden
        >
          {sprite ? <SpriteFx sprite={sprite} /> : <span className="vfx-emoji">{preset.emoji}</span>}
        </div>
      )}
      {hit?.float && (
        <div key={`f${hit.seq}`} className={`float-num float-${hit.float.tone}`}>
          {hit.float.text}
        </div>
      )}

      <div className="combatant-figure">
        {enemySprite && enemyDefId ? (
          <EnemySprite id={enemyDefId} sprite={enemySprite} alt={`${cmb.name}立绘`} />
        ) : (
          <CharacterPortrait
            characterId={cmb.team === "player" ? (cmb as Ally).charId : undefined}
            emoji={cmb.emoji}
            alt={`${cmb.name}立绘`}
          />
        )}
      </div>

      {/* 立绘下方: 血条(内嵌名字 + 数值) → 状态/护盾/仇恨一排 */}
      <div className="combatant-info">
        <div className="hp-bar">
          <div className="hp-fill" style={{ width: `${hpPct}%` }} />
          <span className="cmb-name">{cmb.name}</span>
          <span className="hp-text">
            {Math.max(0, cmb.hp)}/{cmb.maxHp}
          </span>
        </div>

        <div className="combatant-badges">
          {cmb.block > 0 && (
            <span className="block-badge" title="护盾">
              🛡️{cmb.block}
            </span>
          )}
          {cmb.team === "player" && (
            <span className="threat" title="仇恨值">
              🎯{(cmb as Ally).threat}
            </span>
          )}
          <StatusPips statuses={cmb.statuses} />
        </div>
      </div>

      {dead && <div className="dead-overlay">☠</div>}
    </div>
  );
}

// 意图默认不可见: 敌人带「洞察」标记时才揭示。数据始终存在(engine/ai.ts 照常 buildIntent),
// 这里只控制显示 —— 未来的「查看意图」卡牌用 APPLY_STATUS 给敌人挂 insight 即可。
export function isIntentRevealed(enemy: Enemy): boolean {
  return (getStatus(enemy, "insight")?.stacks ?? 0) > 0;
}

function EnemyIntent({ enemy, currentTick }: { enemy: Enemy; currentTick: number }) {
  const countdown = Math.max(0, enemy.nextActTick - currentTick);
  const i = enemy.intent;
  const revealed = isIntentRevealed(enemy);
  return (
    // 未揭示时不给 title —— 否则 hover 就把招式名漏出去了
    <div className="intent" title={revealed ? `意图: ${i.name}` : undefined}>
      {revealed && (
        <span className={`intent-badge intent-${i.kind}`}>
          {i.emoji}
          {i.value != null && <b>{i.value}</b>}
        </span>
      )}
      <span
        className={[
          "countdown",
          revealed ? "" : "countdown-solo",
          countdown === 0 ? "imminent" : "",
        ].join(" ")}
        title="距离下次行动的时刻"
      >
        ⏱{countdown}
      </span>
    </div>
  );
}
