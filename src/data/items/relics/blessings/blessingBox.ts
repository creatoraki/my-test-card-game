import { defineRelics } from "../defineRelic";

// 祝福匣限定(普通档): 只进临时遗物池, 只能从临时祝福匣抽出; 野餐食谱不会指名它们。
// 只用一趟, 数值比普通渠道更激进, 部分带代价。
export const BLESSING_BOX_RELIC_DEFS = defineRelics("blessing", "common", [
  {
    id: "relic-flare",
    name: "应急照明弹",
    scope: "battle",
    channel: "blessingBox",
    desc: "每场战斗开始时，为所有敌人附加 1 拍致盲。",
  },
  {
    id: "relic-disposable-lighter",
    name: "一次性打火机",
    scope: "battle",
    channel: "blessingBox",
    desc: "每回合第一张攻击卡额外附加 2 层灼烧。",
  },
  {
    id: "relic-expired-stimulant",
    name: "过期兴奋剂",
    scope: "battle",
    channel: "blessingBox",
    desc: "全队攻击力 +15；每场战斗胜利后，全队失去 3 点生命。",
    mods: { flat: { attack: 15 } },
  },
  {
    id: "relic-instant-coffee",
    name: "速溶咖啡",
    scope: "battle",
    channel: "blessingBox",
    desc: "每场战斗第一回合额外抽 2 张牌。",
  },
  {
    id: "relic-bubble-wrap",
    name: "气泡膜",
    scope: "battle",
    channel: "blessingBox",
    desc: "每场战斗中，每名队员第一次受到的伤害减半。",
  },
  {
    id: "relic-power-bank",
    name: "充电宝",
    scope: "battle",
    channel: "blessingBox",
    desc: "每场战斗第一回合行动点 +1。",
  },
  {
    id: "relic-temp-badge",
    name: "临时工牌",
    scope: "explore",
    channel: "blessingBox",
    desc: "每进入一个全新房间，获得 2 点净化粒子。",
  },
  {
    id: "relic-tasting-coupon",
    name: "试吃券",
    scope: "explore",
    channel: "blessingBox",
    desc: "在流浪货商购买的第一件商品免费。",
  },
]);
