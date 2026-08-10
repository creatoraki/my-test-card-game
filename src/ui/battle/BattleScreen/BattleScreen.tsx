import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { HandCard } from "@/ui/battle/HandCard";
import { CardInfoPanel } from "@/ui/battle/CardInfoPanel";
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
import { warmEnemyArt } from "@/ui/art/enemyArt";
import { warmVfxSprites } from "@/ui/art/vfxSprites";
import { battleBg, warmBattleBg } from "@/ui/art/battleBg";
import { AmbienceGrade, AmbienceLayer } from "@/ui/battle/AmbienceLayer";
import { resetHandHover } from "@/ui/battle/handFocusStore";
import { useIdleTwitch } from "@/ui/hooks/useIdleTwitch";
import { STAGE, useStageScale } from "@/ui/hooks/stage";
import { cx } from "@/ui/common/cx";
import s from "./BattleScreen.module.css";

// ── 场景相机(透视) ──
// 世界 = 1920×1080 的设计画布(见 ui/stage.ts), 摊在一个真实的 3D 空间里: 背景在远处、
// 敌我单位在基准面 z=0、近景粒子在镜头这一侧(纵深见 CINEMA.depth, 落点在 BattleScreen.css)。
// 相机是这个空间的一次「世界平移 + 绕光轴偏航 + 沿视线推进」, 作为 .battle-scene 的局部
// transform 下发; 真正的投影由 .screen.battle 的 perspective **属性**完成 —— 必须是属性
// 而不是 transform 里的 perspective() 函数, 后者只对该元素自身生效, 后代的 translateZ
// 拿不到透视, 各层就永远不会产生视差。
//
// 全程在设计 px 里算(透视距离也是), 不出现任何屏幕 px ⇒ 任何窗口尺寸下的成像逐 px 一致。
//
// ⚠ 「场景是刚体」这条老约定已被有意打破: 各层深度不同 ⇒ 相机一动就有视差, 角色与它脚下的
//   背景地面会相对滑移。这正是纵深感的来源, 幅度由 CINEMA.depth 收敛(全设 0 即退回刚体)。
interface Camera {
  s: number; // 基准面(敌我单位)的放大倍数; 实现为沿视线的推进量, 见 cameraCss
  dx: number; // 世界平移(世界 px): 把聚焦点送到画框锚点上, 由 worldShift 算出
  dy: number;
  yaw: number; // 偏航角(deg): 正 = 镜头朝右转。0 = 正对场景
  pitch: number; // 俯仰角(deg): 正 = 镜头朝上仰(CSS 的 rotateX 正角把底边拉近)
}

// 全景(无相机)= 恒等变换。刻意不用 "none" —— 见 cameraCss 的函数链恒定说明。
const CAMERA_REST: Camera = { s: 1, dx: 0, dy: 0, yaw: 0, pitch: 0 };

// 镜头光轴 = 画布正中。它同时是 perspective-origin(消失点)、偏航轴与推进的缩放中心 ——
// 三者必须重合, 且必须是**画布**中心而不是取景安全区中心: 前者在 CSS 里恒等于 50% 50%,
// 于是每一个纵深层都能用同一句静态 CSS 定位, 不必逐层下发锚点。
// 取景安全区中心(画框锚点 A)是另一回事 —— 那是"把主体摆哪", 由 worldShift 负责。
const AXIS = { x: STAGE.width / 2, y: STAGE.height / 2 };

// 把世界里的聚焦点 F 送到画框锚点 A 所需的世界平移。
// 基准面的成像为 screen(p) = AXIS + s·(p + d − AXIS)(推进绕光轴放大 s 倍), 令 screen(F)=A:
//   d = (A − AXIS)/s + AXIS − F
// 比"直接 A−F"多出来的那一截, 补的是"绕光轴放大 s 倍会把偏离光轴的 A 顶开"的位移。
function worldShift(A: { x: number; y: number }, F: { x: number; y: number }, s: number) {
  return {
    dx: (A.x - AXIS.x) / s + AXIS.x - F.x,
    dy: (A.y - AXIS.y) / s + AXIS.y - F.y,
  };
}

// 相机 → CSS transform。⚠ 配套前提(缺一不可, 见 BattleScreen.css):
//   .screen.battle  → perspective 属性 + 默认的 perspective-origin(50% 50% = AXIS)
//   .battle-scene   → transform-style: preserve-3d + transform-origin: 50% 50%
//   .battle-world   → 同上(它夹在中间, 一旦 flatten 各层深度就全丢了)
//
// 链的执行顺序是从右往左: 先把世界平移(dx,dy), 再俯仰、再偏航, 最后沿视线推进 z。
// 推进排在两个旋转左侧 ⇒ 推的是「镜头正前方」而非世界 Z, 旋转只管转向;
// rotateY 排在 rotateX 左侧 = 先俯仰后偏航, 即标准相机的 YXZ 姿态顺序(地平线不会被拧歪)。
// 透视投影下 z 处的平面相对光轴放大 P/(P−z), 取 z = P(1−1/s) 即得到基准面精确的 s 倍 ——
// 于是 yaw=0 时基准面的成像与旧的 scale() 逐 px 等价, computeCamera 的取景数学一个字没改;
// 而其余各层因为自带深度, 会自动获得不同的放大与位移速率, 视差由此产生。
//
// ⚠ 函数链恒定(哪怕全景态也照样输出 identity): 只有 from/to 的函数列表逐项对应, 浏览器才会
// 逐项插值; 一旦退化成矩阵插值, 3D 变换会在过渡中间产生诡异的畸变跳动。
function cameraCss(c: Camera | null): string {
  const { s, dx, dy, yaw, pitch } = c ?? CAMERA_REST;
  const z = CINEMA.perspective * (1 - 1 / s);
  return `translateZ(${z}px) rotateY(${yaw}deg) rotateX(${pitch}deg) translate(${dx}px, ${dy}px)`;
}

// 各纵深层的 CSS 变量: 位置 z + 抵消透视的预缩放 (P−z)/P。
// 预缩放保证「静止画面与纵深为 0 时逐 px 相同」—— 纵深只在相机运动时以视差的形式显现,
// 不会悄悄改变任何一层的构图或尺寸。
function depthVars(): Record<string, string> {
  const P = CINEMA.perspective;
  const out: Record<string, string> = {};
  for (const [k, z] of Object.entries(CINEMA.depth)) {
    out[`--depth-${k}`] = `${z}px`;
    out[`--depth-${k}-fix`] = `${(P - z) / P}`;
  }
  return out;
}

const CAMERA_TRANSITION = `transform ${CINEMA.zoomIn}ms cubic-bezier(0.22, 0.61, 0.36, 1)`;
// 瞄准态(挑目标期间)专用: 更慢更软, 与分镜的推近区分开 —— 它是"状态"而非"事件"。
const AIM_TRANSITION = `transform ${CINEMA.aim.dur}ms cubic-bezier(0.2, 0.72, 0.28, 1)`;

// 屏幕 px → 世界 px 的反投影。除数取**世界层**当前的屏幕矩形(其未变换尺寸恒为 STAGE.width),
// 于是 --stage-scale、当前相机变换、以及世界自身的空闲漂移被一次性抵消 —— 测得的永远是纯
// 设计 px, 与 stage.offsetLeft/Top(布局 px)同一坐标系。过渡进行到一半时测量同样成立。
//
// ⚠⚠ 成立的前提是场景当前的变换为 **2D 仿射**(纯缩放 + 平移): 那时"世界矩形 → 屏幕矩形"
//    是线性映射, 用两端点定标才有意义。相机一旦带上偏航/俯仰, 投影就是非线性的,
//    getBoundingClientRect 给的只是投影后的**包围盒** —— 它的中心不再对应世界中心
//    (6° 偏航即可差出几十 px), 反投影会产生同量级的系统性偏差。
//    ⇒ 任何要靠它定位的测量(computeCamera), 都必须安排在姿态已归零的时刻进行;
//      triggerPlay 的镜头交接特意把 yaw/pitch 清零, 就是为了保住这一条。
//    computeAimCamera 是例外: 它只用结果判断"往哪边偏", 再乘比例并钳制, 不怕这点偏差。
function screenToWorld(r: DOMRect, worldRect: DOMRect) {
  const u = STAGE.width / worldRect.width;
  return {
    left: (r.left - worldRect.left) * u,
    top: (r.top - worldRect.top) * u,
    right: (r.right - worldRect.left) * u,
    bottom: (r.bottom - worldRect.top) * u,
  };
}

// 取景安全区(世界 px) = .battle-stage 的布局盒。读 offsetLeft/Top/Width/Height 而非
// getBoundingClientRect —— 布局 px 天然就是世界 px(offsetParent 即 .battle-world), 完全
// 不受相机变换影响。分镜相机与瞄准相机共用同一个画框锚点。
function safeArea(stage: HTMLElement) {
  return { x: stage.offsetLeft, y: stage.offsetTop, w: stage.offsetWidth, h: stage.offsetHeight };
}

// 量一个单位在世界坐标里的包围盒。取内层的 .combatant-stage(立绘 + 特效, 含体型 scale 的那层),
// 而不是外层布局盒 —— 外层量不到大体型敌人的真实占幅, 且会把血条/意图算进取景。
// 我方头像卡没有这层, 退回量自身。查不到该单位(如我方不在 .battle-stage 内)则返回 null。
function worldBoxOf(stage: HTMLElement, worldRect: DOMRect, id: string) {
  const el = stage.querySelector<HTMLElement>(`[data-cmb-id="${id}"]`);
  if (!el) return null;
  // ⚠ 用 data 属性而不是类名选: .combatant-stage 是 CombatantView 的局部类, CSS Modules
  //   哈希后这里写死的字符串永远选不中(会静默退回外层布局盒, 取景就悄悄错了)。
  //   标记由 CombatantView 挂, 见那边的 data-cmb-stage。
  const box = el.querySelector<HTMLElement>("[data-cmb-stage]") ?? el;
  return screenToWorld(box.getBoundingClientRect(), worldRect);
}

const clamp = (v: number, lim: number) => Math.max(-lim, Math.min(lim, v));

// ── 瞄准相机 ──
// 选中攻击卡、正在挑目标期间的常驻镜头: 固定轻微推近, 并朝当前悬停的敌人**转过去** ——
// 姿态(yaw/pitch)与位移(dx/dy)同向叠加。刻意不对准目标: 对准所需的位移会把目标从指针
// 底下挪走, 只求方向感。
//
// ★ 位移必须是斜的。纯水平的直线位移人眼一律读成"平面滑动", 这跟透视/视差做得多足没关系 ——
//   现实里的相机不会只沿一条水平轨道走。所以纵向有两个来源, 缺一不可:
//     ① panY —— 跟随目标自身的高度(敌人普遍站在画框上方 ⇒ 镜头整体微微抬起)
//     ② arc  —— 越偏离画框中央抬得越多, 于是从中央看向两侧走的是一条弧线;
//                哪怕两个敌人一样高, 左右切换目标时轨迹也是斜的, 而不是一条水平直线。
//
// ⓘ 这里量目标位置用的仍是 getBoundingClientRect + screenToWorld, 而此刻场景可能正带着
//   几度姿态 —— 投影包围盒因此有 <1% 的失真。无所谓: 结果只用来定"往哪边偏、偏多少",
//   还要再乘比例并钳制, 且偏移量有上限 ⇒ 不会自激。
function computeAimCamera(
  world: HTMLElement | null,
  stage: HTMLElement | null,
  foeId: string | null,
): Camera | null {
  if (!world || !stage) return null;
  const worldRect = world.getBoundingClientRect();
  if (worldRect.width <= 0) return null;

  const safe = safeArea(stage);
  const A = { x: safe.x + safe.w / 2, y: safe.y + safe.h / 2 }; // 画框锚点 = 安全区中心
  const { scale: s, yaw: yawMax, pitch: pitchMax, pan, panMax, panY, panMaxY, arc } = CINEMA.aim;

  let yaw = 0, pitch = 0;
  const F = { ...A }; // 聚焦点: 默认就是画框锚点(不朝任何人时纯推近)
  const box = foeId ? worldBoxOf(stage, worldRect, foeId) : null;
  if (box) {
    // 目标中心相对画框锚点的偏离(世界 px), 以及它占半个安全区的比例
    const offX = (box.left + box.right) / 2 - A.x;
    const offY = (box.top + box.bottom) / 2 - A.y;
    const nx = clamp(offX / (safe.w / 2), 1);
    const ny = clamp(offY / (safe.h / 2), 1);

    // 姿态: 目标在右就朝右转(CSS 的 rotateY 正角把右侧推远、收向中心, 正是相机右转的成像);
    // 俯仰**反号** —— CSS 的 y 轴向下为正, 而 rotateX 正角是把底边拉近(仰视), 故目标偏上
    // (ny<0)时 pitch 取正 = 镜头上仰。
    yaw = nx * yawMax;
    pitch = -ny * pitchMax;

    // 位移: 聚焦点朝目标让开一小段(与姿态同向协同), 纵向再叠一段随横向偏离增大的抬升。
    // arc 取负是"镜头看向更高处" —— 聚焦点上移, 画面内容随之下沉。
    F.x += clamp(offX * pan, panMax);
    F.y += clamp(offY * panY, panMaxY) - Math.abs(nx) * arc;
  }
  return { s, ...worldShift(A, F, s), yaw, pitch };
}

const sameCamera = (a: Camera | null, b: Camera | null) =>
  a === b ||
  (!!a &&
    !!b &&
    a.s === b.s &&
    a.dx === b.dx &&
    a.dy === b.dy &&
    a.yaw === b.yaw &&
    a.pitch === b.pitch);

export function BattleScreen() {
  const battle = useBattleStore((s) => s.battle);
  const battleMeta = useBattleStore((s) => s.meta);
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
  const [camera, setCamera] = useState<Camera | null>(null); // 分镜相机变换(null=全景)
  // —— 瞄准运镜(挑目标期间的常驻态, 与上面的分镜相机互斥) ——
  // aimFoeId: 当前朝向的敌人, **锁存** —— 只在悬到另一个敌人或指针离开 .battle-stage 时才变。
  // ⓘ 这是个顶层 hover state, 与本文件上方 selectedUid 处"悬停态别放这里"的告诫**不矛盾**:
  //   那条针对手牌(鼠标扫过一排 10 张牌 ⇒ 连续 setState 全量重渲染)。敌人最多 4 个、且只在
  //   待选目标态里响应, 触发频率与点击同级, 代价等同于 setSelectedUid 本身。
  const [aimFoeId, setAimFoeId] = useState<string | null>(null);
  const [aim, setAim] = useState<Camera | null>(null); // 瞄准相机(null=不在瞄准态)
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
  const dealtUidsRef = useRef(new Set<string>()); // 已经播过飞入动画的卡 uid
  const openingDoneRef = useRef(false); // 本场战斗的首批手牌是否已发出
  const timersRef = useRef<number[]>([]);
  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  // 换战斗时清空选择/悬浮/动画(并让在途动画批次失效)
  useEffect(() => {
    setSelectedUid(null);
    resetHandHover();
    setHandAction(null);
    setOpenPile(null);
    clearTimers();
    seqRef.current++;
    animatingRef.current = false;
    setAnimating(false);
    setAttackerId(null);
    setHits({});
    setCutInCard(null);
    setCamera(null);
    setAimFoeId(null);
    setAim(null);
    setHitstop(false);
    dealtUidsRef.current.clear();
    openingDoneRef.current = false;
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

  const handleCardExited = (uid: string) => {
    dealtUidsRef.current.delete(uid);
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
    setAim((prev) => (sameCamera(prev, next) ? prev : next));
  }, [battle, selectedUid, aimFoeId, animating, stageScale]);

  if (!battle) return <div className={s.loading}>加载中…</div>;
  const b = battle; // 非空别名: 供下方事件处理/setTimeout 闭包安全引用(收窄不跨闭包)

  const isPlayerTurn = battle.phase === "player";
  const selectedCard = selectedUid ? battle.cards[selectedUid] : null;
  const needsFoe = selectedCard?.targeting === "foe";
  const needsAlly = selectedCard?.targeting === "ally";

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
  // 左侧透明手牌栏底下(见上方 safeArea)。
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
      const w = worldBoxOf(stage, worldRect, id);
      if (!w) continue;
      left = Math.min(left, w.left);
      top = Math.min(top, w.top);
      right = Math.max(right, w.right);
      bottom = Math.max(bottom, w.bottom);
    }
    if (!isFinite(left)) return null;

    // 取景安全区(世界 px)
    const safe = safeArea(stage);

    // 并集需占据视野, 但留出边距(占安全区 CINEMA.fit), 再与上限 CINEMA.scale 取较小值防溢出。
    const spanW = Math.max(1, right - left), spanH = Math.max(1, bottom - top);
    const fit = Math.min((safe.w * CINEMA.fit) / spanW, (safe.h * CINEMA.fit) / spanH);
    const s = Math.max(1, Math.min(CINEMA.scale, fit));

    const F = { x: (left + right) / 2, y: (top + bottom) / 2 }; // 聚焦点: 并集中心
    const A = { x: safe.x + safe.w / 2, y: safe.y + safe.h / 2 }; // 画框锚点: 安全区中心

    // yaw/pitch=0 —— 分镜的职责是"把目标怼到画面正中看清楚", 该正对就正对; 它的 3D 感来自
    // 推进时各纵深层的视差(背景退开、近景粒子扑面)。姿态是瞄准态的事(见 computeAimCamera)。
    return { s, ...worldShift(A, F, s), yaw: 0, pitch: 0 };
  }

  // 逐步回放动画。seq 为本批次代号: 切战斗/发起新动作会使旧批次的定时器回调失效。
  // 单步分镜: 施法者弹出(全景可见) → 顿 → 镜头推近聚焦目标 → 命中特效/飘字停留 → 镜头恢复+归位。
  function runSteps(steps: AnimStep[], final: BattleState, seq: number, enter: Camera | null) {
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
      const first = i === 0;
      const step = steps[i++];
      const preset = ANIM[step.anim];
      const focusIds = step.hits.length ? step.hits.map((h) => h.id) : [step.actorId];
      setAttackerId(step.actorId); // 施法者弹出并保持(CSS .attacking)
      // 「顿」期间的镜头。默认回全景, 让施法者弹出这一下看得见 ——
      // 但第 0 步若带着 enter(玩家刚从瞄准态点下目标), 就**接着瞄准位往下演**: 先退回全景
      // 再推近会把"确认目标 → 打过去"这个连贯动作切成一退一进两截, 观感很碎。
      setCamera(first ? enter : null);

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
  // enter: 第 0 步「顿」期间的镜头(null=回全景)。玩家出牌时传当前瞄准位, 见 triggerPlay。
  function startBatch(steps: AnimStep[], final: BattleState, enter: Camera | null = null) {
    const seq = ++seqRef.current;
    animatingRef.current = true;
    setAnimating(true);
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
    const steps: AnimStep[] = [
      { actorId: card.ownerCharId, anim, snapshot: plan.cardSnapshot, hits: cardHits, card },
      ...plan.frames.map(stepFromFrame),
    ];

    // 出牌瞬间的镜头交接: 从瞄准位**接着往下推**, 不回全景(见 runSteps 的 enter)。
    // ⚠ 但姿态(yaw/pitch)必须在这一刻归零, 只留推近与平移 —— 两个理由:
    //   ① 叙事上: 目标已确认, 镜头该对正了; 保持歪着推进反而像没瞄准好。
    //   ② 技术上(硬性): 500ms 后 computeCamera 要量目标位置, 而 screenToWorld 只在场景是
    //      2D 仿射(纯缩放+平移)时才精确 —— 带着偏航去量, 反投影会有几十 px 的系统性偏差,
    //      推近后目标就不在画面正中了。详见 screenToWorld 的注释。
    //   转正用的是 zoomIn(380ms) < beat(500ms), 到量取时刻已经稳定落位。
    const enter = aim ? { ...aim, yaw: 0, pitch: 0 } : null;
    startBatch(steps, plan.final, enter);
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
        resetHandHover(); // 换掉/丢掉的那张已不在手上, 详情面板不该继续显示它
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
      style={
        {
          "--stage-scale": stageScale,
          // 透视距离下发给 .screen.battle 的 perspective 属性(唯一真相在 CINEMA.perspective;
          // cameraCss 的推进量按同一个 P 反算, 两边必须是同一个数)
          "--perspective": `${CINEMA.perspective}px`,
        } as React.CSSProperties
      }
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
          data-focused: **分镜**相机非全景时置位, CSS 据此暂停世界的空闲漂移(见下)。瞄准态
          刻意不置位 —— 挑目标可以持续很久, 那期间画面不该完全静止。
          camera ?? aim: 分镜相机优先, 挑目标期间才轮到瞄准相机(两者天然互斥, 见上方 effect)。 */}
      <div
        className={s["battle-scene"]}
        ref={sceneRef}
        data-focused={camera ? "1" : undefined}
        style={{
          transition: camera ? CAMERA_TRANSITION : AIM_TRANSITION,
          transform: cameraCss(camera ?? aim),
        }}
      >
      {/* ★ 世界层: 相机之下、场景内容之上的一层。它同样包住背景 + 氛围 + 舞台,
          存在的意义是让「空闲漂移」和「震屏」有地方落 —— 场景层的 transform 已被相机占用。
          三个变换属性各司其职、互不覆盖: transform=漂移, translate=震屏位移, scale=冲击缩放。
          刻意 position:absolute + inset:0 与场景层几何重合 ⇒ 它成为 .battle-stage 的
          offsetParent, computeCamera 读的取景安全区(stage.offsetLeft/Top/W/H)一个数都不用改。
          ⚠ 它必须保持 transform-style: preserve-3d(见 CSS) —— 各纵深层就挂在它下面,
            一旦它 flatten, 视差(以及整个 3D 感)当场消失。
          --depth-*: 各层的纵深与抵消透视的预缩放, 唯一真相在 CINEMA.depth。 */}
      <div
        className={cx(
          s["battle-world"],
          shake.level > 0 && s[`shake-lv${shake.level}`],
          shake.level > 0 && s[`shake-${shake.seq % 2 ? "a" : "b"}`],
        )}
        ref={worldRef}
        style={
          {
            ...depthVars(),
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
          它在世界内 ⇒ 跟随相机与漂移/震屏。顿帧期间 paused, 粒子和 CSS 动画一起冻住。 */}
      <AmbienceLayer mapId={mapId} paused={hitstop} />

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
              onClick={() => onCombatantClick(e.id)}
              onHover={() => setAimFoeId(e.id)}
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

      <RoundIndicator
        round={battle.round}
        maxRound={12}
        tick={battle.tick}
        enemies={enemies}
      />
      {battleMeta && <ChallengeRail challenges={battleMeta.challenges} />}
      <div className={s.topRight}>
        {battleMeta && <BondRail bonds={battleMeta.bonds} />}
        <BattleActions canEndTurn={isPlayerTurn && !animating} onEndTurn={triggerEndTurn} />
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
        <div className={s["hand-panel"]}>
        {/* data-hand-tray: HandCard 的版式/厚度规则要从托盘起手选自己(见 HandCard.module.css
            末尾那一段)。类名会被哈希、跨不过模块边界, 属性可以(样式铁律 2)。 */}
        <div className={s["hand-tray"]} data-hand-tray>
          <span className={s["hand-tray-rail"]} aria-hidden="true" />
          {renderHand.length === 0 && battle.hand.length === 0 && (
            <div className={s["empty-hand"]}>NO CARDS</div>
          )}
          {renderHand.map((entry) => {
            const c = entry.card;
            const leaving = entry.leaving || c.uid === playingOutUid;
            return (
              <HandCard
                key={c.uid}
                card={c}
                dealDelay={entry.dealDelay}
                leaving={leaving}
                playable={!leaving && isPlayerTurn && (handAction !== null || canPlay(battle, c.uid))}
                selected={c.uid === selectedUid}
                onExited={() => handleCardExited(c.uid)}
                onClick={() => onCardClick(c.uid)}
              />
            );
          })}
        </div>
        </div>
      </div>

      <PileRail battle={battle} onOpenPile={setOpenPile} />

      <PileDrawer battle={battle} pile={openPile} onClose={() => setOpenPile(null)} />

      {/* ★ 卡牌说明固定面板: 画布**右上角**, 位置恒定。展示「悬停 ?? 选中」那张卡 ——
          悬停那半它自己订阅 ui/handFocusStore.ts, 这里只把选中的传下去(理由同 AllyBar)。
          刻意在 .battle-hud **之外**(它曾是 HUD 的第三列) —— 手牌上限实为 10 张, 面板让出那一列
          后手牌托盘才排得下, 几何与层序的完整理由见 ui/CardInfoPanel.css .card-info-panel。
          同样在 .battle-scene 之外 ⇒ 不跟分镜相机推近/漂移/震屏。 */}
      <CardInfoPanel fallbackCard={selectedCard} />

      {/* 胜负遮罩 */}
      {!isPlayerTurn && (
        <div className={s.overlay}>
          <div className={s["overlay-card"]}>
            <h2>{battle.phase === "won" ? "🎉 战斗胜利!" : "💀 战斗失败"}</h2>
            {/* `primary` 是 styles/base.css 的**全局**按钮皮肤(button.primary), 不是本模块的类 */}
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
