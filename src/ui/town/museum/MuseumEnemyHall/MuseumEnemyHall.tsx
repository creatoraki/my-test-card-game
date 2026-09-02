import { useState, type CSSProperties } from "react";
import type { EnemyDef } from "@/data";
import { enemyArt } from "@/ui/art/enemyArt";
import { EnemySprite } from "@/ui/battle/EnemySprite";
import { InteractiveHint } from "@/ui/common/InteractiveHint";
import { useTownStore } from "@/store/townStore";
import { cx } from "@/ui/common/cx";
import { ENEMY_GROUPS, ENEMIES } from "../codexCatalog";
import { moveKindLabel, moveSummary } from "../enemyMoveText";
import { MuseumLockedTile } from "../MuseumLockedTile";
import s from "./MuseumEnemyHall.module.css";

export function MuseumEnemyHall() {
  const recorded = useTownStore((state) => state.codex.enemies);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? ENEMIES.find((enemy) => enemy.id === selectedId) : undefined;

  return (
    <div className={s["hall"]}>
      <section className={s["catalog"]}>
        <div className={s["section-head"]}>
          <div><span className={s["kicker"]}>遭遇档案</span><h3>怪物名录</h3></div>
          <span className={s["count"]}>{recorded.length} / {ENEMIES.length}</span>
        </div>
        <div className={s["enemy-groups"]}>
          {ENEMY_GROUPS.map((group) => (
            <section key={group.id} className={s["enemy-group"]}>
              <h4>{group.name}<small>{group.enemies.filter((enemy) => recorded.includes(enemy.id)).length}/{group.enemies.length}</small></h4>
              <div className={s["enemy-grid"]}>
                {group.enemies.map((enemy) => {
                  const isRecorded = recorded.includes(enemy.id);
                  return isRecorded ? (
                    <div key={enemy.id} className={s["enemy-anchor"]} data-interactive-hint="">
                      <button
                        type="button"
                        className={cx(s["enemy-button"], selectedId === enemy.id && s["is-selected"])}
                        aria-label={`查看${enemy.name}详情`}
                        onClick={() => setSelectedId(enemy.id)}
                      >
                        <EnemyThumb enemy={enemy} />
                        <span>{enemy.name}</span>
                      </button>
                      <InteractiveHint className={s["enemy-hint"]} />
                    </div>
                  ) : (
                    <div key={enemy.id} className={s["enemy-anchor"]} data-interactive-hint="">
                      <button
                        type="button"
                        className={s["locked-enemy"]}
                        aria-label={`未收录敌人：${enemy.name}`}
                        onClick={() => setSelectedId(enemy.id)}
                      >
                        <MuseumLockedTile />
                        <span>{enemy.name}</span>
                      </button>
                      <InteractiveHint className={s["enemy-hint"]} />
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
      <aside className={s["detail"]}>
        {selected && recorded.includes(selected.id) ? <EnemyDetail enemy={selected} /> : <p className={s["empty"]}>选择已遭遇敌人查看详情</p>}
      </aside>
    </div>
  );
}

function EnemyThumb({ enemy }: { enemy: EnemyDef }) {
  const art = enemyArt(enemy.id);
  if (!art) return <span className={s["enemy-emoji"]}>{enemy.emoji}</span>;
  const view = art.view ?? { x: 0, y: 0, w: art.sheet.w / art.frames, h: art.sheet.h };
  const width = 110;
  const scale = width / view.w;
  return (
    <span
      className={s["enemy-figure"]}
      style={{ "--fig-w": `${width}px`, "--fig-h": `${view.h * scale}px`, "--sprite-k": scale } as CSSProperties}
    >
      <EnemySprite
        id={enemy.id}
        sprite={art}
        alt={enemy.name}
      />
    </span>
  );
}

function EnemyDetail({ enemy }: { enemy: EnemyDef }) {
  const art = enemyArt(enemy.id);
  const group = ENEMY_GROUPS.find((entry) => entry.enemies.some((item) => item.id === enemy.id));
  return (
    <div className={s["enemy-detail"]}>
      <div className={s["detail-portrait"]}>
        {art ? <EnemyThumb enemy={enemy} /> : <span className={s["detail-emoji"]}>{enemy.emoji}</span>}
      </div>
      <div className={s["detail-head"]}>
        <span className={s["kicker"]}>{group?.name ?? "敌人档案"}</span>
        <h4>{enemy.name}</h4>
      </div>
      <dl className={s["facts"]}>
        <div><dt>生命</dt><dd>{enemy.maxHp}</dd></div>
        <div><dt>经验</dt><dd>{enemy.exp}</dd></div>
        <div><dt>每轮行动</dt><dd>{enemy.actsPerRound ?? 1}</dd></div>
        <div><dt>掉落档位</dt><dd>{group?.name.replace("敌人", "") ?? "普通"}</dd></div>
      </dl>
      <div className={s["moves"]}>
        <h5>行动模式</h5>
        {enemy.moves.map((move) => (
          <div key={move.id} className={s["move"]}>
            <div className={s["move-head"]}>
              <span className={s["move-name"]}>{move.emoji} {move.name}</span>
              <span className={s["move-kind"]}>{moveKindLabel(move.kind)}</span>
            </div>
            <p>{moveSummary(move)}</p>
            <small>延迟 {move.delay} · 权重 {move.weight ?? 1}{move.hitBonus ? ` · 命中 ${move.hitBonus > 0 ? "+" : ""}${move.hitBonus}%` : ""}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
