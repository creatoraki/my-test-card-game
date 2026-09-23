import type { BattleState } from "./battleState";
import type { CardAnim } from "./cards";

// ---------------------------------------------------------------------------
// 动画帧 —— 纯 UI 桥接结构。引擎在结算敌人行动时逐个记录, UI 逐帧回放。
// 引擎只填充结构化数据(行动者/受影响目标/掉血量/快照), 不决定具体表现动画。
// ---------------------------------------------------------------------------
// 一段命中明细。多段伤害(EffectDescriptor.hits)每段独立判命中, 故 missed 是逐段的。
export interface AnimHitPart {
  hpDelta: number; // >0 掉血, <0 回血, 0 = 命中但无 HP 变化(护盾全吃/濒死顶住)
  missed?: boolean;
  crit?: boolean; // 仅供 UI 飘字强调, 引擎不读取
}

export interface AnimHit {
  id: string; // 受影响单位
  hpDelta: number; // 本步对该单位的合计: >0 掉血, <0 回血, 0 仅护盾/状态/自身增益(仍闪特效但不飘字)
  missed?: boolean; // 合计口径: 所有段都未命中才为 true
  // 逐段明细(见 animHits.ts)。缺省 = 单段, UI 退化为一个数字一声音效。
  // UI 靠它渲染多个飘字与多次 HIT 音效; 引擎自身不读取。
  parts?: AnimHitPart[];
}

export interface AnimFrame {
  actorId: string; // 行动者(敌人 id)
  enemyDefId: string; // 供 UI 查招式定义以决定动画表现
  moveId: string; // 本次执行(或意图)的招式 id
  hits: AnimHit[]; // 需要闪特效/飘字的目标(primary / self / 群体)
  snapshot: BattleState; // 该动作结算后的完整快照(structuredClone)
}

export interface DiscardTriggerFx {
  cardUid: string;
  actorId: string;
  anim?: CardAnim;
  autoPlay?: boolean;
  reveal?: boolean; // 仅卡牌亮相提示, 不播放攻击演出或镜头推近
  hits: AnimHit[];
  snapshot: BattleState;
}

// 拍点(DOT/HOT)结算单独成一帧 —— 敌人在出招**之前**先掉毒血, 我方在回合结束统一结算。
// 合进行动帧的话飘字会挤在招式命中之后, 玩家看不出"先中毒再挥拳"的先后。
export interface TempoFx {
  ownerId: string; // 结算拍点的单位
  hits: AnimHit[]; // DOT 掉血 / HOT 回血
  snapshot: BattleState; // 拍点结算后的完整快照(structuredClone)
}

export interface FleeFx {
  actorId: string;
  enemyDefId: string;
  snapshot: BattleState;
}

export interface RelicTriggerFx {
  relicId: string;
  actorId: string;
  hits: AnimHit[];
  snapshot: BattleState;
}

export type FxStep =
  | ({ kind: "enemy" } & AnimFrame)
  | ({ kind: "discard" } & DiscardTriggerFx)
  | ({ kind: "relic" } & RelicTriggerFx)
  | ({ kind: "tempo" } & TempoFx)
  | ({ kind: "flee" } & FleeFx);

export interface FxRecorder {
  steps: FxStep[];
}

export type DiscardRecorder = FxRecorder;
