import { useEffect, useMemo, useRef, useState } from "react";
import {
  canPlay,
  partyHandLimit,
  RULES,
  type AnimFrame,
  type BattleState,
  type Card,
  type CardAnim,
  type Enemy,
} from "../engine";
import { getEncounter, getEnemyDef, slotPlacement } from "../data";
import { useBattleStore } from "../store/battleStore";
import { useRunStore } from "../store/runStore";
import { CombatantView, isIntentRevealed } from "./CombatantView";
import { AllyBar } from "./AllyBar";
import { TickRuler } from "./TickRuler";
import { HandCard } from "./HandCard";
import { CardInfoPanel } from "./CardInfoPanel";
import { SkillCutInCard } from "./SkillCutInCard";
import { ANIM, CINEMA, cardAnim, moveAnim, type HitFx } from "./animations";
import { ManaCrystalIcon } from "./ManaCrystalIcon";
import { warmEnemyArt } from "./enemyArt";
import { warmVfxSprites } from "./vfxSprites";
import { battleBg, warmBattleBg } from "./battleBg";
import { AmbienceGrade, AmbienceLayer } from "./AmbienceLayer";
import { useIdleTwitch } from "./useIdleTwitch";
import { STAGE, useStageScale } from "./stage";
import "./BattleScreen.css";

// ── 场景相机 ──
// 世界 = 1920×1080 的设计画布(见 ui/stage.ts)。相机就是世界坐标里的一次 translate+scale,
// 直接作为 .battle-scene 的局部 transform 下发 —— 场景层与它的父级(.screen.battle)之间
// 没有别的变换, 故「局部 px」恒等于「世界 px」, 全程不需要任何屏幕 px 换算。
//
// 背景与敌我单位同在 .battle-scene 内 ⇒ 只有这一份变换, 场景是刚体:
// 角色与它脚下的那块地面在任何缩放/平移/窗口尺寸下都不可能分离。
interface Camera {
  s: number; // 放大倍数
  tx: number; // 世界 px
  ty: number;
}

const cameraCss = (c: Camera | null) =>
  c ? `translate(${c.tx}px, ${c.ty}px) scale(${c.s})` : "none";

const CAMERA_TRANSITION = `transform ${CINEMA.zoomIn}ms cubic-bezier(0.22, 0.61, 0.36, 1)`;

// 屏幕 px → 世界 px 的反投影。除数取**世界层**当前的屏幕矩形(其未变换尺寸恒为 STAGE.width),
// 于是 --stage-scale、当前相机变换、以及世界自身的空闲漂移被一次性抵消 —— 测得的永远是纯
// 设计 px, 与 stage.offsetLeft/Top(布局 px)同一坐标系。过渡进行到一半时测量同样成立。
// (旧实现要求"必须在全景态测量", 这个前提就此消失。)
function screenToWorld(r: DOMRect, worldRect: DOMRect) {
  const u = STAGE.width / worldRect.width;
  return {
    left: (r.left - worldRect.left) * u,
    top: (r.top - worldRect.top) * u,
    right: (r.right - worldRect.left) * u,
    bottom: (r.bottom - worldRect.top) * u,
  };
}

export function BattleScreen() {
  const battle = useBattleStore((s) => s.battle);
  const play = useBattleStore((s) => s.play);
  const redrawCard = useBattleStore((s) => s.redrawCard);
  const discardCard = useBattleStore((s) => s.discardCard);
  const end = useBattleStore((s) => s.end);
  const commit = useBattleStore((s) => s.commit);
  const resolveBattle = useRunStore((s) => s.resolveBattle);
  const battleSeq = useBattleStore((s) => s.seq); // 「第几场战斗」的身份标识, 换局时重置分镜状态
  const mapId = useRunStore((s) => s.mapId);
  const bg = battleBg(mapId); // 当前地图的背景素材(视频/静态图), 未登记则回退森林

  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [hoveredUid, setHoveredUid] = useState<string | null>(null);
  const [handAction, setHandAction] = useState<"redraw" | "discard" | null>(null);
  // 手牌渲染列表(本地维护): 在引擎手牌之外, 额外保留"正在出鞘渐隐"的离场卡, 直到其动画播完再移除。
  // 新出现的卡自动挂载 → CSS 触发飞入动画(见 ui/HandCard.css .hand-card 的 hand-deal-in)。
  const [renderHand, setRenderHand] = useState<{ card: Card; leaving: boolean }[]>([]);
  // 正在出牌离场的卡: 点击瞬间即开始出鞘(引擎稍后才在命中时刻把它移出手牌), 避免先缩回未选中位再飞出。
  const [playingOutUid, setPlayingOutUid] = useState<string | null>(null);

  // —— 出牌动画编排(纯 UI): 施法者弹出 → 顿 → 镜头推近聚焦目标 → 命中特效/飘字 → 镜头恢复/归位 ——
  const [attackerId, setAttackerId] = useState<string | null>(null); // 正在弹出的施法者
  const [hits, setHits] = useState<Record<string, HitFx>>({}); // 各目标当前的受击特效
  const [cutInCard, setCutInCard] = useState<Card | null>(null); // 出牌亮相卡面(仅玩家出牌; null=不展示)
  const [camera, setCamera] = useState<Camera | null>(null); // 相机变换(null=全景)
  const [spillSrc, setSpillSrc] = useState<string | null>(null); // 溢出填充图(见下方 grabSpill)
  // 打击感: 命中瞬间冻住世界(顿帧) → 解冻同刻爆发震屏。seq 奇偶交替 shake-a/shake-b 两个
  // 同内容不同名的 keyframes 以重启动画 —— 绝不能给 .battle-world 加 key 重挂载, 那会连带
  // 重挂 <video> 背景触发二次解码。
  const [shake, setShake] = useState<{ seq: number; level: 0 | 1 | 2 }>({ seq: 0, level: 0 });
  const [hitstop, setHitstop] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null); // letterbox 容器(黑边区), 设计画布按它的尺寸缩放
  const screenRef = useRef<HTMLDivElement>(null); // 战斗屏幕(画布 = 唯一的裁切边界)
  const sceneRef = useRef<HTMLDivElement>(null); // ★ 场景层: 相机(推近/平移)的唯一作用对象
  const worldRef = useRef<HTMLDivElement>(null); // ★ 世界层: 背景 + 氛围 + 舞台同在其中; 承载空闲漂移与震屏
  const stageRef = useRef<HTMLDivElement>(null); // 战场舞台层(敌我单位); 其布局盒 = 相机的取景安全区
  const bgVideoRef = useRef<HTMLVideoElement>(null); // 背景视频(仅用于抓首帧做溢出填充)
  // 设计画布(1920×1080)→ 屏幕的等比缩放系数。以 CSS 变量下发给 .screen.battle 的 transform。
  const stageScale = useStageScale(viewportRef);

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
    setHitstop(false);
    setRenderHand([]); // 换战斗: 清空手牌渲染列表, 让新战斗的手牌重新飞入(不播放旧牌离场)
    setPlayingOutUid(null);
  }, [battleSeq]);

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

  // ★ 仇恨系统已移除 —— 敌人在存活我方单位里随机挑目标, 因此不存在"预计会打谁"这件事,
  //   原先的仇恨目标高亮与它的洞察开关一并删除。

  // 待机小动作: 每隔几秒随机让一个存活敌人抖一下(纯表现)。分镜播放期间关掉, 免得和演出打架。
  // ⚠ hook 必须在下面的早退之前调用, 故这里从 battle 现算存活名单而非复用后面的 enemies。
  const aliveEnemyIds = useMemo(
    () => (battle ? battle.enemyIds.filter((id) => battle.combatants[id].alive) : []),
    [battle],
  );
  const twitchId = useIdleTwitch(aliveEnemyIds, !animating);

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

  // 计算相机变换: 把给定目标(多目标取并集)聚焦到取景安全区中心并放大。
  // 全程在世界坐标(设计 px)里算, 不出现任何屏幕 px、不需要 --stage-scale ——
  // 故任何窗口尺寸下的推镜结果逐 px 一致。
  //
  // 取景安全区 = .battle-stage 的布局盒(而非整个画布): 目标居中到清晰可见区, 不会跑到
  // 左侧透明手牌栏底下。读 offsetLeft/Top/Width/Height 而不是 getBoundingClientRect ——
  // 布局 px 天然就是世界 px(offsetParent 即 .battle-scene), 完全不受相机变换影响。
  //
  // 刻意不做边界钳制: 目标永远精确居中, 世界之外露出的部分由 .battle-bg-spill 填充。
  function computeCamera(targetIds: string[]): Camera | null {
    const world = worldRef.current, stage = stageRef.current;
    if (!world || !stage || targetIds.length === 0) return null;

    const worldRect = world.getBoundingClientRect();
    if (worldRect.width <= 0) return null;

    // 目标并集包围盒(世界坐标)
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (const id of targetIds) {
      const el = stage.querySelector<HTMLElement>(`[data-cmb-id="${id}"]`);
      if (!el) continue;
      // 敌人量内层的 .combatant-stage(立绘 + 特效, 含体型 scale 的那层), 而不是外层布局盒 ——
      // --place-scale 只作用于内层, 外层矩形量不到大体型敌人的真实占幅, 会把镜头推得过近。
      // 顺带把血条/意图排除在取景外, 聚焦点落在立绘上。我方头像卡没有这层, 退回量自身。
      const box = el.querySelector<HTMLElement>(".combatant-stage") ?? el;
      const w = screenToWorld(box.getBoundingClientRect(), worldRect);
      left = Math.min(left, w.left);
      top = Math.min(top, w.top);
      right = Math.max(right, w.right);
      bottom = Math.max(bottom, w.bottom);
    }
    if (!isFinite(left)) return null;

    // 取景安全区(世界 px)
    const safe = {
      x: stage.offsetLeft,
      y: stage.offsetTop,
      w: stage.offsetWidth,
      h: stage.offsetHeight,
    };

    // 并集需占据视野, 但留出边距(占安全区 CINEMA.fit), 再与上限 CINEMA.scale 取较小值防溢出。
    const spanW = Math.max(1, right - left), spanH = Math.max(1, bottom - top);
    const fit = Math.min((safe.w * CINEMA.fit) / spanW, (safe.h * CINEMA.fit) / spanH);
    const s = Math.max(1, Math.min(CINEMA.scale, fit));

    const F = { x: (left + right) / 2, y: (top + bottom) / 2 }; // 聚焦点: 并集中心
    const A = { x: safe.x + safe.w / 2, y: safe.y + safe.h / 2 }; // 画框锚点: 安全区中心

    // 把 F 映射到 A ⇒ T = A - s·F(配合 transform-origin: 0 0)
    return { s, tx: A.x - s * F.x, ty: A.y - s * F.y };
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
        setHitstop(false);
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

        // 打击感: 先"卡"再"炸" —— 命中瞬间把整个世界(CSS 动画 + 粒子)冻住 CINEMA.hitstop,
        // 解冻的同一刻爆发震屏。顿帧设 0 即退化成"命中即震"。震屏幅度按招式的 shake 档取,
        // 辅助系(档 0)完全不震。
        // 居合斩(iai)的爆发点不在挂载瞬间而在 impactMs(蓄力后) ⇒ 顿帧/震屏整体推迟;
        // 其余动画 impactDelay=0, 且必须保持同步调用(不能统一走 setTimeout(0), 否则
        // setHitstop 与 setHits 拆成两次渲染, sword-fall 会多出一帧未冻结画面)。
        const level = preset.shake;
        const impactDelay = preset.iai?.impactMs ?? 0;
        if (impactDelay > 0) {
          const tStop = window.setTimeout(() => {
            if (seqRef.current !== seq) return;
            if (CINEMA.hitstop > 0) setHitstop(true);
          }, impactDelay);
          timersRef.current.push(tStop);
        } else if (CINEMA.hitstop > 0) setHitstop(true);
        const tShake = window.setTimeout(() => {
          if (seqRef.current !== seq) return;
          setHitstop(false);
          if (level > 0) setShake((s) => ({ seq: s.seq + 1, level }));
        }, impactDelay + CINEMA.hitstop);
        timersRef.current.push(tShake);
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

  const enemies = battle.enemyIds.map((id) => battle.combatants[id] as Enemy);
  const allies = battle.playerIds.map((id) => battle.combatants[id]);
  // 手工站位按槽位下标取 —— createBattle 按 enc.enemies 顺序 push enemyIds, 故两者下标一一对应。
  // 站位是纯表现, 不进 BattleState(引擎无副作用且状态要可序列化), 故在此回查遭遇战定义。
  const placements = getEncounter(battle.encounterId).enemies.map(slotPlacement);
  const hand = battle.hand.map((uid) => battle.cards[uid]);

  const canUseHandActions = isPlayerTurn && !animating && hand.length > 0;
  const redrawAvailable = canUseHandActions && battle.redrawsThisRound < 1;

  // 当前关注的手牌(悬停优先, 其次选中): 归属角色的槽位变宽点亮(AllyBar), 卡牌详情进右侧
  // 固定面板(CardInfoPanel)。纯派生, 不新增任何 state —— 每张卡都带 ownerCharId, 且我方
  // Combatant 的 id 就是角色 id(runStore.launchBattle 如此建局, fxTargets 的 case "self"
  // 也依赖这一点)。选中待选目标期间 focusUid 仍在, 详情与槽位高亮因此持续可见。
  const focusUid = hoveredUid ?? selectedUid;
  const focusCard = focusUid ? (battle.cards[focusUid] ?? null) : null;
  const focusCharId = focusCard?.ownerCharId;

  // 居合斩全屏压暗: 由 hits 派生, 与特效同挂同卸(tRestore 的 setHits({}) 自动清掉),
  // key=seq 保证连发重放。零新增 state / 计时器。
  const dimHit = Object.values(hits).find((h) => ANIM[h.anim].iai);

  return (
    // --stage-scale: 把 1920×1080 的设计画布等比缩到当前窗口(见 ui/stage.ts 与 BattleScreen.css .screen.battle)
    <div
      className="battle-viewport"
      ref={viewportRef}
      style={{ "--stage-scale": stageScale } as React.CSSProperties}
    >
      <div
        className={`screen battle${hitstop ? " hitstop" : ""}`}
        ref={screenRef}
        onClick={() => setSelectedUid(null)}
      >
      {/* 溢出填充: 相机强制把目标居中(不做边界钳制), 世界之外露出的区域由这一层兜底 ——
          同一张背景的模糊放大副本, 观感远好于纯黑。它在场景之外 ⇒ 不跟相机动, 始终铺满画布。 */}
      {spillSrc && <img className="battle-bg-spill" src={spillSrc} alt="" aria-hidden="true" />}

      {/* ★ 场景层(世界 1920×1080) = 相机的唯一作用对象。背景与敌我单位同在其中, 由同一份
          transform 驱动 ⇒ 场景是刚体, 角色与它脚下的地面永远不会分离。
          裁切在 .screen.battle(整屏), 故推近时角色可越过舞台边界铺满画面。
          data-focused: 相机非全景时置位, CSS 据此暂停世界的空闲漂移(见下)。 */}
      <div
        className="battle-scene"
        ref={sceneRef}
        data-focused={camera ? "1" : undefined}
        style={{
          transition: CAMERA_TRANSITION,
          transform: cameraCss(camera),
          transformOrigin: "0 0",
        }}
      >
      {/* ★ 世界层: 相机之下、场景内容之上的一层。它同样包住背景 + 氛围 + 舞台 ⇒ 刚体不变,
          存在的意义是让「空闲漂移」和「震屏」有地方落 —— 场景层的 transform 已被相机占用。
          三个变换属性各司其职、互不覆盖: transform=漂移, translate=震屏位移, scale=冲击缩放。
          刻意 position:absolute + inset:0 与场景层几何重合 ⇒ 它成为 .battle-stage 的
          offsetParent, computeCamera 读的取景安全区(stage.offsetLeft/Top/W/H)一个数都不用改。 */}
      <div
        className={`battle-world${shake.level ? ` shake-lv${shake.level} shake-${shake.seq % 2 ? "a" : "b"}` : ""}`}
        ref={worldRef}
        style={
          {
            "--drift-x": `${CINEMA.drift.x}px`,
            "--drift-y": `${CINEMA.drift.y}px`,
            "--drift-scale": `${1 + CINEMA.drift.scale}`,
            "--drift-dur": `${CINEMA.drift.dur}ms`,
            "--shake-amp": `${CINEMA.shake.amp[shake.level]}px`,
            "--shake-punch": `${1 + CINEMA.shake.punch}`,
            "--shake-dur": `${CINEMA.shake.dur}ms`,
          } as React.CSSProperties
        }
      >
      {/* 背景层: 精确铺满世界, 素材按当前地图取(见 ui/battleBg.ts)。视频与静态图两个分支
          共用同一份 className —— 对场景相机而言二者完全等价, 都只是世界里的一张地皮。 */}
      {bg.kind === "video" ? (
        <video
          ref={bgVideoRef}
          className="battle-bg-video"
          src={bg.src}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onLoadedData={grabSpill}
        />
      ) : (
        <img className="battle-bg-video" src={bg.src} alt="" />
      )}

      {/* 场景氛围: 按地图登记的 Canvas 粒子(雨/光尘/雾)+ 可选的灯光闪烁。两张画布靠 z-index
          夹住舞台 —— far 在单位之下、near 在单位之上并整层失焦, 纵深由此而来。
          它在世界内 ⇒ 跟随相机与漂移/震屏。顿帧期间 paused, 粒子和 CSS 动画一起冻住。 */}
      <AmbienceLayer mapId={mapId} paused={hitstop} />

      {/* 战场舞台层: 世界里的一块子矩形(避开左侧手牌栏), 同时是相机的取景安全区。
          它不带自己的 transform —— 相机只驱动外层的 .battle-scene。 */}
      <div className="battle-stage" ref={stageRef}>
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
              twitching={e.id === twitchId}
              onClick={() => onCombatantClick(e.id)}
            />
          ))}
        </div>

        {/* 提示条 */}
        {/* <div className="hint-bar">
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
      {dimHit && <div key={dimHit.seq} className="battle-dim" aria-hidden />}

      {/* ★ 顶端信息条: 法力水晶 | 换牌/丢弃 | 手牌读数 | 时刻标尺 | 结束回合。
          同样在 .battle-scene **之外** ⇒ 不跟分镜相机推近/漂移/震屏, 信息恒定可读。
          ⚠ 它**贴着画布上沿**(top/left/right 全为 0, 不吃 --canvas-pad), 与顶边零缝隙 ——
            见 BattleScreen.css .battle-topbar。 */}
      <div
        className="battle-topbar"
        role="toolbar"
        aria-label="战斗信息条"
        onClick={(e) => e.stopPropagation()}
      >
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

          {/* 手牌张数读数。原先挂在手牌托盘上沿, 但手牌放大后卡会越出 HUD 上沿把它盖住,
              故并入顶端信息条 —— 这里本就是「法力 / 换牌丢弃 / 时刻」的全局读数区。 */}
          <div className="hand-count-readout" aria-hidden="true">
            <span className="hph-tag">HAND</span>
            <span className="hph-rule" />
            <span className="hph-count">
              {String(battle.hand.length).padStart(2, "0")}
              <i>/{String(partyHandLimit(battle)).padStart(2, "0")}</i>
            </span>
          </div>

          {/* 时刻标尺: 本作核心是时刻制, 这是界面里唯一的全局时刻显示。
              它自带 margin-left:auto ⇒ 从这里开始的东西一律靠右, 结束回合按钮因此落在最右端。 */}
          <TickRuler tick={battle.tick} round={battle.round} enemies={enemies} />

          {/* 结束回合: 信息条最右端的一枚横版机能键(旧的竖排外挂条已废弃, 见 .end-turn-btn)。
              放进信息条是为了让「回合级操作」与回合级读数(法力/时刻/手牌)同处一条, 不再有
              一个飘在画布右下的孤立控件。 */}
          <button
            className="end-turn-btn"
            type="button"
            disabled={!isPlayerTurn || animating}
            onClick={(e) => {
              e.stopPropagation();
              triggerEndTurn();
            }}
          >
            结束回合
          </button>
      </div>

      {/* ★ 底部一体化 HUD: 队伍卡 | 手牌托盘 | 卡牌说明面板。
          刻意在 .battle-scene **之外** ⇒ 整条不跟分镜相机推近/漂移/震屏, 构图恒定。
          它同时意味着我方单位不在 .battle-stage 内 —— computeCamera 查不到我方的
          data-cmb-id, 走它现成的 `if (!isFinite(left)) return null` 兜底保持全景, 于是
          「打自身/友军牌时不推镜, 只播特效 + 震屏」不需要任何特判(见 ui/AllyBar.tsx 注释)。 */}
      <div className="battle-hud" onClick={(e) => e.stopPropagation()}>
        <AllyBar
          allies={allies}
          hits={hits}
          attackerId={attackerId}
          focusCharId={focusCharId}
          targetable={isPlayerTurn && !!needsAlly}
          onSelect={onCombatantClick}
        />

        {/* 手牌托盘。导轨/衬板都是纯装饰, 几何全部由 BattleScreen.css 的 --hand-* 旋钮收敛,
            这里不写任何尺寸。
            ⚠ 卡刻意比托盘高(越出 HUD 上沿), 故这一列里不能再放别的东西 —— 原先压在托盘上沿的
              HAND 张数读数已搬到顶端信息条, 见上方 .battle-topbar。 */}
        <div className="hand-panel">
        <div className="hand-tray">
          <span className="hand-tray-rail" aria-hidden="true" />
          {renderHand.length === 0 && battle.hand.length === 0 && (
            <div className="empty-hand">NO CARDS</div>
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
                onHover={(h) => setHoveredUid(h ? c.uid : null)}
              />
            );
          })}
        </div>
        </div>

        {/* 卡牌说明固定面板: 手牌右侧、位置恒定。展示 focusUid(悬停 ?? 选中)那张卡 */}
        <CardInfoPanel card={focusCard} />
      </div>

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
