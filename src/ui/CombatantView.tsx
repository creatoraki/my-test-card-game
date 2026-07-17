import type { EnemyPlacement } from "../data";
import { getStatus, type Enemy } from "../engine";
import { StatusPips } from "./StatusPips";
import type { HitFx } from "./animations";
import { CharacterPortrait } from "./CharacterPortrait";
import { EnemySprite } from "./EnemySprite";
import { enemyArt } from "./enemyArt";
import { HitFxLayer, hitFxVars } from "./HitFxLayer";

interface Props {
  cmb: Enemy;
  currentTick: number;
  targetable: boolean; // 当前是否是合法的点选目标
  attacking?: boolean; // 是否是当前出牌的施法者(前冲动画)
  hit?: HitFx | null; // 命中时刻下发的受击/首击特效
  placement?: EnemyPlacement; // 手工站位(贴合背景地面); 省略则用 .enemy-row 的默认排布
  onClick?: () => void;
}

// 场上的敌人单位: 无背景面板, 立绘直接浮在场景上。
// 我方不走这里 —— 见 ui/AllyBar.tsx 的底部玻璃头像栏; 两者共用 HitFxLayer 保证命中表现一致。
export function CombatantView({ cmb, currentTick, targetable, attacking, hit, placement, onClick }: Props) {
  const hpPct = Math.max(0, (cmb.hp / cmb.maxHp) * 100);
  const dead = !cmb.alive;

  // 敌人立绘按 enemyDefId 查登记表; 未登记的退回 CharacterPortrait 的 emoji
  const enemySprite = enemyArt(cmb.enemyDefId);

  const { reactClass, vars } = hitFxVars(hit ?? null);

  // --place-*: 手工站位, dx/dy 落到 .combatant 的 translate, scale 只落到 .combatant-stage
  // (不能走 transform —— 那条已被 hover/前冲/hitShake 占满, 见 styles.css)
  if (placement) {
    if (placement.dx != null) vars["--place-dx"] = `${placement.dx}px`;
    if (placement.dy != null) vars["--place-dy"] = `${placement.dy}px`;
    if (placement.scale != null) vars["--place-scale"] = `${placement.scale}`;
  }

  return (
    <div
      data-cmb-id={cmb.id}
      className={[
        "combatant",
        "enemy",
        dead ? "dead" : "",
        targetable ? "targetable" : "",
        attacking ? "attacking" : "",
        reactClass,
      ].join(" ")}
      style={Object.keys(vars).length ? (vars as React.CSSProperties) : undefined}
      onClick={(e) => {
        e.stopPropagation();
        if (targetable && onClick) onClick();
      }}
    >
      {!dead && <EnemyIntent enemy={cmb} currentTick={currentTick} />}

      {/* --place-scale 只作用于这一层: 立绘和命中特效一起放大, 血条/BUFF/意图/倒计时保持原尺寸。
          HitFxLayer 必须留在这层内 —— 它相对最近的定位祖先定位, 且要跟着立绘一起缩放 */}
      <div className="combatant-stage">
        <HitFxLayer hit={hit ?? null} />

        <div className="combatant-figure">
          {enemySprite ? (
            <EnemySprite id={cmb.enemyDefId} sprite={enemySprite} alt={`${cmb.name}立绘`} />
          ) : (
            <CharacterPortrait emoji={cmb.emoji} alt={`${cmb.name}立绘`} />
          )}
        </div>
      </div>

      {/* 立绘下方: 血条(内嵌名字 + 数值) → 护盾/BUFF-DEBUFF 一排 */}
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
