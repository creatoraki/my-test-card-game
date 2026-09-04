import type { EventChoice, ExploreEffect } from "../explore/types";

export interface NpcEvent {
  id: string;
  title: string;
  description: string;
  choices: EventChoice[];
}

const outcome = (id: string, text: string, effects: ExploreEffect[]) => ({
  id,
  weight: 1,
  text,
  effects,
});

const choice = (
  id: string,
  label: string,
  story: string,
  desc: string,
  outcomes: EventChoice["outcomes"],
): EventChoice => ({ id, label, story, desc, energyDelta: 0, outcomes });

export const NPC_EVENTS: Record<string, NpcEvent> = {
  "npc-night-canteen": {
    id: "npc-night-canteen",
    title: "夜班配餐机",
    description: "一台沿着天花板轨道移动的配餐机停在队伍面前。它扫描牛奶包装后说道：检测到夜班员工，允许领取加班补偿。",
    choices: [
      choice("medical", "领取医疗补偿", "你把牛奶递进配餐机的识别槽，等待它核对夜班档案。", "领取医疗补给", [
        outcome("medical-a", "配餐机打开底部储物格，交出一只未启封医疗包。", [{ type: "GAIN_ITEM", itemId: "medical-kit-c" }]),
        outcome("medical-b", "配餐机将队伍误判为重伤班组，额外发放了一颗糖块。", [
          { type: "GAIN_ITEM", itemId: "medical-kit-c" },
          { type: "GAIN_ITEM", itemId: "sugar-cube-c" },
        ]),
      ]),
      choice("training", "领取夜班培训", "你让配餐机播放夜班员工的协作广播，所有人围在扬声器旁听完。", "领取训练反馈", [
        outcome("training-a", "配餐机播放了一段夜班协作广播，全队从中获得了经验。", [{ type: "GAIN_EXP_PARTY", amount: 8 }]),
        outcome("training-b", "你让配餐机把培训内容定向播放给一名队员，他获得了更深入的岗位指导。", [{ type: "GAIN_EXP_ONE", amount: 21 }]),
      ]),
    ],
  },
  "npc-cargo-clerk": {
    id: "npc-cargo-clerk",
    title: "货运登记员",
    description: "电梯门重新打开，一个没有身体的登记员投影站在货运台前。它接过面包，要求队伍选择收货或改签。",
    choices: [
      choice("misroute", "领取误发货物", "你把面包交给登记员，换取一只错误楼层货箱的开启权限。", "领取误发补给", [
        outcome("misroute-a", "登记员从错误货箱中调出两枚磁铁。", [{ type: "GAIN_ITEM", itemId: "magnet", count: 2 }]),
        outcome("misroute-b", "误发货箱里没有电池，但医疗包和弹簧被完整保存。", [
          { type: "GAIN_ITEM", itemId: "medical-kit-c" },
          { type: "GAIN_ITEM", itemId: "coil-spring" },
        ]),
      ]),
      choice("reroute", "改签装备货物", "你要求登记员把错误楼层的货单改到队伍名下。", "从装备货物中选一件", [
        outcome("reroute-a", "登记员把一批错误楼层的装备改签到你们名下。", [{ type: "EQUIP_OFFER", count: 2 }]),
        outcome("reroute-b", "原本无法送达的装备被转入维护流程，并完成了一次免费羁绊重铸。", [{ type: "REFORGE_BOND" }]),
      ]),
    ],
  },
  "npc-vip-reception": {
    id: "npc-vip-reception",
    title: "高级访客接待 AI",
    description: "大厅接待屏亮起过时的笑脸：高级访客身份已确认，请选择接待服务。",
    choices: [
      choice("catalog", "查看隐藏装备目录", "你把可乐放进接待台，要求 AI 调出旧公司的隐藏装备目录。", "从装备目录中选一件", [
        outcome("catalog-a", "接待 AI 调出隐藏装备目录，三件装备的详细信息全部公开。", [{ type: "EQUIP_OFFER", count: 3 }]),
        outcome("catalog-b", "AI 只找到两件装备，却把一瓶果汁作为访客礼物一并交出。", [
          { type: "EQUIP_OFFER", count: 2 },
          { type: "GAIN_ITEM", itemId: "fruit-juice-c" },
        ]),
      ]),
      choice("maintenance", "申请光学维护", "你让接待 AI 暂停大厅扫描，打开访客专用的光学维护槽。", "领取光学维护成果", [
        outcome("maintenance-a", "安检玻璃打开维护槽，维护槽里的两枚逻辑魔方被送到队伍面前。", [
          { type: "GAIN_ITEM", itemId: "logic-cube", count: 2 },
        ]),
        outcome("maintenance-b", "接待 AI 将装备送进光学校准台，新的随机羁绊在光线中生成。", [{ type: "REFORGE_BOND" }]),
      ]),
    ],
  },
  "npc-greenhouse-keeper": {
    id: "npc-greenhouse-keeper",
    title: "营养菌培育员",
    description: "温室深处走出一个由植物维护程序组成的机械人。它闻了闻汉堡，说：高热量样本，可交换一次培育成果。",
    choices: [
      choice("harvest", "交换成熟培育物", "你把汉堡递给培育员，让它从根系中挑选成熟的工业材料。", "领取培育材料", [
        outcome("harvest-a", "培育员从根系中取出两只用于复位的弹簧。", [{ type: "GAIN_ITEM", itemId: "coil-spring", count: 2 }]),
        outcome("harvest-b", "温室没有足够的储备，但培育员交出了一枚磁铁和一支净化用圣水。", [
          { type: "GAIN_ITEM", itemId: "magnet" },
          { type: "GAIN_ITEM", itemId: "holy-water-c" },
        ]),
      ]),
      choice("knowledge", "交换生长知识", "你让队员围着培育架观察污染环境下的植物记录。", "领取生长训练反馈", [
        outcome("knowledge-a", "培育员向全队解释植物如何在污染环境中维持生长。", [{ type: "GAIN_EXP_PARTY", amount: 13 }]),
        outcome("knowledge-b", "你让一名队员单独学习培育记录，他掌握了完整的生存样本分析方法。", [{ type: "GAIN_EXP_ONE", amount: 31 }]),
      ]),
    ],
  },
  "npc-mobile-mechanic": {
    id: "npc-mobile-mechanic",
    title: "流动维修商",
    description: "一台装满工具的维修机器人从展示柜后驶出：检测到高热量维修授权，允许一次高级装备处理。",
    choices: [
      choice("reforge", "请求羁绊重铸", "你把炸鸡交给维修商，请它处理一件已经拥有的装备。", "重铸一件装备羁绊", [
        outcome("reforge-a", "维修商重新焊接装备接口，新的羁绊偏向攻击和爆发。", [{ type: "REFORGE_BOND", bias: "offense" }]),
        outcome("reforge-b", "维修商更换装备的保护层，新的羁绊偏向防御和生存。", [{ type: "REFORGE_BOND", bias: "defense" }]),
      ]),
      choice("workshop", "打开维修仓库", "你让维修商打开随行仓库，检查其中仍能使用的装备。", "从维修仓库中选一件", [
        outcome("workshop-a", "维修商打开随行仓库，三件装备的属性和羁绊全部公开。", [{ type: "EQUIP_OFFER", count: 3 }]),
        outcome("workshop-b", "仓库只有两件装备，但维修商将一枚标准齿轮作为拆装补偿交给队伍。", [
          { type: "EQUIP_OFFER", count: 2 },
          { type: "GAIN_ITEM", itemId: "standard-gear" },
        ]),
      ]),
    ],
  },
  "npc-board-projection": {
    id: "npc-board-projection",
    title: "董事会投影",
    description: "会议桌尽头的董事会投影重新亮起。它们没有询问公司为何毁灭，只把披萨识别成一份迟到数百年的会议供餐。",
    choices: [
      choice("card-access", "申请高阶卡组权限", "你把披萨摆上会议桌，要求董事会重新审核一名队员的卡组。", "处理一名角色的卡组", [
        outcome("card-access-a", "董事会批准了一次免费卡组锻造，三张角色专属候选卡牌悬在会议桌上方。", [{ type: "FORGE_DRAW" }]),
        outcome("card-access-b", "投影将一张卡牌列为无效资产，你可以把它从角色卡组中永久移除。", [{ type: "FORGE_REMOVE" }]),
      ]),
      choice("equipment-access", "申请董事会装备权限", "你提交装备调拨申请，让投影打开董事会的私有装备库。", "从私有装备库中选一件", [
        outcome("equipment-access-a", "私有装备库向队伍开放，三件装备的全部属性公开展示。", [{ type: "EQUIP_OFFER", count: 3 }]),
        outcome("equipment-access-b", "投影重新签发一件装备的随机羁绊，但没有留下其他可用物品。", [{ type: "REFORGE_BOND" }]),
      ]),
    ],
  },
};

export function getNpcEvent(id: string): NpcEvent | undefined {
  return NPC_EVENTS[id];
}