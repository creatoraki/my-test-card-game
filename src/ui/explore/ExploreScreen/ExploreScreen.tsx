// ★ 探索主界面 ★ —— 全屏「废弃楼层」场景 + 中央等距区域路由图, 见 探索模式设计.md。
//
// 一轮的玩法只有两句话:
//   **在 2-3 秒里记住整张图的桥接, 然后选一条入口通道。**
//   **每结算一个节点, 决定「继续推进」还是「前往下一区域」——依据是你对自己记忆的置信度。**
// 净化粒子(energy)是唯一的难度轴与时限: 每结算 1 个节点按推进段扣 3/3/4/5(见
// EXPLORE_RULES.energyPerNodeBySegment), 消耗速度由玩家自己决定。
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
  canUseItem,
  choiceStartsBattle,
  landedChoices,
  landedEvent,
  projectedEnergy,
  roundBattleEvent,
} from "@/explore/session";
import type { ChoiceCost, EventChoice, NodeEvent } from "@/explore/types";
import { getItemDef, getNpcEvent } from "@/data";
import { TARGETED_ITEM_USE_KINDS, type ItemStack } from "@/items/types";
import { useExploreStore } from "@/store/exploreStore";
import { useRunStore } from "@/store/runStore";
import { useTownStore } from "@/store/townStore";
import BackpackPanel from "@/ui/explore/BackpackPanel";
import BackpackBar from "@/ui/explore/BackpackBar";
import ExpDropFx from "@/ui/explore/ExpDropFx";
import ExploreCommandBar from "@/ui/explore/ExploreCommandBar";
import { EventModal, NpcModal, RestModal, type EventModalView, type NpcModalView, type RestModalView } from "./ExploreModals";
import type { EventPanelScene } from "@/ui/common/EventPanel";
import LootPickup from "@/ui/explore/LootPickup";
import RewardOverlay from "@/ui/explore/RewardOverlay";
import ShopOverlay from "@/ui/explore/ShopOverlay";
import { EnergyLamp } from "@/ui/explore/EnergyLamp";
import NodeTip from "@/ui/explore/NodeTip";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import { HpBar } from "@/ui/common/HpBar";
import { PollutionMeter } from "@/ui/common/PollutionMeter";
import {
  RouteBoard,
  ROUTE_PANEL_H,
  ROUTE_PANEL_W,
  GENERATE_MS,
  GENERATE_REDUCED_MS,
  nodeCenter,
} from "@/ui/common/RouteBoard";
import { prefersReducedMotion } from "@/ui/app/transitions";
import { useRevealPresence } from "@/ui/common/ModalReveal";
import { panelRevealCloseMs } from "@/ui/explore/styles/panelReveal";
import { useTypewriter } from "@/ui/hooks/useTypewriter";
import { StageCanvas } from "@/ui/app/StageCanvas";
import { mapArt, warmMapArt } from "@/ui/art/mapArt";
import { setTransitionOrigin } from "@/ui/app/transitionOrigin";
import { cx } from "@/ui/common/cx";
import s from "./ExploreScreen.module.css";

// 路由图面板在画布里的落位。
// ★ 等距棋盘沿「左下 → 右上」铺开, 因此包围盒的**左上角与右下角天然是空的** ——
//   节点悬浮浮卡会贴着对应瓦片出现, 决策浮层仍落在画布中央。
//   把面板往右推是为了给左上的 HUD 让位, 同时让棋盘右上角避开右上的读数列。
// ⚠ 这两个数跟着面板尺寸走(现为 1366×786): 左边界让开左上的背包条与队伍区,
//   下边界必须留在 COMMAND_BAR_TOP 之上, 否则棋盘会压到本轮指令条上。
const BOARD_LEFT = 400;
const BOARD_TOP = 128;
const COMMAND_BAR_TOP = 930;
const BAG_W = 640;

// 固定槽位数: 探索队伍区恒定 3 格, 与 engine/rules.ts 的 progression.partySize 对齐。
// 人数不足时空出来的格子渲染成空槽, 保持构图稳定。
const EXPL_PARTY_SLOTS = RULES.progression.partySize;

const ENGAGE_CHOICE: EventChoice = {
  id: "engage",
  label: "迎战",
  desc: "进入本轮推进战斗",
  energyDelta: 0,
};

// P1 才接入的指令。**先按最终形态排好版**, 下一轮往里填实现即可 —— 位置定下来了,
// 玩家也提前知道这排东西将来是干什么的(设计文档 §7.3)。
const COMMANDS = [
  { name: "拓扑扫描", desc: "永久显示 2 根桥接" },
  { name: "信号锚点", desc: "记录一次落点" },
  { name: "并行探针", desc: "预览一条通道的落点" },
  { name: "侧向跨接", desc: "落点前跨到相邻通道" },
] as const;

// 落点事件浮层的演出节拍(ms)。★ 单一真相在这里 —— 需要给 CSS 的那几个由 tsx 内联下发,
// 两边不各写一份(与 CryoScene 的 --content-delay 同一套做法)。
//
// 这段时序读作一句话: **面板落定 → 标题浮字 → 正文讲完 → 选项才就位 → 落子有回响 → 结果逐条揭晓**。
// 抵达一个落点是这个模式里唯一的叙事时刻, 值得花两三秒把它讲完; 中途不给跳过, 就是要玩家读完。
const EVENT_BEAT = {
  titleStart: 380, // 面板横线展开过半时标题开始浮字, 早一点会被裁掉
  titleChar: 45, // 标题每字间隔
  descStart: 720, // 正文起播 —— 压着面板落定的那一刻
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
  const chooseEventOption = useRunStore((s) => s.chooseEventOption);
  const confirmNode = useExploreStore((s) => s.confirmNode);
  const restEat = useExploreStore((s) => s.restEat);
  const restSkip = useExploreStore((s) => s.restSkip);
  const chooseNpcOption = useExploreStore((s) => s.chooseNpcOption);
  const confirmNpc = useExploreStore((s) => s.confirmNpc);
  const pushOn = useExploreStore((s) => s.pushOn);
  const leaveRegion = useExploreStore((s) => s.leaveRegion);
  const leaveDone = useExploreStore((s) => s.leaveDone);
  const engageRoundBattle = useExploreStore((s) => s.engageRoundBattle);
  const enterEncounter = useRunStore((s) => s.enterEncounter);
  const finishExpedition = useRunStore((s) => s.finishExpedition);
  const retreat = useRunStore((s) => s.retreat);
  const useItemAction = useExploreStore((s) => s.useItem);

  const [bagOpen, setBagOpen] = useState(false);
  // ---- 消耗品使用: 目标选择流程 ----
  // useTarget 非空 = 玩家已点下「使用」, 正在等 TA 点选左下角的一名存活角色。
  const [useTarget, setUseTarget] = useState<ItemStack | null>(null);
  // 使用结算后的一句反馈飘字(「糖块 · 剑士 回复 25% 生命」), 定时自动消失。
  const [useFlash, setUseFlash] = useState<{ text: string; seq: number } | null>(null);
  const useFlashTimer = useRef<number | null>(null);
  // 当前悬停的节点。浮卡只跟随悬停，不回落到当前落点。
  // ⚠ hidden = 该节点是未知节点(尚未走到): 浮卡必须按占位渲染, 不读真实事件。
  const [hovered, setHovered] = useState<{ seg: number; lane: number; hidden: boolean } | null>(null);
  // 已点下但还没派发出去的那一支。★ 这个空档就是「落子的回响」——
  //   按钮先演完(竖条锁死 + 扫光掠过), 结算才发生; 少了它, 点击就只是一次表单提交。
  const [committing, setCommitting] = useState<number | null>(null);
  const [scene, setScene] = useState<EventPanelScene>("briefing");
  const commitTimer = useRef<number | null>(null);
  // 结算摘要是否已逐条播完 —— 播完之前「确认」按钮不接受点击, 否则玩家一路连点就什么都没看见。
  const [narrationDone, setNarrationDone] = useState(false);
  const battleFreeze = useRef<{
    event: NodeEvent;
    choices: { id: string; label: string; cost?: ChoiceCost }[];
    storyText: string;
  } | null>(null);
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
  // BOSS 通关走的是战斗画布内的胜利结算流程, 不经过这里。
  useEffect(() => {
    if (phase === "retreated" || phase === "wiped") finishExpedition();
  }, [phase, finishExpedition]);

  useEffect(() => {
    if (phase === "inBattle") enterEncounter();
  }, [phase, enterEncounter]);

  // 阶段一旦走出白名单(比如按下「探索路线」), 背包必须自己关掉 ——
  // 硬约束在 store 层, 但面板留在屏幕上会让玩家以为还能翻。
  const bagAllowed = session ? canOpenBackpack(session) : false;
  useEffect(() => {
    if (!bagAllowed) setBagOpen(false);
  }, [bagAllowed]);

  // 目标选择跟着阶段走: 阶段一变, 「这会儿能不能用药」的答案也变了, 挂着的选择一律作废。
  useEffect(() => {
    setUseTarget(null);
  }, [phase]);

  // 奖励/拾取浮层拉起时, 遮罩会把队伍区挡在下面 —— 挂着的选择同样作废。
  // ⚠ 这里直接读 session 自算, 与下方渲染用的 hasPendingAction/hasLoot 同一口径。
  const pendingOverlayUp = Boolean(session?.pendingActions.length || session?.pendingLoot.length);
  useEffect(() => {
    if (pendingOverlayUp) setUseTarget(null);
  }, [pendingOverlayUp]);

  // 目标选择模式下 Esc 取消。
  useEffect(() => {
    if (!useTarget) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setUseTarget(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [useTarget]);

  // 飘字定时器卸载时顺手撤掉, 不会有卸载后 setState。
  useEffect(
    () => () => {
      if (useFlashTimer.current != null) window.clearTimeout(useFlashTimer.current);
    },
    [],
  );

  const onHoverNode = useCallback(
    (at: { seg: number; lane: number; hidden: boolean } | null) => {
      setHovered(at);
    },
    [],
  );

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
  const panelEvent = session?.phase === "roundBattle"
    ? roundBattleEvent(session)
    : session?.phase === "inBattle"
      ? battleFreeze.current?.event ?? landedEv
    : landedEv;
  const evDesc = panelEvent?.description ?? "";
  // 正文逐字。text 一变就自动重置游标 ⇒ 换事件自然重播, 这里不需要额外的 key。
  const desc = useTypewriter(evDesc, EVENT_BEAT.descStart, EVENT_BEAT.descCps);
  const storyText = session?.phase === "inBattle"
    ? battleFreeze.current?.storyText ?? ""
    : session?.phase === "roundBattle"
      ? panelEvent?.choices?.[0]?.story ?? ""
    : session?.pendingStory.join("\n\n") ?? "";
  const story = useTypewriter(storyText, 0, EVENT_BEAT.descCps);
  // 走出 landed(结算已派发, 或整轮被别的路径打断)就把「已点下」清掉,
  // 免得下一个落点一进来两个按钮就是暗的。
  useEffect(() => {
    if (phase !== "landed") setCommitting(null);
  }, [phase]);
  useEffect(() => {
    if (phase === "resolving" || phase === "npcResolving") {
      setScene("result");
    } else if (phase === "inBattle") {
      setScene("choice");
    } else if (phase === "landed" || phase === "roundBattle" || phase === "resting" || phase === "npcEvent" || phase === "shopping") {
      setScene("briefing");
    }
  }, [phase, round, session?.currentSegment]);
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

  const choiceList =
    session?.phase === "roundBattle"
      ? [ENGAGE_CHOICE]
      : session?.phase === "landed"
        ? landedChoices(session)
        : session?.phase === "inBattle"
          ? battleFreeze.current?.choices ?? []
          : [];

      const currentEvent = panelEvent ?? (session?.phase === "roundBattle"
        ? {
            id: `round-battle-${session.round}`,
            kind: "battle" as const,
            category: "battle" as const,
            title: `推进战斗 · ${BATTLE_TIER_NAME[battleTierOf(session.round)]}`,
            description: "本轮战斗事件池暂无可用文案。",
            energyDelta: 0,
          }
        : null);
      const eventModalOpen =
        phase === "landed" ||
        phase === "shopping" ||
        phase === "resolving" ||
        phase === "roundBattle" ||
        phase === "inBattle";
      const restModalOpen = phase === "resting" && Boolean(currentEvent?.hiddenRest);
      const npc = session?.restNpcId ? getNpcEvent(session.restNpcId) : undefined;
      const npcModalOpen = (phase === "npcEvent" || phase === "npcResolving") && Boolean(npc);
      const mustReplace = Boolean(session?.pendingPickup.length);
      const hasLoot = Boolean(session?.pendingLoot.length);
      const hasPendingAction = Boolean(session?.pendingActions.length);
      const narrationGate =
        phase === "resolving" || phase === "npcResolving"
          ? desc.done && story.done && narrationDone
          : true;
      const overlayOpen = narrationGate && (hasPendingAction || hasLoot);
      const hiddenRest = currentEvent?.hiddenRest;
      const restFood = hiddenRest && session
        ? session.backpack.find((stack) => stack.itemId === hiddenRest.foodItemId) ?? null
        : null;

      const eventView: EventModalView | null = session && currentEvent
        ? {
            session,
            ev: currentEvent,
            choiceList,
            desc,
            story,
            storyText,
            beats,
            choiceReady: phase === "inBattle" || (desc.done && (!storyText || story.done)),
            committing,
            narrationDone,
            mustReplace,
            hasLoot,
            hasPendingAction,
            scene,
          }
        : null;
      const restView: RestModalView | null = session && hiddenRest
        ? { session, hiddenRest, restFood, scene }
        : null;
      const npcView: NpcModalView | null = session && npc
        ? {
            session,
            npc,
            beats,
            hasLoot,
            hasPendingAction,
            narrationDone,
            scene,
          }
        : null;
      const eventPresence = useRevealPresence(eventModalOpen && Boolean(eventView), eventView, panelRevealCloseMs());
      const restPresence = useRevealPresence(restModalOpen && Boolean(restView), restView, panelRevealCloseMs());
      const npcPresence = useRevealPresence(npcModalOpen && Boolean(npcView), npcView, panelRevealCloseMs());

  if (!session || !session.board) return null;

  const board = session.board;
      const ev = currentEvent;
  const canBackpack = canOpenBackpack(session);
  const usedSlots = backpackSlots(session);

  // ---- 消耗品使用 ----
  // 结算飘字: seq 递增保证连用两件时飘字重挂, 不会因为 key 相同而丢动画。
  const flashUseNote = (text: string) => {
    setUseFlash((current) => ({ text, seq: (current?.seq ?? 0) + 1 }));
    if (useFlashTimer.current != null) window.clearTimeout(useFlashTimer.current);
    useFlashTimer.current = window.setTimeout(() => setUseFlash(null), 2200);
  };

  // 「使用」的统一入口(右键菜单与大面板按钮都走这里):
  //   指定角色类 → 进入头像选择流程; 其余效果 → 立即结算并飘字。
  const startItemUse = (stack: ItemStack) => {
    const def = getItemDef(stack.itemId);
    if (!def.use || !canUseItem(session)) return;
    if ((TARGETED_ITEM_USE_KINDS as readonly string[]).includes(def.use.kind)) {
      setUseTarget(stack);
      return;
    }
    const note = useItemAction(stack.uid);
    if (note) flashUseNote(note);
  };

  // 点选左下角角色头像 → 结算并退出选择流程。store 会再校验一次目标合法性。
  const applyItemUse = (charId: string) => {
    if (!useTarget) return;
    const note = useItemAction(useTarget.uid, charId);
    if (note) flashUseNote(note);
    setUseTarget(null);
  };

  // 目标是否「用了有效果」: 除存活外还按消耗品 kind 检查当前状态 ——
  // 满血吃糖、无损伤用医疗包、无污染用圣水都算无效目标, 头像不开放点选
  // (设计文档《消耗品》§五: 使用前检查效果有效性, 检查失败不消耗物品)。
  const useDef = useTarget ? getItemDef(useTarget.itemId) : null;
  const memberUsable = (p: (typeof session.party)[number]) => {
    if (!useDef?.use || !p.alive) return false;
    const u = useDef.use;
    if (u.kind === "healOne") return p.hp < p.hpLimit;
    if (u.kind === "healLimitOne") return p.hpLimit < p.maxHp;
    if (u.kind === "reducePollutionOne") return (characters[p.charId]?.pollution ?? 0) > 0;
    return true;
  };
  const hasUsableTarget = session.party.some(memberUsable);

  // 落点浮层开着的两个阶段: 四角 HUD 轻度后退, 把注意力收拢到面板上(不加全屏遮罩)。
  const focused =
    session.phase === "landed" ||
    session.phase === "shopping" ||
    session.phase === "resolving" ||
    session.phase === "resting" ||
    session.phase === "npcEvent" ||
    session.phase === "npcResolving" ||
    session.phase === "roundBattle" ||
    session.phase === "inBattle";
  const recede = focused ? s["is-recede"] : undefined;
  const choiceReady = session.phase === "inBattle" || (desc.done && (!storyText || story.done));

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
  const takeOption = (index: number, event?: MouseEvent<HTMLButtonElement>) => {
    if (committing != null) return;
    const battleBound =
      session.phase === "roundBattle" ||
      (session.phase === "landed" && choiceStartsBattle(session, index));
    if (event && battleBound && event.detail !== 0) {
      setTransitionOrigin(event.clientX, event.clientY);
    }
    const engage = () => {
      if (battleBound && panelEvent) {
        battleFreeze.current = {
          event: panelEvent,
          choices: choiceList.map(({ id, label, cost }) => ({ id, label, cost })),
          storyText,
        };
      }
      if (session.phase === "roundBattle") {
        engageRoundBattle();
      } else {
        const result = chooseEventOption(index);
        if (!result) console.warn("[explore] 选项未被会话接受", { index, phase: session.phase });
      }
    };
    if (battleBound || prefersReducedMotion()) {
      try {
        engage();
      } catch (err) {
        console.error("[explore] 事件结算抛出异常", err);
      } finally {
        setCommitting(null);
      }
      return;
    }
    setCommitting(index);
    commitTimer.current = window.setTimeout(() => {
      commitTimer.current = null;
      try {
        engage();
      } catch (err) {
        console.error("[explore] 事件结算抛出异常", err);
      } finally {
        setCommitting(null);
      }
    }, EVENT_BEAT.commit);
  };

  return (
    <StageCanvas
      viewportClassName={s["explore-viewport"]}
      className={cx(s["screen"], s["explore-stage"], locked && s["is-locked"])}
      data-explore-stage
    >
        <img className={s["explore-bg"]} src={mapArt(session.mapId)} alt="" draggable={false} />
        <div className={s["explore-veil"]} aria-hidden />

        {/* ---- 左上: 随身背包(12 × 2 = 24 格) ----
            原来这里是纯文字的区域标题, 但探索途中真正需要一直看见的是物资与余量。 */}
        <div className={s["expl-bag"]} style={{ left: "12px", top: "0px", width: `${BAG_W}px` }}>
          <BackpackBar onUseItem={startItemUse} />
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
            onArrive={onArrive}
            onLeaveDone={onLeaveDone}
            onHoverNode={onHoverNode}
            // ⚠ 必须关掉组件自带的地面底图: 本页已经铺了全屏场景图(.explore-bg),
            //   再开一层会在画面正中多出一块 16:9 的矩形贴图压在场景上。
            ground={false}
          />
          {hovered && !focused && (
            <NodeTip
              key={`${hovered.seg}-${hovered.lane}`}
              event={board.nodes[hovered.seg][hovered.lane]}
              seg={hovered.seg}
              lane={hovered.lane}
              hidden={hovered.hidden}
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

        {session.phase === "sealed" ? (
          <div className={s["expl-command-bar"]} style={{ top: `${COMMAND_BAR_TOP}px` }}>
            <div className={s["expl-command-divider"]} aria-hidden />
            <span className={s["expl-kicker"]}>本轮指令</span>
            <ExploreCommandBar
              tone="probe"
              label="探索路线"
              onClick={beginReveal}
            />
          </div>
        ) : null}

        {/* ---- 左下: 队伍 ----
            消耗品目标选择模式下, 存活成员的头像变成可选目标(高亮脉冲),
            点击即使用; 右键/Esc/「取消」退出选择。 */}
        <div
          className={cx(s["expl-party"], recede, useTarget && s["is-targeting"])}
          style={{ left: "16px", bottom: "16px" }}
          onContextMenu={
            useTarget
              ? (event) => {
                  event.preventDefault();
                  setUseTarget(null);
                }
              : undefined
          }
        >
          {Array.from({ length: EXPL_PARTY_SLOTS }, (_, i) => {
            const p = session.party[i];
            if (!p) return <div key={`empty${i}`} className={s["expl-slot-empty"]} />;
            const targetable = memberUsable(p);
            return (
              <div
                key={p.charId}
                className={cx(
                  s["expl-member"],
                  targetable && s["is-targetable"],
                  !p.alive && s["is-down"],
                )}
                onClick={targetable ? () => applyItemUse(p.charId) : undefined}
              >
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
                  <PollutionMeter value={characters[p.charId]?.pollution ?? 0} />
                </div>
                {!p.alive && <span className={s["expl-member-down"]}>阵亡</span>}
              </div>
            );
          })}
        </div>

        {/* ---- 消耗品使用: 目标选择提示 / 结算飘字 ---- */}
        {useTarget && (
          <div className={s["expl-use-banner"]} style={{ left: "16px", bottom: "348px" }}>
            <span className={s["expl-use-banner-kicker"]}>使用消耗品</span>
            <span className={s["expl-use-banner-text"]}>
              {hasUsableTarget
                ? `选择一名存活角色使用「${useDef?.name ?? "消耗品"}」`
                : "没有可用目标 —— 角色当前状态无需此效果"}
            </span>
            <button
              className={s["expl-use-banner-cancel"]}
              type="button"
              onClick={() => setUseTarget(null)}
            >
              取消
            </button>
          </div>
        )}
        {useFlash && (
          <div
            key={useFlash.seq}
            className={s["expl-use-flash"]}
            style={{ left: "16px", bottom: "348px" }}
          >
            {useFlash.text}
          </div>
        )}

        {/* ---- 右下: 指令栏 + 背包 + 撤退 ---- */}
        <div className={cx(s["expl-actions"], recede)} style={{ right: "56px", bottom: "40px" }}>
          {(session.phase === "atNode" || session.phase === "choosingEntry") && (
            <div className={s["expl-advance"]}>
              {session.phase === "atNode" && (
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
              )}
              <button
                className={cx(s["expl-advance-btn"], s["is-leave"])}
                type="button"
                style={{ "--i": session.phase === "atNode" ? 1 : 0 } as CSSProperties}
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

        {eventPresence.mounted && eventPresence.data && (
          <EventModal
            view={eventPresence.data}
            closing={eventPresence.closing}
            onTakeOption={(index, event) => takeOption(index, event)}
            onConfirm={confirmNode}
            onAdvance={() => setScene("choice")}
            onBack={() => setScene("briefing")}
          />
        )}
        {restPresence.mounted && restPresence.data && (
          <RestModal
            view={restPresence.data}
            closing={restPresence.closing}
            onEat={restEat}
            onSkip={restSkip}
            onAdvance={() => setScene("choice")}
            onBack={() => setScene("briefing")}
          />
        )}
        {npcPresence.mounted && npcPresence.data && (
          <NpcModal
            view={npcPresence.data}
            closing={npcPresence.closing}
            onChoose={chooseNpcOption}
            onConfirm={confirmNpc}
            onAdvance={() => setScene("choice")}
            onBack={() => setScene("briefing")}
          />
        )}

        <ShopOverlay />

        {/* ---- 背包面板 ----
            替换模式(pendingPickup 非空)时强制打开: 「拿不拿得下」这个决定必须当场做完,
            让它跨节点就等于把决定悄悄取消掉了(session.confirmNode 也会拦一次)。 */}
        {(bagOpen || mustReplace) && canBackpack && (
          <BackpackPanel
            onClose={() => setBagOpen(false)}
            onUse={(stack) => {
              // 替换模式下背包不许关(必须当场处理完待取物), 其余情况收起面板露出队伍区,
              // 让「点选角色」这件事发生在左下角而不是面板后面。
              if (!mustReplace) setBagOpen(false);
              startItemUse(stack);
            }}
          />
        )}

        <div className={s["expl-scrim"]} data-closing={!overlayOpen || undefined} aria-hidden />
        <RewardOverlay gate={narrationGate} />
        <LootPickup gate={narrationGate && !session.pendingActions.length} />
    </StageCanvas>
  );
}
