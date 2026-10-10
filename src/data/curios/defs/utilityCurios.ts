import type { CurioKind } from "@/explore/corridor/types";
import { ARCADE_MAX_STAKES, WAYSTONE_RULES } from "../rules/serviceBalance";
import type { CurioDef } from "../types";

/** 钱币、经验、拆解、押注、导航这类工具型服务。 */
export const UTILITY_CURIOS = {
  coinExchange: {
    name: "自助驿站终端", role: "service", verb: "兑换", size: 220, persistent: true,
    description: "终端屏幕上滚动着旧时代的币值换算表。支付 3 份临期食品即可开启兑换，本次开启内可以反复把铜币合成银币、银币合成金币。只能向上合成，不能拆分。",
    decisions: [{
      id: "open", label: "支付食品并开启兑换", foodCost: 3, gates: ["coinExchangeable"],
      story: "终端吞下了食品，投币口亮起绿灯，等待小队放入钱币。",
      effects: [{ type: "OPEN_COIN_EXCHANGE" }],
    }],
  },
  expConverter: {
    name: "鲸纹留声机", role: "service", verb: "播放", size: 205,
    description: "留声机的唱臂会把放进喇叭里的杂物读成一段旋律，听完的人都能学到点什么。支付 2 份临期食品，再放入任意数量的消耗品、材料或钱币，按品类折算成全队经验。",
    decisions: [{
      id: "convert", label: "选择物品放进喇叭", foodCost: 2,
      offer: { match: { categories: ["consumable", "material", "scrap"] }, min: 1 },
      story: "唱针落下，杂物在喇叭里化成一段低沉的鲸歌，队员们静静听完了整首曲子。",
      effects: [{ type: "CONVERT_TO_EXP" }],
    }],
  },
  salvager: {
    name: "星象观测台", role: "service", verb: "拆解", size: 215,
    description: "观测台的星盘早已停转，底座被改装成了一台拆解机。放入装备或模组，就能拆回通用材料；稀有度越高、完美度越好，拆出的东西越多。",
    decisions: [{
      id: "salvage", label: "选择装备或模组拆解",
      offer: { match: { categories: ["equipment", "module"] }, min: 1 },
      story: "星盘重新转动起来，投入的物件被一层层剥开，只留下还能用的零件。",
      effects: [{ type: "SALVAGE" }],
    }],
  },
  neonArcade: {
    name: "霓虹游艺摊", role: "service", verb: "押注", size: 210, energyCost: 0,
    description: `游艺摊的霓虹灯牌写着「赌下一场战斗」。押上最多 ${ARCADE_MAX_STAKES} 枚钱币，赌小队在下一场战斗中完成的挑战数：押中后钱币升级，押不中则全部没收。同一时间只能有一笔押注。`,
    decisions: [
      {
        id: "betOne", label: "押注：至少完成 1 个挑战", gates: ["noActiveBet"],
        offer: { match: { itemIds: ["copper-coin", "silver-coin"] }, min: 1, max: ARCADE_MAX_STAKES, coinStake: true },
        story: "摊主把钱币收进透明筹码盒，灯牌上亮起「一」字。",
        effects: [{ type: "PLACE_BET", goal: 1 }],
      },
      {
        id: "betAll", label: "押注：2 个挑战全部完成", gates: ["noActiveBet", "goldUnlocked"],
        offer: { match: { itemIds: ["copper-coin", "silver-coin"] }, min: 1, max: ARCADE_MAX_STAKES, coinStake: true },
        story: "摊主吹了声口哨，把钱币收进透明筹码盒，灯牌上两个格子同时亮起。",
        effects: [{ type: "PLACE_BET", goal: 2 }],
      },
    ],
  },
  signpost: {
    name: "橡叶岔路牌", role: "service", verb: "查看", size: 200, optional: true, energyCost: 1,
    description: "路牌上的每片橡叶都指向一扇门，叶脉里刻着门后房间的记号。查看它可以知道相连的房间都是什么。",
    decisions: [{
      id: "read", label: "辨认叶片上的记号",
      story: "队员们拂去叶片上的灰，读出了每扇门后的房间类型。",
      effects: [{ type: "REVEAL_ADJACENT" }],
    }],
  },
  waystone: {
    name: "月光传送盆", role: "service", verb: "查看", size: 205, persistent: true, optional: true,
    description: `月光能量盆总是成对出现。两座都点亮后，站在任一座旁边都能传送到另一座，每次消耗 ${WAYSTONE_RULES.travelEnergy} 粒子。`,
    decisions: [
      {
        id: "light", label: "注入粒子点亮能量盆", gates: ["waystoneDark"],
        story: "盆中的液面泛起银光，一道光束射向远处，标出了另一座能量盆的位置。",
        effects: [{ type: "LIGHT_WAYSTONE" }],
      },
      {
        id: "travel", label: "传送到另一座能量盆", gates: ["waystoneLit"],
        story: "",
        effects: [{ type: "WAYSTONE_TRAVEL" }],
      },
    ],
  },
} satisfies Partial<Record<CurioKind, CurioDef>>;
