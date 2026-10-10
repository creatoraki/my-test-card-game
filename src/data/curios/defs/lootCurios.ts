import { byJob, fail, feedDecision, poolItem, roll, withItem } from "../rules/helpers";
import type { CurioKind } from "@/explore/corridor/types";
import type { CurioDef, CurioEffect } from "../types";

// 搜刮类：每种物件 4 个候选品类，交互时不重复抽 2 类、每类 1 件；喂养小生物改为抽 3 类且必定成功。
// 美术分配见 ui/art/corridor/commonPropArt.ts。

const SUPPLY_OPTIONS: CurioEffect[] = [poolItem("food"), poolItem("consumable"), poolItem("scrap"), poolItem("generalMaterial")];
const WRECK_OPTIONS: CurioEffect[] = [poolItem("generalMaterial"), poolItem("crystal"), poolItem("module"), poolItem("scrap")];
const LOCKER_OPTIONS: CurioEffect[] = [poolItem("premiumScrap"), poolItem("module"), { type: "GRANT_EQUIP" }, poolItem("crystal")];

export const LOOT_CURIOS = {
  supplyCrate: {
    name: "遗落的战术背包",
    role: "loot",
    verb: "翻找",
    size: 200,
    description: "一只鼓鼓囊囊的战术背包靠在几只货箱旁，旅人留下的补给胡乱塞在里面：可能是食品、应急道具、零钱或零件。",
    decisions: [
      {
        id: "open",
        label: "翻找补给",
        story: "你们把背包和货箱翻了个遍，挑出两样还能用的东西。",
        effects: [roll(2, SUPPLY_OPTIONS)],
        failure: fail(
          0.2,
          "包底的补给早已胀袋变质，执行者被扑面的酸气呛得直咳。",
          [{ type: "ADJUST_POLLUTION", target: "actor", amount: 6 }],
          withItem("cola", { chanceDelta: -0.2, note: "可乐瓶盖撬开了夹层的卡扣，没惊动变质的那一层" }),
          byJob("actuary", { chanceDelta: -0.15, note: "精算师核对生产日期，避开了变质的那一批" }),
        ),
      },
      feedDecision(
        "feedCleaner",
        "喂给背包里的清扫虫",
        "清扫虫吞下食物后钻进背包夹层，把卡在里面的补给全都推了出来。",
        "cleaner",
        1,
        [roll(3, SUPPLY_OPTIONS)],
      ),
    ],
  },
  toolLocker: {
    name: "废弃的研究员工作站",
    role: "loot",
    verb: "搜查",
    size: 205,
    description: "研究员撤离时没来得及收拾工作站，星仪还在空转，桌下的仪器箱堆得摇摇欲坠。翻一翻也许能找到零件、结晶、模组或散落的钱币。",
    decisions: [
      {
        id: "dismantle",
        label: "撬开仪器箱",
        story: "仪器箱的锁扣吱呀一声弹开，两样东西被完整取了出来。",
        effects: [roll(2, WRECK_OPTIONS)],
        failure: fail(
          0.35,
          "堆在顶上的仪器箱猛地滑落，锋利的箱角狠狠刮过执行者的手臂。",
          [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.08 }],
          byJob("swordsman", { chanceDelta: -0.35, note: "剑士用刀背顶住了滑落的箱子" }),
        ),
      },
      feedDecision(
        "feedMole",
        "喂给箱堆里的掘地鼹",
        "掘地鼹吃饱后钻进箱堆深处，把压在底下的东西一件件拱了出来。",
        "mole",
        1,
        [roll(3, WRECK_OPTIONS)],
      ),
    ],
  },
  safe: {
    name: "密码寄存柜",
    role: "loot",
    verb: "破解",
    size: 210,
    description: "一排寄存格的指示灯还亮着，每一格都要输对密码才能打开。柜里寄存着贵重物资，但输错太多次可能会触发防盗机关。",
    decisions: [
      {
        id: "forceOpen",
        label: "尝试破解密码",
        story: "密码盘发出一串短促的提示音，寄存柜在防盗机关启动前弹开了两格。",
        effects: [roll(2, LOCKER_OPTIONS)],
        failure: fail(
          0.4,
          "指示灯骤然全部转红，刺耳的警报响彻整个房间，巡逻的守卫正朝这里赶来。",
          [{ type: "ALARM_BATTLE" }],
          byJob("swordsman", { chanceDelta: -0.3, note: "剑士用刀尖卡住了锁舌，没让它回弹" }),
          byJob("actuary", {
            convert: {
              story: "警报响起的前一刻，精算师算出了密码盘的出厂规律，顺手打开了存放零钱的找零格。",
              effects: [poolItem("premiumScrap"), poolItem("premiumScrap")],
            },
          }),
        ),
      },
      feedDecision(
        "feedBeetle",
        "喂给锁孔里的甲虫",
        "甲虫吃饱后钻进密码盘，一格一格咬开了卡死的齿轮，寄存柜无声地打开了。",
        "beetle",
        2,
        [roll(3, LOCKER_OPTIONS)],
      ),
    ],
  },
  relicCache: {
    name: "尘封的环锁密匣", role: "loot", verb: "开启", size: 190,
    description: "密匣落满灰尘，匣盖上的环锁封印仍在微微发光。开启后可直接获得一件随机遗物。",
    decisions: [{
      id: "open", label: "开启密匣", story: "环锁一圈圈松开，一件遗物从匣底浮起，被送入待拾取框。",
      effects: [{ type: "GRANT_RANDOM_RELIC" }],
      failure: fail(
        0.2,
        "环锁松开时的反冲灌进执行者体内，遗物的光芒也随之熄灭。",
        [{ type: "ADJUST_POLLUTION", target: "actor", amount: 15 }],
        withItem({ familyId: "holy-water" }, { chanceDelta: -0.2, note: "圣水浸透封印，让环锁安静地松开" }),
      ),
    }],
  },
  temporaryRelicCache: {
    name: "起程祈愿龛", role: "loot", verb: "祈愿", size: 190,
    description: "出发点路边的石龛里还亮着烛火，向它祈一个愿，祝福会凝成一件一次性遗物。遗物仅在本次探索生效，不能寄回，离开远征后消失。",
    decisions: [{ id: "blessing", label: "祈愿并领取一次性遗物", story: "龛中的烛火轻轻一跳，短暂的祝福化作一件可携带的遗物。",
      effects: [{ type: "GRANT_DISPOSABLE_RELIC" }] }],
  },
} satisfies Partial<Record<CurioKind, CurioDef>>;
