// 探索会话。断言集中在三件事:
//   ① 阶段机(generating → sealed → revealing → choosingEntry → advancing → landed →
//      resolving → atNode → (推进 / 前往下一区域) → routeDisclosure → inBattle → 下一轮)
//      不会被跳步或绕过 —— 尤其是四处:
//      · sealed → revealing 只能由玩家主动触发, 且**一轮仅此一次**(桥接不能反复看);
//      · 入口通道只能在 choosingEntry 选一次, 之后不可再改;
//      · landed: 推进动画播完只是落点, 效果必须等玩家选完分支才生效;
//      · currentSegment === 4 时**不得**再提供「继续推进」;
//   ② 20 个节点的**深度分层与保底规则**成立(设计文档 §2.3.2) —— 浅停有价值、深潜有方差;
//   ③ 能量档位(每节点 −3)、血量继承、团灭清算这些跨系统的口子表现稳定。

import { describe, expect, it } from "vitest";
import { makeItemStack } from "../data";
import { EXPLORE_RULES, ENERGY_TIERS } from "./rules";
import {
  addItems,
  arriveNode,
  backpackSlots,
  battleTierOf,
  burdenNow,
  canOpenBackpack,
  canPushOn,
  canUseItem,
  chooseEntry,
  chooseOption,
  confirmNode,
  createSession,
  discardStack,
  encounterModifier,
  energyTier,
  finishBattle,
  finishGenerating,
  generateRound,
  finishReveal,
  landedEvent,
  leaveRegion,
  projectedEnergy,
  pushOn,
  retreat,
  rewardMultiplier,
  shipHome,
  startReveal,
  startSlot,
  stopReel,
  chooseSlotCard,
  useItem,
} from "./session";
import type { ExploreState, PartySnapshot } from "./types";

const PARTY: PartySnapshot[] = [
  { charId: "swordsman", name: "剑士", emoji: "⚔️", hp: 70, maxHp: 70, alive: true, burdenAdapt: 0 },
];

const SEGMENTS = EXPLORE_RULES.segmentsPerRound;
const WIN = [{ charId: "swordsman", hp: 70, alive: true }];

// ⚠ 直接写 s.phase !== "x" 会让 TS 顺着上一处早退把类型收窄成单个字面量, 后面的比较就成了
// 「两个字面量无交集」的编译错误。会话是被纯函数就地改的, 收窄在这里没有意义 —— 统一走这个取值器。
const phaseOf = (s: ExploreState): string => s.phase;

function newSession(seed = 1): ExploreState {
  return createSession(
    "neon-city",
    PARTY.map((p) => ({ ...p })),
    seed,
  );
}

// 从新生成的一轮(generating)推到 choosingEntry —— 浮现、揭示、限时这三拍都是 UI 侧的
// 定时器/点击驱动的, 纯逻辑测试里一次走完即可。所有「换轮之后」的用例都该先过这里。
function toChoosing(s: ExploreState): void {
  finishGenerating(s);
  startReveal(s);
  finishReveal(s);
}

// 结算一个节点: 推进动画 → 落点 → 选主分支 → 确认 → 停在 atNode。
// ⚠ 分支固定取 0(主选项): 它的代价与效果就是节点卡上给玩家预览的那一份, 用它跑保底最稳。
function takeNode(s: ExploreState): void {
  arriveNode(s);
  chooseOption(s, 0);
  if (s.phase === "resolving") confirmNode(s);
}

// 披露页 → 战斗签 → 开战。转轮的三次暂停用固定 elapsedMs 喂进去, 种子一样结果就一样。
// ⚠ 停哪个符号不重要(测试只需要走进 inBattle), 但**必须真的走完三次** ——
//   少一次就停在 slotSpinning, 后面的战斗回填会静默地什么都不做。
function runSlot(s: ExploreState, index = 0): void {
  startSlot(s);
  stopReel(s, 40);
  stopReel(s, 220);
  stopReel(s, 505);
  chooseSlotCard(s, index);
}

// 走完一整轮: 选入口 → 榨满 4 个节点 → 披露 → 战斗签 → 推进战斗 → 判胜。
function runRound(s: ExploreState, lane = 0, nodes = SEGMENTS): void {
  toChoosing(s);
  chooseEntry(s, lane);
  for (let i = 0; i < nodes; i++) {
    if (phaseOf(s) !== "advancing") break;
    takeNode(s);
    if (phaseOf(s) !== "atNode") return; // 撤离 / 团灭
    if (i < nodes - 1 && canPushOn(s)) pushOn(s);
  }
  if (phaseOf(s) === "atNode" || phaseOf(s) === "choosingEntry") leaveRegion(s);
  if (phaseOf(s) === "routeDisclosure") runSlot(s);
  if (phaseOf(s) === "inBattle") finishBattle(s, true, WIN, ["scrap-bot", "scrap-bot"]);
}

describe("建局", () => {
  it("开局即生成第 1 轮, 处于浮现演出阶段", () => {
    const s = newSession();
    expect(s.phase).toBe("generating");
    expect(s.round).toBe(1);
    expect(s.roundCount).toBe(6);
    expect(s.currentSegment).toBe(0);
    expect(s.energy).toBe(EXPLORE_RULES.startingEnergy);
    expect(s.board).not.toBeNull();
    expect(s.board!.segments).toHaveLength(SEGMENTS);
    expect(s.board!.nodes).toHaveLength(SEGMENTS);
    for (const row of s.board!.nodes) expect(row).toHaveLength(EXPLORE_RULES.laneCount);
  });

  it("同种子两次建局完全一致", () => {
    expect(newSession(2024).board).toEqual(newSession(2024).board);
  });

  it("队伍是拷贝 —— 改会话不会污染传进来的快照", () => {
    const party = PARTY.map((p) => ({ ...p }));
    const s = createSession("neon-city", party, 1);
    s.party[0].hp = 1;
    expect(party[0].hp).toBe(70);
  });
});

describe("节点生成与保底(设计文档 §2.3.2)", () => {
  // 把一整趟远征的每一轮都过一遍, 逐轮检查 —— 单看第 1 轮说明不了问题。
  function eachBoard(seed: number, fn: (s: ExploreState) => void): void {
    const s = newSession(seed);
    let guard = 0;
    while (s.phase !== "retreated" && s.phase !== "wiped" && s.phase !== "cleared" && guard++ < 8) {
      fn(s);
      runRound(s);
    }
  }

  it("每轮恰好 20 个节点, 同一推进段内不重复", () => {
    for (let seed = 1; seed <= 20; seed++) {
      eachBoard(seed, (s) => {
        const rows = s.board!.nodes;
        expect(rows.flat()).toHaveLength(SEGMENTS * EXPLORE_RULES.laneCount);
        for (const row of rows) {
          const ids = row.map((e) => e.id);
          expect(new Set(ids).size).toBe(ids.length);
        }
      });
    }
  });

  it("深度分层: 每个节点都落在自己 depth 允许的推进段里", () => {
    for (let seed = 1; seed <= 20; seed++) {
      eachBoard(seed, (s) => {
        s.board!.nodes.forEach((row, seg) => {
          for (const e of row) {
            const [lo, hi] = e.depth ?? [1, SEGMENTS];
            expect(seg + 1).toBeGreaterThanOrEqual(lo);
            expect(seg + 1).toBeLessThanOrEqual(hi);
          }
        });
      });
    }
  });

  it("风险节点只在第 3-4 推进段, 且纯负面 ≤ 2、高风险 ≤ 3(全图配额)", () => {
    for (let seed = 1; seed <= 20; seed++) {
      eachBoard(seed, (s) => {
        const flat = s.board!.nodes.flat();
        expect(flat.filter((e) => e.risk === "negative").length).toBeLessThanOrEqual(2);
        expect(flat.filter((e) => e.risk === "highRisk").length).toBeLessThanOrEqual(3);
        s.board!.nodes.slice(0, 2).forEach((row) => {
          for (const e of row) expect(e.risk).toBeUndefined();
        });
      });
    }
  });

  it("第 1-2 推进段至少有 1 个生存节点 —— 浅停必须是有价值的巩固打法", () => {
    for (let seed = 1; seed <= 20; seed++) {
      eachBoard(seed, (s) => {
        const shallow = [...s.board!.nodes[0], ...s.board!.nodes[1]];
        expect(shallow.some((e) => e.category === "survival")).toBe(true);
      });
    }
  });

  it("全图至少 3 个成长节点", () => {
    for (let seed = 1; seed <= 20; seed++) {
      eachBoard(seed, (s) => {
        const growth = s.board!.nodes.flat().filter((e) => e.category === "growth");
        expect(growth.length).toBeGreaterThanOrEqual(3);
      });
    }
  });

  it("未实现的事件(disabled)不参与抽取, 战斗事件已经不存在了", () => {
    for (let seed = 1; seed <= 20; seed++) {
      eachBoard(seed, (s) => {
        for (const e of s.board!.nodes.flat()) {
          expect(e.disabled).not.toBe(true);
          expect(e.category).not.toBe("battle");
        }
      });
    }
  });

  it("终局类事件不会在第 5 轮之前出现(枯竭档的撤离升降机除外)", () => {
    for (let seed = 1; seed <= 20; seed++) {
      eachBoard(seed, (s) => {
        if (s.round >= 5) return;
        for (const e of s.board!.nodes.flat()) {
          // ★ 撤离升降机的枯竭档保护无视轮次限制(设计文档 §4.2): 时限是压力, 不是死刑。
          if (e.id === "evac-lift") continue;
          expect(e.category).not.toBe("endgame");
        }
      });
    }
  });

  it("能量跌到枯竭档时撤离升降机必现于第 1-2 段 —— 时限是压力, 不是死刑", () => {
    // ⚠ 这条是**硬保底**, 所以直接对着生成器断言, 不要靠「打一轮看看」——
    //   打一轮会经过能量类事件(逆流净化机 +18), 能量可能反弹出第 5 档, 保底本就不该生效,
    //   于是用例会随种子时灵时不灵, 而且失败时分不清是保底坏了还是能量没跌到位。
    for (let seed = 1; seed <= 20; seed++) {
      const s = newSession(seed);
      s.energy = 5;
      expect(energyTier(s.energy).tier).toBe(5);
      s.round = 2; // 枯竭档保护**无视 minRound**: 第 2 轮也必须给出升降机
      generateRound(s);
      const shallow = [...s.board!.nodes[0], ...s.board!.nodes[1]];
      expect(shallow.some((e) => e.id === "evac-lift")).toBe(true);
    }
  });
});

describe("阶段机", () => {
  it("浮现与揭示阶段都不能选入口 —— 必须一路走到 choosingEntry", () => {
    const s = newSession();
    expect(chooseEntry(s, 0)).toBe(false); // generating
    expect(finishGenerating(s)).toBe(true);
    expect(s.phase).toBe("sealed");
    expect(chooseEntry(s, 0)).toBe(false); // sealed: 桥接还没揭示, 不许下注
    expect(startReveal(s)).toBe(true);
    expect(s.phase).toBe("revealing");
    expect(chooseEntry(s, 0)).toBe(false); // revealing
    expect(finishReveal(s)).toBe(true);
    expect(s.phase).toBe("choosingEntry");
    expect(chooseEntry(s, 0)).toBe(true);
    expect(s.phase).toBe("advancing");
  });

  it("★ 桥接一轮只能看一次 —— 揭示之后再也回不到 sealed", () => {
    const s = newSession();
    expect(startReveal(s)).toBe(false); // 演出没播完就想揭示: 不认
    finishGenerating(s);
    expect(startReveal(s)).toBe(true);
    expect(startReveal(s)).toBe(false); // revealing 阶段再按不生效
    finishReveal(s);
    expect(startReveal(s)).toBe(false);
    expect(s.phase).toBe("choosingEntry");
  });

  it("★ 入口通道全轮只能选一次 —— 之后 chooseEntry 一律无效", () => {
    const s = newSession();
    toChoosing(s);
    expect(chooseEntry(s, 3)).toBe(true);
    expect(s.entryLane).toBe(3);
    expect(s.currentLane).toBe(3);
    expect(chooseEntry(s, 1)).toBe(false); // advancing
    takeNode(s);
    expect(chooseEntry(s, 1)).toBe(false); // atNode
    expect(s.entryLane).toBe(3);
  });

  it("越界或被封锁的入口选不了", () => {
    const s = newSession();
    toChoosing(s);
    s.board!.blockedLanes = [2];
    expect(chooseEntry(s, -1)).toBe(false);
    expect(chooseEntry(s, 5)).toBe(false);
    expect(chooseEntry(s, 2)).toBe(false);
    expect(s.phase).toBe("choosingEntry");
  });

  it("推进播完只落点、不结算: 能量与记录都不动", () => {
    const s = newSession();
    toChoosing(s);
    chooseEntry(s, 0);
    const energyBefore = s.energy;
    expect(arriveNode(s)).toBe(true);
    expect(s.phase).toBe("landed");
    expect(s.currentSegment).toBe(1);
    expect(s.energy).toBe(energyBefore);
    expect(s.history).toHaveLength(0);
    expect(landedEvent(s)).toBe(s.board!.nodes[0][s.currentLane!]);

    expect(chooseOption(s, 0)).toBe(true);
    expect(s.history).toHaveLength(1);
  });

  it("★ 走满 4 段后不得再「继续推进」, 只能前往下一区域(设计文档 §9.2)", () => {
    const s = newSession(7);
    toChoosing(s);
    chooseEntry(s, 0);
    for (let i = 0; i < SEGMENTS; i++) {
      if (phaseOf(s) !== "advancing") break;
      takeNode(s);
      if (phaseOf(s) !== "atNode") return; // 撤离升降机 / 团灭: 这条用例换个种子才有意义
      if (i < SEGMENTS - 1) {
        expect(canPushOn(s)).toBe(true);
        expect(pushOn(s)).toBe(true);
      }
    }
    if (phaseOf(s) !== "atNode") return;
    expect(s.currentSegment).toBe(SEGMENTS);
    expect(canPushOn(s)).toBe(false);
    expect(pushOn(s)).toBe(false);
    expect(leaveRegion(s)).toBe(true);
    expect(s.phase).toBe("routeDisclosure");
  });

  it("选入口阶段可以直接前往下一区域 —— 本轮 0 个节点", () => {
    const s = newSession();
    toChoosing(s);
    expect(leaveRegion(s)).toBe(true);
    expect(s.phase).toBe("routeDisclosure");
    expect(s.currentSegment).toBe(0);
    expect(s.history).toHaveLength(0);
  });

  it("披露页 → 战斗签 → 推进战斗: 档位按轮次固定表(轻/中/中/大/大/BOSS)", () => {
    expect(["light", "medium", "medium", "heavy", "heavy", "boss"]).toEqual([1, 2, 3, 4, 5, 6].map(battleTierOf));
    const s = newSession();
    toChoosing(s);
    leaveRegion(s);
    // ★ 老虎机只改战斗条件与收益, **不改档位** —— 档位仍由轮次固定表决定。
    expect(startSlot(s)).toBe(true);
    expect(s.phase).toBe("slotSpinning");
    runSlot(s); // 已在 slotSpinning 时 startSlot 会被拦, 后面三次暂停照常
    expect(s.phase).toBe("inBattle");
    expect(s.pendingBattleTier).toBe("light");
    expect(s.pendingIsBoss).toBe(false);
    expect(s.pendingEncounterId).toBe("n-crew");
  });

  it("打赢推进战斗进入下一轮, 新的一轮要重新走一遍浮现与揭示", () => {
    const s = newSession();
    runRound(s);
    expect(s.round).toBe(2);
    expect(s.phase).toBe("generating");
    expect(s.currentSegment).toBe(0);
    expect(s.entryLane).toBeNull();
  });

  it("第 6 轮打赢 BOSS = 通关", () => {
    const s = newSession(3);
    s.round = 6;
    toChoosing(s);
    leaveRegion(s);
    runSlot(s);
    expect(s.pendingIsBoss).toBe(true);
    finishBattle(s, true, WIN, ["scrap-bot"]);
    expect(s.phase).toBe("cleared");
  });

  it("⚠ 浮现、揭示与推进途中禁止开背包(设计文档 §6.3 的硬约束)", () => {
    const s = newSession();
    expect(canOpenBackpack(s)).toBe(false); // generating: 演出期锁死一切
    finishGenerating(s);
    expect(canOpenBackpack(s)).toBe(true); // sealed: 桥接还没揭示, 翻背包也偷看不到东西
    startReveal(s);
    expect(canOpenBackpack(s)).toBe(false); // revealing: 开背包 = 无限延长观察时间
    finishReveal(s);
    expect(canOpenBackpack(s)).toBe(true); // choosingEntry
    chooseEntry(s, 0);
    expect(canOpenBackpack(s)).toBe(false); // advancing
    arriveNode(s);
    expect(canOpenBackpack(s)).toBe(true); // landed: 不限时的决策阶段
  });

  it("消耗品只在不限时的决策阶段能用, sealed 除外", () => {
    const s = newSession();
    finishGenerating(s);
    expect(canOpenBackpack(s)).toBe(true);
    expect(canUseItem(s)).toBe(false); // sealed 是唯一「能开包但不能用药」的阶段
    startReveal(s);
    finishReveal(s);
    expect(canUseItem(s)).toBe(true);
  });
});

describe("净化粒子(设计文档 §4.2)", () => {
  it("每结算 1 个节点固定 −3, 再叠该分支自己的增减", () => {
    const s = newSession();
    toChoosing(s);
    chooseEntry(s, 0);
    arriveNode(s);
    const ev = landedEvent(s)!;
    const before = s.energy;
    chooseOption(s, 0);
    const extra = ev.choices?.[0]?.energyDelta ?? ev.energyDelta;
    expect(s.energy).toBe(Math.max(0, Math.min(100, before - EXPLORE_RULES.energyPerNode + extra)));
    expect(s.history[0].energyAfter).toBe(s.energy);
  });

  it("「隐匿通道」的免费节点会顶掉基础消耗, 且只顶指定次数", () => {
    const s = newSession();
    toChoosing(s);
    chooseEntry(s, 0);
    arriveNode(s);
    // 换成一个不含额外增减的测试节点, 单独验证基础消耗这一项
    s.board!.nodes[0][s.currentLane!] = {
      id: "test-free",
      kind: "loot",
      category: "growth",
      title: "测试节点",
      description: "",
      energyDelta: 0,
      effects: [],
    };
    s.freeNodes = 1;
    const before = s.energy;
    chooseOption(s, 0);
    expect(s.energy).toBe(before); // 这一个免费
    expect(s.freeNodes).toBe(0);
  });

  it("档位边界: 80/60/40/20/0 分别落在第 1..5 档", () => {
    expect(energyTier(100).tier).toBe(1);
    expect(energyTier(80).tier).toBe(1);
    expect(energyTier(79).tier).toBe(2);
    expect(energyTier(60).tier).toBe(2);
    expect(energyTier(59).tier).toBe(3);
    expect(energyTier(40).tier).toBe(3);
    expect(energyTier(39).tier).toBe(4);
    expect(energyTier(20).tier).toBe(4);
    expect(energyTier(19).tier).toBe(5);
    expect(energyTier(0).tier).toBe(5);
  });

  it("K_energy 随档位单调递增, 且压平在 1.00-1.60(设计文档 §4.2 的新表)", () => {
    for (let i = 1; i < ENERGY_TIERS.length; i++) {
      expect(ENERGY_TIERS[i].rewardMultiplier).toBeGreaterThan(
        ENERGY_TIERS[i - 1].rewardMultiplier,
      );
    }
    expect(rewardMultiplier(100)).toBe(1.0);
    expect(rewardMultiplier(0)).toBe(1.6);
  });

  it("预测值 = 再推进一个节点后的能量, 不会低于 0", () => {
    const s = newSession();
    expect(projectedEnergy(s)).toBe(s.energy - EXPLORE_RULES.energyPerNode);
    s.energy = 2;
    expect(projectedEnergy(s)).toBe(0);
    s.freeNodes = 1;
    expect(projectedEnergy(s)).toBe(2);
  });

  it("遭遇改造随档位加码, BOSS 还要额外吃血量缩放", () => {
    const fillers = ["scrap-bot", "radio-bot"];
    // EncounterModifier 的字段都是可选的(引擎侧允许只改一部分), 故断言前先兜底成空数组。
    const extras = (energy: number, boss: boolean) =>
      encounterModifier(energy, boss, fillers).extraEnemies?.length ?? 0;

    expect(extras(0, false)).toBeGreaterThan(extras(100, false));
    expect(encounterModifier(100, true, fillers).hpMultiplier).toBe(1);
    expect(encounterModifier(0, true, fillers).hpMultiplier ?? 1).toBeGreaterThan(1);
    // 第 4 档起 BOSS 追加一个护卫
    expect(extras(0, true)).toBeGreaterThan(extras(0, false));
  });
});

describe("背包与负重(设计文档 §六)", () => {
  it("装备占 2 格、其余占 1 格, 负重惩罚随占格线性上升", () => {
    const s = newSession();
    expect(backpackSlots(s)).toBe(0);
    expect(burdenNow(s)).toBe(0);

    addItems(s, [makeItemStack("scrap-piece"), makeItemStack("armor-plate-c")]);
    expect(backpackSlots(s)).toBe(3); // 1 + 2
    expect(burdenNow(s)).toBe(3); // 每格 −1 个百分点
  });

  it("装不下的进 pendingPickup, 不会被悄悄丢掉", () => {
    const s = newSession();
    addItems(
      s,
      Array.from({ length: 32 }, () => makeItemStack("scrap-piece")),
    );
    expect(backpackSlots(s)).toBe(32);

    const { taken, overflow } = addItems(s, [makeItemStack("armor-plate-c")]);
    expect(taken).toHaveLength(0);
    expect(overflow).toHaveLength(1);
    expect(s.pendingPickup).toHaveLength(1);
  });

  it("背包里还有待取舍的东西时不许离开结算阶段", () => {
    const s = newSession();
    toChoosing(s);
    chooseEntry(s, 0);
    arriveNode(s);
    chooseOption(s, 0);
    if (phaseOf(s) !== "resolving") return; // 撤离升降机 / 团灭的落点跳过
    s.pendingPickup = [makeItemStack("scrap-piece")];
    expect(confirmNode(s)).toBe(false);
  });

  it("丢弃即时生效, 负重立刻回升", () => {
    const s = newSession();
    addItems(s, [makeItemStack("armor-plate-c")]);
    const uid = s.backpack[0].uid;
    expect(burdenNow(s)).toBe(2);
    expect(discardStack(s, uid)).toBe(true);
    expect(burdenNow(s)).toBe(0);
    expect(discardStack(s, uid)).toBe(false); // 丢过的再丢一次不该有反应
  });

  it("消耗品用完即消失, 且不额外扣净化粒子", () => {
    const s = newSession();
    toChoosing(s);
    addItems(s, [makeItemStack("nutrient-paste")]);
    s.party[0].hp = 10;
    const energyBefore = s.energy;
    expect(useItem(s, s.backpack[0].uid)).not.toBeNull();
    expect(s.backpack).toHaveLength(0);
    expect(s.party[0].hp).toBeGreaterThan(10);
    expect(s.energy).toBe(energyBefore); // 携带成本已由负重收过一次, 不重复收费
  });

  it("投递口: 未开启不能寄, 开启后寄一次扣一次能量", () => {
    const s = newSession();
    addItems(s, [makeItemStack("data-shard")]);
    const uid = s.backpack[0].uid;

    expect(shipHome(s, [uid])).toBe(false); // 投递口没开
    s.chuteOpen = true;
    const energyBefore = s.energy;
    expect(shipHome(s, [uid])).toBe(true);
    expect(s.backpack).toHaveLength(0);
    expect(s.shipped).toHaveLength(1);
    expect(s.energy).toBe(energyBefore - EXPLORE_RULES.chute.energyCost);
    expect(s.chuteOpen).toBe(false); // 一个节点只能寄一次
  });
});

describe("落点分支与撤离", () => {
  it("落点决策途中不许跳步 —— 选入口/撤离/推进全部无效", () => {
    const s = newSession();
    toChoosing(s);
    chooseEntry(s, 0);
    arriveNode(s);
    expect(chooseEntry(s, 1)).toBe(false);
    expect(retreat(s)).toBe(false);
    expect(pushOn(s)).toBe(false);
    expect(chooseOption(s, 9)).toBe(false); // 越界的分支
    expect(s.phase).toBe("landed");
  });

  it("选备选分支时, 生效的是备选分支自己的代价与效果", () => {
    const s = newSession();
    toChoosing(s);
    chooseEntry(s, 0);
    arriveNode(s);
    // 造一个两支差异明显的落点: 主支纯扣能量, 备支纯给积分
    s.board!.nodes[0][s.currentLane!] = {
      id: "test-branch",
      kind: "loot",
      category: "growth",
      title: "测试用岔路",
      description: "",
      energyDelta: -30,
      effects: [],
      choices: [
        { id: "a", label: "主支", desc: "", energyDelta: -30, effects: [] },
        {
          id: "b",
          label: "备支",
          desc: "",
          energyDelta: 0,
          effects: [{ type: "GAIN_LOOT", amount: 10 }],
        },
      ],
    };
    const energyBefore = s.energy;
    chooseOption(s, 1);
    // 备支自己不花能量, 但每节点固定 −3 照扣
    expect(s.energy).toBe(energyBefore - EXPLORE_RULES.energyPerNode);
    expect(s.loot).toBe(Math.round(10 * rewardMultiplier(s.energy)));
    expect(s.history[0].note).toContain("备支");
  });

  it("END_REGION 效果直接把本轮推进推到走满 —— 之后只能前往下一区域", () => {
    const s = newSession();
    toChoosing(s);
    chooseEntry(s, 0);
    arriveNode(s);
    s.board!.nodes[0][s.currentLane!] = {
      id: "test-end",
      kind: "energy",
      category: "energy",
      title: "测试用逆流机",
      description: "",
      energyDelta: 18,
      effects: [{ type: "END_REGION" }],
    };
    chooseOption(s, 0);
    confirmNode(s);
    expect(s.currentSegment).toBe(SEGMENTS);
    expect(canPushOn(s)).toBe(false);
  });

  it("主动撤离只在可操作的阶段允许, 且保留全部积分", () => {
    const s = newSession();
    expect(retreat(s)).toBe(false); // generating: 演出期锁死一切
    finishGenerating(s);
    startReveal(s);
    expect(retreat(s)).toBe(false); // revealing: 限时窗口内不许中途开溜
    finishReveal(s);
    s.loot = 120;
    expect(retreat(s)).toBe(true);
    expect(s.phase).toBe("retreated");
    expect(s.loot).toBe(120);
  });

  it("atNode 与披露页也允许撤离 —— 它们同样是不限时的待决策阶段", () => {
    const s = newSession();
    toChoosing(s);
    chooseEntry(s, 0);
    takeNode(s);
    if (phaseOf(s) !== "atNode") return;
    expect(retreat(s)).toBe(true);
    expect(s.phase).toBe("retreated");
  });

  it("事件掉血也能团灭", () => {
    const s = newSession();
    s.party[0].hp = 1;
    toChoosing(s);
    chooseEntry(s, 0);
    arriveNode(s);
    s.board!.nodes[0][s.currentLane!] = {
      id: "test-damage",
      kind: "hazard",
      category: "hazard",
      title: "测试用塌方",
      description: "",
      energyDelta: 0,
      effects: [{ type: "DAMAGE_PARTY_PERCENT", percent: 1 }],
    };
    chooseOption(s, 0);
    expect(s.phase).toBe("wiped");
  });
});

describe("战斗回填与团灭", () => {
  // 直接推到本轮的推进战斗 —— 0 节点直推是最短路径。
  function intoBattle(s: ExploreState): void {
    toChoosing(s);
    leaveRegion(s);
    runSlot(s);
    expect(s.phase).toBe("inBattle");
  }

  it("战斗后血量写回队伍, 下一轮以此开局", () => {
    const s = newSession();
    intoBattle(s);
    finishBattle(s, true, [{ charId: "swordsman", hp: 23, alive: true }], ["scrap-bot"]);
    expect(s.party[0].hp).toBe(23);
    expect(s.party[0].alive).toBe(true);
    expect(s.round).toBe(2);
    expect(s.phase).toBe("generating");
  });

  // 设计文档 §6.1: 战斗胜利**只掉物品, 绝不直接掉居民积分** —— 积分改由废料回据点出售产生。
  it("普通战斗胜利不给积分, 只掉实物", () => {
    const s = newSession();
    s.energy = 0; // 枯竭档, 掉落系数最高
    intoBattle(s);
    const before = s.loot;
    finishBattle(s, true, WIN, ["scrap-bot", "scrap-bot", "scrap-bot"]);
    expect(s.loot).toBe(before);
    expect(s.backpack.length).toBeGreaterThan(0); // 枯竭档三只机械不可能一件不掉
  });

  it("同种子的战斗掉的东西逐件一致", () => {
    const run = () => {
      const s = newSession(4242);
      intoBattle(s);
      finishBattle(s, true, WIN, ["scrap-bot", "radio-bot"]);
      return s.backpack.map((x) => x.itemId);
    };
    expect(run()).toEqual(run());
  });

  it("战斗失利 = 团灭, 积分与背包一起清空(已寄回的除外)", () => {
    const s = newSession();
    intoBattle(s);
    s.loot = 200;
    s.backpack = [makeItemStack("scrap-piece"), makeItemStack("data-shard")];
    s.shipped = [makeItemStack("scrap-alloy")];
    finishBattle(s, false, [{ charId: "swordsman", hp: 0, alive: false }], ["scrap-bot"]);
    expect(s.phase).toBe("wiped");
    expect(s.loot).toBe(Math.floor(200 * EXPLORE_RULES.wipe.lootKept));
    expect(s.backpack).toEqual([]);
    expect(s.shipped).toHaveLength(1); // 投递口是背包玩法唯一的保险手段
  });

  it("非战斗阶段调用回填无效 —— 幂等护栏", () => {
    const s = newSession();
    expect(finishBattle(s, true, [], ["scrap-bot"])).toEqual({
      loot: 0,
      items: [],
      overflow: [],
    });
    expect(s.phase).toBe("generating");
  });
});
