// ★ 探索主界面 ★ —— 全屏「废弃楼层」场景 + 中央失真路由图, 见 探索模式设计.md。
//
// 一段的玩法只有一句话: **在几秒内记住线路, 然后选一个入口。**
// 线路会隐去, 信号自动下行、遇横线强制换线, 你只能承受落到哪个终点。
// 净化粒子(energy)是唯一的难度轴与时限, 每段固定扣 10 点 —— 越往深处走越难, 也越值钱。
//
// 与主菜单/据点/战斗同一套「1920×1080 设计画布 + 等比缩放」机制(见 ui/stage.ts):
// ★ 本文件里所有坐标/尺寸都是「设计 px」, 直接照 1920×1080 的设计稿填数。
// ⚠ 不要在画布内写 vw/vh 或按窗口宽度的 @media —— 那会让构图随分辨率漂移。
//
// ⚠ 根节点 .explore-stage 及各玻璃砖的祖先链上**永远不能挂 animation / opacity / transform /
//   filter**: 任何祖先一旦成为 backdrop root, 玻璃的 backdrop-filter 就取不到背景图。
//   入场动画一律挂叶子元素(与 ControlTerminalScene 同一条约束)。

import { useEffect, useRef, type CSSProperties } from "react";
import { getMap } from "../data";
import {
  canOpenBackpack,
  effectiveTaint,
  landedChoices,
  landedEvent,
  projectedEnergy,
} from "../explore/session";
import { EXPLORE_RULES } from "../explore/rules";
import { useExploreStore } from "../store/exploreStore";
import { useRunStore } from "../store/runStore";
import { EnergyMeter } from "./EnergyMeter";
import { HpBar } from "./HpBar";
import {
  RouteBoard,
  ROUTE_PANEL_H,
  GENERATE_MS,
  GENERATE_REDUCED_MS,
  laneCenterX,
  NODE_TOP_Y,
  routePanelWidth,
} from "./RouteBoard";
import { prefersReducedMotion } from "./transitions";
import { useStageScale } from "./stage";
import { mapArt, warmMapArt } from "./mapArt";
import "./ExploreScreen.css";

// 路由图面板在画布里的落位。宽度由 laneCount 决定(见 RouteBoard.routePanelWidth), 故只给上沿。
const BOARD_TOP = 176;

// P1 才接入的指令。**先按最终形态排好版**, 下一轮往里填实现即可 —— 位置定下来了,
// 玩家也提前知道这排东西将来是干什么的(设计文档 §6.2)。
const COMMANDS = [
  { name: "拓扑扫描", desc: "永久显示 2 条横线" },
  { name: "信号锚点", desc: "记录一次落点" },
  { name: "并行探针", desc: "预览一个入口的终点" },
] as const;

// 阶段 → 左上角那一句提示。玩家永远该知道「现在轮到我做什么」。
const PHASE_HINT: Record<string, string> = {
  generating: "新的签路正在浮现……",
  sealed: "签路已就位 —— 按下探索路线才能看见转向",
  revealing: "记住线路 —— 它马上就会消失",
  choosing: "选择一个入口",
  routing: "信号下行中……",
  landed: "决定怎么处理这个落点",
  resolving: "结算落点",
  inBattle: "战斗中",
};

export function ExploreScreen() {
  const session = useExploreStore((s) => s.session);
  const generateDone = useExploreStore((s) => s.generateDone);
  const beginReveal = useExploreStore((s) => s.beginReveal);
  const revealDone = useExploreStore((s) => s.revealDone);
  const pickEntry = useExploreStore((s) => s.pickEntry);
  const routeDone = useExploreStore((s) => s.routeDone);
  const pickOption = useExploreStore((s) => s.pickOption);
  const advance = useExploreStore((s) => s.advance);
  const enterEncounter = useRunStore((s) => s.enterEncounter);
  const finishExpedition = useRunStore((s) => s.finishExpedition);
  const retreat = useRunStore((s) => s.retreat);

  const viewportRef = useRef<HTMLDivElement>(null);
  const stageScale = useStageScale(viewportRef);

  const phase = session?.phase;
  const segment = session?.segment;
  const revealMs = session?.board?.revealDurationMs;

  // 背景图 3.4MB, 进页先拉一次(从据点过来时通常已被 warm 过, 本调用幂等)。
  useEffect(warmMapArt, []);

  // 生成演出 —— 换段时新图逐层画出来的那 2 秒。时长必须与 RouteBoard.css 的 rbGen* 三段一致,
  // 故直接用 RouteBoard 导出的常量, 两边不各写一份。同样挂 effect 以便卸载时撤表。
  useEffect(() => {
    if (phase !== "generating") return;
    const ms = prefersReducedMotion() ? GENERATE_REDUCED_MS : GENERATE_MS;
    const id = window.setTimeout(generateDone, ms);
    return () => window.clearTimeout(id);
  }, [phase, segment, generateDone]);

  // 展示计时 —— 唯一的「限时」在这里。⚠ 计时器挂 effect 而非裸 setTimeout: 进战斗/离页导致卸载时
  // 清理函数顺手撤掉, 不会有卸载后 setState。段号进依赖数组, 换段才会重新起表。
  useEffect(() => {
    if (phase !== "revealing" || revealMs == null) return;
    const id = window.setTimeout(revealDone, revealMs);
    return () => window.clearTimeout(id);
  }, [phase, segment, revealMs, revealDone]);

  // 会话自己走到终局(坐上升降机 / 段数走完 / 事件掉血团灭) → 交给 runStore 结算并切页。
  // BOSS 通关走的是战斗那条路(reward → confirmExpReport), 不经过这里。
  useEffect(() => {
    if (phase === "retreated" || phase === "wiped") finishExpedition();
  }, [phase, finishExpedition]);

  if (!session || !session.board) return null;

  const map = getMap(session.mapId);
  const board = session.board;
  const ev = landedEvent(session);
  const taint = effectiveTaint(session);
  const canBackpack = canOpenBackpack(session);
  const boardW = routePanelWidth(board.laneCount);

  // 落点浮层开着的两个阶段: 四角 HUD 轻度后退, 把注意力收拢到面板上(不加全屏遮罩)。
  const focused = session.phase === "landed" || session.phase === "resolving";
  const recede = focused ? " is-recede" : "";

  // 生成演出的 2 秒里整块画布不接受输入 —— 这一段是纯演出, 中途插手会让计时器与画面对不上。
  // ⚠ is-locked 只做 pointer-events, **不能**在 .explore-stage 上加 opacity/filter(见抬头约束)。
  const locked = session.phase === "generating";

  // 落点分支 → 应用。战斗分支会把会话打成 inBattle, 这里顺手切战斗页。
  const takeOption = (index: number) => {
    const next = pickOption(index);
    if (next?.phase === "inBattle") enterEncounter();
  };

  return (
    <div
      className="explore-viewport"
      ref={viewportRef}
      style={{ "--stage-scale": stageScale } as CSSProperties}
    >
      <div className={`screen explore explore-stage${locked ? " is-locked" : ""}`}>
        <img className="explore-bg" src={mapArt(session.mapId)} alt="" draggable={false} />
        <div className="explore-veil" aria-hidden />

        {/* ---- 左上: 区域与进度 ---- */}
        <header className={`expl-header${recede}`} style={{ left: "56px", top: "42px" }}>
          <span className="expl-kicker">区域推进</span>
          <h2 className="expl-title">{map.name}</h2>
          {/* key 挂 phase: 换阶段时这一行重挂一次, 走一遍卷入动画 —— 提示变了要被看见。 */}
          <p className="expl-sub" key={session.phase}>
            段 {session.segment} / {session.segmentCount} · {PHASE_HINT[session.phase] ?? ""}
          </p>
        </header>

        {/* ---- 右上: 读数 ---- */}
        <div className={`expl-readout${recede}`} style={{ right: "56px", top: "42px" }}>
          <div className="expl-chip expl-chip-wide">
            <EnergyMeter energy={session.energy} projected={projectedEnergy(session)} />
          </div>
          <div className="expl-chip">
            <span className="expl-chip-label">污染层数</span>
            <strong className={`expl-chip-value${taint > 0 ? " is-bad" : ""}`}>
              {taint} / {EXPLORE_RULES.taint.max}
            </strong>
            <span className="expl-chip-note">
              {taint > 0
                ? `受伤 +${Math.round(taint * EXPLORE_RULES.taint.damageTakenPerStack * 100)}%`
                : "未受污染"}
            </span>
          </div>
          <div className="expl-chip">
            <span className="expl-chip-label">居民积分</span>
            <strong className="expl-chip-value">{session.loot}</strong>
            <span className="expl-chip-note">撤离或通关才落袋</span>
          </div>
          {/* 负重是 P1(32 格背包)的读数, 位置先占住 */}
          <div className="expl-chip is-locked">
            <span className="expl-chip-label">负重</span>
            <strong className="expl-chip-value">— —</strong>
            <span className="expl-chip-note">未开放</span>
          </div>
        </div>

        {/* ---- 中央: 路由图 ---- */}
        <div
          className="expl-board"
          style={{
            left: `${(1920 - boardW) / 2}px`,
            top: `${BOARD_TOP}px`,
            width: `${boardW}px`,
            height: `${ROUTE_PANEL_H}px`,
          }}
        >
          <RouteBoard
            board={board}
            phase={session.phase}
            entryLane={session.entryLane}
            exitLane={session.exitLane}
            onPickEntry={pickEntry}
            onStartReveal={beginReveal}
            onRouteDone={routeDone}
          />
          {/* 落点 → 浮层的光柱: 从落点卡上沿向上升起, 把「是这张卡把面板叫出来的」说清楚。
              位置用 RouteBoard 导出的版式常量算, 两边不各写一份坐标。 */}
          {focused && session.exitLane != null && (
            <div
              className={`expl-beam k-${ev?.kind ?? "route"}`}
              style={{
                left: `${laneCenterX(session.exitLane) - 3}px`,
                top: "48px",
                height: `${NODE_TOP_Y - 48}px`,
              }}
              aria-hidden
            />
          )}
        </div>

        {/* ---- 左下: 队伍 ---- */}
        <div className={`expl-party${recede}`} style={{ left: "56px", bottom: "40px" }}>
          {session.party.map((p) => (
            <div key={p.charId} className={`expl-member${p.alive ? "" : " is-down"}`}>
              <span className="expl-member-emoji">{p.emoji}</span>
              <div className="expl-member-body">
                <HpBar hp={p.hp} maxHp={p.maxHp} name={p.name} flush />
              </div>
              {!p.alive && <span className="expl-member-down">阵亡</span>}
            </div>
          ))}
        </div>

        {/* ---- 右下: 指令栏 + 背包 + 撤退 ---- */}
        <div className={`expl-actions${recede}`} style={{ right: "56px", bottom: "40px" }}>
          <div className="expl-commands">
            <span className="expl-chip-label">探索指令</span>
            <div className="expl-command-row">
              {COMMANDS.map((c) => (
                <button key={c.name} className="expl-command" type="button" disabled title={c.desc}>
                  <span className="expl-command-name">{c.name}</span>
                  <span className="expl-command-flag">未开放</span>
                </button>
              ))}
            </div>
          </div>
          <div className="expl-button-row">
            {/* ⚠ 背包的开放时机是硬约束(设计文档 §6.3): 展示线路时开背包 = 无限延长观察时间。
                真正的拦截在 explore/session.canOpenBackpack, 这里只是把它的结论画出来。
                实物背包本身属于 P1, 故按钮当前恒为禁用 —— 但两种禁用的**理由不同**, 分别标出来,
                这样下一轮把背包接进来时, 阶段锁定的表现已经是对的。 */}
            <button
              className={`expl-btn is-locked${canBackpack ? "" : " is-phase-locked"}`}
              type="button"
              disabled
              title={canBackpack ? "实物背包尚未开放" : "签路浮现、展示线路与走线途中不可开背包"}
            >
              背包
              <span className="expl-btn-flag">{canBackpack ? "未开放" : "本阶段锁定"}</span>
            </button>
            <button
              className="expl-btn is-danger"
              type="button"
              // 与 session.retreat 的白名单保持一致(sealed 与 choosing 同类: 都是不限时的待决策阶段)
              disabled={
                session.phase !== "sealed" &&
                session.phase !== "choosing" &&
                session.phase !== "resolving"
              }
              onClick={() => retreat()}
            >
              撤离远征
            </button>
          </div>
        </div>

        {/* ---- 落点浮层(两段式) ----
            landed   —— 事件卡面 + 两个分支按钮。**所有事件都走这一步**, 战斗也不例外:
                        点了「迎战」才切战斗页, 玩家总有机会先看清自己落在哪张卡上。
            resolving —— 同一块面板原地换成结算摘要 + 推进按钮(key 不变 ⇒ 不重播入场)。

            ★ 没有全屏遮罩: 压暗背景会毁掉这张废弃楼层图的气质, 也会挡住刚刚亮起来的路径 ——
              而玩家此刻最想看的就是「我是怎么走到这张卡上的」。聚焦靠四角 HUD 的轻度后退
              与那道光柱来做。面板开合是从画布上方滑入(与控制终端的吊绳浮层同一套语言)。 */}
        {focused && ev && (
          <div className="expl-modal" key={`${session.segment}-${ev.id}`}>
            <section className={`expl-panel k-${ev.kind}`}>
              <span className="expl-kicker">第 {session.segment} 段 · 落点</span>
              <h3 className="expl-panel-title">{ev.title}</h3>
              <p className="expl-panel-desc">{ev.description}</p>

              {session.phase === "landed" ? (
                <div className="expl-choices">
                  {landedChoices(session).map((c, i) => (
                    <button
                      key={c.id}
                      className="expl-choice"
                      type="button"
                      onClick={() => takeOption(i)}
                    >
                      <span className="expl-choice-bar" aria-hidden />
                      <span className="expl-choice-head">
                        <span className="expl-choice-label">{c.label}</span>
                        {c.energyDelta !== 0 && (
                          <span
                            className={`expl-choice-energy ${c.energyDelta > 0 ? "up" : "down"}`}
                          >
                            粒子 {c.energyDelta > 0 ? "+" : ""}
                            {c.energyDelta}
                          </span>
                        )}
                      </span>
                      <span className="expl-choice-desc">{c.desc}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <div className="expl-notes">
                    {session.pendingNotes.length ? (
                      session.pendingNotes.map((n, i) => (
                        <span
                          key={i}
                          className="expl-note"
                          style={{ animationDelay: `${i * 40}ms` } as CSSProperties}
                        >
                          {n}
                        </span>
                      ))
                    ) : (
                      <span className="expl-note is-muted">无结算</span>
                    )}
                  </div>
                  <div className="expl-panel-foot">
                    <span className="expl-panel-cost">
                      {session.skipSegmentCost
                        ? "本段免除基础消耗"
                        : `推进消耗 −${EXPLORE_RULES.energyPerSegment} 粒子`}
                    </span>
                    <button className="expl-btn is-primary" type="button" onClick={() => advance()}>
                      {session.segment >= session.segmentCount ? "结束远征 ▸" : "继续推进 ▸"}
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
