// ★ 战斗签老虎机 ★ —— 每轮的第二个关卡, 见 探索模式设计.md §2.4 / §11.2。
//
// 玩法只有两句话:
//   **3 条转轮同时滚, 拉 3 次摇杆从左到右依次定住。**
//   **从定住的 3 张里选 1 张执行 —— 无论选中什么, 战斗都必然发生。**
// 追三连的代价是放弃选择权(§2.4.3): 瞄同一个符号中了拿 +1.50, 但只有一张卡能用;
// 稳妥打法是故意停出 3 张不同的, 换取最大的战术选择权。这个平衡器不需要任何数值。
//
// ★ 表现层的立场: **转轮本身就是画面**。三条巨型卡带铺满整个 1920×1080 探索画布,
//   右侧一根停止摇杆; 三列定住后三张卡原地放大, 直接点卡面开战 —— 全程没有第二个面板。
//   所以这里不复用 .expl-modal/.expl-panel(那是居中小面板的语言), 自建 .slot-stage 全屏层。
//
// ⚠ 硬约束(与本页其余部分同一条): .slot-stage / .slot-floor 这条祖先链上不挂
//   animation / opacity / transform / filter —— 一旦成为 backdrop root, 本层的
//   backdrop-filter 就取不到背景场景了。动画一律挂叶子(.slot-strip / .slot-card / 摇臂)。

import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { BATTLE_TIER_NAME, canRetreat } from "@/explore/session";
import { EXPLORE_RULES } from "@/explore/rules";
import type { SlotBattleMod, SlotState, SlotSymbol } from "@/explore/types";
import { useExploreStore } from "@/store/exploreStore";
import { slotArt } from "@/ui/art/slotArt";
import { cx } from "@/ui/common/cx";
import s from "./SlotReels.module.css";

// ── 几何(设计 px, 1920×1080 画布基准) ──
// ★ 唯一真相点: 由这里内联下发给 CSS, 两边各写一份就会让位移量与格子高度对不上
//   (与 RouteBoard 下发 --len 同一套做法)。
//   CARD_W : CARD_H = 1 : 1.4, 与手牌同比(BattleScreen.css --hand-card-w/h)。
const CARD_W = 384;
const CARD_H = 538;
const CELL = 578; // 单元高 = 卡高 + 40 间隙 ← slotSpin 的位移量用的就是它
// 转轮窗口高; 上下各露出 (820-578)/2 = 121px 的邻卡。
// ⚠ 上限被画布卡死: 820(窗口) + ~90(标题带) + ~40(底部提示) + 44(两道 gap) ≈ 994 < 1080。
const WINDOW = 820;

// 战斗条件改造 → 人话。⚠ 只描述**真实会生效**的项: 引擎认识的就这四样,
// 卡面上绝不能出现一个引擎不执行的承诺(见 data/slotSymbols.ts 的降级说明)。
function describeMod(mod?: SlotBattleMod): string[] {
  if (!mod) return [];
  const out: string[] = [];
  if (mod.castTickDelta != null && mod.castTickDelta !== 0) {
    out.push(mod.castTickDelta < 0 ? `敌方先手 +${-mod.castTickDelta}` : `敌方行动间隔 +${mod.castTickDelta}`);
  }
  for (const st of mod.enemyStatuses ?? []) {
    out.push(st.id === "insight" ? "公示敌方意图" : `敌方 ${st.id} +${st.stacks}`);
  }
  if (mod.extraEnemies?.length) out.push(`追加敌人 ×${mod.extraEnemies.length}`);
  if (mod.hpMultiplier != null && mod.hpMultiplier !== 1) {
    out.push(`敌人 HP ×${mod.hpMultiplier}`);
  }
  return out;
}

function symbolTags(sym: SlotSymbol): string[] {
  const tags = describeMod(sym.mod);
  if (sym.dropBonus) tags.push(`掉落系数 +${sym.dropBonus.toFixed(2)}`);
  return tags;
}

// ---------------------------------------------------------------------------
// 一张巨型卡面
// ---------------------------------------------------------------------------
// 结构借手牌的语言(HandCard.css): 正方形美术区 + 固定高文字区。
// detailed 只在放大态(三选一)为真 —— 滚动中挂标签纯属视觉噪音, 那一刻的信息量
// 只需要「这是哪个符号」, 由美术 + 角标字形 + 标题三样承担。
function SlotCard({ sym, detailed }: { sym: SlotSymbol | undefined; detailed: boolean }) {
  if (!sym) return <div className={cx(s["slot-card"], s["is-blank"])} aria-hidden />;
  const tags = detailed ? symbolTags(sym) : [];
  return (
    <div className={cx(s["slot-card"], s[`k-${sym.kind}`])}>
      <span className={s["slot-card-bar"]} aria-hidden />
      <div className={s["slot-card-art"]} style={{ backgroundImage: `url(${slotArt(sym.id)})` }}>
        <span className={s["slot-card-grid"]} aria-hidden />
        <span className={s["slot-card-icon"]} aria-hidden>
          {sym.icon}
        </span>
      </div>
      <div className={s["slot-card-text"]}>
        <span className={s["slot-card-kind"]}>{sym.kind === "prep" ? "战前准备" : "战斗"}</span>
        <strong className={s["slot-card-title"]}>{sym.title}</strong>
        <p className={s["slot-card-desc"]}>{sym.desc}</p>
        {tags.length > 0 && (
          <span className={s["slot-tags"]}>
            {tags.map((t) => (
              <em key={t} className={s["slot-tag"]}>
                {t}
              </em>
            ))}
          </span>
        )}
        {/* 效果已按现有引擎降级 —— 明说, 别让玩家以为设计本来如此。 */}
        {detailed && sym.degraded && <span className={s["slot-degraded"]}>效果已降级</span>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 一条转轮
// ---------------------------------------------------------------------------
// 滚动中: 卡带整体匀速上移, 一个周期正好走完 order 一遍, 用**负的 animation-delay**
//   把相位偏移做出来(等价于「这条轮子已经先转了 offsetMs」)。
// ⚠ 位移公式必须与 explore/slot.reelIndexAt 严格对应: 位移 = -(t + offset)/symbolMs × CELL,
//   定格线在窗口**正中央**(靠 .slot-strip 的 top 偏移把第 0 张摆到中线)。
//   两边错开半个单元, 玩家就会觉得「明明停在这张却给了另一张」。
// 定住后: 换成静态渲染, 把定住的卡摆在中央 —— 不靠暂停动画, 那会残留亚像素误差。
// 三选一时(picking): 只留中间那一张, 窗口收到一张卡高, 卡面放大成可点的按钮。
function Reel({
  slot,
  index,
  spinning,
  symbolMs,
  picking,
  chosenIndex,
  onPick,
}: {
  slot: SlotState;
  index: number;
  spinning: boolean;
  symbolMs: number;
  picking: boolean;
  chosenIndex: number | null;
  onPick: (index: number, e: MouseEvent<HTMLButtonElement>) => void;
}) {
  const reel = slot.reels[index];
  const n = reel.order.length;
  const stoppedId = slot.stopped[index];
  const byId = (id: string) => slot.symbols.find((x) => x.id === id);

  // ── 三选一: 原地放大, 直接点卡面 ──
  // ★ 「选一张再按确认」多出来的那一下没有任何决策含量, 只会把「执行」从卡面上挪走。
  if (picking && stoppedId != null) {
    const sym = byId(stoppedId);
    // chosenIndex 非空 = 已经选完、正在等过场幕布 —— 选中的那张留亮, 其余两张压暗。
    const mark = chosenIndex == null ? "" : chosenIndex === index ? " is-chosen" : " is-dimmed";
    return (
      <div className={cx(s["slot-reel"], s["is-picking"], mark && s[mark.trim()])}>
        <button className={s["slot-pick"]} type="button" onClick={(e) => onPick(index, e)}>
          <SlotCard sym={sym} detailed />
        </button>
      </div>
    );
  }

  if (stoppedId != null) {
    const at = reel.order.indexOf(stoppedId);
    // 前后各留一张, 让「定住的这一张」在视觉上仍然处在一条带子中间, 而不是凭空浮着。
    const window = [-1, 0, 1].map((d) => reel.order[(at + d + n) % n]);
    return (
      <div className={cx(s["slot-reel"], s["is-stopped"])}>
        <div className={s["slot-strip"]}>
          {window.map((id, i) => (
            <div
              key={`${id}-${i}`}
              className={cx(s["slot-cell"], i === 1 && s["is-hit"])}
            >
              <SlotCard sym={byId(id)} detailed={false} />
            </div>
          ))}
        </div>
        <div className={s["slot-marker"]} aria-hidden />
      </div>
    );
  }

  // 带子渲染两遍 —— 走完第一遍时接上第二遍的同一位置, 循环处看不见接缝。
  const strip = [...reel.order, ...reel.order];
  return (
    <div className={s["slot-reel"]}>
      <div
        className={cx(s["slot-strip"], s["is-spinning"], !spinning && s["is-paused"])}
        style={
          {
            "--slot-n": n,
            animationDuration: `${n * symbolMs}ms`,
            animationDelay: `${-reel.offsetMs}ms`,
          } as CSSProperties
        }
      >
        {strip.map((id, i) => (
          <div key={`${id}-${i}`} className={s["slot-cell"]}>
            <SlotCard sym={byId(id)} detailed={false} />
          </div>
        ))}
      </div>
      <div className={s["slot-marker"]} aria-hidden />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 停止摇杆
// ---------------------------------------------------------------------------
// ★ **按下的瞬间就判定**(pointerDown), 下压回弹动画是纯表演, 不参与判定 ——
//   §2.4.3 的「勉强可读」靠的是 ±60ms 的按键精度, 任何「拖到底才算数」的交互
//   都会引入 200ms+ 的不可控延迟, 当场把这一关退化成纯抽奖。
function Lever({
  disabled,
  pressedKey,
  stoppedCount,
  reelCount,
  onPull,
}: {
  disabled: boolean;
  pressedKey: number; // 每次触发 +1: 用 key 重挂 DOM 来重放一次性动画, 比清 class 再置回可靠
  stoppedCount: number;
  reelCount: number;
  onPull: () => void;
}) {
  return (
    <aside className={cx(s["slot-lever"], disabled && s["is-done"])}>
      <div className={s["slot-lever-rail"]} aria-hidden />
      <button
        className={s["slot-lever-hit"]}
        type="button"
        disabled={disabled}
        // ⚠ 用 pointerDown 而不是 click: click 要等抬手, 那一段是玩家控制不了的延迟。
        onPointerDown={onPull}
        aria-label="拉下摇杆停止转轮"
      >
        <span
          key={pressedKey}
          className={cx(s["slot-lever-arm"], pressedKey > 0 && s["is-pulled"])}
          aria-hidden
        >
          <span className={s["slot-lever-knob"]} />
        </span>
      </button>
      <div className={s["slot-lever-base"]}>
        <span className={s["slot-lever-pips"]} aria-hidden>
          {Array.from({ length: reelCount }, (_, i) => (
            <i
              key={i}
              className={cx(s["slot-lever-pip"], i < stoppedCount && s["is-on"])}
            />
          ))}
        </span>
        <span className={s["slot-lever-label"]}>{disabled ? "已定住" : "拉下停止"}</span>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// 主体
// ---------------------------------------------------------------------------
export function SlotReels({ onEnterBattle }: { onEnterBattle: (e: MouseEvent<HTMLButtonElement>) => void }) {
  const session = useExploreStore((s) => s.session);
  const stopReel = useExploreStore((s) => s.stopReel);
  const chooseSlotCard = useExploreStore((s) => s.chooseSlotCard);
  const retreatNow = useExploreStore((s) => s.retreatNow);

  const phase = session?.phase;
  const slot = session?.slot ?? null;
  const spinning = phase === "slotSpinning";

  // 滚动的起始时刻。★ 用 rAF 而不是 effect 的同步赋值: CSS 动画是在下一帧才真正开始跑的,
  //   同步取 now() 会让逻辑判定比画面早整整一帧。
  const startedAt = useRef(0);
  const [ready, setReady] = useState(false);
  const [pullCount, setPullCount] = useState(0); // 只用来重放摇杆动画
  // ★ 选完卡之后继续留在画面上, 直到本页被过场整体卸载。
  //   会话在 chooseSlotCard 里当场就变成 inBattle, 但屏幕**还没切** ——
  //   ScreenTransition 的裂纹幕布是压在旧界面(仍是 explore)上播完再 swap 的
  //   (见 ScreenTransition.tsx:129 那颗 BATTLE_RIPPLE_START_MS 定时器)。
  //   若这里按 phase 立刻返回 null, 玩家会看到老虎机先消失、露出底下的路由图, 再碎屏。
  const [linger, setLinger] = useState(false);
  useEffect(() => {
    if (!spinning) return;
    setReady(false);
    const id = requestAnimationFrame((t) => {
      startedAt.current = t;
      setReady(true);
    });
    return () => cancelAnimationFrame(id);
    // slot.round 进依赖: 换轮时要重新对表。
  }, [spinning, slot?.round]);

  const onStop = useCallback(() => {
    if (!ready) return;
    // ★ 先取时刻再做别的: 中间插任何一句都是在往判定里掺自己的执行耗时。
    stopReel(performance.now() - startedAt.current);
    setPullCount((x) => x + 1);
  }, [ready, stopReel]);

  // 三选一 = 直接执行。★ 只有会话真的走进 inBattle 才切界面 —— 与披露页原来那颗按钮同一条护栏。
  const pickAndFight = useCallback(
    (index: number, e: MouseEvent<HTMLButtonElement>) => {
      const next = chooseSlotCard(index);
      if (next?.phase !== "inBattle") return;
      setLinger(true); // 先钉住画面, 再让幕布在**这一页**上碎开
      onEnterBattle(e);
    },
    [chooseSlotCard, onEnterBattle],
  );

  // 兜底解钉: 万一会话没走进战斗就回到了别的探索相(撤离、回退), 不能让老虎机糊在画面上。
  useEffect(() => {
    if (linger && phase !== "inBattle") setLinger(false);
  }, [linger, phase]);

  // 空格/回车也能停 —— 这是限时反射操作, 不该逼玩家去够鼠标。
  useEffect(() => {
    if (!spinning) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.code !== "Enter") return;
      e.preventDefault();
      onStop();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [spinning, onStop]);

  // linger: 已经选完卡、屏幕还没切走的那一段, 继续渲染定格画面(见上面的说明)。
  const held = linger && phase === "inBattle";
  if (!session || !slot || (phase !== "slotSpinning" && phase !== "slotChoosing" && !held)) return null;

  const { symbolMs, reelCount, tripleBonus } = EXPLORE_RULES.slot;
  const stoppedCount = slot.stopped.filter((x) => x != null).length;
  const picking = phase === "slotChoosing" || held;

  return (
    <div
      className={cx(s["slot-stage"], picking && s["is-picking"], held && s["is-held"])}
      style={
        {
          "--slot-card-w": `${CARD_W}px`,
          "--slot-card-h": `${CARD_H}px`,
          "--slot-cell": `${CELL}px`,
          "--slot-window": `${WINDOW}px`,
        } as CSSProperties
      }
    >
      <header className={s["slot-topbar"]}>
        <span className={s["expl-kicker"]}>
          战斗签 · {BATTLE_TIER_NAME[slot.tier]}
        </span>
        <h3 className={s["slot-title"]}>
          {held ? "进入推进战斗" : spinning ? `拉下摇杆定住第 ${stoppedCount + 1} / ${reelCount} 列` : "从 3 张里选 1 张"}
        </h3>
        {/* 同花判定在第 3 列定格后立即演出, 数值直接写在界面上(§11.2)。 */}
        {picking && (
          <div className={cx(s["slot-match"], slot.matchBonus > 0 && s["is-hit"])}>
            {slot.matchBonus >= tripleBonus
              ? `三连！掉落系数 +${slot.matchBonus.toFixed(2)}`
              : slot.matchBonus > 0
                ? `对子 · 掉落系数 +${slot.matchBonus.toFixed(2)}`
                : "全不同 · 无同花加成, 但三张卡都可选"}
          </div>
        )}
      </header>

      <div className={s["slot-floor"]}>
        {slot.reels.map((_, i) => (
          <Reel
            key={i}
            slot={slot}
            index={i}
            spinning={spinning && ready}
            symbolMs={symbolMs}
            picking={picking}
            chosenIndex={held ? slot.chosenIndex : null}
            onPick={pickAndFight}
          />
        ))}
        <Lever
          disabled={picking}
          pressedKey={pullCount}
          stoppedCount={stoppedCount}
          reelCount={reelCount}
          onPull={onStop}
        />
      </div>

      <footer className={s["slot-hint"]}>
        <p className={s["slot-hint-text"]}>
          {held
            ? "战斗条件已确定。"
            : spinning
              ? "空格键同样可以停 · 瞄同一张能凑三连（+1.50），但中了就只剩一张卡可用；故意停出 3 张不同的，换的是最大的战术选择权。"
              : "无论选中战斗卡还是准备卡，本轮的推进战斗都必然发生 —— 准备卡先结算，再随机回落一张战斗卡。"}
        </p>
        {/* 全屏层遮住了四角 HUD, 而 §2.4.5 要求「3 张定住、尚未确认执行之前可以撤离」——
            所以撤离入口必须在这一层里补一颗。★ 直接读 session.canRetreat: 白名单只有一份。 */}
        <button
          className={cx(s["expl-btn"], s["is-danger"], s["slot-retreat"])}
          type="button"
          disabled={!canRetreat(session)}
          onClick={() => retreatNow()}
        >
          撤离远征
        </button>
      </footer>
    </div>
  );
}

export default SlotReels;
