// ★ 探索主界面 ★ —— 全屏「废弃楼层」场景 + 中央等距区域路由图, 见 探索模式设计.md。
//
// 一轮的玩法只有两句话:
//   **在 2-3 秒里记住整张图的桥接, 然后选一条入口通道。**
//   **每结算一个节点, 决定「继续推进」还是「前往下一区域」——依据是你对自己记忆的置信度。**
// 净化粒子(energy)是唯一的难度轴与时限: 每结算 1 个节点 −3, 消耗速度由玩家自己决定。
//
// 与主菜单/据点/战斗同一套「1920×1080 设计画布 + 等比缩放」机制(见 ui/stage.ts):
// ★ 本文件里所有坐标/尺寸都是「设计 px」, 直接照 1920×1080 的设计稿填数。
// ⚠ 不要在画布内写 vw/vh 或按窗口宽度的 @media —— 那会让构图随分辨率漂移。
//
// ⚠ 根节点 .explore-stage 及各玻璃砖的祖先链上**永远不能挂 animation / opacity / transform /
//   filter**: 任何祖先一旦成为 backdrop root, 玻璃的 backdrop-filter 就取不到背景图。
//   入场动画一律挂叶子元素(与 ControlTerminalScene 同一条约束)。

import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { getMap } from "../data";
import { RULES } from "../engine";
import {
  backpackSlots,
  battleTierOf,
  BATTLE_TIER_NAME,
  burdenNow,
  canOpenBackpack,
  canPushOn,
  canRetreat,
  effectiveTaint,
  landedChoices,
  landedEvent,
  projectedEnergy,
  remainingNodes,
} from "../explore/session";
import { EXPLORE_RULES } from "../explore/rules";
import { useExploreStore } from "../store/exploreStore";
import { useRunStore } from "../store/runStore";
import BackpackPanel from "./BackpackPanel";
import { EnergyMeter } from "./EnergyMeter";
import { HpBar } from "./HpBar";
import {
  RouteBoard,
  ROUTE_PANEL_H,
  ROUTE_PANEL_W,
  GENERATE_MS,
  GENERATE_REDUCED_MS,
  nodeCenter,
} from "./RouteBoard";
import SlotReels from "./SlotReels";
import { prefersReducedMotion } from "./transitions";
import { useTypewriter } from "./useTypewriter";
import { useStageScale } from "./stage";
import { mapArt, warmMapArt } from "./mapArt";
import { eventArt } from "./eventArt";
import { setTransitionOrigin } from "./transitionOrigin";
import "./ExploreScreen.css";

// 路由图面板在画布里的落位。
// ★ 等距棋盘沿「左下 → 右上」铺开, 因此包围盒的**左上角与右下角天然是空的** ——
//   节点详情侧栏就摆进左上那块空三角(见下面的 .expl-inspect 定位), 决策浮层落在下方。
//   把面板往右推是为了给左上的侧栏让位, 同时让棋盘右上角避开右上的读数列。
const BOARD_LEFT = 396;
const BOARD_TOP = 150;

// P1 才接入的指令。**先按最终形态排好版**, 下一轮往里填实现即可 —— 位置定下来了,
// 玩家也提前知道这排东西将来是干什么的(设计文档 §7.3)。
const COMMANDS = [
  { name: "拓扑扫描", desc: "永久显示 2 根桥接" },
  { name: "信号锚点", desc: "记录一次落点" },
  { name: "并行探针", desc: "预览一条通道的落点" },
  { name: "侧向跨接", desc: "落点前跨到相邻通道" },
] as const;

// 落点事件浮层的演出节拍(ms)。★ 单一真相在这里 —— 需要给 CSS 的那几个由 tsx 内联下发,
// 两边不各写一份(与 SlotReels 的几何常量、CryoScene 的 --content-delay 同一套做法)。
//
// 这段时序读作一句话: **面板落定 → 标题浮字 → 正文讲完 → 选项才就位 → 落子有回响 → 结果逐条揭晓**。
// 抵达一个落点是这个模式里唯一的叙事时刻, 值得花两三秒把它讲完; 中途不给跳过, 就是要玩家读完。
const EVENT_BEAT = {
  titleStart: 260, // 面板下滑过半(explDrop 600ms)时标题开始浮字, 早一点才不显得等
  titleChar: 45, // 标题每字间隔
  descStart: 560, // 正文起播 —— 压着面板落定的那一刻
  descCps: 34, // 正文速度(字/秒), 标点处由 useTypewriter 自己加停顿
  choiceStagger: 90, // 选项逐个浮现的间隔
  commit: 460, // 点下选项 → 真正派发 pickOption 的「判定」停顿
  noteLead: 180, // resolving: 第一条结算摘要前的留白(等选项收干净)
  noteStagger: 140, // 结算摘要逐条间隔
  noteTail: 260, // 最后一条播完到「确认」解锁之间的收尾
} as const;

// 阶段 → 左上角那一句提示。玩家永远该知道「现在轮到我做什么」。
const PHASE_HINT: Record<string, string> = {
  generating: "新的区域正在浮现……",
  sealed: "读完 20 个节点 —— 按下探索路线才能看见桥接",
  revealing: "记住桥接 —— 它马上就会消失",
  choosingEntry: "选择一条入口通道（本轮唯一一次选择）",
  advancing: "信号推进中……",
  landed: "决定怎么处理这个落点",
  resolving: "结算落点",
  atNode: "继续推进, 还是前往下一区域？",
  leaving: "正在离开这片区域……",
  routeDisclosure: "本轮线路披露",
  slotSpinning: "按 3 次暂停 —— 定住 3 个槽位",
  slotChoosing: "从 3 张里选 1 张 —— 战斗必然发生",
  inBattle: "推进战斗中",
};

export function ExploreScreen() {
  const session = useExploreStore((s) => s.session);
  const generateDone = useExploreStore((s) => s.generateDone);
  const beginReveal = useExploreStore((s) => s.beginReveal);
  const revealDone = useExploreStore((s) => s.revealDone);
  const pickEntry = useExploreStore((s) => s.pickEntry);
  const arrive = useExploreStore((s) => s.arrive);
  const pickOption = useExploreStore((s) => s.pickOption);
  const confirmNode = useExploreStore((s) => s.confirmNode);
  const pushOn = useExploreStore((s) => s.pushOn);
  const leaveRegion = useExploreStore((s) => s.leaveRegion);
  const leaveDone = useExploreStore((s) => s.leaveDone);
  const startSlot = useExploreStore((s) => s.startSlot);
  const enterEncounter = useRunStore((s) => s.enterEncounter);
  const finishExpedition = useRunStore((s) => s.finishExpedition);
  const retreat = useRunStore((s) => s.retreat);

  const viewportRef = useRef<HTMLDivElement>(null);
  const stageScale = useStageScale(viewportRef);
  const [bagOpen, setBagOpen] = useState(false);
  // 侧栏当前展示的是哪个节点。悬停/聚焦即换, 移开则回落到「当前落点」。
  const [hovered, setHovered] = useState<{ seg: number; lane: number } | null>(null);
  // 已点下但还没派发出去的那一支。★ 这个空档就是「落子的回响」——
  //   按钮先演完(竖条锁死 + 扫光掠过), 结算才发生; 少了它, 点击就只是一次表单提交。
  const [committing, setCommitting] = useState<number | null>(null);
  const commitTimer = useRef<number | null>(null);
  // 结算摘要是否已逐条播完 —— 播完之前「确认」按钮不接受点击, 否则玩家一路连点就什么都没看见。
  const [notesDone, setNotesDone] = useState(false);

  const phase = session?.phase;
  const round = session?.round;
  const revealMs = session?.board?.revealDurationMs;

  // 背景图 3.4MB, 进页先拉一次(从据点过来时通常已被 warm 过, 本调用幂等)。
  useEffect(warmMapArt, []);

  // 浮现演出 —— 换轮时新图逐段画出来的那 2 秒。时长必须与 RouteBoard.css 的 rbGen* 一致,
  // 故直接用 RouteBoard 导出的常量, 两边不各写一份。同样挂 effect 以便卸载时撤表。
  useEffect(() => {
    if (phase !== "generating") return;
    const ms = prefersReducedMotion() ? GENERATE_REDUCED_MS : GENERATE_MS;
    const id = window.setTimeout(generateDone, ms);
    return () => window.clearTimeout(id);
  }, [phase, round, generateDone]);

  // 揭示计时 —— 唯一的「限时」在这里。⚠ 计时器挂 effect 而非裸 setTimeout: 进战斗/离页导致卸载时
  // 清理函数顺手撤掉, 不会有卸载后 setState。轮号进依赖数组, 换轮才会重新起表。
  useEffect(() => {
    if (phase !== "revealing" || revealMs == null) return;
    const id = window.setTimeout(revealDone, revealMs);
    return () => window.clearTimeout(id);
  }, [phase, round, revealMs, revealDone]);

  // 会话自己走到终局(坐上升降机 / 主动撤离 / 事件掉血团灭) → 交给 runStore 结算并切页。
  // BOSS 通关走的是战斗那条路(reward → confirmExpReport), 不经过这里。
  useEffect(() => {
    if (phase === "retreated" || phase === "wiped") finishExpedition();
  }, [phase, finishExpedition]);

  // 阶段一旦走出白名单(比如按下「探索路线」), 背包必须自己关掉 ——
  // 硬约束在 store 层, 但面板留在屏幕上会让玩家以为还能翻。
  const bagAllowed = session ? canOpenBackpack(session) : false;
  useEffect(() => {
    if (!bagAllowed) setBagOpen(false);
  }, [bagAllowed]);

  const onHoverNode = useCallback((at: { seg: number; lane: number } | null) => {
    setHovered(at);
  }, []);

  const onArrive = useCallback(() => {
    arrive();
  }, [arrive]);

  // ⚠ 与 onArrive 同理包一层 useCallback: RouteBoard 的离场计时器把它放进依赖数组,
  //   每次渲染换一个新函数会让那个 setTimeout 不断重排, 行走永远走不完。
  const onLeaveDone = useCallback(() => {
    leaveDone();
  }, [leaveDone]);

  // ---- 落点浮层的演出时序 ----
  // ⚠ 这三个 hook 必须待在下面那句早退**之前**: 会话还没建好时也得照常调用, 否则 hook 顺序会变。
  const landedEv = session?.board ? landedEvent(session) : null;
  const evDesc = landedEv?.description ?? "";
  // 正文逐字。text 一变就自动重置游标 ⇒ 换事件自然重播, 这里不需要额外的 key。
  const desc = useTypewriter(evDesc, EVENT_BEAT.descStart, EVENT_BEAT.descCps);

  // 走出 landed(结算已派发, 或整轮被别的路径打断)就把「已点下」清掉,
  // 免得下一个落点一进来两个按钮就是暗的。
  useEffect(() => {
    if (phase !== "landed") setCommitting(null);
  }, [phase]);
  useEffect(() => () => window.clearTimeout(commitTimer.current ?? undefined), []);

  // 结算摘要的揭晓计时: 最后一条浮起来之后才给「确认」解锁。
  const noteCount = session?.pendingNotes.length ?? 0;
  useEffect(() => {
    if (phase !== "resolving") return;
    if (prefersReducedMotion()) {
      setNotesDone(true);
      return;
    }
    setNotesDone(false);
    const ms =
      EVENT_BEAT.noteLead + Math.max(1, noteCount) * EVENT_BEAT.noteStagger + EVENT_BEAT.noteTail;
    const id = window.setTimeout(() => setNotesDone(true), ms);
    return () => window.clearTimeout(id);
  }, [phase, noteCount]);

  if (!session || !session.board) return null;

  const map = getMap(session.mapId);
  const board = session.board;
  const ev = landedEv;
  const taint = effectiveTaint(session);
  const canBackpack = canOpenBackpack(session);
  const usedSlots = backpackSlots(session);
  const burden = Math.round(burdenNow(session));
  // 背包装不下的东西必须当场取舍(设计文档 §6.4) —— 面板强制打开, 且关不掉。
  const mustReplace = session.pendingPickup.length > 0;

  // 落点浮层开着的两个阶段: 四角 HUD 轻度后退, 把注意力收拢到面板上(不加全屏遮罩)。
  const focused = session.phase === "landed" || session.phase === "resolving";
  const recede = focused ? " is-recede" : "";

  // 浮现演出的 2 秒里整块画布不接受输入 —— 这一段是纯演出, 中途插手会让计时器与画面对不上。
  // ⚠ is-locked 只做 pointer-events, **不能**在 .explore-stage 上加 opacity/filter(见抬头约束)。
  // ★ 离场行走(leaving)同样锁死: 那几秒棋子正沿线路走向本轮终点, 中途按撤离/开背包
  //   会让画面与阶段机各说各话(session 层对这一相也一律不放行)。
  const locked = session.phase === "generating" || session.phase === "leaving";

  // 侧栏展示: 优先悬停的那个, 其次是当前落点。
  const shownNode = hovered
    ? board.nodes[hovered.seg]?.[hovered.lane]
    : session.currentSegment > 0
      ? ev
      : null;
  const shownSeg = hovered ? hovered.seg : session.currentSegment - 1;

  const tier = battleTierOf(session.round);
  const left = remainingNodes(session);
  // 「继续推进」的后果预告(§11.2): 下一段有几根桥接 —— 越深越不确定, 这是决策的全部依据。
  const nextBridges = board.segments[session.currentSegment]?.bridges.length ?? 0;

  // 落点分支 → 应用。
  // ★ 不立刻派发: 先让被点中的那一支演完「落子」(竖条锁死 + 扫光), 另一支同时暗下去,
  //   commit 拍之后才把结算算进会话。这段停顿就是玩家读到的「我做了一个决定」。
  // ⚠ 演出中不接受第二次点击 —— 否则连点两个分支会派发两次结算。
  const takeOption = (index: number) => {
    if (committing != null) return;
    if (prefersReducedMotion()) {
      pickOption(index);
      return;
    }
    setCommitting(index);
    commitTimer.current = window.setTimeout(() => {
      commitTimer.current = null;
      pickOption(index);
    }, EVENT_BEAT.commit);
  };

  // 战斗签三选一 → 推进战斗。战斗建局在 runStore(只有它认识 battleStore)。
  // ★ 会话的推进由 SlotReels 里的 chooseSlotCard 完成, 这里只负责「幕布 + 切页」。
  const goBattle = (event: MouseEvent<HTMLButtonElement>) => {
    // 键盘触发的 click 没有可用鼠标坐标(detail 为 0)，幕布会安全回退到视口中心。
    if (event.detail !== 0) setTransitionOrigin(event.clientX, event.clientY);
    enterEncounter();
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
            第 {session.round} / {session.roundCount} 轮 · 推进段 {session.currentSegment} /{" "}
            {EXPLORE_RULES.segmentsPerRound} · {PHASE_HINT[session.phase] ?? ""}
          </p>
          <p className="expl-sub2">本轮推进战斗：{BATTLE_TIER_NAME[tier]}</p>
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
          {/* 负重(设计文档 §6.2): 每占 1 格, 全队命中/暴击/闪避各 −1 个百分点。 */}
          <div className="expl-chip">
            <span className="expl-chip-label">负重</span>
            <strong className={`expl-chip-value${usedSlots > 0 ? " is-bad" : ""}`}>
              {usedSlots} / {RULES.burden.backpackSlots}
            </strong>
            <span className="expl-chip-note">
              {usedSlots > 0 ? `命中/暴击/闪避 −${burden}%` : "空手上路"}
            </span>
          </div>
        </div>

        {/* ---- 中央: 等距路由图 ---- */}
        <div
          className="expl-board"
          style={{
            left: `${BOARD_LEFT}px`,
            top: `${BOARD_TOP}px`,
            width: `${ROUTE_PANEL_W}px`,
            height: `${ROUTE_PANEL_H}px`,
          }}
        >
          <RouteBoard
            board={board}
            phase={session.phase}
            entryLane={session.entryLane}
            currentLane={session.currentLane}
            currentSegment={session.currentSegment}
            onPickEntry={pickEntry}
            onStartReveal={beginReveal}
            onArrive={onArrive}
            onLeaveDone={onLeaveDone}
            onHoverNode={onHoverNode}
          />
          {/* 落点 → 浮层的光柱: 从落点瓦片向上升起, 把「是这个节点把面板叫出来的」说清楚。
              位置用 RouteBoard 导出的版式常量算, 两边不各写一份坐标。 */}
          {focused && session.currentLane != null && session.currentSegment > 0 && (
            <div
              className={`expl-beam k-${ev?.kind ?? "route"}`}
              style={{
                left: `${nodeCenter(session.currentSegment - 1, session.currentLane).x - 3}px`,
                top: `${nodeCenter(session.currentSegment - 1, session.currentLane).y}px`,
                height: `${ROUTE_PANEL_H - nodeCenter(session.currentSegment - 1, session.currentLane).y}px`,
              }}
              aria-hidden
            />
          )}
        </div>

        {/* ---- 左上: 节点详情侧栏 ----
            20 个节点的瓦片上放不下文字, 所以按战棋的标准做法: 图标常驻、详情进侧栏(§11.1)。
            ★ 落在标题下方的那块空地 —— 等距棋盘的包围盒左上角本来就是空的, 不会挡住任何瓦片。 */}
        <aside
          className={`expl-inspect${recede}`}
          style={{ left: "56px", top: "214px", width: "320px" }}
        >
          {shownNode ? (
            <div className={`expl-inspect-body k-${shownNode.kind}`} key={shownNode.id + shownSeg}>
              <span className="expl-kicker">第 {shownSeg + 1} 推进段 · 节点</span>
              <h3 className="expl-inspect-title">{shownNode.title}</h3>
              <div className="expl-inspect-tags">
                {shownNode.energyDelta !== 0 && (
                  <span className={`expl-tag ${shownNode.energyDelta > 0 ? "up" : "down"}`}>
                    额外粒子 {shownNode.energyDelta > 0 ? "+" : ""}
                    {shownNode.energyDelta}
                  </span>
                )}
                {shownNode.risk && (
                  <span className={`expl-tag ${shownNode.risk}`}>
                    {shownNode.risk === "negative" ? "纯损耗" : "高风险"}
                  </span>
                )}
              </div>
              <p className="expl-inspect-desc">{shownNode.description}</p>
              {shownNode.choices?.map((c) => (
                <p key={c.id} className="expl-inspect-choice">
                  <span className="expl-inspect-label">{c.label}</span>
                  <span className="expl-inspect-cost">{c.desc}</span>
                </p>
              ))}
            </div>
          ) : (
            <div className="expl-inspect-body is-empty">
              <span className="expl-kicker">节点详情</span>
              <p className="expl-inspect-desc">
                把光标放到任意一个节点图标上 —— 20 个节点全程可见, 这是你决定走哪条通道的全部依据。
              </p>
            </div>
          )}
        </aside>

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
            <span className="expl-chip-label">
              探索指令 · 侧向跨接 {session.lateralShiftsLeft}/1
            </span>
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
            {/* ⚠ 背包的开放时机是硬约束(设计文档 §6.3): 揭示桥接时开背包 = 无限延长观察时间。
                真正的拦截在 explore/session.canOpenBackpack, 这里只是把它的结论画出来。 */}
            <button
              className={`expl-btn${canBackpack ? "" : " is-locked is-phase-locked"}`}
              type="button"
              disabled={!canBackpack}
              title={canBackpack ? undefined : "区域浮现、桥接揭示与信号推进途中不可开背包"}
              onClick={() => setBagOpen((v) => !v)}
            >
              背包
              <span className="expl-btn-flag">
                {canBackpack ? `${usedSlots}/${RULES.burden.backpackSlots}` : "本阶段锁定"}
              </span>
            </button>
            <button
              className="expl-btn is-danger"
              type="button"
              // ★ 直接读 session.canRetreat —— 白名单只有一份, 各写一份迟早对不上
              disabled={!canRetreat(session)}
              onClick={() => retreat()}
            >
              撤离远征
            </button>
          </div>
        </div>

        {/* ---- 选入口阶段的「直接推进」---- 本轮 0 个节点, 设计文档 §1.2 明确允许。 */}
        {session.phase === "choosingEntry" && (
          <div className="expl-skip">
            <button className="expl-btn" type="button" onClick={() => leaveRegion()}>
              直接前往下一区域 ▸
              <span className="expl-btn-flag">本轮不探索任何节点</span>
            </button>
          </div>
        )}

        {/* ---- 落点浮层(两段式) ----
            landed   —— 事件卡面 + 两个分支按钮。**抵达 ≠ 结算**: 落点已定、效果一件都没生效。
            resolving —— 同一块面板原地换成结算摘要 + 确认按钮(key 不变 ⇒ 不重播入场)。

            ★ 没有全屏遮罩: 压暗背景会毁掉这张废弃楼层图的气质, 也会挡住刚刚亮起来的路径 ——
              而玩家此刻最想看的就是「我是怎么走到这个节点上的」(§11.2)。 */}
        {focused && ev && (
          <div className="expl-modal" key={`${session.round}-${session.currentSegment}-${ev.id}`}>
            <section className={`expl-panel k-${ev.kind}`}>
              <div className="expl-panel-art" aria-hidden="true">
                <img className="expl-panel-image" src={eventArt(ev.kind)} alt="" />
                <div className="expl-panel-art-grid" />
                <span className="expl-panel-art-code">EVT / {ev.kind.toUpperCase()}</span>
                <span className="expl-panel-art-mark">◆</span>
              </div>
              <div className="expl-panel-content">
                <div className="expl-panel-heading">
                  <span className="expl-kicker">
                    第 {session.round} 轮 · 第 {session.currentSegment} 推进段 · 落点
                  </span>
                  {/* key 挂 phase: 「待处理 → 已结算」这一跳必须被看见, 重挂一次走遍浮起动画。 */}
                  <span
                    className={`expl-panel-status${session.phase === "resolving" ? " is-settled" : ""}`}
                    key={session.phase}
                  >
                    {session.phase === "landed" ? "待处理" : "已结算"}
                  </span>
                </div>
                {/* 标题逐字浮起: 打字机那套用在标题上太慢, 逐字**淡入**才有「名字被念出来」的分量。
                    ⚠ 减弱动态效果时不拆 span —— 一堆 inline-block 会让标点的行内断行规则失效。 */}
                <h3 className="expl-panel-title">
                  {prefersReducedMotion()
                    ? ev.title
                    : Array.from(ev.title).map((ch, i) => (
                        <span
                          key={i}
                          className="expl-title-char"
                          style={
                            {
                              animationDelay: `${EVENT_BEAT.titleStart + i * EVENT_BEAT.titleChar}ms`,
                            } as CSSProperties
                          }
                        >
                          {ch === " " ? " " : ch}
                        </span>
                      ))}
                </h3>
                {/* 正文逐字。aria-label 给读屏一次性的全文 —— 无障碍不该被演出拖着走。 */}
                <p className="expl-panel-desc" aria-label={ev.description}>
                  <span aria-hidden>{desc.shown}</span>
                  {!desc.done && <span className="expl-caret" aria-hidden />}
                </p>

                {session.phase === "landed" ? (
                  // 正文讲完之前选项只是「在那儿」而不可点(is-armed 才开闸):
                  // 让玩家先读完代价再做选择, 这是这段演出想换来的东西。
                  <div
                    className={`expl-choices${desc.done ? " is-armed" : ""}`}
                    style={
                      { "--choice-stagger": `${EVENT_BEAT.choiceStagger}ms` } as CSSProperties
                    }
                  >
                    {landedChoices(session).map((c, i) => {
                      // ★ 按钮上写的是这一支的粒子净变化, 不让玩家自己做加法。
                      const base = session.freeNodes > 0 ? 0 : -EXPLORE_RULES.energyPerNode;
                      const delta = base + c.energyDelta;
                      const state =
                        committing == null ? "" : committing === i ? " is-chosen" : " is-dimmed";
                      return (
                        <button
                          key={c.id}
                          className={`expl-choice${state}`}
                          type="button"
                          disabled={!desc.done || committing != null}
                          style={{ "--i": i } as CSSProperties}
                          onClick={() => takeOption(i)}
                        >
                          <span className="expl-choice-bar" aria-hidden />
                          <span className="expl-choice-head">
                            <span className="expl-choice-label">{c.label}</span>
                            <span className={`expl-choice-energy ${delta >= 0 ? "up" : "down"}`}>
                              粒子 {delta > 0 ? "+" : delta < 0 ? "−" : ""}
                              {Math.abs(delta)}
                            </span>
                          </span>
                          <span className="expl-choice-desc">{c.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <div className="expl-notes">
                      {session.pendingNotes.length ? (
                        session.pendingNotes.map((n, i) => (
                          <span
                            key={i}
                            className="expl-note"
                            style={
                              {
                                animationDelay: `${EVENT_BEAT.noteLead + i * EVENT_BEAT.noteStagger}ms`,
                              } as CSSProperties
                            }
                          >
                            {n}
                          </span>
                        ))
                      ) : (
                        <span
                          className="expl-note is-muted"
                          style={
                            { animationDelay: `${EVENT_BEAT.noteLead}ms` } as CSSProperties
                          }
                        >
                          无结算
                        </span>
                      )}
                    </div>
                    {/* 结算摘要还在逐条浮起时「确认」不接受点击(notesDone) ——
                        否则玩家一路连点, 这一节点到底发生了什么就永远没被看见。 */}
                    <div className="expl-panel-foot">
                      <span className="expl-panel-cost">
                        {mustReplace ? "先在背包里处理完拿不下的东西" : "结算完毕"}
                      </span>
                      <button
                        className="expl-btn is-primary expl-confirm"
                        type="button"
                        disabled={mustReplace || !notesDone}
                        style={
                          {
                            animationDelay: `${
                              EVENT_BEAT.noteLead +
                              Math.max(1, session.pendingNotes.length) * EVENT_BEAT.noteStagger
                            }ms`,
                          } as CSSProperties
                        }
                        onClick={() => confirmNode()}
                      >
                        确认 ▸
                      </button>
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ---- 节点决策(atNode) ----
            ★ 两个按钮必须并排、等重、都带后果预告(§11.2) —— 这是玩家判断
              「我对这条线还有多少信心」的全部界面依据。 */}
        {session.phase === "atNode" && (
          <div className="expl-modal">
            <section className="expl-panel expl-panel-decide">
              <span className="expl-kicker">
                第 {session.currentSegment} / {EXPLORE_RULES.segmentsPerRound} 推进段已结算
              </span>
              <div className="expl-decide-row">
                <button
                  className="expl-choice"
                  type="button"
                  disabled={!canPushOn(session)}
                  style={{ "--i": 0 } as CSSProperties}
                  onClick={() => pushOn()}
                >
                  <span className="expl-choice-bar" aria-hidden />
                  <span className="expl-choice-head">
                    <span className="expl-choice-label">继续推进</span>
                    <span className="expl-choice-energy down">
                      粒子 −{EXPLORE_RULES.energyPerNode}
                    </span>
                  </span>
                  <span className="expl-choice-desc">
                    {canPushOn(session)
                      ? `进入第 ${session.currentSegment + 1} 推进段 · 该段有 ${nextBridges} 根桥接 —— 越深越不确定`
                      : "已走满 4 个推进段, 本轮到此为止"}
                  </span>
                </button>
                <button
                  className="expl-choice"
                  type="button"
                  style={{ "--i": 1 } as CSSProperties}
                  onClick={() => leaveRegion()}
                >
                  <span className="expl-choice-bar" aria-hidden />
                  <span className="expl-choice-head">
                    <span className="expl-choice-label">前往下一区域</span>
                    <span className="expl-choice-energy">{BATTLE_TIER_NAME[tier]}</span>
                  </span>
                  <span className="expl-choice-desc">
                    {left > 0 ? `放弃本轮剩余 ${left} 个节点, 直接打推进战斗` : "进入本轮的推进战斗"}
                  </span>
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ---- 本轮线路披露(routeDisclosure) ----
            ★ 这是**教学页而不是过场**(§11.2): 没有披露, 玩家分不清「我记错了 / 我压根没记 /
              这张图本来就记不住」。全图桥接与实际路径由 RouteBoard 画, 这里只放结论与出口。 */}
        {session.phase === "routeDisclosure" && (
          <div className="expl-modal">
            <section className="expl-panel expl-panel-decide">
              <span className="expl-kicker">第 {session.round} 轮 · 线路披露</span>
              <h3 className="expl-panel-title">这就是本轮的完整桥接</h3>
              <p className="expl-panel-desc">
                亮起来的是你实际走过的路径, 压暗的是你放弃的节点。
                {session.entryLane != null
                  ? `你从 ${"ABCDE"[session.entryLane]} 通道进入, 推进了 ${session.currentSegment} 个节点。`
                  : "你没有进入这片区域。"}
              </p>
              <div className="expl-panel-foot">
                <span className="expl-panel-cost">
                  下一关：{BATTLE_TIER_NAME[tier]} 的战斗签 · 战斗只掉物品, 废料要带回据点才换积分
                </span>
                <button className="expl-btn is-primary" type="button" onClick={() => startSlot()}>
                  抽取战斗签 ▸
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ---- 战斗签老虎机(slotSpinning / slotChoosing) ----
            每轮的第二个关卡。动词与路由图刻意不同 —— 那边考记忆, 这边考时机(§2.4)。
            会话推进在 SlotReels 内部完成, 这里只把「切到战斗界面」这一步传进去。 */}
        <SlotReels onEnterBattle={goBattle} />

        {/* ---- 背包面板 ----
            替换模式(pendingPickup 非空)时强制打开: 「拿不拿得下」这个决定必须当场做完,
            让它跨节点就等于把决定悄悄取消掉了(session.confirmNode 也会拦一次)。 */}
        {(bagOpen || mustReplace) && canBackpack && (
          <BackpackPanel onClose={() => setBagOpen(false)} />
        )}
      </div>
    </div>
  );
}
