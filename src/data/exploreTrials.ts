// ============================================================================
// 挑战节点事件池 —— 探索层唯一一种**跨轮生效**的节点(见 explore/types.ts TrialDef)。
//
// 一句话玩法: 花 5 点净化粒子接下一份契约 →
//   **接下的当轮与下一轮的全部战斗**(推进战斗 + 节点战斗)都背着一条属性衰减 →
//   下一轮的推进战斗打完立刻结算奖励并撤掉衰减。
//   中途撤离 / 战斗失利 = 白扛两轮, 不发奖。这就是赌注本身。
//
// ★ 与别的节点最大的不同: 决策的后果不在这个节点里结束。玩家要算的不是「这一格划不划算」,
//   而是「我现在的队伍状态, 能不能带着这条 debuff 再打两场」。
//
// ⚠ 代码里一律叫 trial, 界面文字一律叫「挑战」——
//   engine/challenges/ 已经有一套「挑战词条」(战斗内的掉落系数加成目标), 两者毫无关系,
//   撞名会让日后读代码的人把 pendingChallengeBonus 与本文件搅在一起。
//
// ⚠ 属性修正的硬约束: runStore.launchBattle 对**每一名角色各叠一次** trial.mods,
//   所以这里**绝不能**写 burdenAdapt —— 它是「小队合计」属性,
//   三人队会被叠成三倍。maxHp 同样不碰(会让当前血量高于上限)。
//   安全项: attack / healPower / healBoost / shieldBoost / dodgeRate / blockRate /
//           hitRate / critRate / critDamage / precision / initiative / armorPen。
//
// ⚠ EventChoice.desc 当前 UI **不渲染**(选项不预告得失), 所以每条 debuff 的具体数值
//   必须写进 description 正文里 —— 那是玩家唯一读得到的地方。
// ============================================================================

import type { NodeEvent, TrialDef } from "../explore/types";
import { choice, item, items, outcome, startTrial } from "./exploreEventKit";

// 全部挑战统一持续 2 轮(接下的当轮 + 下一轮)。改这一个数就是改整套机制的时长。
const TRIAL_ROUNDS = 2;

// ---------------------------------------------------------------------------
// 四份契约
// ---------------------------------------------------------------------------
// 奖励一律是「物品包 / 常驻小队增益」二选一, 权重各 1 —— 到期时由 session 掷一次。
// ★ 正面遗物收益转为随机祝福遗物 ⇒ 进入待拾取框并占用背包格；与本轮的负面修正是两套东西。

const OVERLOAD_LIMITER: TrialDef = {
  id: "trial-overload-limiter",
  name: "过载限流阀",
  penaltyDesc: "全队攻击力 −30%",
  mods: { pct: { attack: -30 } },
  rounds: TRIAL_ROUNDS,
  rewards: [
    outcome(
      "cache",
      "限流阀在契约结束时吐出被扣押的整批配件：逻辑魔方 ×1 与备用电池 ×2。",
      items(item("logic-cube"), item("standard-battery", 2)),
    ),
    outcome(
      "feedback",
      "限流阀解除时把积压的功率反灌回队伍的动力接口，之后的战斗都能多榨出一点输出。",
      [{ type: "GRANT_RANDOM_RELIC" }],
    ),
  ],
};

const MEDICAL_LOCKDOWN: TrialDef = {
  id: "trial-medical-lockdown",
  name: "医疗协议封锁",
  penaltyDesc: "治愈力 −35%、治愈强度 −20",
  mods: { pct: { healPower: -35 }, flat: { healBoost: -20 } },
  rounds: TRIAL_ROUNDS,
  rewards: [
    outcome(
      "stock",
      "封锁解除，被扣下的整批医疗物资退还给你们：医疗包 ×2 与圣水 ×1。",
      items(item("medical-kit-c", 2), item("holy-water-c")),
    ),
    outcome(
      "protocol",
      "封锁期间的用药记录被系统判定为合规，队伍获得了应急输液权限。",
      [
        { type: "GRANT_RANDOM_RELIC" },
      ],
    ),
  ],
};

const GRAVITY_RECALIBRATION: TrialDef = {
  id: "trial-gravity-recalibration",
  name: "重力校准场",
  penaltyDesc: "闪避率 −20、格挡率 −15",
  mods: { flat: { dodgeRate: -20, blockRate: -15 } },
  rounds: TRIAL_ROUNDS,
  rewards: [
    outcome(
      "vault",
      "校准场关闭时打开了配重仓，登记在场地名下的那件装备连同两枚复位弹簧一起被推了出来。",
      items({ type: "GRANT_EQUIP" }, item("coil-spring", 2)),
    ),
    outcome(
      "adapt",
      "两轮重力扰动之后，队伍的动作已经自己适应了偏移的配重。",
      [
        { type: "GRANT_RANDOM_RELIC" },
      ],
    ),
  ],
};

const SENSOR_JAMMER: TrialDef = {
  id: "trial-sensor-jammer",
  name: "感应干扰塔",
  penaltyDesc: "命中率 −15、暴击率 −20",
  mods: { flat: { hitRate: -15, critRate: -20 } },
  rounds: TRIAL_ROUNDS,
  rewards: [
    outcome(
      "salvage",
      "干扰塔停机后，塔基的备用槽位是完整的：一枚通用模组与一枚磁性分拣单元。",
      items({ type: "GRANT_MODULE" }, item("magnet")),
    ),
    outcome(
      "calibrate",
      "在持续干扰下练出来的瞄准习惯留了下来，队伍的锁定比进塔之前更稳。",
      [
        { type: "GRANT_RANDOM_RELIC" },
      ],
    ),
  ],
};

// ---------------------------------------------------------------------------
// 节点事件
// ---------------------------------------------------------------------------
// ⚠ energyDelta 必须与 choices[0].energyDelta 一致 —— 节点浮卡读的是前者(预览),
//   真正结算读的是后者。两边写岔了, 玩家看到的代价就是假的。
// ⚠ 「放弃」一支必须存在: 挑战是可选的赌注, 不是强制过路费。
const ACCEPT_ENERGY = -5;

export const TRIAL: NodeEvent[] = [
  {
    id: "trial-overload-limiter",
    kind: "trial",
    category: "trial",
    title: "过载限流阀",
    description:
      "限流阀把整层的输出功率死死压在最低档，被它扣押的一批配件就锁在闸箱后面的缓冲仓里。" +
      "契约端口还亮着：接入即可取回配件，代价是本轮与下一轮的全部战斗中，全队攻击力下降 30%。" +
      "阀门会在下一轮的推进战斗结束后自行解锁。",
    energyDelta: ACCEPT_ENERGY,
    depth: [1, 4],
    choices: [
      choice(
        "accept",
        "接受挑战",
        "消耗 5 粒子，承受两轮攻击力衰减",
        "你把手按上契约端口。限流阀的指示灯从红转黄，队伍的动力输出应声掉了一截。",
        [startTrial(OVERLOAD_LIMITER)],
        ACCEPT_ENERGY,
      ),
      choice(
        "skip",
        "绕开限流阀",
        "什么也不会发生",
        "你没有碰那块端口，带着队伍从闸箱旁边绕了过去。缓冲仓的锁一直没有响。",
        undefined,
      ),
    ],
  },
  {
    id: "trial-medical-lockdown",
    kind: "trial",
    category: "trial",
    title: "医疗协议封锁",
    description:
      "整层的医疗协议被一道旧封锁令冻结，物资柜的玻璃后面能看见成排未启封的医疗包。" +
      "解封申请可以现在提交，但审核期内治疗全部降级：本轮与下一轮的全部战斗中，" +
      "治愈力下降 35%，治愈强度下降 20 点。审核会在下一轮的推进战斗结束后出结果。",
    energyDelta: ACCEPT_ENERGY,
    depth: [1, 4],
    choices: [
      choice(
        "accept",
        "接受挑战",
        "消耗 5 粒子，承受两轮治疗衰减",
        "你提交了解封申请。终端立刻把队伍的医疗权限降到了最低档，物资柜仍然锁着。",
        [startTrial(MEDICAL_LOCKDOWN)],
        ACCEPT_ENERGY,
      ),
      choice(
        "skip",
        "不提交申请",
        "什么也不会发生",
        "你合上了申请界面。物资柜的玻璃映着队伍走开的背影，封锁令继续生效。",
        undefined,
      ),
    ],
  },
  {
    id: "trial-gravity-recalibration",
    kind: "trial",
    category: "trial",
    title: "重力校准场",
    description:
      "校准场的配重仓悬在半空，仓门上登记着一件从未被领走的装备。" +
      "启动校准就能让仓门在流程结束时打开，但整个过程里场地重力会持续偏移：" +
      "本轮与下一轮的全部战斗中，闪避率下降 20、格挡率下降 15。" +
      "校准会在下一轮的推进战斗结束后完成。",
    energyDelta: ACCEPT_ENERGY,
    depth: [1, 4],
    choices: [
      choice(
        "accept",
        "接受挑战",
        "消耗 5 粒子，承受两轮闪避与格挡衰减",
        "你启动了校准程序。脚下的地板轻轻沉了一下，每个人的动作都慢了半拍。",
        [startTrial(GRAVITY_RECALIBRATION)],
        ACCEPT_ENERGY,
      ),
      choice(
        "skip",
        "关闭校准程序",
        "什么也不会发生",
        "你把校准程序退了出来。配重仓停在原处，仓门始终没有松动。",
        undefined,
      ),
    ],
  },
  {
    id: "trial-sensor-jammer",
    kind: "trial",
    category: "trial",
    title: "感应干扰塔",
    description:
      "干扰塔还在向整层广播噪声，塔基的备用槽位里能看见一枚完整的通用模组。" +
      "停机指令要跑满两轮才生效，而在那之前噪声只会更强：" +
      "本轮与下一轮的全部战斗中，命中率下降 15、暴击率下降 20。" +
      "塔会在下一轮的推进战斗结束后彻底停机。",
    energyDelta: ACCEPT_ENERGY,
    depth: [1, 4],
    choices: [
      choice(
        "accept",
        "接受挑战",
        "消耗 5 粒子，承受两轮命中与暴击衰减",
        "你下达了停机指令。塔顶的噪声反而拔高了一档，所有人的瞄准镜同时开始跳字。",
        [startTrial(SENSOR_JAMMER)],
        ACCEPT_ENERGY,
      ),
      choice(
        "skip",
        "让干扰塔继续运行",
        "什么也不会发生",
        "你没有下达停机指令。噪声在身后维持着同一个音高，塔基的槽位仍然锁着。",
        undefined,
      ),
    ],
  },
];
