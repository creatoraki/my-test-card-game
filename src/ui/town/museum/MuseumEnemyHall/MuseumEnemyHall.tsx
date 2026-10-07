import { ShopDetailAside } from "@/ui/town/shop/ShopDetailAside";
import { useState } from "react";
import type { EnemyDef } from "@/data";
import { RULES } from "@/engine";
import { InteractiveHint } from "@/ui/common/tooltip/InteractiveHint";
import { useTownStore } from "@/store/town/townStore";
import { cx } from "@/ui/common/shared/cx";
import { ENEMY_GROUPS, ENEMIES } from "../shared/codexCatalog";
import { moveKindLabel, moveSummary } from "./enemyMoveText";
import { MuseumLockedTile } from "../MuseumLockedTile";
import { EnemyPortrait } from "./EnemyPortrait";
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
                        <EnemyPortrait enemy={enemy} className={s["enemy-portrait"]} />
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
                        <MuseumLockedTile className={s["enemy-portrait"]} />
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
      <ShopDetailAside>
        {selected && recorded.includes(selected.id) ? <EnemyDetail enemy={selected} /> : <p className={s["empty"]}>选择已遭遇敌人查看详情</p>}
      </ShopDetailAside>
    </div>
  );
}

function EnemyDetail({ enemy }: { enemy: EnemyDef }) {
  const group = ENEMY_GROUPS.find((entry) => entry.enemies.some((item) => item.id === enemy.id));
  return (
    <div className={s["enemy-detail"]}>
      <EnemyPortrait enemy={enemy} className={s["detail-portrait"]} />
      <div className={s["detail-head"]}>
        <span className={s["kicker"]}>{group?.name ?? "敌人档案"}</span>
        <h4>{enemy.name}</h4>
      </div>
      <dl className={s["facts"]}>
        <div><dt>生命</dt><dd>{enemy.maxHp}</dd></div>
        <div><dt>经验</dt><dd>{enemy.exp}</dd></div>
        <div><dt>每回合行动点</dt><dd>{enemy.apPerRound ?? RULES.enemy.apPerRound}</dd></div>
        <div><dt>掉落档位</dt><dd>{group?.name.replace("敌人", "") ?? "普通"}</dd></div>
      </dl>
      <div className={s["moves"]}>
        <h5>行动模式</h5>
        {enemy.passiveDescription && <div className={s["move"]}><p>{enemy.passiveDescription}</p></div>}
        {enemy.moves.map((move) => (
          <div key={move.id} className={s["move"]}>
            <div className={s["move-head"]}>
              <span className={s["move-name"]}>{move.emoji} {move.name}</span>
              <span className={s["move-kind"]}>{moveKindLabel(move.kind)}</span>
            </div>
            <p>{moveSummary(move)}</p>
            <small>消耗 {move.cost} · 延迟 {move.delay} · 权重 {move.weight ?? 1}{move.hitBonus ? ` · 命中 ${move.hitBonus > 0 ? "+" : ""}${move.hitBonus}%` : ""}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
