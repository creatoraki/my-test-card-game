import type { CurioKind } from "../../explore/corridor/types";
import type { CurioDef } from "./types";
import { byJob, fail, withItem } from "./helpers";

export const ARK_CURIOS = {
  arkSeedVault: {
    name: "休眠种子库", role: "loot", verb: "采集", size: 205,
    description: "低温柜中排列着种荚与密封口粮。保育系统仍在拒绝无权限的采集，但传动轴似乎缺了一枚齿轮。",
    decisions: [
      { id: "salvage", label: "取走外层口粮", story: "外层应急仓正常解锁，两份密封口粮滑了出来。",
        effects: [{ type: "GAIN_POOL_ITEM", pool: "basicFood", count: 2 }] },
      { id: "unlock", label: "尝试开启培育内仓", story: "内仓缓缓敞开，完整的维护零件与保存良好的食品显露出来。",
        effects: [{ type: "GAIN_POOL_ITEM", pool: "generalMaterial", count: 2 }, { type: "GAIN_POOL_ITEM", pool: "food", count: 1 }],
        failure: fail(0.3, "休眠舱错误地启动了授粉程序，孢子扑了执行者一脸。",
          [{ type: "ADJUST_POLLUTION", target: "actor", amount: 8 }],
          byJob("botanist", { chanceDelta: -0.3, note: "植物学家识别了种荚的休眠周期" }),
          withItem("standard-gear", { chanceDelta: -0.3, note: "齿轮补齐了内仓的联动锁" })) },
    ],
  },
  arkDewCollector: {
    name: "凝露净化器", role: "heal", verb: "取露", size: 210,
    description: "宽大的金属叶片把露水汇入玻璃滤芯。可以用露水处理伤口，也能把滤芯里积存的能量导回净化装置。",
    decisions: [
      { id: "dew", label: "用凝露处理伤口", story: "清凉的凝露已经备好，选择一名需要治疗的队员。",
        effects: [{ type: "HEAL_ONE", percent: 0.25 }],
        failure: fail(0.2, "滤膜上附着的残留孢子混入露水，执行者受到了轻度污染。",
          [{ type: "ADJUST_POLLUTION", target: "actor", amount: 6 }],
          byJob("botanist", { chanceDelta: -0.2, note: "植物学家剔除了滤膜上的杂孢" })) },
      { id: "charge", label: "回收滤芯中的净化粒子", story: "叶片上的荧光逐渐暗下去，粒子流回到了净化装置。",
        effects: [{ type: "MODIFY_ENERGY", amount: 12 }] },
    ],
  },
  arkComposter: {
    name: "生质循环釜", role: "loot", verb: "回收", size: 215,
    description: "厚玻璃内的根系正在分解报废零件。釜底还留有上一批回收料，也可以支付一份临期食品启动完整循环。",
    decisions: [
      { id: "residue", label: "清理釜底回收料", story: "滤网上挂着几块洗净的维护零件。",
        effects: [{ type: "GAIN_POOL_ITEM", pool: "generalMaterial", count: 1 }],
        failure: fail(0.2, "尚未停转的搅拌叶扫过执行者的手臂。",
          [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.06 }],
          byJob("alchemist", { chanceDelta: -0.2, note: "炼金术士先中和了循环釜的催化液" })) },
      { id: "cycle", label: "投入一份食品启动循环", foodCost: 1,
        story: "菌床吸收了食品，循环釜吐出一批干净的零件与可用药剂。",
        effects: [{ type: "GAIN_POOL_ITEM", pool: "generalMaterial", count: 2 }, { type: "GAIN_POOL_ITEM", pool: "consumable", count: 1 }] },
    ],
  },
  arkGeneConsole: {
    name: "枝序档案台", role: "service", verb: "读取", size: 205,
    description: "终端保存着生态守卫的行动谱系。可以读取巡逻路线，也能消耗一份临期食品为生物处理器供能，学习一段战术。",
    decisions: [
      { id: "survey", label: "读取方舟路线与威胁分布", story: "根网中的定位数据被还原成一张完整的区域图。",
        effects: [{ type: "REVEAL_MAP", threats: true }] },
      { id: "learn", label: "供能并学习战术", foodCost: 1, story: "谱系记录完成了解码，全队获得卡组经验，并得到一次卡牌候选。",
        effects: [{ type: "GAIN_EXP_PARTY", amount: 8 }, { type: "FORGE_DRAW" }] },
    ],
  },
  arkSporeVent: {
    name: "失控孢子风阀", role: "trap", forced: true, verb: "封堵", size: 215,
    description: "房门开启的一瞬间，送风阀把积存的孢子吹向小队。必须先处理这股喷流。",
    decisions: [
      { id: "seal", label: "消耗净化粒子封闭风阀", story: "净化膜盖住了送风口，孢子被锁回了管线。",
        effects: [{ type: "MODIFY_ENERGY", amount: -5 }] },
      { id: "cross", label: "掩住口鼻迅速通过", story: "小队穿过了淡绿色的雾，每个人都沾上了一点孢子。",
        effects: [{ type: "ADJUST_POLLUTION", target: "party", amount: 4 }] },
      { id: "manual", label: "由执行者手动切断风机", story: "执行者顶住气流关闭了风机，手臂被阀片划出一道浅口。",
        effects: [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.05 }],
        failure: fail(0.2, "阀片突然回弹，浓缩孢子从检修口喷了出来。",
          [{ type: "ADJUST_POLLUTION", target: "actor", amount: 8 }],
          byJob("botanist", { convert: { story: "植物学家让孢子提前休眠，安全取走了过滤耗材。", effects: [{ type: "GAIN_POOL_ITEM", pool: "consumable", count: 1 }] } }),
          withItem({ familyId: "holy-water" }, { chanceDelta: -0.2, note: "圣水让送风口的孢子失去了活性" })) },
    ],
  },
} satisfies Partial<Record<CurioKind, CurioDef>>;
