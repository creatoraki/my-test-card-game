import type { Enemy } from "@/engine";
import { cx } from "@/ui/common/cx";
import s from "./TickRuler.module.css";

// 从当前时刻起往后画几格。8 格够覆盖大多数敌人的 castTick(3~5), 又不会把顶栏撑爆。
const SPAN = 8;

// ★ 敌人行动标记开关(语义待定)。
// 打开后每个刻度格下方会点出「本刻会有几个敌人行动」的小点 —— 数据是现成的
// (Enemy.nextActTick 与 BattleState.tick), 但它等于把「何时挨打」全盘摊开,
// 与 CombatantView 里「意图默认不可见、靠洞察揭示」的设计取向可能冲突, 故先关着。
// 定了之后改这一行即可。
const SHOW_ENEMY_MARKS = false;

interface Props {
  tick: number; // 当前时刻
  round: number; // 当前回合
  enemies: Enemy[]; // 仅在 SHOW_ENEMY_MARKS 打开时使用
}

// 手牌面板顶栏右侧的「时刻标尺」: 横向排开当前时刻起的若干刻, 高亮当前刻。
// 本作的核心是时刻制, 但改造前界面里根本没有全局时刻显示(只有每个敌人头顶的倒计时),
// 这条尺就是那个缺口。纯展示组件, 不读 store。
export function TickRuler({ tick, round, enemies }: Props) {
  const ticks = Array.from({ length: SPAN }, (_, i) => tick + i);

  // 每个刻上有几个敌人会行动(开关关闭时恒为空表, 不产生任何渲染)
  const marks = new Map<number, number>();
  if (SHOW_ENEMY_MARKS) {
    for (const e of enemies) {
      if (!e.alive) continue;
      marks.set(e.nextActTick, (marks.get(e.nextActTick) ?? 0) + 1);
    }
  }

  return (
    <div className={s["tick-ruler"]} title="时刻轴：普通牌推进 1 时刻，速攻牌不推进">
      <span className={s["tick-ruler-label"]}>
        回合 <b>{round}</b>
      </span>
      <div className={s["tick-ruler-track"]}>
        {ticks.map((t) => (
          <span key={t} className={cx(s["tick-cell"], t === tick && s.now)}>
            {t}
            {SHOW_ENEMY_MARKS && marks.has(t) && (
              <i className={s["tick-mark"]} aria-hidden>
                {"•".repeat(marks.get(t)!)}
              </i>
            )}
          </span>
        ))}
        <span className={cx(s["tick-cell"], s.tail)} aria-hidden>
          ▸
        </span>
      </div>
    </div>
  );
}
