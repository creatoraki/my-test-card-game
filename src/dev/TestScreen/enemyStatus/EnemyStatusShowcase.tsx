import type { CSSProperties } from "react";
import { enemyArt, enemyIdle } from "@/ui/art/battle/enemyArt";
import { EnemySprite } from "@/ui/common/unit/EnemySprite";
import { HpBar } from "@/ui/common/bar/HpBar";
import unit from "@/ui/battle/CombatantView/CombatantView.module.css";
import motion from "@/ui/battle/CombatantView/CombatantView.motion.module.css";
import { enemySamples } from "./statusSamples";
import { StatusIconRow } from "./StatusIconRow";
import s from "./EnemyStatusShowcase.module.css";

function SampleEnemy({ sample }: { sample: (typeof enemySamples)[number] }) {
  const sprite = enemyArt(sample.id);
  if (!sprite) return null;
  const view = sprite.view ?? {
    x: 0, y: 0, w: sprite.sheet.w / sprite.frames, h: sprite.sheet.h,
  };
  const body = sprite.body;
  const idle = enemyIdle(sprite);
  // 与 CombatantView 一致：按主体高度归一，完整展示源图，抵消脚下透明留白。
  const vars = {
    "--sprite-k": `calc(var(--foe-figure-h) * ${sample.scale} / ${body.h})`,
    "--body-w": `calc(var(--sprite-k) * ${body.w})`,
    "--body-h": `calc(var(--foe-figure-h) * ${sample.scale})`,
    "--fig-w": `calc(var(--sprite-k) * ${view.w})`,
    "--fig-h": `calc(var(--sprite-k) * ${view.h})`,
    "--foot-inset": `calc(var(--sprite-k) * ${view.y + view.h - body.y - body.h})`,
    "--body-cx": `calc(var(--sprite-k) * ${body.x + body.w / 2 - view.x - view.w / 2})`,
    "--shadow-w": "calc(var(--body-w) * 0.78)",
    "--idle-bob": `${idle.bob}px`,
    "--idle-sway": `${idle.sway}px`,
    "--idle-tilt": `${idle.tilt}deg`,
    "--idle-dur": `${idle.dur}ms`,
    "--idle-delay": `${idle.delay}ms`,
  } as CSSProperties;

  return (
    <article className={s.sample}>
      <div className={unit.combatant} style={vars}>
        <div className={`${unit["combatant-stage"]} ${motion.stage}`}>
          <div className={`${unit["combatant-figure"]} ${motion.figure}`}>
            <EnemySprite id={sample.id} sprite={sprite} alt={`${sample.name}立绘`} />
          </div>
        </div>
        <div className={unit["combatant-info"]}>
          <div className={unit["combatant-hp"]}>
            <StatusIconRow statuses={sample.statuses} />
            <HpBar hp={sample.hp} maxHp={sample.maxHp} hideLimit large />
          </div>
        </div>
      </div>
      <div className={s.caption}>
        <strong>{sample.name}</strong>
        <span>{sample.statuses.length} 个状态 · {sample.statuses.length > 6 ? "双行展示" : "单行展示"}</span>
      </div>
    </article>
  );
}

export function EnemyStatusShowcase() {
  return (
    <main className={s.showcase}>
      <header className={s.header}>
        <h1>敌人增益与减益展示</h1>
        <p>战斗原尺寸立绘与血条 · 状态图标位于血条上方 · 悬停查看状态</p>
      </header>
      <section className={s.stage} aria-label="三个敌人的状态图标对比">
        {enemySamples.map((sample) => <SampleEnemy key={sample.id} sample={sample} />)}
      </section>
      <footer className={s.legend}>
        <span className={s.buff}>绿色层数：增益</span>
        <span className={s.debuff}>红色层数：减益</span>
        <span>保留素材原始边框，每行最多六个图标</span>
      </footer>
    </main>
  );
}
