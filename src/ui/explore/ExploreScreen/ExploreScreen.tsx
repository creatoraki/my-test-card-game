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

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { RULES } from "@/engine";
import {
  backpackSlots,
  battleTierOf,
  BATTLE_TIER_NAME,
  canOpenBackpack,
  canPushOn,
  canRetreat,
  landedChoices,
  landedEvent,
  landedShop,
  npcChoices,
  projectedEnergy,
} from "@/explore/session";
import { getItemDef, getNpcEvent } from "@/data";
import { countByItemId } from "@/items/inventory";
import { useExploreStore } from "@/store/exploreStore";
import { useRunStore } from "@/store/runStore";
import { useTownStore } from "@/store/townStore";
import BackpackPanel from "@/ui/explore/BackpackPanel";
import BackpackBar from "@/ui/explore/BackpackBar";
import ExpDropFx from "@/ui/explore/ExpDropFx";
import LootPickup from "@/ui/explore/LootPickup";
import MerchantPanel from "@/ui/explore/MerchantPanel";
import RewardOverlay from "@/ui/explore/RewardOverlay";
import { EnergyLamp } from "@/ui/explore/EnergyLamp";
import NodeTip from "@/ui/explore/NodeTip";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import { HpBar } from "@/ui/common/HpBar";
import { PollutionMeter } from "@/ui/common/PollutionMeter";
import ItemSlot from "@/ui/common/item/ItemSlot";
import {
  RouteBoard,
  ROUTE_PANEL_H,
  ROUTE_PANEL_W,
  GENERATE_MS,
  GENERATE_REDUCED_MS,
  nodeCenter,
} from "@/ui/explore/RouteBoard";
import SlotReels from "@/ui/explore/SlotReels";
import { prefersReducedMotion } from "@/ui/app/transitions";
import { useTypewriter } from "@/ui/hooks/useTypewriter";
import { useStageScale } from "@/ui/hooks/stage";
import { mapArt, warmMapArt } from "@/ui/art/mapArt";
import { eventArt } from "@/ui/art/eventArt";
import { setTransitionOrigin } from "@/ui/app/transitionOrigin";
import { cx } from "@/ui/common/cx";
import s from "./ExploreScreen.module.css";

// 路由图面板在画布里的落位。
// ★ 等距棋盘沿「左下 → 右上」铺开, 因此包围盒的**左上角与右下角天然是空的** ——
//   节点悬浮浮卡会贴着对应瓦片出现, 决策浮层仍落在画布中央。
//   把面板往右推是为了给左上的 HUD 让位, 同时让棋盘右上角避开右上的读数列。
const BOARD_LEFT = 508;
const BOARD_TOP = 184;
const BAG_W = 640;

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
  storyLead: 180, // resolving: 第一段后续文案前的留白
  storyStagger: 260, // 后续文案逐段间隔
  noteGap: 160, // 文案播完到第一条摘要
  noteStagger: 140, // 结算摘要逐条间隔
  noteTail: 260, // 最后一条播完到「确认」解锁之间的收尾
} as const;

function narrationBeats(storyCount: number, noteCount: number) {
  const storyAt = (index: number) => EVENT_BEAT.storyLead + index * EVENT_BEAT.storyStagger;
  const notesFrom = EVENT_BEAT.storyLead + storyCount * EVENT_BEAT.storyStagger + EVENT_BEAT.noteGap;
  const noteAt = (index: number) => notesFrom + index * EVENT_BEAT.noteStagger;
  const total = noteAt(Math.max(1, noteCount) - 1) + EVENT_BEAT.noteTail;
  return { storyAt, noteAt, total };
}

export function ExploreScreen() {
  const session = useExploreStore((s) => s.session);
  const characters = useTownStore((s) => s.characters);
  const generateDone = useExploreStore((s) => s.generateDone);
  const beginReveal = useExploreStore((s) => s.beginReveal);
  const revealDone = useExploreStore((s) => s.revealDone);
  const pickEntry = useExploreStore((s) => s.pickEntry);
  const arrive = useExploreStore((s) => s.arrive);
  const buyFromShop = useExploreStore((s) => s.buyFromShop);
  const chooseEventOption = useRunStore((s) => s.chooseEventOption);
  const confirmNode = useExploreStore((s) => s.confirmNode);
  const restEat = useExploreStore((s) => s.restEat);
  const restSkip = useExploreStore((s) => s.restSkip);
  const chooseNpcOption = useExploreStore((s) => s.chooseNpcOption);
  const confirmNpc = useExploreStore((s) => s.confirmNpc);
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
  // 当前悬停的节点。浮卡只跟随悬停，不回落到当前落点。
  const [hovered, setHovered] = useState<{ seg: number; lane: number } | null>(null);
  // 已点下但还没派发出去的那一支。★ 这个空档就是「落子的回响」——
  //   按钮先演完(竖条锁死 + 扫光掠过), 结算才发生; 少了它, 点击就只是一次表单提交。
  const [committing, setCommitting] = useState<number | null>(null);
  const commitTimer = useRef<number | null>(null);
  // 结算摘要是否已逐条播完 —— 播完之前「确认」按钮不接受点击, 否则玩家一路连点就什么都没看见。
  const [narrationDone, setNarrationDone] = useState(false);
  const previousExpRef = useRef<Record<string, number>>({});
  const expSequenceRef = useRef<Record<string, number>>({});
  const expTimersRef = useRef<Record<string, number>>({});
  const [expDrops, setExpDrops] = useState<Record<string, { amount: number; sequence: number }>>({});

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
  const storyText = session?.pendingStory.join("\n\n") ?? "";
  const story = useTypewriter(storyText, 0, EVENT_BEAT.descCps);
  const descScrollRef = useRef<HTMLParagraphElement>(null);
  const descLiveRef = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const scrollBox = descScrollRef.current;
    const liveText = descLiveRef.current;
    if (!scrollBox || !liveText) return;
    scrollBox.scrollTop = Math.max(0, liveText.scrollHeight - scrollBox.clientHeight);
  }, [desc.shown, story.shown]);

  // 走出 landed(结算已派发, 或整轮被别的路径打断)就把「已点下」清掉,
  // 免得下一个落点一进来两个按钮就是暗的。
  useEffect(() => {
    if (phase !== "landed") setCommitting(null);
  }, [phase]);
  useEffect(() => () => window.clearTimeout(commitTimer.current ?? undefined), []);

  // 结算故事与摘要共用一条时间线: 全部播完之后才给「确认」解锁。
  const storyCount = session?.pendingStory.length ?? 0;
  const noteCount = session?.pendingNotes.length ?? 0;
  const beats = narrationBeats(storyCount, noteCount);
  useEffect(() => {
    if (phase !== "resolving" && phase !== "npcResolving") return;
    if (prefersReducedMotion()) {
      setNarrationDone(true);
      return;
    }
    setNarrationDone(false);
    const id = window.setTimeout(() => setNarrationDone(true), beats.total);
    return () => window.clearTimeout(id);
  }, [beats.total, phase, storyCount, noteCount]);

  useEffect(() => {
    const current = session?.pendingExp ?? {};
    const previous = previousExpRef.current;
    if (phase === "generating" && round === 1 && !Object.keys(current).length) {
      previousExpRef.current = {};
      setExpDrops({});
      return;
    }

    const nextDrops: Record<string, { amount: number; sequence: number }> = {};
    for (const [charId, total] of Object.entries(current)) {
      const gained = total - (previous[charId] ?? 0);
      if (gained <= 0) continue;
      const sequence = (expSequenceRef.current[charId] ?? 0) + 1;
      expSequenceRef.current[charId] = sequence;
      nextDrops[charId] = { amount: gained, sequence };
      window.clearTimeout(expTimersRef.current[charId]);
      expTimersRef.current[charId] = window.setTimeout(() => {
        setExpDrops((drops) => {
          if (drops[charId]?.sequence !== sequence) return drops;
          const remaining = { ...drops };
          delete remaining[charId];
          return remaining;
        });
      }, prefersReducedMotion() ? 700 : 2200);
    }
    previousExpRef.current = { ...current };
    if (Object.keys(nextDrops).length) setExpDrops((drops) => ({ ...drops, ...nextDrops }));
  }, [phase, round, session?.pendingExp]);

  useEffect(
    () => () => {
      for (const timer of Object.values(expTimersRef.current)) window.clearTimeout(timer);
    },
    [],
  );

  if (!session || !session.board) return null;

  const board = session.board;
  const ev = landedEv;
  const shop = landedShop(session);
  const merchantEvent = Boolean(ev?.services?.length && shop);
  const canBackpack = canOpenBackpack(session);
  const usedSlots = backpackSlots(session);
  // 背包装不下的东西必须当场取舍(设计文档 §6.4) —— 面板强制打开, 且关不掉。
  const mustReplace = session.pendingPickup.length > 0;
  const hasLoot = session.pendingLoot.length > 0;
  const hasPendingAction = session.pendingActions.length > 0;
  const stackedModal =
    session.phase === "landed" ||
    session.phase === "resolving" ||
    session.phase === "npcEvent" ||
    session.phase === "npcResolving";
  const narrationGate =
    session.phase === "resolving" || session.phase === "npcResolving"
      ? desc.done && story.done && narrationDone
      : true;
  const hiddenRest = ev?.hiddenRest;
  const restFood = hiddenRest
    ? session.backpack.find((stack) => stack.itemId === hiddenRest.foodItemId) ?? null
    : null;
  const npc = session.restNpcId ? getNpcEvent(session.restNpcId) : undefined;

  // 落点浮层开着的两个阶段: 四角 HUD 轻度后退, 把注意力收拢到面板上(不加全屏遮罩)。
  const focused =
    session.phase === "landed" ||
    session.phase === "resolving" ||
    session.phase === "resting" ||
    session.phase === "npcEvent" ||
    session.phase === "npcResolving";
  const eventModalOpen = session.phase === "landed" || session.phase === "resolving";
  const recede = focused ? s["is-recede"] : undefined;

  // 浮现演出的 2 秒里整块画布不接受输入 —— 这一段是纯演出, 中途插手会让计时器与画面对不上。
  // ⚠ is-locked 只做 pointer-events, **不能**在 .explore-stage 上加 opacity/filter(见抬头约束)。
  // ★ 离场行走(leaving)同样锁死: 那几秒棋子正沿线路走向本轮终点, 中途按撤离/开背包
  //   会让画面与阶段机各说各话(session 层对这一相也一律不放行)。
  const locked = session.phase === "generating" || session.phase === "leaving";

  const tier = battleTierOf(session.round);

  // 落点分支 → 应用。
  // ★ 不立刻派发: 先让被点中的那一支演完「落子」(竖条锁死 + 扫光), 另一支同时暗下去,
  //   commit 拍之后才把结算算进会话。这段停顿就是玩家读到的「我做了一个决定」。
  // ⚠ 演出中不接受第二次点击 —— 否则连点两个分支会派发两次结算。
  const takeOption = (index: number) => {
    if (committing != null) return;
    if (prefersReducedMotion()) {
      chooseEventOption(index);
      return;
    }
    setCommitting(index);
    commitTimer.current = window.setTimeout(() => {
      commitTimer.current = null;
      chooseEventOption(index);
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
      className={s["explore-viewport"]}
      ref={viewportRef}
      style={{ "--stage-scale": stageScale } as CSSProperties}
    >
      <div
        className={cx(s["screen"], s["explore-stage"], locked && s["is-locked"])}
        data-explore-stage
        data-explore-dock={stackedModal ? "stacked" : undefined}
      >
        <img className={s["explore-bg"]} src={mapArt(session.mapId)} alt="" draggable={false} />
        <div className={s["explore-veil"]} aria-hidden />

        {/* ---- 左上: 随身背包(12 × 2 = 24 格) ----
            原来这里是纯文字的区域标题, 但探索途中真正需要一直看见的是物资与余量。 */}
        <div className={s["expl-bag"]} style={{ left: "12px", top: "0px", width: `${BAG_W}px` }}>
          <BackpackBar />
        </div>

        {/* ---- 右上: 净化粒子 ----
            这一局唯一的时限就是这个数字, 所以右上角只留它一个 ——
            居民积分与负重都退到面板里(上一版那两块 chip 已废弃)。 */}
        <div className={cx(s["expl-readout"], recede)} style={{ right: "12px", top: "0px" }}>
          <EnergyLamp
            energy={session.energy}
            projected={projectedEnergy(session)}
            recede={focused}
          />
          {session.auras.length > 0 && (
            <div className={s["expl-aura-list"]} aria-label="远征光环">
              {session.auras.map((aura) => (
                <span className={s["expl-aura"]} key={aura.id} title={aura.desc}>
                  <span className={s["expl-aura-name"]}>{aura.name}</span>
                  <span className={s["expl-aura-desc"]}>{aura.desc}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ---- 中央: 等距路由图 ---- */}
        <div
          className={s["expl-board"]}
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
          {hovered && !focused && (
            <NodeTip
              key={`${hovered.seg}-${hovered.lane}`}
              event={board.nodes[hovered.seg][hovered.lane]}
              seg={hovered.seg}
              lane={hovered.lane}
            />
          )}
          {/* 落点 → 浮层的光柱: 从落点瓦片向上升起, 把「是这个节点把面板叫出来的」说清楚。
              位置用 RouteBoard 导出的版式常量算, 两边不各写一份坐标。 */}
          {focused && session.currentLane != null && session.currentSegment > 0 && (
            <div
              className={cx(s["expl-beam"], s[`k-${ev?.kind ?? "route"}`])}
              style={{
                left: `${nodeCenter(session.currentSegment - 1, session.currentLane).x - 3}px`,
                top: `${nodeCenter(session.currentSegment - 1, session.currentLane).y}px`,
                height: `${ROUTE_PANEL_H - nodeCenter(session.currentSegment - 1, session.currentLane).y}px`,
              }}
              aria-hidden
            />
          )}
        </div>

        {/* ---- 左下: 队伍 ---- */}
        <div className={cx(s["expl-party"], recede)} style={{ left: "16px", bottom: "16px" }}>
          {session.party.map((p) => (
            <div key={p.charId} className={cx(s["expl-member"], !p.alive && s["is-down"])}>
              <div className={s["expl-member-figure"]}>
                <CharacterPortrait
                  characterId={p.charId}
                  emoji={p.emoji}
                  alt={`${p.name}立绘`}
                  className={s["expl-portrait"]}
                />
              </div>
              {expDrops[p.charId] && (
                <ExpDropFx
                  key={`${p.charId}-${expDrops[p.charId].sequence}`}
                  amount={expDrops[p.charId].amount}
                />
              )}
              <div className={s["expl-member-body"]}>
                <HpBar hp={p.hp} hpLimit={p.hpLimit} maxHp={p.maxHp} flush />
                <PollutionMeter
                  value={characters[p.charId]?.pollution ?? 0}
                  compact
                  className={s["expl-pollution"]}
                />
              </div>
              {!p.alive && <span className={s["expl-member-down"]}>阵亡</span>}
            </div>
          ))}
        </div>

        {/* ---- 右下: 指令栏 + 背包 + 撤退 ---- */}
        <div className={cx(s["expl-actions"], recede)} style={{ right: "56px", bottom: "40px" }}>
          {session.phase === "atNode" && (
            <div className={s["expl-advance"]}>
              <button
                className={cx(s["expl-advance-btn"], s["is-push"])}
                type="button"
                disabled={!canPushOn(session)}
                title={canPushOn(session) ? undefined : "已走满 4 个推进段, 本轮到此为止"}
                style={{ "--i": 0 } as CSSProperties}
                onClick={() => pushOn()}
              >
                <span className={s["expl-advance-ring"]} aria-hidden />
                <span className={s["expl-advance-label"]}>继续推进</span>
              </button>
              <button
                className={cx(s["expl-advance-btn"], s["is-leave"])}
                type="button"
                style={{ "--i": 1 } as CSSProperties}
                onClick={() => leaveRegion()}
              >
                <span className={s["expl-advance-ring"]} aria-hidden />
                <span className={s["expl-advance-label"]}>前往下一区域</span>
              </button>
            </div>
          )}
          <div className={s["expl-commands"]}>
            <span className={s["expl-chip-label"]}>
              探索指令 · 侧向跨接 {session.lateralShiftsLeft}/1
            </span>
            <div className={s["expl-command-row"]}>
              {COMMANDS.map((c) => (
                <button key={c.name} className={s["expl-command"]} type="button" disabled title={c.desc}>
                  <span className={s["expl-command-name"]}>{c.name}</span>
                  <span className={s["expl-command-flag"]}>未开放</span>
                </button>
              ))}
            </div>
          </div>
          <div className={s["expl-button-row"]}>
            {/* ⚠ 背包的开放时机是硬约束(设计文档 §6.3): 揭示桥接时开背包 = 无限延长观察时间。
                真正的拦截在 explore/session.canOpenBackpack, 这里只是把它的结论画出来。 */}
            {/* <button
              className={cx(
                s["expl-btn"],
                !canBackpack && s["is-locked"],
                !canBackpack && s["is-phase-locked"],
              )}
              type="button"
              disabled={!canBackpack}
              title={canBackpack ? undefined : "区域浮现、桥接揭示与信号推进途中不可开背包"}
              onClick={() => setBagOpen((v) => !v)}
            >
              背包
              <span className={s["expl-btn-flag"]}>
                {canBackpack ? `${usedSlots}/${RULES.burden.backpackSlots}` : "本阶段锁定"}
              </span>
            </button> */}
            <button
              className={cx(s["expl-btn"], s["is-danger"])}
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
          <div className={s["expl-skip"]}>
            <button className={s["expl-btn"]} type="button" onClick={() => leaveRegion()}>
              直接前往下一区域 ▸
              <span className={s["expl-btn-flag"]}>本轮不探索任何节点</span>
            </button>
          </div>
        )}

        {/* ---- 落点浮层(两段式) ----
            landed   —— 事件卡面 + 两个分支按钮。**抵达 ≠ 结算**: 落点已定、效果一件都没生效。
            resolving —— 同一块面板原地换成结算摘要 + 确认按钮(key 不变 ⇒ 不重播入场)。

            ★ 没有全屏遮罩: 压暗背景会毁掉这张废弃楼层图的气质, 也会挡住刚刚亮起来的路径 ——
              而玩家此刻最想看的就是「我是怎么走到这个节点上的」(§11.2)。 */}
        {eventModalOpen && ev && (
          <div className={s["expl-modal"]} key={`${session.round}-${session.currentSegment}-${ev.id}`}>
            <section
              className={cx(
                s["expl-panel"],
                s[`k-${ev.kind}`],
                session.phase === "landed" && s["has-choices"],
                merchantEvent && s["is-merchant"],
              )}
            >
              <span className={s["panel-frame"]} aria-hidden />
              <span className={s["panel-scan"]} aria-hidden />
              <aside className={s["expl-panel-aside"]} aria-hidden="true">
                <div className={s["expl-panel-art"]}>
                  <img className={s["expl-panel-image"]} src={eventArt(ev.kind)} alt="" />
                  <div className={s["expl-panel-art-grid"]} />
                  <span className={s["expl-panel-art-mark"]}>◆</span>
                </div>
              </aside>
              <div className={s["expl-panel-content"]}>
                {/* 标题逐字浮起: 打字机那套用在标题上太慢, 逐字**淡入**才有「名字被念出来」的分量。
                    ⚠ 减弱动态效果时不拆 span —— 一堆 inline-block 会让标点的行内断行规则失效。 */}
                <h3 className={s["expl-panel-title"]}>
                  {prefersReducedMotion()
                    ? ev.title
                    : Array.from(ev.title).map((ch, i) => (
                        <span
                          key={i}
                          className={s["expl-title-char"]}
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
                  <div className={s["expl-panel-read"]}>
                    <p
                      className={s["expl-panel-desc"]}
                      ref={descScrollRef}
                      aria-label={[ev.description, ...session.pendingStory].filter(Boolean).join("\n\n")}
                    >
                      <span className={s["expl-desc-ghost"]} aria-hidden>
                        {ev.description}
                        {storyText ? `\n\n${storyText}` : ""}
                      </span>
                      <span className={s["expl-desc-live"]} ref={descLiveRef} aria-hidden>
                        {desc.shown}
                        {desc.done && storyText ? `\n\n${story.shown}` : ""}
                        {(!desc.done || (desc.done && storyText && !story.done)) && (
                          <span className={s["expl-caret"]} />
                        )}
                      </span>
                    </p>
                  </div>
                  {ev.services?.length && shop ? (
                    <div className={s["expl-panel-slot"]}>
                      <MerchantPanel
                        session={session}
                        shop={shop}
                        onBuy={buyFromShop}
                        canClose={desc.done && committing == null && !session.pendingActions.length}
                        onClose={() => takeOption(0)}
                      />
                    </div>
                  ) : (
                    <div className={s["expl-panel-act"]}>
                      {session.phase === "landed" ? (
                        // 正文讲完之前选项只是「在那儿」而不可点(is-armed 才开闸)。
                        <div
                          className={cx(
                            s["expl-choices"],
                            desc.done && s["is-armed"],
                            committing != null && s["is-closing"],
                          )}
                          style={
                            { "--choice-stagger": `${EVENT_BEAT.choiceStagger}ms` } as CSSProperties
                          }
                        >
                          {landedChoices(session).map((c, i) => {
                            // ★ 选项只说「你打算怎么做」, 得失一律等结算阶段再揭晓。
                            const state =
                              committing == null
                                ? undefined
                                : committing === i
                                  ? s["is-chosen"]
                                  : s["is-dimmed"];
                            const requiredCount = c.cost?.count ?? 0;
                            const availableCount = c.cost
                              ? countByItemId(session.backpack, c.cost.itemId)
                              : 0;
                            const costUnavailable = Boolean(c.cost && availableCount < requiredCount);
                            return (
                              <button
                                key={c.id}
                                className={cx(s["expl-choice"], state, costUnavailable && s["is-cost-locked"])}
                                type="button"
                                disabled={!desc.done || committing != null || costUnavailable}
                                title={
                                  c.cost
                                    ? costUnavailable
                                      ? "背包中没有指定食品"
                                      : `需要 ${getItemDef(c.cost.itemId).name} ×${requiredCount}`
                                    : undefined
                                }
                                style={{ "--i": i } as CSSProperties}
                                onClick={() => takeOption(i)}
                              >
                                <span className={s["expl-choice-bar"]} aria-hidden />
                                <span className={s["expl-choice-index"]} aria-hidden>
                                  {String(i + 1).padStart(2, "0")}
                                </span>
                                <span className={s["expl-choice-label"]}>{c.label}</span>
                                {c.cost && (
                                  <span className={s["expl-choice-cost"]}>
                                    {costUnavailable ? "背包中没有指定食品" : `需要 ${getItemDef(c.cost.itemId).name} ×${requiredCount}`}
                                  </span>
                                )}
                                <span className={s["expl-choice-arrow"]} aria-hidden>
                                  ▸
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <>
                          <div className={s["expl-notes"]}>
                            {session.pendingNotes.length ? (
                              session.pendingNotes.map((n, i) => (
                                <span
                                  key={i}
                                  className={s["expl-note"]}
                                  style={
                                    {
                                      animationDelay: `${beats.noteAt(i)}ms`,
                                    } as CSSProperties
                                  }
                                >
                                  {n}
                                </span>
                              ))
                            ) : (
                              <span
                                className={cx(s["expl-note"], s["is-muted"])}
                                style={
                                  { animationDelay: `${beats.noteAt(0)}ms` } as CSSProperties
                                }
                              >
                                无结算
                              </span>
                            )}
                          </div>
                          {/* 结算摘要播完前确认按钮保持禁用，脚部固定在面板底边。 */}
                          <div className={s["expl-panel-foot"]}>
                            <span className={s["expl-panel-cost"]}>
                              {mustReplace
                                ? "先在背包里处理完拿不下的东西"
                                : hasLoot
                                  ? "先处理事件物品"
                                  : hasPendingAction
                                    ? "先处理事件奖励"
                                    : "结算完毕"}
                            </span>
                            <button
                              className={cx(s["expl-btn"], s["is-primary"], s["expl-confirm"])}
                              type="button"
                              disabled={mustReplace || hasLoot || hasPendingAction || !narrationDone}
                              style={
                                {
                                  animationDelay: `${
                                    beats.noteAt(Math.max(1, session.pendingNotes.length) - 1)
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
                  )}
              </div>
            </section>
          </div>
        )}

        {session.phase === "resting" && ev?.hiddenRest && (
          <div className={s["expl-modal"]}>
            <section className={cx(s["expl-panel"], s["expl-panel-decide"])}>
              <span className={s["panel-frame"]} aria-hidden />
              <span className={s["panel-scan"]} aria-hidden />
              <span className={s["expl-kicker"]}>隐藏休息 · 事件后的额外选择</span>
              <h3 className={s["expl-panel-title"]}>要在这里休息吗？</h3>
              <div className={s["expl-panel-slot"]}>
                <p className={s["expl-panel-desc"]}>
                  你可以消耗指定食品，唤来隐藏访客；也可以跳过休息，继续前往下一个节点。
                </p>
                {restFood ? (
                  <div className={s["expl-rest-food"]}>
                    <ItemSlot
                      stack={restFood}
                      showName
                      onClick={() => restEat(restFood.uid)}
                    />
                    <span>食用 {getItemDef(restFood.itemId).name}，触发隐藏 NPC</span>
                  </div>
                ) : (
                  <p className={s["expl-empty"]}>背包中没有指定食品。</p>
                )}
              </div>
              <div className={s["expl-panel-foot"]}>
                <span className={s["expl-panel-cost"]}>{restFood ? "食品会从背包中消耗" : "无法触发隐藏访客"}</span>
                <button className={s["expl-btn"]} type="button" onClick={restSkip}>
                  跳过休息
                </button>
              </div>
            </section>
          </div>
        )}

        {session.phase === "npcEvent" && npc && (
          <div className={s["expl-modal"]}>
            <section className={cx(s["expl-panel"], s["expl-panel-decide"])}>
              <span className={s["panel-frame"]} aria-hidden />
              <span className={s["panel-scan"]} aria-hidden />
              <span className={s["expl-kicker"]}>隐藏 NPC · 特殊事件</span>
              <h3 className={s["expl-panel-title"]}>{npc.title}</h3>
              <div className={s["expl-panel-slot"]}>
                <p className={s["expl-panel-desc"]}>{npc.description}</p>
                <div className={s["expl-decide-row"]}>
                  {npcChoices(session).map((choice, index) => (
                    <button
                      className={s["expl-choice"]}
                      type="button"
                      key={choice.id}
                      style={{ "--i": index } as CSSProperties}
                      onClick={() => chooseNpcOption(index)}
                    >
                      <span className={s["expl-choice-bar"]} aria-hidden />
                      <span className={s["expl-choice-label"]}>{choice.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {session.phase === "npcResolving" && npc && (
          <div className={s["expl-modal"]}>
            <section className={cx(s["expl-panel"], s["expl-panel-decide"])}>
              <span className={s["panel-frame"]} aria-hidden />
              <span className={s["panel-scan"]} aria-hidden />
              <span className={s["expl-kicker"]}>隐藏 NPC · 结果记录</span>
              <h3 className={s["expl-panel-title"]}>{npc.title}</h3>
              <div className={s["expl-panel-slot"]}>
                {session.pendingStory.length > 0 && (
                  <div className={s["expl-story"]} aria-live="polite">
                    {session.pendingStory.map((story, index) => (
                      <p
                        key={`${story}-${index}`}
                        style={{ animationDelay: `${beats.storyAt(index)}ms` } as CSSProperties}
                      >
                        {story}
                      </p>
                    ))}
                  </div>
                )}
                <div className={s["expl-notes"]}>
                  {session.pendingNotes.map((note, index) => (
                    <span
                      className={s["expl-note"]}
                      key={`${note}-${index}`}
                      style={{ animationDelay: `${beats.noteAt(index)}ms` } as CSSProperties}
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>
              <div className={s["expl-panel-foot"]}>
                <span className={s["expl-panel-cost"]}>
                  {hasLoot || hasPendingAction ? "先处理上方奖励" : "隐藏事件已结算"}
                </span>
                <button
                  className={cx(s["expl-btn"], s["is-primary"])}
                  type="button"
                  disabled={hasLoot || hasPendingAction || !narrationDone}
                  onClick={confirmNpc}
                >
                  返回路线 ▸
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ---- 本轮线路披露(routeDisclosure) ----
            ★ 这是**教学页而不是过场**(§11.2): 没有披露, 玩家分不清「我记错了 / 我压根没记 /
              这张图本来就记不住」。全图桥接与实际路径由 RouteBoard 画, 这里只放结论与出口。 */}
        {session.phase === "routeDisclosure" && (
          <div className={s["expl-modal"]}>
            <section className={cx(s["expl-panel"], s["expl-panel-decide"])}>
              <span className={s["panel-frame"]} aria-hidden />
              <span className={s["panel-scan"]} aria-hidden />
              <span className={s["expl-kicker"]}>线路披露</span>
              <h3 className={s["expl-panel-title"]}>这就是本轮的完整桥接</h3>
              <div className={s["expl-panel-slot"]}>
                <p className={s["expl-panel-desc"]}>
                  亮起来的是你实际走过的路径, 压暗的是你放弃的节点。
                  {session.entryLane != null
                    ? `你从 ${"ABCDE"[session.entryLane]} 通道进入。`
                    : "你没有进入这片区域。"}
                </p>
              </div>
              <div className={s["expl-panel-foot"]}>
                <span className={s["expl-panel-cost"]}>
                  下一关：{BATTLE_TIER_NAME[tier]} 的战斗签 · 战斗只掉物品, 废料要带回据点才换积分
                </span>
                <button className={cx(s["expl-btn"], s["is-primary"])} type="button" onClick={() => startSlot()}>
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

        {narrationGate && session.pendingActions.length > 0 && <RewardOverlay />}
        {narrationGate && !session.pendingActions.length && <LootPickup />}
      </div>
    </div>
  );
}
