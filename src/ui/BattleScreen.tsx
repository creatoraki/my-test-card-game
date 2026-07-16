import { useEffect, useMemo, useRef, useState } from "react";
import { canPlay, RULES, type AnimFrame, type BattleState, type Card, type CardAnim, type Enemy } from "../engine";
import { getEncounter, getEnemyDef, slotPlacement } from "../data";
import { useBattleStore } from "../store/battleStore";
import { useRunStore } from "../store/runStore";
import { CombatantView, isIntentRevealed } from "./CombatantView";
import { HandCard } from "./HandCard";
import { CardDetailPopup } from "./CardDetailPopup";
import { SkillCutInCard } from "./SkillCutInCard";
import { ANIM, CINEMA, cardAnim, moveAnim, type HitFx } from "./animations";
import { ManaCrystalIcon } from "./ManaCrystalIcon";
import { warmEnemyArt } from "./enemyArt";
import { warmVfxSprites } from "./vfxSprites";
import { battleBg, warmBattleBg } from "./battleBg";
import { toDesignBox, useStageScale, type DesignBox } from "./stage";

// 相机下发给两个图层的 style: 前景(舞台)与背景(视频)。二者由同一个相机变换导出。
interface CameraStyles {
  stage: React.CSSProperties;
  bg: React.CSSProperties;
}

// 前景与背景必须共用同一条 transition —— 视差关系全程精确成立就靠这个。
// 二者都是 none → translate+scale, CSS 按分量线性插值, 于是任意时刻
// S(τ)=1+(S-1)e(τ) 且 S_bg(τ)=1+(S-1)k·e(τ), 比值恒为 k, 过渡中不会错位。
const CAMERA_TRANSITION = `transform ${CINEMA.zoomIn}ms cubic-bezier(0.22, 0.61, 0.36, 1)`;

const clamp = (v: number, lo: number, hi: number) =>
  lo > hi ? (lo + hi) / 2 : Math.min(Math.max(v, lo), hi); // lo>hi = 背景缩放余量不足, 取中点兜底

// 把屏幕空间仿射 q → S·q + T 换算成某元素的局部 transform(配合 transform-origin: 0 0)。
// k = 祖先 .screen.battle 的 --stage-scale(设计画布→屏幕的等比缩放, 见 ui/stage.ts)。
//
// 推导: 元素局部点 p 的未变换屏幕位置 q = O + k·p (O = 元素未变换时的屏幕左上角)。
// 施加局部 translate(t) scale(S) 后屏幕位置 = O + k·S·p + k·t。
// 令其等于 S·q + T = S·O + S·k·p + T ⇒ t = (T - (1-S)·O) / k。
// 即: 缩放分量 S 不受 k 影响(标量可交换), 但平移量是屏幕 px, 必须除以 k 换回设计 px ——
// 漏除会让小窗口下推镜偏移/过头。
function screenAffineToLocal(
  S: number,
  T: { x: number; y: number },
  origin: DOMRect,
  k: number,
): React.CSSProperties {
  const tx = (T.x - (1 - S) * origin.left) / k;
  const ty = (T.y - (1 - S) * origin.top) / k;
  return { transform: `translate(${tx}px, ${ty}px) scale(${S})`, transformOrigin: "0 0" };
}

export function BattleScreen() {
  const battle = useBattleStore((s) => s.battle);
  const play = useBattleStore((s) => s.play);
  const redrawCard = useBattleStore((s) => s.redrawCard);
  const discardCard = useBattleStore((s) => s.discardCard);
  const end = useBattleStore((s) => s.end);
  const commit = useBattleStore((s) => s.commit);
  const resolveBattle = useRunStore((s) => s.resolveBattle);
  const runIndex = useRunStore((s) => s.index);
  const mapId = useRunStore((s) => s.mapId);
  const bg = battleBg(mapId); // 当前地图的背景素材(视频/静态图), 未登记则回退森林

  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [hoveredUid, setHoveredUid] = useState<string | null>(null);
  const [hoverRect, setHoverRect] = useState<DesignBox | null>(null); // 悬浮手牌的矩形(浮窗锚点, 设计 px)
  const [handAction, setHandAction] = useState<"redraw" | "discard" | null>(null);
  // 手牌渲染列表(本地维护): 在引擎手牌之外, 额外保留"正在出鞘渐隐"的离场卡, 直到其动画播完再移除。
  // 新出现的卡自动挂载 → CSS 触发飞入动画(见 styles.css .hand-card 的 hand-deal-in)。
  const [renderHand, setRenderHand] = useState<{ card: Card; leaving: boolean }[]>([]);
  // 正在出牌离场的卡: 点击瞬间即开始出鞘(引擎稍后才在命中时刻把它移出手牌), 避免先缩回未选中位再飞出。
  const [playingOutUid, setPlayingOutUid] = useState<string | null>(null);

  // —— 出牌动画编排(纯 UI): 施法者弹出 → 顿 → 镜头推近聚焦目标 → 命中特效/飘字 → 镜头恢复/归位 ——
  const [attackerId, setAttackerId] = useState<string | null>(null); // 正在弹出的施法者
  const [hits, setHits] = useState<Record<string, HitFx>>({}); // 各目标当前的受击特效
  const [cutInCard, setCutInCard] = useState<Card | null>(null); // 出牌亮相卡面(仅玩家出牌; null=不展示)
  const [camera, setCamera] = useState<CameraStyles | null>(null); // 相机变换(null=全景)
  const viewportRef = useRef<HTMLDivElement>(null); // letterbox 容器(黑边区), 设计画布按它的尺寸缩放
  const screenRef = useRef<HTMLDivElement>(null); // 战斗屏幕(相机画框, 也是唯一的裁切边界)
  const stageRef = useRef<HTMLDivElement>(null); // 战场舞台层(前景: 敌我单位)
  const bgRef = useRef<HTMLElement | null>(null); // 背景层(按视差跟随相机); 视频/静态图共用, 故取宽类型
  // 回调 ref: <video> 与 <img> 两种元素都要落到同一个 bgRef 上(相机只对它量 getBoundingClientRect)
  const setBgEl = (el: HTMLElement | null) => {
    bgRef.current = el;
  };
  // 设计画布(1920×1080)→ 屏幕的等比缩放系数。以 CSS 变量下发给 .screen.battle 的 transform;
  // 另存一份 ref 供 computeCamera 读 —— 相机是在定时器回调里算的, 走 ref 才拿得到当时的最新值。
  const stageScale = useStageScale(viewportRef);
  const stageScaleRef = useRef(stageScale);
  stageScaleRef.current = stageScale;

  const [animating, setAnimating] = useState(false); // 动画期间锁输入
  const animatingRef = useRef(false); // 同步守卫(避免同一时刻重复触发)
  const seqRef = useRef(0); // 批次序号, 用于取消旧动画批次的定时器回调
  const hitSeqRef = useRef(0); // 受击特效序号, 递增以强制 React 重放同一目标的连续特效
  const timersRef = useRef<number[]>([]);
  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  // 换战斗时清空选择/悬浮/动画(并让在途动画批次失效)
  useEffect(() => {
    setSelectedUid(null);
    setHoveredUid(null);
    setHandAction(null);
    clearTimers();
    seqRef.current++;
    animatingRef.current = false;
    setAnimating(false);
    setAttackerId(null);
    setHits({});
    setCutInCard(null);
    setCamera(null);
    setRenderHand([]); // 换战斗: 清空手牌渲染列表, 让新战斗的手牌重新飞入(不播放旧牌离场)
    setPlayingOutUid(null);
  }, [runIndex]);

  // 卸载时清理计时器
  useEffect(() => () => clearTimers(), []);

  // 预热序列帧特效素材: 帧图是 12 个独立请求, 不预热首次播放会逐帧闪。
  // 敌人待机立绘同理(拼条单文件但体积大), 不预热则进战斗首帧空白。
  // 放在进战斗时(而非模块顶层)以免菜单界面白付流量; 到首次命中至少有 beat+zoomIn 的余量。
  useEffect(() => {
    warmVfxSprites();
    warmEnemyArt();
    warmBattleBg();
  }, []);

  // 同步渲染列表 = 引擎手牌 + 离场中的卡。引擎手牌里消失的卡标记 leaving(出鞘渐隐, 保留原位),
  // 新增的卡追加到末尾(挂载即飞入)。leaving 卡在其离场动画结束后由 handleCardExited 移除。
  useEffect(() => {
    if (!battle) return;
    const liveSet = new Set(battle.hand);
    setRenderHand((prev) => {
      const prevUids = new Set(prev.map((e) => e.card.uid));
      const merged = prev.map((e) =>
        liveSet.has(e.card.uid)
          ? { card: battle.cards[e.card.uid], leaving: false }
          : { card: e.card, leaving: true },
      );
      for (const uid of battle.hand) {
        if (!prevUids.has(uid)) merged.push({ card: battle.cards[uid], leaving: false });
      }
      return merged;
    });
  }, [battle]);

  const handleCardExited = (uid: string) => {
    setRenderHand((prev) => prev.filter((e) => e.card.uid !== uid));
    setPlayingOutUid((cur) => (cur === uid ? null : cur));
  };

  // 敌人预计攻击的我方目标(仇恨最高的存活友军), 用于 UI 提示
  const aggroTargetId = useMemo(() => {
    if (!battle) return undefined;
    const allies = battle.playerIds.map((id) => battle.combatants[id]).filter((c) => c.alive);
    if (!allies.length) return undefined;
    return allies.reduce((best, a) =>
      (a as any).threat > (best as any).threat ? a : best,
    ).id;
  }, [battle]);

  // 仇恨高亮同样泄露「敌人下一击打谁」, 因此跟随意图的揭示开关: 有敌人被洞察时才显示
  const aggroHintVisible = useMemo(() => {
    if (!battle) return false;
    return battle.enemyIds
      .map((id) => battle.combatants[id] as Enemy)
      .some((e) => e.alive && isIntentRevealed(e));
  }, [battle]);

  if (!battle) return <div className="screen center">加载中…</div>;
  const b = battle; // 非空别名: 供下方事件处理/setTimeout 闭包安全引用(收窄不跨闭包)

  const isPlayerTurn = battle.phase === "player";
  const selectedCard = selectedUid ? battle.cards[selectedUid] : null;
  const needsFoe = selectedCard?.targeting === "foe";
  const needsAlly = selectedCard?.targeting === "ally";
  const mana = battle.resources[RULES.resource.name] ?? 0;

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
  interface AnimStep {
    actorId: string; // 前冲的施法者
    anim: CardAnim; // 表现动画类型(UI 侧解析)
    snapshot: BattleState; // 该动作结算后的完整状态
    hits: { id: string; hpDelta: number }[]; // 受击/受益目标(hpDelta>0 掉血, <0 回血, 0 仅闪特效)
    card?: Card; // 仅玩家出牌步携带: 用于镜头聚焦后的「卡面亮相」演出
  }

  // 引擎产出的敌人动画帧 → 一步(动画表现在 UI 侧按招式解析)。
  function stepFromFrame(f: AnimFrame): AnimStep {
    const def = getEnemyDef(f.enemyDefId);
    const move = def.moves.find((m) => m.id === f.moveId) ?? def.moves[0];
    return { actorId: f.actorId, anim: moveAnim(move), snapshot: f.snapshot, hits: f.hits };
  }

  // 计算相机变换: 把给定目标(多目标取并集)聚焦到画框中心并放大, 背景按视差跟随。
  //
  // 相机 = 一个屏幕空间仿射变换 q → S·q + T。前景(舞台)与背景(视频)各自把它换算到
  // 自身局部坐标系(见 screenAffineToLocal), 因此二者严格同步 —— 这是「真聚焦」而非
  // 「放大一个 div」的关键: 推近时森林与角色一起动。
  //
  // 取景框用舞台矩形(而非整屏): 目标居中到清晰可见区, 不会跑到左侧透明手牌栏底下;
  // 整屏只是裁切边界, 让场景铺满、边缘不露馅。
  //
  // ⚠ 测量前提: 只在全景态(camera===null → transform:none)调用, 否则 getBoundingClientRect
  // 量到的是变换后的矩形。runSteps 在 beat(500ms) 时刻调用, 上一步的 zoomOut(380ms) 早已结束。
  function computeCamera(targetIds: string[]): CameraStyles | null {
    const screen = screenRef.current, stage = stageRef.current, bg = bgRef.current;
    if (!screen || !stage || !bg || targetIds.length === 0) return null;

    // 目标并集包围盒(屏幕坐标)
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (const id of targetIds) {
      const el = stage.querySelector<HTMLElement>(`[data-cmb-id="${id}"]`);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      left = Math.min(left, r.left);
      top = Math.min(top, r.top);
      right = Math.max(right, r.right);
      bottom = Math.max(bottom, r.bottom);
    }
    if (!isFinite(left)) return null;

    const stageRect = stage.getBoundingClientRect();
    const F = { x: (left + right) / 2, y: (top + bottom) / 2 }; // 聚焦点: 并集中心
    const C = { x: stageRect.left + stageRect.width / 2, y: stageRect.top + stageRect.height / 2 }; // 画框中心

    // 并集需占据视野, 但留出边距(占取景框 78%), 再与单目标上限 CINEMA.scale 取较小值防溢出。
    const spanW = Math.max(1, right - left), spanH = Math.max(1, bottom - top);
    const fit = Math.min((stageRect.width * 0.78) / spanW, (stageRect.height * 0.78) / spanH);
    const S = Math.max(1, Math.min(CINEMA.scale, fit));

    // 前景: 把 F 映射到 C ⇒ T_fg = C - S·F
    const Tfg = { x: C.x - S * F.x, y: C.y - S * F.y };

    // 背景: 把前景拆成「以 C 为心缩放 S」+「平移 P = S·(C-F)」, 各按视差系数 k 衰减。
    // k=0 → S_bg=1,T_bg=0(背景不动); k=1 → 与前景完全一致。
    const k = CINEMA.bgParallax;
    const Sbg = 1 + (S - 1) * k;
    const Tbg = {
      x: C.x - Sbg * C.x + k * S * (C.x - F.x),
      y: C.y - Sbg * C.y + k * S * (C.y - F.y),
    };

    // 边缘钳制: 背景放大平移后必须仍盖住游戏画布, 否则会露黑边。
    // 真触发时表现为「镜头顶到场景边界」。
    const screenRect = screen.getBoundingClientRect();
    const bgRect = bg.getBoundingClientRect();
    Tbg.x = clamp(Tbg.x, screenRect.right - Sbg * bgRect.right, screenRect.left - Sbg * bgRect.left);
    Tbg.y = clamp(Tbg.y, screenRect.bottom - Sbg * bgRect.bottom, screenRect.top - Sbg * bgRect.top);

    // 以上全部是屏幕空间内的自洽比值(包围盒 / fit / Tbg 的钳制), 祖先缩放会同比约掉, 故不受 k 影响;
    // 只有下面这步跨了坐标系(屏幕 px → 设计画布局部 px), 需要 k。
    const stageK = stageScaleRef.current;
    return {
      stage: screenAffineToLocal(S, Tfg, stageRect, stageK),
      bg: screenAffineToLocal(Sbg, Tbg, bgRect, stageK),
    };
  }

  // 逐步回放动画。seq 为本批次代号: 切战斗/发起新动作会使旧批次的定时器回调失效。
  // 单步分镜: 施法者弹出(全景可见) → 顿 → 镜头推近聚焦目标 → 命中特效/飘字停留 → 镜头恢复+归位。
  function runSteps(steps: AnimStep[], final: BattleState, seq: number) {
    let i = 0;
    const next = () => {
      if (seqRef.current !== seq) return;
      if (i >= steps.length) {
        commit(final); // 落到最终态(下一回合起始 / 出牌后终态)
        setCamera(null);
        setAttackerId(null);
        setHits({});
        setCutInCard(null);
        animatingRef.current = false;
        setAnimating(false);
        return;
      }
      const step = steps[i++];
      const preset = ANIM[step.anim];
      const focusIds = step.hits.length ? step.hits.map((h) => h.id) : [step.actorId];
      setAttackerId(step.actorId); // 施法者弹出并保持(CSS .attacking)
      setCamera(null); // 保持全景, 让"顿"期间能看到弹出的角色

      // 镜头到位时刻; 仅玩家出牌步在此后插入「卡面亮相」段(飞入→停留→飞出), 后续时刻整体后移 cutIn。
      const tFocus = CINEMA.beat + CINEMA.zoomIn;
      const cutIn = step.card ? CINEMA.cardIn + CINEMA.cardHold + CINEMA.cardOut : 0;

      // 顿之后: 镜头推近, 把目标居中放大
      const tZoom = window.setTimeout(() => {
        if (seqRef.current !== seq) return;
        setCamera(computeCamera(focusIds));
      }, CINEMA.beat);
      timersRef.current.push(tZoom);

      // 镜头到位后: 若为玩家出牌, 挂载卡面浮层(挂载即播放整段 CSS 动画), 演出结束再卸载
      if (step.card) {
        const cardForCutIn = step.card;
        const tCutIn = window.setTimeout(() => {
          if (seqRef.current !== seq) return;
          setCutInCard(cardForCutIn);
        }, tFocus);
        const tCutInEnd = window.setTimeout(() => {
          if (seqRef.current !== seq) return;
          setCutInCard(null);
        }, tFocus + cutIn);
        timersRef.current.push(tCutIn, tCutInEnd);
      }

      // 卡面亮相结束后: 提交该动作后的状态(扣血/加盾/状态可见), 放特效 + 飘字, 停留 hitHold
      const tHit = window.setTimeout(() => {
        if (seqRef.current !== seq) return;
        commit(step.snapshot);
        const hitSeq = ++hitSeqRef.current;
        const map: Record<string, HitFx> = {};
        for (const h of step.hits) {
          const fx: HitFx = { anim: step.anim, seq: hitSeq };
          if (preset.kind === "attack" && h.hpDelta > 0) fx.float = { text: `-${h.hpDelta}`, tone: "dmg" };
          else if (preset.kind === "support" && h.hpDelta < 0)
            fx.float = { text: `+${-h.hpDelta}`, tone: "heal" };
          map[h.id] = fx;
        }
        setHits(map);
      }, tFocus + cutIn);

      // 停留结束: 镜头恢复全景 + 施法者归位 + 清特效
      const tRestore = window.setTimeout(() => {
        if (seqRef.current !== seq) return;
        setCamera(null);
        setAttackerId(null);
        setHits({});
      }, tFocus + cutIn + CINEMA.hitHold);

      // 镜头拉回后 → 下一步
      const tNext = window.setTimeout(
        next,
        tFocus + cutIn + CINEMA.hitHold + CINEMA.zoomOut + CINEMA.gap,
      );
      timersRef.current.push(tHit, tRestore, tNext);
    };
    next();
  }

  // 开启一个动画批次: 上锁 + 清选择, 逐步回放。空步数则直接落到终态。
  function startBatch(steps: AnimStep[], final: BattleState) {
    const seq = ++seqRef.current;
    animatingRef.current = true;
    setAnimating(true);
    setSelectedUid(null);
    setHandAction(null);
    runSteps(steps, final, seq);
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
    const steps: AnimStep[] = [
      { actorId: card.ownerCharId, anim, snapshot: plan.cardSnapshot, hits: cardHits, card },
      ...plan.frames.map(stepFromFrame),
    ];
    startBatch(steps, plan.final);
  }

  // 结束回合: 逐步播放冲刷的敌人行动, 最后落到下一回合起始态。
  function triggerEndTurn() {
    if (animatingRef.current) return;
    const plan = end();
    if (!plan) return;
    startBatch(plan.frames.map(stepFromFrame), plan.final);
  }

  function onCardClick(uid: string) {
    if (!isPlayerTurn || animating) return;
    if (handAction) {
      const next = handAction === "redraw" ? redrawCard(uid) : discardCard(uid);
      if (next) {
        commit(next);
        setHandAction(null);
        setHoveredUid(null);
      }
      return;
    }
    if (!canPlay(b, uid)) return;
    const card = b.cards[uid];
    if (card.targeting === "foe" || card.targeting === "ally") {
      setSelectedUid((prev) => (prev === uid ? null : uid));
    } else {
      triggerPlay(uid);
    }
  }

  function onCombatantClick(id: string) {
    if (!selectedUid || !selectedCard || animating) return;
    const t = b.combatants[id];
    if (!t.alive) return;
    if (needsFoe && t.team === "enemy") triggerPlay(selectedUid, id);
    else if (needsAlly && t.team === "player") triggerPlay(selectedUid, id);
  }

  const enemies = battle.enemyIds.map((id) => battle.combatants[id]);
  const allies = battle.playerIds.map((id) => battle.combatants[id]);
  // 手工站位按槽位下标取 —— createBattle 按 enc.enemies 顺序 push enemyIds, 故两者下标一一对应。
  // 站位是纯表现, 不进 BattleState(引擎无副作用且状态要可序列化), 故在此回查遭遇战定义。
  const placements = getEncounter(battle.encounterId).enemies.map(slotPlacement);
  const hand = battle.hand.map((uid) => battle.cards[uid]);

  // 跟随鼠标的详情浮窗只在悬浮手牌时展示
  const hoveredCard = hoveredUid && battle.cards[hoveredUid] ? battle.cards[hoveredUid] : null;
  const canUseHandActions = isPlayerTurn && !animating && hand.length > 0;
  const redrawAvailable = canUseHandActions && battle.redrawsThisRound < 1;

  // 背景层的相机样式。提到分支外算一次, 保证 <video>/<img> 两个分支拿到的完全是同一份。
  const bgStyle: React.CSSProperties = {
    transition: CAMERA_TRANSITION,
    transform: camera?.bg.transform ?? "none",
    transformOrigin: "0 0",
  };

  return (
    // --stage-scale: 把 1920×1080 的设计画布等比缩到当前窗口(见 ui/stage.ts 与 styles.css .screen.battle)
    <div
      className="battle-viewport"
      ref={viewportRef}
      style={{ "--stage-scale": stageScale } as React.CSSProperties}
    >
      <div className="screen battle" ref={screenRef} onClick={() => setSelectedUid(null)}>
      {/* 背景层: 精确铺满游戏画布, 素材按当前地图取(见 ui/battleBg.ts)。作为相机的远景平面,
          按 CINEMA.bgParallax 衰减跟随。视频与静态图两个分支必须共用同一份 className/ref/style ——
          前景与背景的同步全靠这条共用 transition, 任一处不一致都会让推镜时前后景错位。 */}
      {bg.kind === "video" ? (
        <video
          ref={setBgEl}
          className="battle-bg-video"
          src={bg.src}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          style={bgStyle}
        />
      ) : (
        <img ref={setBgEl} className="battle-bg-video" src={bg.src} alt="" style={bgStyle} />
      )}
      {/* 战场舞台层: 相机的近景平面。全景时 transform:none, 布局与静息态一致。
          裁切在 .screen.battle(整屏), 故推近时角色可越过舞台边界铺满画面。 */}
      <div
        className="battle-stage"
        ref={stageRef}
        style={{
          transition: CAMERA_TRANSITION,
          transform: camera?.stage.transform ?? "none",
          transformOrigin: "0 0",
        }}
      >
        {/* 敌人 */}
        <div className="row enemy-row">
          {enemies.map((e, i) => (
            <CombatantView
              key={e.id}
              cmb={e}
              currentTick={battle.tick}
              targetable={isPlayerTurn && !!needsFoe && e.alive}
              attacking={e.id === attackerId}
              hit={hits[e.id] ?? null}
              placement={placements[i]}
              onClick={() => onCombatantClick(e.id)}
            />
          ))}
        </div>

        {/* 提示条 */}
        <div className="hint-bar">
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
        </div>

        {/* 我方 */}
        <div className="row ally-row">
          {allies.map((a) => (
            <CombatantView
              key={a.id}
              cmb={a}
              currentTick={battle.tick}
              targetable={isPlayerTurn && !!needsAlly && a.alive}
              isAggroTarget={aggroHintVisible && a.id === aggroTargetId && a.alive}
              attacking={a.id === attackerId}
              hit={hits[a.id] ?? null}
              onClick={() => onCombatantClick(a.id)}
            />
          ))}
        </div>
      </div>

      {/* 左侧悬浮手牌 */}
      <div className="side" onClick={(e) => e.stopPropagation()}>
        <div className="hand-toolbar" role="toolbar" aria-label="手牌工具栏">
          <ManaCrystalBar mana={mana} max={RULES.resource.perRound} />
          <div className="hand-toolbar-actions">
            <button
              className={`hand-tool-button ${handAction === "redraw" ? "active" : ""}`}
              type="button"
              aria-label="换牌"
              title={battle.redrawsThisRound >= 1 ? "本回合已换牌" : "换牌：选择一张手牌替换"}
              disabled={!redrawAvailable}
              onClick={() => {
                setSelectedUid(null);
                setHandAction((current) => (current === "redraw" ? null : "redraw"));
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <defs>
                  <linearGradient id="tool-metal-redraw" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#e6f4c8" />
                    <stop offset="0.5" stopColor="#9cbc4e" />
                    <stop offset="1" stopColor="#3f5320" />
                  </linearGradient>
                </defs>
                <path stroke="url(#tool-metal-redraw)" d="M20 11a8 8 0 0 0-14.8-4.2L3 9m0-5v5h5" />
                <path stroke="url(#tool-metal-redraw)" d="M4 13a8 8 0 0 0 14.8 4.2L21 15m0 5v-5h-5" />
              </svg>
            </button>
            <button
              className={`hand-tool-button ${handAction === "discard" ? "active" : ""}`}
              type="button"
              aria-label="丢弃"
              title="丢弃：选择一张手牌置入弃牌堆"
              disabled={!canUseHandActions}
              onClick={() => {
                setSelectedUid(null);
                setHandAction((current) => (current === "discard" ? null : "discard"));
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <defs>
                  <linearGradient id="tool-metal-discard" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#e6f4c8" />
                    <stop offset="0.5" stopColor="#9cbc4e" />
                    <stop offset="1" stopColor="#3f5320" />
                  </linearGradient>
                </defs>
                <path stroke="url(#tool-metal-discard)" d="M4 7h16" />
                <path stroke="url(#tool-metal-discard)" d="M9 7V4h6v3" />
                <path stroke="url(#tool-metal-discard)" d="M7 7l1 13h8l1-13" />
                <path stroke="url(#tool-metal-discard)" d="M10 11v5M14 11v5" />
              </svg>
            </button>
          </div>
        </div>
        <div className="hand-strip">
          {renderHand.length === 0 && battle.hand.length === 0 && (
            <div className="empty-hand">(手牌为空)</div>
          )}
          {renderHand.map((entry, i) => {
            const c = entry.card;
            const leaving = entry.leaving || c.uid === playingOutUid;
            return (
              <HandCard
                key={c.uid}
                card={c}
                dealIndex={i}
                leaving={leaving}
                playable={!leaving && isPlayerTurn && (handAction !== null || canPlay(battle, c.uid))}
                selected={c.uid === selectedUid}
                onExited={() => handleCardExited(c.uid)}
                onClick={() => onCardClick(c.uid)}
                onHover={(h, rect) => {
                  setHoveredUid(h ? c.uid : null);
                  // 屏幕 px → 设计 px: 浮窗定位在画布局部坐标系里(见 ui/stage.ts)
                  const canvas = screenRef.current?.getBoundingClientRect();
                  if (h && rect && canvas) {
                    setHoverRect(toDesignBox(rect, canvas, stageScaleRef.current));
                  }
                }}
              />
            );
          })}
        </div>
      </div>

      <button
        className="end-turn-float"
        disabled={!isPlayerTurn || animating}
        onClick={(e) => {
          e.stopPropagation();
          triggerEndTurn();
        }}
      >
        结束回合
      </button>

      {/* 胜负遮罩 */}
      {!isPlayerTurn && (
        <div className="overlay">
          <div className="overlay-card">
            <h2>{battle.phase === "won" ? "🎉 战斗胜利!" : "💀 战斗失败"}</h2>
            <button className="primary" onClick={() => resolveBattle()}>
              继续
            </button>
          </div>
        </div>
      )}

      {/* 出牌亮相卡面: 挂在舞台层之外, 不受相机缩放/裁切影响 */}
      <SkillCutInCard card={cutInCard} />

      {/* 卡牌右侧的详情浮窗 */}
        <CardDetailPopup card={hoveredCard} anchor={hoverRect} />
      </div>
    </div>
  );
}

function ManaCrystalBar({ mana, max }: { mana: number; max: number }) {
  const total = Math.max(max, mana);
  return (
    <div className="mana-bar" title="法力水晶（每回合的出牌资源）">
      {Array.from({ length: total }).map((_, i) => (
        <ManaCrystalIcon key={i} className={`mana-crystal mana-pip ${i < mana ? "on" : "off"}`} />
      ))}
    </div>
  );
}
