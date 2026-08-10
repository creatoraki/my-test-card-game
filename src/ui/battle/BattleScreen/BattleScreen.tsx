import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  canPlay,
  type AnimFrame,
  type BattleState,
  type Card,
  type CardAnim,
  type Enemy,
} from "@/engine";
import { getEncounter, getEnemyDef, slotPlacement } from "@/data";
import { useBattleStore } from "@/store/battleStore";
import { useRunStore } from "@/store/runStore";
import { CombatantView, isIntentRevealed } from "@/ui/battle/CombatantView";
import { AllyBar } from "@/ui/battle/AllyBar";
import { HandTray } from "@/ui/battle/HandTray";
import { CardInfoPanel } from "@/ui/battle/CardInfoPanel";
import { VictoryPanel } from "@/ui/battle/VictoryPanel";
import { BattleActions } from "@/ui/battle/BattleActions";
import { BondRail } from "@/ui/battle/BondRail";
import { ChallengeRail } from "@/ui/battle/ChallengeRail";
import { HandTools, type HandAction } from "@/ui/battle/HandTools";
import { ManaBar } from "@/ui/battle/ManaBar";
import { PileRail, type Pile } from "@/ui/battle/PileRail";
import { PileDrawer } from "@/ui/battle/PileDrawer";
import { RoundIndicator } from "@/ui/battle/RoundIndicator";
import { SkillCutInCard } from "@/ui/battle/SkillCutInCard";
import { ANIM, CINEMA, HAND_DEAL, cardAnim, moveAnim, type HitFx } from "@/ui/battle/animations";
import {
  choreograph,
  depthVars,
  sameCamera,
  type Camera,
  type ChoreoStep,
  type ShotPreset,
  unitWorldBox,
  useCameraRig,
  createTimeline,
  type Timeline,
  worldShift,
} from "@/ui/battle/camera";
import { warmEnemyArt } from "@/ui/art/enemyArt";
import { warmVfxSprites } from "@/ui/art/vfxSprites";
import { battleBg, warmBattleBg } from "@/ui/art/battleBg";
import { AmbienceGrade, AmbienceLayer } from "@/ui/battle/AmbienceLayer";
import { resetHandHover } from "@/ui/battle/handFocusStore";
import { useIdleTwitch } from "@/ui/hooks/useIdleTwitch";
import { useStageScale } from "@/ui/hooks/stage";
import { cx } from "@/ui/common/cx";
import s from "./BattleScreen.module.css";

const clamp = (v: number, lim: number) => Math.max(-lim, Math.min(lim, v));
const CAMERA_HARD_CUT_DISTANCE = 420;
const CAMERA_SETTLE_MS = CINEMA.aim.dur + 80;
const DEPTH_VARS = depthVars();

function safeArea(stage: HTMLElement) {
  return { x: stage.offsetLeft, y: stage.offsetTop, w: stage.offsetWidth, h: stage.offsetHeight };
}

function computeAimCamera(world: HTMLElement | null, stage: HTMLElement | null, foeId: string | null): Camera | null {
  if (!world || !stage) return null;
  const safe = safeArea(stage);
  const A = { x: safe.x + safe.w / 2, y: safe.y + safe.h / 2 };
  const { scale: s, yaw: yawMax, pitch: pitchMax, pan, panMax, panY, panMaxY, arc } = CINEMA.aim;
  let yaw = 0;
  let pitch = 0;
  const F = { ...A };
  const box = foeId ? unitWorldBox(world, foeId) : null;
  if (box) {
    const offX = (box.left + box.right) / 2 - A.x;
    const offY = (box.top + box.bottom) / 2 - A.y;
    const nx = clamp(offX / (safe.w / 2), 1);
    const ny = clamp(offY / (safe.h / 2), 1);
    yaw = nx * yawMax;
    pitch = -ny * pitchMax;
    F.x += clamp(offX * pan, panMax);
    F.y += clamp(offY * panY, panMaxY) - Math.abs(nx) * arc;
  }
  return { s, ...worldShift(A, F, s), yaw, pitch, roll: 0 };
}

export function BattleScreen() {
  const battle = useBattleStore((s) => s.battle);
  const battleMeta = useBattleStore((s) => s.meta);
  const play = useBattleStore((s) => s.play);
  const redrawCard = useBattleStore((s) => s.redrawCard);
  const discardCard = useBattleStore((s) => s.discardCard);
  const end = useBattleStore((s) => s.end);
  const commit = useBattleStore((s) => s.commit);
  const resolveBattle = useRunStore((s) => s.resolveBattle);
  const battleSettled = useRunStore((s) => s.battleSettled);
  const battleSeq = useBattleStore((s) => s.seq); // 「第几场战斗」的身份标识, 换局时重置分镜状态
  const mapId = useRunStore((s) => s.mapId);
  const bg = battleBg(mapId); // 当前地图的背景素材(视频/静态图), 未登记则回退森林

  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  // ★ 手牌**悬停**态刻意**不在这里** —— 它住在 ui/handFocusStore.ts。
  //   它曾是这里的一个 useState, 于是鼠标每跨过一张手牌(mouseleave + mouseenter 两次 setState)
  //   就把整个战斗界面重渲染一遍: 每个敌人、一排法力水晶 SVG、时刻标尺、队伍卡、十张手牌、
  //   右侧详情面板。而它真正影响的只有 CardInfoPanel 的内容与 AllyBar 里的一格高亮 ——
  //   现在由那两个组件各自订阅, 本组件对悬停完全无感。⚠ 别再把它搬回来。
  const [handAction, setHandAction] = useState<HandAction>(null);
  const [openPile, setOpenPile] = useState<Pile | null>(null);
  // 手牌渲染列表(本地维护): 在引擎手牌之外, 额外保留"正在出鞘渐隐"的离场卡, 直到其动画播完再移除。
  // 新出现的卡自动挂载 → CSS 触发飞入动画(见 ui/HandCard.css .hand-card 的 hand-deal-in)。
  const [renderHand, setRenderHand] = useState<
    { card: Card; leaving: boolean; dealDelay: number }[]
  >([]);
  // 正在出牌离场的卡: 点击瞬间即开始出鞘(引擎稍后才在命中时刻把它移出手牌), 避免先缩回未选中位再飞出。
  const [playingOutUid, setPlayingOutUid] = useState<string | null>(null);

  // —— 出牌动画编排(纯 UI): 施法者弹出 → 顿 → 镜头推近聚焦目标 → 命中特效/飘字 → 镜头恢复/归位 ——
  const [attackerId, setAttackerId] = useState<string | null>(null); // 正在弹出的施法者
  const [hits, setHits] = useState<Record<string, HitFx>>({}); // 各目标当前的受击特效
  const [cutInCard, setCutInCard] = useState<Card | null>(null); // 出牌亮相卡面(仅玩家出牌; null=不展示)
  // —— 瞄准运镜(挑目标期间的常驻态, 与上面的分镜相机互斥) ——
  // aimFoeId: 当前朝向的敌人, **锁存** —— 只在悬到另一个敌人或指针离开 .battle-stage 时才变。
  // ⓘ 这是个顶层 hover state, 与本文件上方 selectedUid 处"悬停态别放这里"的告诫**不矛盾**:
  //   那条针对手牌(鼠标扫过一排 10 张牌 ⇒ 连续 setState 全量重渲染)。敌人最多 4 个、且只在
  //   待选目标态里响应, 触发频率与点击同级, 代价等同于 setSelectedUid 本身。
  const [aimFoeId, setAimFoeId] = useState<string | null>(null);
  const [aim, setAim] = useState<Camera | null>(null); // 瞄准相机(null=不在瞄准态)
  const [camera, setCamera] = useState<Camera | null>(null); // 分镜/瞄准相机目标
  const [cameraMoving, setCameraMoving] = useState(false);
  const [spillSrc, setSpillSrc] = useState<string | null>(null); // 溢出填充图(见下方 grabSpill)
  const [hitstop, setHitstop] = useState(false);
  const [fxRate, setFxRate] = useState(1);
  const [speed2x, setSpeed2x] = useState(false);
  const playbackRateRef = useRef(1);
  const viewportRef = useRef<HTMLDivElement>(null); // letterbox 容器(黑边区), 设计画布按它的尺寸缩放
  const screenRef = useRef<HTMLDivElement>(null); // 战斗屏幕(画布 = 唯一的裁切边界)
  const sceneRef = useRef<HTMLDivElement>(null); // ★ 场景层: 相机(推近/平移)的唯一作用对象
  const worldRef = useRef<HTMLDivElement>(null); // ★ 世界层: 背景 + 氛围 + 舞台同在其中; 承载 rig 的漂移与冲击
  const stageRef = useRef<HTMLDivElement>(null); // 战场舞台层(敌我单位); 其布局盒 = 相机的取景安全区
  const bgVideoRef = useRef<HTMLVideoElement>(null); // 背景视频(仅用于抓首帧做溢出填充)
  // 设计画布(1920×1080)→ 屏幕的等比缩放系数。以 CSS 变量下发给 .screen.battle 的 transform。
  const stageScale = useStageScale(viewportRef);
  const viewportStyle = useMemo(
    () =>
      ({
        "--stage-scale": stageScale,
        "--perspective": `${CINEMA.perspective}px`,
      }) as React.CSSProperties,
    [stageScale],
  );
  const worldStyle = useMemo(
    () => ({ "--fx-rate": fxRate, ...DEPTH_VARS }) as React.CSSProperties,
    [fxRate],
  );

  const [animating, setAnimating] = useState(false); // 动画期间锁输入
  const animatingRef = useRef(false); // 同步守卫(避免同一时刻重复触发)
  const seqRef = useRef(0); // 批次序号, 用于取消旧动画批次的定时器回调
  const hitSeqRef = useRef(0); // 受击特效序号, 递增以强制 React 重放同一目标的连续特效
  const cameraSettleTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const cameraStateReadyRef = useRef(false);
  const dealtUidsRef = useRef(new Set<string>()); // 已经播过飞入动画的卡 uid
  const openingDoneRef = useRef(false); // 本场战斗的首批手牌是否已发出
  const timelineRef = useRef<Timeline | null>(null);
  const triggerPlayRef = useRef<(uid: string, primaryId?: string) => void>(() => undefined);
  const combatantClickRef = useRef<(id: string) => void>(() => undefined);
  const cameraRig = useCameraRig({ sceneRef, worldRef, screenRef });
  const setCameraTarget = (next: Camera | null) => {
    cameraRig.setCamera(next);
    setCamera(next);
  };
  const snapCameraTarget = (next: Camera | null) => {
    cameraRig.snap(next);
    setCamera(next);
  };
  const setPlaybackRate = (rate: number, persist = true) => {
    if (persist) playbackRateRef.current = rate;
    cameraRig.setTimeScale(rate);
    cameraRig.setFxRate(rate);
    setFxRate(rate);
  };

  const togglePlaybackSpeed = () => {
    const next = playbackRateRef.current === 2 ? 1 : 2;
    playbackRateRef.current = next;
    setSpeed2x(next === 2);
    if (hitstop) {
      cameraRig.setFxRate(next);
      setFxRate(next);
    } else if (animatingRef.current) {
      setPlaybackRate(next);
    }
  };

  // 换战斗时清空选择/悬浮/动画(并让在途动画批次失效)
  useEffect(() => {
    setSelectedUid(null);
    resetHandHover();
    setHandAction(null);
    setOpenPile(null);
    timelineRef.current?.cancel();
    timelineRef.current = null;
    seqRef.current++;
    animatingRef.current = false;
    setAnimating(false);
    setAttackerId(null);
    setHits({});
    setCutInCard(null);
    snapCameraTarget(null);
    setAimFoeId(null);
    setAim(null);
    setHitstop(false);
    setPlaybackRate(1);
    setSpeed2x(false);
    dealtUidsRef.current.clear();
    openingDoneRef.current = false;
    setRenderHand([]); // 换战斗: 清空手牌渲染列表, 让新战斗的手牌重新飞入(不播放旧牌离场)
    setPlayingOutUid(null);
  }, [battleSeq]);

  // 卸载时取消当前批次；rig 自己负责销毁 rAF。
  useEffect(
    () => () => {
      timelineRef.current?.cancel();
      if (cameraSettleTimerRef.current !== null) {
        window.clearTimeout(cameraSettleTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!cameraStateReadyRef.current) {
      cameraStateReadyRef.current = true;
      return;
    }
    setCameraMoving(true);
    if (cameraSettleTimerRef.current !== null) {
      window.clearTimeout(cameraSettleTimerRef.current);
    }
    cameraSettleTimerRef.current = window.setTimeout(() => {
      cameraSettleTimerRef.current = null;
      setCameraMoving(false);
    }, CAMERA_SETTLE_MS);
  }, [camera, aim]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!animatingRef.current || (event.key !== "Escape" && event.code !== "Space")) return;
      event.preventDefault();
      timelineRef.current?.flush();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // 预热序列帧特效素材: 帧图是 12 个独立请求, 不预热首次播放会逐帧闪。
  // 敌人待机立绘同理(拼条单文件但体积大), 不预热则进战斗首帧空白。
  // 放在进战斗时(而非模块顶层)以免菜单界面白付流量; 到首次命中前预留加载余量。
  useEffect(() => {
    warmVfxSprites();
    warmEnemyArt();
    warmBattleBg();
  }, []);

  useEffect(() => {
    if (!battle || battle.phase !== "won" || battleSettled) return;
    resolveBattle();
  }, [battle, battleSettled, resolveBattle]);

  // ── 溢出填充图 ──
  // 静态图背景直接复用同一个 URL(浏览器共享那份解码, 零额外成本);
  // 视频背景则从**已经在放的那个** <video> 抓一帧画进 64×36 的小 canvas —— 反正要被
  // blur(36px) 糊掉, 不需要分辨率, 更不必为此挂第二个 <video>(那会双解码, 见 README)。
  useEffect(() => {
    setSpillSrc(bg.kind === "image" ? bg.src : null);
  }, [bg.kind, bg.src]);

  const grabSpill = () => {
    const v = bgVideoRef.current;
    if (!v) return;
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 36;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    setSpillSrc(c.toDataURL());
  };

  // 同步渲染列表 = 引擎手牌 + 离场中的卡。引擎手牌里消失的卡标记 leaving(出鞘渐隐, 保留原位),
  // 新增的卡追加到末尾(挂载即飞入)。leaving 卡在其离场动画结束后由 handleCardExited 移除。
  useEffect(() => {
    if (!battle) return;
    const liveSet = new Set(battle.hand);
    const newUids = battle.hand.filter((uid) => !dealtUidsRef.current.has(uid));
    const base = openingDoneRef.current ? 0 : HAND_DEAL.opening;
    const delayOf = new Map(newUids.map((uid, k) => [uid, base + k * HAND_DEAL.stagger]));
    if (newUids.length > 0) openingDoneRef.current = true;
    newUids.forEach((uid) => dealtUidsRef.current.add(uid));
    setRenderHand((prev) => {
      const prevUids = new Set(prev.map((e) => e.card.uid));
      const merged = prev.map((e) =>
        liveSet.has(e.card.uid)
          ? { card: battle.cards[e.card.uid], leaving: false, dealDelay: e.dealDelay }
          : { card: e.card, leaving: true, dealDelay: e.dealDelay },
      );
      for (const uid of battle.hand) {
        if (!prevUids.has(uid)) {
          merged.push({
            card: battle.cards[uid],
            leaving: false,
            dealDelay: delayOf.get(uid) ?? 0,
          });
        }
      }
      return merged;
    });
  }, [battle]);

  const handleCardExited = useCallback((uid: string) => {
    dealtUidsRef.current.delete(uid);
    setRenderHand((prev) => prev.filter((e) => e.card.uid !== uid));
    setPlayingOutUid((cur) => (cur === uid ? null : cur));
  }, []);

  const isPlayerTurn = battle?.phase === "player";
  const selectedCard = battle && selectedUid ? battle.cards[selectedUid] : null;
  const needsFoe = selectedCard?.targeting === "foe";
  const needsAlly = selectedCard?.targeting === "ally";

  const runHandAction = useCallback(
    (uid: string) => {
      const next = handAction === "redraw" ? redrawCard(uid) : discardCard(uid);
      if (next) {
        commit(next);
        setHandAction(null);
        resetHandHover();
      }
    },
    [commit, discardCard, handAction, redrawCard],
  );

  const onCardClick = useCallback(
    (uid: string) => {
      if (!battle || !isPlayerTurn || animating || handAction) return;
      if (!canPlay(battle, uid)) return;
      const card = battle.cards[uid];
      if (card.targeting === "foe" || card.targeting === "ally") {
        setSelectedUid((prev) => (prev === uid ? null : uid));
      } else {
        triggerPlayRef.current(uid);
      }
    },
    [animating, battle, handAction, isPlayerTurn],
  );

  const onCombatantClick = useCallback((id: string) => {
    combatantClickRef.current(id);
  }, []);

  // ★ 仇恨系统已移除 —— 敌人在存活我方单位里随机挑目标, 因此不存在"预计会打谁"这件事,
  //   原先的仇恨目标高亮与它的洞察开关一并删除。

  // 待机小动作: 每隔几秒随机让一个存活敌人抖一下(纯表现)。分镜播放期间关掉, 免得和演出打架。
  // ⚠ hook 必须在下面的早退之前调用, 故这里从 battle 现算存活名单而非复用后面的 enemies。
  const aliveEnemyIds = useMemo(
    () => (battle ? battle.enemyIds.filter((id) => battle.combatants[id].alive) : []),
    [battle],
  );
  const twitchId = useIdleTwitch(aliveEnemyIds, !animating);

  // 瞄准相机的驱动: "选中了一张指向敌人的卡 且 不在分镜里" ⇒ 推近(并朝锁存的目标偏移),
  // 否则退出瞄准态。分镜期间恒不生效 —— startBatch 会清 selectedUid 并上锁, 这里只是二重保险。
  // ⚠ hook 必须在下面的早退之前, 故条件全部在 effect 内部从 battle 现算(与 useIdleTwitch 同理)。
  // 用 useLayoutEffect: 与首帧同步测量, 避免瞄准态先渲染一帧全景再跳。
  // stageScale 进依赖: 窗口尺寸变了要重测(结果虽是设计 px, 但 DOM 矩形已变)。
  useLayoutEffect(() => {
    const card = battle && selectedUid ? battle.cards[selectedUid] : null;
    const on =
      !!battle && battle.phase === "player" && !animating && card?.targeting === "foe";
    const next = on ? computeAimCamera(worldRef.current, stageRef.current, aimFoeId) : null;
    if (!animating) setCameraTarget(next);
    setAim((prev) => (sameCamera(prev, next) ? prev : next));
  }, [battle, selectedUid, aimFoeId, animating, stageScale, cameraRig]);

  if (!battle) return <div className={s.loading}>加载中…</div>;
  const b = battle; // 非空别名: 供下方事件处理闭包安全引用(收窄不跨闭包)

  // 本次出牌"接收特效"的目标单位(攻击→敌人受击; 辅助→友军柔光)
  function fxTargets(uid: string, primaryId?: string): string[] {
    const card = b.cards[uid];
    // 施放确认目标与效果范围可以不同，例如回旋斩需点选敌人确认，但命中所有敌人。
    if (card.effects.some((effect) => effect.target === "allFoes")) {
      return b.enemyIds.filter((id) => b.combatants[id].alive);
    }
    if (card.effects.some((effect) => effect.target === "allAllies")) {
      return b.playerIds.filter((id) => b.combatants[id].alive);
    }
    switch (card.targeting) {
      case "foe":
      case "ally":
        return primaryId ? [primaryId] : [];
      case "self":
        return [card.ownerCharId];
      default:
        return [];
    }
  }

  // ── 统一动画帧队列 ──
  // 一"步"= 一个施法者的一次动作: 前冲蓄力 → 命中(提交该动作后的状态快照 + 受击特效/飘字) → 下一步。
  // 玩家出牌是第 0 步, 随后接续它触发的每个敌人行动; 结束回合则是冲刷的敌人行动逐步。
  // 引擎产出的敌人动画帧 → 一步(动画表现在 UI 侧按招式解析)。
  function stepFromFrame(f: AnimFrame): ChoreoStep {
    const def = getEnemyDef(f.enemyDefId);
    const move = def.moves.find((m) => m.id === f.moveId) ?? def.moves[0];
    return { actorId: f.actorId, anim: moveAnim(move), snapshot: f.snapshot, hits: f.hits };
  }

  // 计算相机变换: 把给定目标(多目标取并集)聚焦到取景安全区中心并放大。
  // 全程在世界坐标(设计 px)里算, 不出现任何屏幕 px、不需要 --stage-scale ——
  // 故任何窗口尺寸下的推镜结果逐 px 一致。
  //
  // 取景安全区 = .battle-stage 的布局盒(而非整个画布): 目标居中到清晰可见区, 不会跑到
  // 左侧透明手牌栏底下(见上方 safeArea)。
  //
  // 刻意不做边界钳制: 目标永远精确居中, 世界之外露出的部分由 .battle-bg-spill 填充。
  function computeCamera(targetIds: string[], shot: ShotPreset): Camera | null {
    const world = worldRef.current, stage = stageRef.current;
    if (!world || !stage || targetIds.length === 0) return null;

    // 目标并集包围盒(世界坐标)
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (const id of targetIds) {
      const index = b.enemyIds.indexOf(id);
      const placement = index >= 0 ? slotPlacement(getEncounter(b.encounterId).enemies[index]) : undefined;
      const w = unitWorldBox(world, id, placement);
      if (!w) continue;
      left = Math.min(left, w.left);
      top = Math.min(top, w.top);
      right = Math.max(right, w.right);
      bottom = Math.max(bottom, w.bottom);
    }
    if (!isFinite(left)) return null;

    // 取景安全区(世界 px)
    const safe = safeArea(stage);

    // 并集需占据视野, 但留出镜位自己的边距, 再与镜位上限取较小值防溢出。
    const spanW = Math.max(1, right - left), spanH = Math.max(1, bottom - top);
    const fit = Math.min((safe.w * shot.fit) / spanW, (safe.h * shot.fit) / spanH);
    const s = Math.max(1, Math.min(shot.scale, fit));

    const F = { x: (left + right) / 2, y: (top + bottom) / 2 }; // 聚焦点: 并集中心
    const A = { x: safe.x + safe.w / 2, y: safe.y + safe.h / 2 }; // 画框锚点: 安全区中心
    const nx = clamp((F.x - A.x) / (safe.w / 2), 1);
    const ny = clamp((F.y - A.y) / (safe.h / 2), 1);
    return {
      s,
      ...worldShift(A, F, s),
      yaw: nx * shot.yaw,
      pitch: -ny * shot.pitch,
      roll: nx === 0 ? 0 : shot.roll * Math.sign(nx),
    };
  }

  function impactAxis(step: ChoreoStep, targetIds: string[]) {
    const world = worldRef.current;
    if (!world) return { x: 0, y: -1 };
    const target = targetIds.map((id) => unitWorldBox(world, id)).find(Boolean);
    const actor = unitWorldBox(world, step.actorId);
    if (!target || !actor) return { x: 0, y: -1 };
    const tx = (target.left + target.right) / 2;
    const ty = (target.top + target.bottom) / 2;
    const ax = (actor.left + actor.right) / 2;
    const ay = (actor.top + actor.bottom) / 2;
    const length = Math.hypot(tx - ax, ty - ay) || 1;
    return { x: (tx - ax) / length, y: (ty - ay) / length };
  }

  function shouldHardCut(previous: ChoreoStep, current: ChoreoStep, previousFocus: Camera | null, currentFocus: Camera | null) {
    const factionChanged = b.playerIds.includes(previous.actorId) !== b.playerIds.includes(current.actorId);
    if (factionChanged) return true;
    if (!previousFocus || !currentFocus) return false;
    return Math.hypot(currentFocus.dx - previousFocus.dx, currentFocus.dy - previousFocus.dy) > CAMERA_HARD_CUT_DISTANCE;
  }

  function runSteps(steps: ChoreoStep[], final: BattleState, seq: number, enter: Camera | null) {
    const plans = choreograph(steps, b);
    const finishBatch = () => {
      if (seqRef.current !== seq) return;
      commit(final);
      cameraRig.setTimeScale(1);
      snapCameraTarget(null);
      cameraRig.setTuning(null);
      setPlaybackRate(1, false);
      setAttackerId(null);
      setHits({});
      setCutInCard(null);
      setHitstop(false);
      timelineRef.current = null;
      animatingRef.current = false;
      setAnimating(false);
    };
    if (plans.length === 0) {
      finishBatch();
      return;
    }
    const timeline = createTimeline(seq, () => cameraRig.getTimeScale(), finishBatch);
    timelineRef.current?.cancel();
    timelineRef.current = timeline;

    let at = 0;
    let lastActor = "";
    let lastAnim: CardAnim | null = null;
    plans.forEach(({ step, preset, targetIds, keepCamera }, index) => {
      const repeat = lastActor === step.actorId && lastAnim === step.anim ? 1 : 0;
      const hold = preset.hold * Math.max(0.55, 0.78 ** repeat);
      const cutIn = step.card ? CINEMA.cardIn + CINEMA.cardHold + CINEMA.cardOut : 0;
      const hitAt = at + preset.lead + cutIn;
      const focus = () => (preset.kind === "none" ? null : computeCamera(targetIds, preset));
      timeline.add({
        at,
        run: () => {
          setAttackerId(step.actorId);
          cameraRig.setTuning(preset.rig);
          if (index === 0 && enter) setCameraTarget(enter);
          else if (index === 0) setCameraTarget(null);
        },
      });
      timeline.add({
        at: at + preset.lead,
        run: () => {
          const previous = index > 0 ? plans[index - 1] : null;
          const nextFocus = focus();
          if (!previous || index === 0) {
            setCameraTarget(nextFocus);
            return;
          }
          const previousFocus = previous.preset.kind === "none" ? null : computeCamera(previous.targetIds, previous.preset);
          const hardCut = previous.preset.kind === "kill" || shouldHardCut(previous.step, step, previousFocus, nextFocus);
          if (hardCut) snapCameraTarget(nextFocus);
          else if (!keepCamera) setCameraTarget(nextFocus);
        },
      });
      if (step.card) {
        timeline.add({ at: at + preset.lead, run: () => setCutInCard(step.card ?? null) });
        timeline.add({ at: hitAt, run: () => setCutInCard(null) });
      }
      timeline.add({
        at: hitAt,
        run: () => {
          commit(step.snapshot);
          const hitSeq = ++hitSeqRef.current;
          const map: Record<string, HitFx> = {};
          for (const h of step.hits) {
            const fx: HitFx = { anim: step.anim, seq: hitSeq };
            if (ANIM[step.anim].kind === "attack" && h.hpDelta > 0) fx.float = { text: `-${h.hpDelta}`, tone: "dmg" };
            else if (ANIM[step.anim].kind === "support" && h.hpDelta < 0) fx.float = { text: `+${-h.hpDelta}`, tone: "heal" };
            map[h.id] = fx;
          }
          setHits(map);
          const impactDelay = ANIM[step.anim].iai?.impactMs ?? 0;
          timeline.schedule(impactDelay, () => {
            setHitstop(preset.hitstop > 0);
            if (preset.hitstop > 0) {
              cameraRig.setTimeScale(0);
            }
            const axis = impactAxis(step, targetIds);
            cameraRig.punch(preset.punch);
            cameraRig.impact(axis, preset.shake, -axis.x * preset.roll * 0.35);
            if (preset.creep > 0) {
              timeline.schedule(Math.round(hold * 0.35), () => {
                const current = focus();
                if (current) setCameraTarget({ ...current, dy: current.dy - preset.creep });
              });
            }
            if (preset.hitstop > 0) {
              timeline.schedule(preset.hitstop, () => {
                setHitstop(false);
                const slow = preset.slowmo?.scale ?? 1;
                setPlaybackRate(slow, false);
                if (preset.slowmo) timeline.schedule(preset.slowmo.ms, () => setPlaybackRate(playbackRateRef.current), true);
                else setPlaybackRate(playbackRateRef.current);
              }, true);
            }
          });
        },
      });
      timeline.add({ at: hitAt + hold, run: () => { setHits({}); setAttackerId(null); } });
      at = hitAt + hold + 40;
      lastActor = step.actorId;
      lastAnim = step.anim;
    });
    timeline.add({ at: at + 260, run: () => setCameraTarget(null) });
    timeline.add({ at: at + 520, run: () => undefined });
    timeline.start();
  }

  // 开启一个动画批次: 上锁 + 清选择, 逐步回放。空步数则直接落到终态。
  // enter: 第 0 步「顿」期间的镜头(null=回全景)。玩家出牌时传当前瞄准位, 见 triggerPlay。
  function startBatch(steps: ChoreoStep[], final: BattleState, enter: Camera | null = null) {
    const seq = ++seqRef.current;
    animatingRef.current = true;
    setAnimating(true);
    setPlaybackRate(playbackRateRef.current);
    setSelectedUid(null);
    setHandAction(null);
    setAimFoeId(null); // 瞄准朝向只在一次"挑目标"里有效, 不该跨到下一张卡
    // ⓘ 这里刻意**不清**悬停态 —— 保持与旧 hoveredUid 实现逐帧一致的行为。
    //   (旧实现有个遗留小毛病: 打出的那张卡 leaving 后带 pointer-events:none 且随即卸载,
    //    永远收不到 mouseleave ⇒ 右侧详情面板会一直停在这张已经打出去的卡上, 直到鼠标
    //    悬到另一张牌。想修的话在这里加一行 resetHandHover() 即可, 但那是行为变更, 单独议。)
    runSteps(steps, final, seq, enter);
  }

  // 出牌: 先算出动画计划(含触发的敌人行动), 玩家出牌为第 0 步, 敌人行动依次接续。
  function triggerPlay(uid: string, primaryId?: string) {
    if (animatingRef.current) return;
    const card = b.cards[uid];
    const anim = cardAnim(card);
    const targets = fxTargets(uid, primaryId);
    const before: Record<string, number> = {};
    for (const id of targets) before[id] = b.combatants[id]?.hp ?? 0;

    const plan = play(uid, primaryId);
    if (!plan) return;
    setPlayingOutUid(uid); // 出牌成功: 立即让该卡从当前(选中弹出)位开始向右出鞘

    const cardHits = targets.map((id) => ({
      id,
      hpDelta: before[id] - (plan.cardSnapshot.combatants[id]?.hp ?? before[id]),
    }));
    const steps: ChoreoStep[] = [
      { actorId: card.ownerCharId, anim, snapshot: plan.cardSnapshot, hits: cardHits, card },
      ...plan.frames.map(stepFromFrame),
    ];

    // 出牌瞬间的镜头交接: 从瞄准位**接着往下推**, 不回全景(见 runSteps 的 enter)。
    // ⚠ 但姿态(yaw/pitch)必须在这一刻归零, 只留推近与平移 —— 两个理由:
    //   ① 叙事上: 目标已确认, 镜头该对正了; 保持歪着推进反而像没瞄准好。
    //   ② 技术上(硬性): 500ms 后 computeCamera 要量目标位置, 而 screenToWorld 只在场景是
    //      2D 仿射(纯缩放+平移)时才精确 —— 带着偏航去量, 反投影会有几十 px 的系统性偏差,
    //      推近后目标就不在画面正中了。详见 screenToWorld 的注释。
    //   转正使用短于首个命中节拍的过渡, 到量取时刻已经稳定落位。
    const enter = aim ? { ...aim, yaw: 0, pitch: 0 } : null;
    startBatch(steps, plan.final, enter);
  }
  triggerPlayRef.current = triggerPlay;

  // 结束回合: 逐步播放冲刷的敌人行动, 最后落到下一回合起始态。
  function triggerEndTurn() {
    if (animatingRef.current) return;
    const plan = end();
    if (!plan) return;
    startBatch(plan.frames.map(stepFromFrame), plan.final);
  }

  function performCombatantClick(id: string) {
    if (!selectedUid || !selectedCard || animating) return;
    const t = b.combatants[id];
    if (!t.alive) return;
    if (needsFoe && t.team === "enemy") triggerPlay(selectedUid, id);
    else if (needsAlly && t.team === "player") triggerPlay(selectedUid, id);
  }
  combatantClickRef.current = performCombatantClick;

  const enemies = battle.enemyIds.map((id) => battle.combatants[id] as Enemy);
  const allies = battle.playerIds.map((id) => battle.combatants[id]);
  // 手工站位按槽位下标取 —— createBattle 按 enc.enemies 顺序 push enemyIds, 故两者下标一一对应。
  // 站位是纯表现, 不进 BattleState(引擎无副作用且状态要可序列化), 故在此回查遭遇战定义。
  const placements = getEncounter(battle.encounterId).enemies.map(slotPlacement);
  // ★ 「当前关注的手牌」= 悬停 ?? 选中 —— 但这个合并**不在这里做**, 而是由 AllyBar 与
  //   CardInfoPanel 各自完成: 悬停那半它们自己从 ui/handFocusStore.ts 订阅, 选中这半由
  //   下面以 props 传下去。理由是性能(见文件上方 selectedUid 处的注释), 语义完全不变 ——
  //   选中待选目标期间 selectedCard 仍在, 详情与槽位高亮因此持续可见。
  //   (归属角色 = card.ownerCharId; 我方 Combatant 的 id 就是角色 id, runStore.launchBattle
  //    如此建局, fxTargets 的 case "self" 也依赖这一点。)

  // 居合斩全屏压暗: 由 hits 派生, 与特效同挂同卸(tRestore 的 setHits({}) 自动清掉),
  // key=seq 保证连发重放。零新增 state / 计时器。
  const dimHit = Object.values(hits).find((h) => ANIM[h.anim].iai);
  // 我方角色前冲上浮时(data-attacking, 见 fx/HitFxLayer.module.css)，让开左下角这三块 UI
  const playerActing = !!attackerId && battle.playerIds.includes(attackerId);

  return (
    // --stage-scale: 把 1920×1080 的设计画布等比缩到当前窗口(见 ui/stage.ts 与 BattleScreen.css .screen.battle)
    <div
      className={s["battle-viewport"]}
      ref={viewportRef}
      style={viewportStyle}
    >
      <div
        className={s.battle}
        // 顿帧标记走属性: 要冻住的动画分属 EnemySprite / CombatantView / 本文件三处,
        // 属性不参与 Modules 哈希, 是唯一能跨模块命中的通道(样式铁律 2)。
        data-hitstop={hitstop ? "" : undefined}
        ref={screenRef}
        onClick={() => setSelectedUid(null)}
      >
      {/* 溢出填充: 相机强制把目标居中(不做边界钳制), 世界之外露出的区域由这一层兜底 ——
          同一张背景的模糊放大副本, 观感远好于纯黑。它在场景之外 ⇒ 不跟相机动, 始终铺满画布。 */}
      {spillSrc && <img className={s["battle-bg-spill"]} src={spillSrc} alt="" aria-hidden="true" />}

      {/* ★ 场景层(世界 1920×1080) = 相机的唯一作用对象。背景与敌我单位同在其中, 由同一份
          transform 驱动。★ 场景**不再是刚体**: 各层带着不同的纵深(CINEMA.depth), 相机一动
          就按深度分速率位移 —— 这就是 3D 感的来源, 代价是角色与背景地面会相对滑移。
          裁切在 .screen.battle(整屏), 故推近时角色可越过舞台边界铺满画面。
          camera ?? aim: 分镜相机优先, 挑目标期间才轮到瞄准相机(两者天然互斥, 见上方 effect)。 */}
      <div
        className={s["battle-scene"]}
        ref={sceneRef}
        style={{ willChange: cameraMoving ? "transform" : "auto" }}
        onTransitionEnd={(event) => {
          if (event.propertyName !== "transform" || event.target !== event.currentTarget) return;
          if (cameraSettleTimerRef.current !== null) {
            window.clearTimeout(cameraSettleTimerRef.current);
            cameraSettleTimerRef.current = null;
          }
          setCameraMoving(false);
        }}
      >
        {/* ★ 世界层: 相机之下、场景内容之上的一层。它同样包住背景 + 氛围 + 舞台,
          存在的意义是承载 rig 直接写入的空闲漂移、冲击位移与 punch 缩放。
          刻意 position:absolute + inset:0 与场景层几何重合 ⇒ 它成为 .battle-stage 的
          offsetParent, computeCamera 读的取景安全区(stage.offsetLeft/Top/W/H)一个数都不用改。
          ⚠ 它必须保持 transform-style: preserve-3d(见 CSS) —— 各纵深层就挂在它下面,
            一旦它 flatten, 视差(以及整个 3D 感)当场消失。
          --depth-*: 各层的纵深与抵消透视的预缩放, 唯一真相在 CINEMA.depth。 */}
      <div
        className={s["battle-world"]}
        ref={worldRef}
        style={worldStyle}
      >
      {/* 背景层: 精确铺满世界, 素材按当前地图取(见 ui/battleBg.ts)。视频与静态图两个分支
          共用同一份 className —— 对场景相机而言二者完全等价, 都只是世界里的一张地皮。 */}
      {bg.kind === "video" ? (
        <video
          ref={bgVideoRef}
          className={s["battle-bg-video"]}
          src={bg.src}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onLoadedData={grabSpill}
        />
      ) : (
        <img className={s["battle-bg-video"]} src={bg.src} alt="" />
      )}

      {/* 场景氛围: 按地图登记的 Canvas 粒子(雨/光尘/雾)+ 可选的灯光闪烁。两张画布靠 z-index
          夹住舞台 —— far 在单位之下、near 在单位之上并整层失焦, 纵深由此而来。
          它在世界内 ⇒ 跟随相机与 rig 的动态位移。顿帧期间 paused, 粒子和 CSS 动画一起冻住。 */}
      <AmbienceLayer mapId={mapId} paused={hitstop} fxRate={fxRate} />

      {/* 战场舞台层: 世界里的一块子矩形(避开左侧手牌栏), 同时是相机的取景安全区。
          它不带自己的 transform —— 相机只驱动外层的 .battle-scene。 */}
      {/* ⓘ onMouseLeave 清瞄准朝向刻意挂在**这一层**而不是逐个敌人身上: 瞄准镜头一平移, 敌人
          就从指针底下挪走了, 逐敌人清除会形成「平移 → leave → 回中 → enter → 平移」的来回震荡。
          .battle-stage 是一大块区域, 这点位移不会让指针离开它 ⇒ 朝向在区域内锁存, 稳定。 */}
      <div className={s["battle-stage"]} ref={stageRef} onMouseLeave={() => setAimFoeId(null)}>
        {/* 敌人 */}
        <div className={s["enemy-row"]}>
          {enemies.map((e, i) => (
            <CombatantView
              key={e.id}
              cmb={e}
              currentTick={battle.tick}
              targetable={isPlayerTurn && !!needsFoe && e.alive}
              attacking={e.id === attackerId}
              hit={hits[e.id] ?? null}
              placement={placements[i]}
              twitching={e.id === twitchId}
              onClick={onCombatantClick}
              onHover={setAimFoeId}
            />
          ))}
        </div>

        {/* 提示条 */}
        {/* <div className={s["hint-bar"]}>
          {handAction === "redraw"
            ? "▶ 选择一张手牌换牌"
            : handAction === "discard"
              ? "▶ 选择一张手牌丢弃"
              : selectedCard
            ? needsFoe
              ? "▶ 选择一个敌人作为目标(再次点击卡牌取消)"
              : needsAlly
                ? "▶ 选择一名友军作为目标(再次点击卡牌取消)"
                : ""
            : isPlayerTurn
              ? "点击卡牌打出。普通牌会推进 1 时刻, 速攻牌不推进。"
              : ""}
        </div> */}
      </div>
      </div>
      </div>

      {/* 屏幕空间调色: 暗角 / 色偏 / 扫描线。刻意在场景**之外** —— 这是「镜头」而非「场景」,
          跟着相机放大的话暗角会被推出画面而失效。参数按地图登记在 ui/ambience.ts。 */}
      <AmbienceGrade mapId={mapId} />

      {/* 居合斩全屏压暗: 刻意在 .battle-scene 之外(z 1) —— 盖住场景与调色层、不盖
          HUD/顶栏; 不受 combatant-stage 的 scale 包含块与顿帧暂停选择器影响, 70ms
          顿帧期间压暗/反白闪照常播(世界冻结、刀光继续走)。 */}
      {dimHit && <div key={dimHit.seq} className={s["battle-dim"]} aria-hidden />}

      {/* <RoundIndicator
        round={battle.round}
        maxRound={12}
        tick={battle.tick}
        enemies={enemies}
      /> */}
      {battle && <ChallengeRail challenges={battle.challenges} />}
      <div className={s.topRight}>
        {battleMeta && <BondRail bonds={battleMeta.bonds} />}
        <BattleActions
          canEndTurn={isPlayerTurn && !animating}
          onEndTurn={triggerEndTurn}
          speed2x={speed2x}
          onToggleSpeed={togglePlaybackSpeed}
        />
      </div>

      {/* ★ 底部一体化 HUD: 队伍卡 | 手牌托盘(两列; 卡牌说明面板已搬到画布右上角, 见下方)。
          刻意在 .battle-scene **之外** ⇒ 整条不跟分镜相机推近/漂移/震屏, 构图恒定。
          它同时意味着我方单位不在 .battle-stage 内 —— computeCamera 查不到我方的
          data-cmb-id, 走它现成的 `if (!isFinite(left)) return null` 兜底保持全景, 于是
          「打自身/友军牌时不推镜, 只播特效 + 震屏」不需要任何特判(见 ui/AllyBar.tsx 注释)。 */}
      <div className={s["battle-hud"]} onClick={(e) => e.stopPropagation()}>
        <div className={cx(s["party-dock"], playerActing && s["dock-hidden"])}>
          <HandTools
            battle={battle}
            handAction={handAction}
            isPlayerTurn={isPlayerTurn}
            animating={animating}
            onToggle={(action) => {
              setSelectedUid(null);
              setHandAction((current) => (current === action ? null : action));
            }}
          />
          <ManaBar battle={battle} />
          <AllyBar
            allies={allies}
            hits={hits}
            attackerId={attackerId}
            focusFallbackCard={selectedCard}
            targetable={isPlayerTurn && !!needsAlly}
            onSelect={onCombatantClick}
          />
        </div>
        <HandTray
          renderHand={renderHand}
          battle={battle}
          isPlayerTurn={isPlayerTurn}
          handAction={handAction}
          selectedUid={selectedUid}
          playingOutUid={playingOutUid}
          onCardClick={onCardClick}
          onCardAction={runHandAction}
          onCardExited={handleCardExited}
        />
      </div>

      <PileRail battle={battle} onOpenPile={setOpenPile} />

      <PileDrawer battle={battle} pile={openPile} onClose={() => setOpenPile(null)} />

        {/* ★ 卡牌说明固定面板: 画布**右上角**, 为右侧竖排牌堆让出一列。位置恒定。
          展示「悬停 ?? 选中」那张卡 ——
          悬停那半它自己订阅 ui/handFocusStore.ts, 这里只把选中的传下去(理由同 AllyBar)。
          刻意在 .battle-hud **之外**(它曾是 HUD 的第三列) —— 牌堆移到右上角后，底部托盘不再
          为牌堆让位, 几何与层序的完整理由见 ui/CardInfoPanel.css .card-info-panel。
          同样在 .battle-scene 之外 ⇒ 不跟分镜相机推近/漂移/震屏。 */}
      <CardInfoPanel fallbackCard={selectedCard} />

      {/* 战败遮罩。胜利由战斗画布内的 VictoryPanel 接管, 不再跳战后小结页。 */}
      {battle.phase === "lost" && (
        <div className={s.overlay}>
          <div className={s["overlay-card"]}>
            <h2>💀 战斗失败</h2>
            {/* `primary` 是 styles/base.css 的**全局**按钮皮肤(button.primary), 不是本模块的类 */}
            <button className="primary" onClick={() => resolveBattle()}>
              继续
            </button>
          </div>
        </div>
      )}

      <VictoryPanel />

      {/* 出牌亮相卡面: 挂在舞台层之外, 不受相机缩放/裁切影响 */}
      <SkillCutInCard card={cutInCard} />
      </div>
    </div>
  );
}
