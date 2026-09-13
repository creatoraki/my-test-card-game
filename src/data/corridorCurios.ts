import type { CurioKind } from "../explore/corridor/types";
import type { EventChoice, ExploreEffect, NodeEvent } from "../explore/types";

interface CurioDefinition {
  name: string;
  verb: string;
  /** 贴地后的可见高度(px)；素材底部的透明留白由 CorridorSprite 另行补偿。 */
  size: number;
  event: NodeEvent;
}

function option(id: string, label: string, desc: string, effects: ExploreEffect[], energyDelta = 0): EventChoice {
  return { id, label, desc, effects, energyDelta, story: desc };
}

/** 首版只投放这八种物件；名称、交互文案与事件效果集中配置。 */
export const CORRIDOR_CURIOS: Record<CurioKind, CurioDefinition> = {
  chest: {
    name: "遗留物资箱", verb: "搜寻", size: 95,
    event: {
      id: "corridor-chest", kind: "loot", category: "growth", title: "遗留物资箱", energyDelta: 0,
      description: "生锈的箱扣松动了。缝隙里露出封装完好的补给，也许还有能用的零件。",
      choices: [
        option("supplies", "取出补给", "找到糖块 ×2 和医疗包 ×1。", [{ type: "GAIN_ITEM", itemId: "sugar-cube-c", count: 2 }, { type: "GAIN_ITEM", itemId: "medical-kit-c" }]),
        option("salvage", "拆解箱体", "回收箱体内的合金，获得 30 居民积分。", [{ type: "GAIN_LOOT", amount: 30 }]),
      ],
    },
  },
  medical: {
    name: "应急医疗柜", verb: "检查", size: 100,
    event: {
      id: "corridor-medical", kind: "heal", category: "survival", title: "应急医疗柜", energyDelta: 0,
      description: "柜内的急救指示灯还亮着。可以现场处理伤口，也可以把药品带走。",
      choices: [
        option("heal", "包扎全队", "全队恢复 20% 最大生命，无法复活阵亡队员。", [{ type: "HEAL_PARTY", percent: 0.2 }]),
        option("pack", "取走医疗包", "获得医疗包 ×1，留待需要时使用。", [{ type: "GAIN_ITEM", itemId: "medical-kit-c" }]),
      ],
    },
  },
  terminal: {
    name: "破损数据终端", verb: "接入", size: 92,
    event: {
      id: "corridor-terminal", kind: "loot", category: "growth", title: "破损数据终端", energyDelta: 0,
      description: "屏幕裂成蛛网，缓存却仍然完整。一段未上传的作战记录正在循环播放。",
      choices: [
        option("read", "读取作战记录", "全队获得 24 点经验。", [{ type: "GAIN_EXP_PARTY", amount: 24 }]),
        option("module", "拆下备用模组", "获得一个随机模组；额外消耗 3 点净化粒子。", [{ type: "GRANT_MODULE" }], -3),
      ],
    },
  },
  vending: {
    name: "故障售货机", verb: "翻找", size: 205,
    event: {
      id: "corridor-vending", kind: "loot", category: "economy", title: "故障售货机", energyDelta: 0,
      description: "出货口卡着一个旧纸袋。电源旁路也许能让储藏格再开启一次。",
      choices: [
        option("food", "取出纸袋", "获得牛奶 ×1 和糖块 ×1。", [{ type: "GAIN_ITEM", itemId: "milk" }, { type: "GAIN_ITEM", itemId: "sugar-cube-c" }]),
        option("power", "接通应急电源", "额外消耗 4 点净化粒子，获得医疗包 ×2。", [{ type: "GAIN_ITEM", itemId: "medical-kit-c", count: 2 }], -4),
      ],
    },
  },
  purifier: {
    name: "残存净化罐", verb: "回收", size: 230,
    event: {
      id: "corridor-purifier", kind: "energy", category: "energy", title: "残存净化罐", energyDelta: 0,
      description: "罐体里还漂浮着微弱的蓝光。回收粒子，或者用它净化队员的污染。",
      choices: [
        option("energy", "回收净化粒子", "释放罐内储备，恢复 16 点净化粒子。", [{ type: "MODIFY_ENERGY", amount: 16 }]),
        option("purify", "净化队员", "选择一名队员降低 12 点污染。", [{ type: "REDUCE_POLLUTION", scope: "one", amount: 12 }]),
      ],
    },
  },
  scrap: {
    name: "废弃零件堆", verb: "搜刮", size: 88,
    event: {
      id: "corridor-scrap", kind: "loot", category: "growth", title: "废弃零件堆", energyDelta: 0,
      description: "断线与金属板堆在墙根。表层的废料很安全，更深处却露出尖锐的断口。",
      choices: [
        option("safe", "收集表层废料", "获得 22 居民积分。", [{ type: "GAIN_LOOT", amount: 22 }]),
        option("risk", "深入翻找", "获得随机装备一件，全队损失 8% 最大生命。", [{ type: "GRANT_EQUIP" }, { type: "DAMAGE_PARTY_PERCENT", percent: 0.08 }]),
      ],
    },
  },
  dispatch: {
    name: "安全投递柜", verb: "启用", size: 250,
    event: {
      id: "corridor-dispatch", kind: "merchant", category: "economy", title: "安全投递柜", energyDelta: 0,
      description: "投递柜仍与据点相连。打开后可从背包选择物品寄回，已寄出的物品不会因团灭丢失。",
      choices: [option("send", "开启投递口", "投递口已开启。请打开背包选择寄件；每次寄送消耗 5 点净化粒子。", [{ type: "OPEN_CHUTE" }])],
    },
  },
  camp: {
    name: "遗落营地", verb: "休整", size: 90,
    event: {
      id: "corridor-camp", kind: "heal", category: "survival", title: "遗落营地", energyDelta: 0,
      description: "灯还温热，铺盖的主人却不知去向。这是继续深入前难得的喘息处。",
      choices: [
        option("rest", "短暂休整", "全队修复 8% 体力极限，并恢复 12% 最大生命。", [{ type: "HEAL_LIMIT_PARTY", percent: 0.08 }, { type: "HEAL_PARTY", percent: 0.12 }]),
        option("battery", "取下灯具电池", "恢复 10 点净化粒子。", [{ type: "MODIFY_ENERGY", amount: 10 }]),
      ],
    },
  },
};

export const CORRIDOR_AMBUSH: NodeEvent = {
  id: "corridor-ambush", kind: "battle", category: "battle", title: "地底黑影", energyDelta: 0,
  description: "地面的黑斑忽然鼓起，无声的轮廓挡住了去路。",
  choices: [option("fight", "迎战黑影", "准备战斗。", [{ type: "START_NODE_BATTLE", tier: "t1" }])],
};
