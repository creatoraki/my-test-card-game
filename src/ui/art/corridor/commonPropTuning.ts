import type { CommonPropAssetId } from "./commonPropAssets";

export interface CommonPropTuning {
  /** 叠乘在素材基础缩放上的倍率。 */
  multiplier: number;
  /** 场景上下偏移（设计 px，正值往下）。 */
  offsetY: number;
}

/**
 * 交互物缩放预览页（TestScreen 交互物缩放 → 打印全部倍率）调好的旋钮倍率与上下偏移，只作用于游戏内。
 * 预览页仍以未调整的基础缩放为准，这样页面里存的旋钮值不会被乘两遍；没登记的素材按 1 倍、不偏移。
 */
export const COMMON_PROP_TUNING: Partial<Record<CommonPropAssetId, CommonPropTuning>> = {
  appraisalAnvil: { multiplier: 0.896, offsetY: 2 },
  whaleGramophone: { multiplier: 0.72, offsetY: 10 },
  travelerPack: { multiplier: 0.803, offsetY: 0 },
  ringLockCase: { multiplier: 1.273, offsetY: 2 },
  wishTree: { multiplier: 1.273, offsetY: 0 },
  potionBench: { multiplier: 0.858, offsetY: 2 },
  moonBasin: { multiplier: 0.604, offsetY: 2 },
  thunderLamp: { multiplier: 0.821, offsetY: 3 },
  memoryAltar: { multiplier: 1.218, offsetY: 5 },
  stoneShrine: { multiplier: 0.803, offsetY: 0 },
  wingCourier: { multiplier: 0.645, offsetY: 0 },
  mossMailbox: { multiplier: 0.821, offsetY: 0 },
  robotMerchant: { multiplier: 0.858, offsetY: 0 },
  sleepCatVault: { multiplier: 0.591, offsetY: 0 },
  rustSnailShell: { multiplier: 0.591, offsetY: 0 },
  starSandHourglass: { multiplier: 0.507, offsetY: 0 },
  stoppedCuckooClock: { multiplier: 0.957, offsetY: 10 },
  triPetalLotus: { multiplier: 0.604, offsetY: 3 },
  miasmaTapir: { multiplier: 0.839, offsetY: 0 },
  reverseSakuraSpring: { multiplier: 0.704, offsetY: 1 },
  bottledTown: { multiplier: 1, offsetY: 0 },
};
