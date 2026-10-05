import flareArt from "@/assets/遗物/应急照明弹.webp";
import disposableLighterArt from "@/assets/遗物/一次性打火机.webp";
import expiredStimulantArt from "@/assets/遗物/过期兴奋剂.webp";
import instantCoffeeArt from "@/assets/遗物/速溶咖啡.webp";
import bubbleWrapArt from "@/assets/遗物/气泡膜.webp";
import powerBankArt from "@/assets/遗物/充电宝.webp";
import tempBadgeArt from "@/assets/遗物/临时工牌.webp";
import tastingCouponArt from "@/assets/遗物/试吃券.webp";

/** 祝福匣一次性遗物，与其他遗物统一走物品图片及预加载入口。 */
export const TEMPORARY_RELIC_ART: Record<string, string> = {
  "relic-flare": flareArt,
  "relic-disposable-lighter": disposableLighterArt,
  "relic-expired-stimulant": expiredStimulantArt,
  "relic-instant-coffee": instantCoffeeArt,
  "relic-bubble-wrap": bubbleWrapArt,
  "relic-power-bank": powerBankArt,
  "relic-temp-badge": tempBadgeArt,
  "relic-tasting-coupon": tastingCouponArt,
};
