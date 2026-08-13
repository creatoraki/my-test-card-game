import { memo } from "react";
import type { EnemyPlacement } from "@/data";
import { getStatus, type Enemy } from "@/engine";
import { StatusPips } from "@/ui/common/StatusPips";
import { cx } from "@/ui/common/cx";
import type { HitFx } from "@/ui/battle/animations";
import { unitShellAttrs } from "@/ui/battle/unitShell";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import { EnemySprite } from "@/ui/battle/EnemySprite";
import { enemyArt, enemyIdle } from "@/ui/art/enemyArt";
import { HitFxLayer, hitFxVars } from "@/ui/battle/fx/HitFxLayer";
import { DeathVanishFx } from "@/ui/battle/fx/DeathVanishFx";
import { DEATH, type DeathPhase } from "@/ui/battle/deathChoreo";
import { HpBar } from "@/ui/common/HpBar";
import { ShieldBar } from "@/ui/common/ShieldBar";
import { RailPopover } from "@/ui/common/RailPopover";
import { HourglassIcon } from "./icons";
import s from "./CombatantView.module.css";
// 敌我两种外壳共用的两枚徽章。同域共享样式模块, 双方各自 import(样式铁律 1)。
import ub from "@/ui/battle/styles/unitBadges.module.css";

interface Props {
  cmb: Enemy;
  currentTick: number;
  targetable: boolean; // 当前是否是合法的点选目标
  attacking?: boolean; // 是否是当前出牌的施法者(前冲动画)
  telegraph?: boolean; // 是否正在蓄力预告
  hit?: HitFx | null; // 命中时刻下发的受击/首击特效
  placement?: EnemyPlacement; // 手工站位(贴合背景地面); 省略则用 .enemy-row 的默认排布
  twitching?: boolean; // 待机小动作(见 ui/useIdleTwitch.ts): 随机抽中时抖一下
  onClick?: (id: string) => void;
  // 悬停到本单位(仅 targetable 时触发): 供瞄准运镜取朝向, 见 BattleScreen 的 aimFoeId。
  // 刻意没有配对的"离开"回调 —— 瞄准朝向是锁存的, 清除挂在 .battle-stage 上(理由见那里)。
  onHover?: (id: string) => void;
  deathPhase?: DeathPhase;
}

// 场上的敌人单位: 无背景面板, 立绘直接浮在场景上。
// 我方不走这里 —— 见 ui/AllyBar.tsx 的底部玻璃头像栏; 两者共用 HitFxLayer 保证命中表现一致。
export const CombatantView = memo(function CombatantView({
  cmb,
  currentTick,
  targetable,
  attacking,
  telegraph,
  hit,
  placement,
  twitching,
  onClick,
  onHover,
  deathPhase,
}: Props) {
  const phase = deathPhase ?? (!cmb.alive ? "dead" : "alive");
  const dead = phase === "dead";

  // 敌人立绘按 enemyDefId 查登记表; 未登记的退回 CharacterPortrait 的 emoji
  const enemySprite = enemyArt(cmb.enemyDefId);

  const { react, vars } = hitFxVars(hit ?? null);

  // --place-*: 手工站位, dx/dy 落到 .combatant 的 translate, scale 由几何变量自然参与
  // (不能走 transform —— 那条已被 hover/前冲/hitShake 占满, 见 CombatantView.module.css)
  if (placement) {
    if (placement.dx != null) vars["--place-dx"] = `${placement.dx}px`;
    if (placement.dy != null) vars["--place-dy"] = `${placement.dy}px`;
    if (placement.scale != null) vars["--place-scale"] = `${placement.scale}`;
  }

  // --sprite-k 到 --body-cx: 展示框与主体框的源图几何, 立绘主体高度统一到 --foe-figure-h。
  // --shadow-w: 脚下椭圆落地阴影的宽度, 跟主体宽度走, 而不是跟布局盒宽度走。
  if (enemySprite) {
    const view = enemySprite.view ?? {
      x: 0,
      y: 0,
      w: enemySprite.sheet.w / enemySprite.frames,
      h: enemySprite.sheet.h,
    };
    const body = enemySprite.body;
    const bodyCenterOffset =
      (body.x + body.w / 2 - (view.x + view.w / 2)) * (placement?.flip ? -1 : 1);
    vars["--sprite-k"] = `calc(var(--foe-figure-h) * var(--place-scale, 1) / ${body.h})`;
    vars["--body-h"] = "calc(var(--foe-figure-h) * var(--place-scale, 1))";
    vars["--body-w"] = `calc(var(--sprite-k) * ${body.w})`;
    vars["--fig-w"] = `calc(var(--sprite-k) * ${view.w})`;
    vars["--fig-h"] = `calc(var(--sprite-k) * ${view.h})`;
    vars["--foot-inset"] =
      `calc(var(--sprite-k) * ${view.y + view.h - (body.y + body.h)})`;
    vars["--body-cx"] = `calc(var(--sprite-k) * ${bodyCenterOffset})`;
  } else {
    // emoji 兜底没有源图几何, 给 CSS 一组稳定的缺省值。
    vars["--sprite-k"] = "1px";
    vars["--body-h"] = "var(--foe-figure-h)";
    vars["--body-w"] = "var(--foe-figure-h)";
    vars["--fig-w"] = "var(--foe-figure-h)";
    vars["--fig-h"] = "var(--foe-figure-h)";
    vars["--foot-inset"] = "0px";
    vars["--body-cx"] = "0px";
  }
  const idle = enemyIdle(enemySprite);
  vars["--idle-bob"] = `${idle.bob}px`;
  vars["--idle-sway"] = `${idle.sway}px`;
  vars["--idle-tilt"] = `${idle.tilt}deg`;
  vars["--idle-dur"] = `${idle.dur}ms`;
  vars["--idle-delay"] = `${idle.delay}ms`;
  vars["--shadow-w"] = "calc(var(--body-w) * 0.78)";
  vars["--death-vanish-ms"] = `${DEATH.vanish}ms`;

  return (
    <div
      data-cmb-id={cmb.id}
      // 外壳状态一律走 data-*(见 battle/unitShell.ts): fx/HitFxLayer 与 EnemySprite 都要
      // 按这些状态改自己的表现, 而它们够不着本文件被哈希的类名。
      {...unitShellAttrs({ side: "enemy", dead, death: phase, targetable, attacking, telegraph, react })}
      className={cx(s["combatant"], twitching && !dead && s["twitch"])}
      style={vars as React.CSSProperties}
      onClick={(e) => {
        e.stopPropagation();
        if (targetable && onClick) onClick(cmb.id);
      }}
      onMouseEnter={() => {
        if (targetable && onHover) onHover(cmb.id);
      }}
    >
      {telegraph && phase === "alive" && (
        <div className={s.telegraph}>
          {isIntentRevealed(cmb) ? cmb.intent.name : "⚠ 行动"}
        </div>
      )}

        {/* --place-scale 作用于立绘和命中特效的几何, 血条/BUFF/意图/倒计时保持原尺寸。
          HitFxLayer 必须留在这层内 —— 它相对最近的定位祖先定位, 且要跟着立绘一起缩放 */}
      {/* data-cmb-stage: 供 BattleScreen 的 computeCamera 量取景框(它要的是含体型 scale 的
          这一层, 不是外层布局盒)。类名会被 Modules 哈希, querySelector 只能认属性。 */}
      <div className={s["combatant-stage"]} data-cmb-stage>
        <HitFxLayer hit={hit ?? null} />
        {phase === "vanish" && <DeathVanishFx />}

        <div className={s["combatant-figure"]}>
          {enemySprite ? (
            <EnemySprite
              id={cmb.enemyDefId}
              sprite={enemySprite}
              alt={`${cmb.name}立绘`}
              flip={placement?.flip}
            />
          ) : (
            <CharacterPortrait
              emoji={cmb.emoji}
              alt={`${cmb.name}立绘`}
              className={s["combatant-portrait"]}
            />
          )}
        </div>
      </div>

      {/* 立绘下方: BUFF/护盾 → 血条 → 意图/倒计时 */}
      <div className={s["combatant-info"]}>
        <div className={s["combatant-hp"]}>
          <div className={s["combatant-badges"]}>
            <StatusPips
              statuses={cmb.statuses}
              shield={cmb.shield}
              detail
              popoverSide="top-left"
              className={s["combatant-statuses"]}
            />
          </div>
          <HpBar hp={cmb.hp} hpLimit={cmb.hpLimit} maxHp={cmb.maxHp} hideLimit large />
          <ShieldBar shield={cmb.shield} maxHp={cmb.maxHp} large hideEmpty />
        </div>
        {phase === "alive" && <EnemyIntent enemy={cmb} currentTick={currentTick} />}
      </div>

      {dead && <div className={ub["dead-overlay"]}>☠</div>}
    </div>
  );
});

// 意图默认不可见: 敌人带「洞察」标记时才揭示。数据始终存在(engine/ai.ts 照常随机抽招),
// 这里只控制显示 —— 未来的「查看意图」卡牌用 APPLY_STATUS 给敌人挂 insight 即可。
export function isIntentRevealed(enemy: Enemy): boolean {
  return (getStatus(enemy, "insight")?.stacks ?? 0) > 0;
}

function EnemyIntent({ enemy, currentTick }: { enemy: Enemy; currentTick: number }) {
  if (enemy.nextActTick == null) return null;

  const countdown = Math.max(0, enemy.nextActTick - currentTick);
  const i = enemy.intent;
  const revealed = isIntentRevealed(enemy);
  return (
    <div
      className={s["combatant-readout"]}
    >
      {revealed && (
        <span className={cx(s["intent-badge"], s[`intent-${i.kind}`])}>
          {i.emoji}
          {i.value != null && <b>{i.value}</b>}
        </span>
      )}
      <span
        className={cx(
          s["countdown"],
          !revealed && s["countdown-solo"],
          countdown === 0 && s["imminent"],
        )}
        data-rail-item
        tabIndex={0}
        aria-label={`距离下次行动 ${countdown} 时刻`}
      >
        <HourglassIcon className={s.hourglass} />
        <span className={s["countdown-num"]}>{countdown}</span>
        <RailPopover side="top">
          <strong>下次行动</strong>
          <p>剩余 {countdown} 时刻</p>
          {revealed && (
            <small>
              意图：{i.name}{i.value != null && ` · 数值 ${i.value}`}
            </small>
          )}
        </RailPopover>
      </span>
    </div>
  );
}
