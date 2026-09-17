// 伤害乘区。修正钩子只往这里登记数值, 由管线按固定公式统一结算,
// 因此结果与状态挂上的先后顺序无关:
//   (基础 + flat) × (1 + dealtPct%) × dealtMult × (1 + takenPct%) × takenMult
export interface DamageModifiers {
  flat: number; // 固定加值(力量、遗物 +N)
  dealtPct: number; // 造成伤害加算%(锋利、八千代)
  dealtMult: number; // 造成伤害独立乘区连乘(虚弱、充能外壳)
  takenPct: number; // 受到伤害加算%
  takenMult: number; // 受到伤害独立乘区连乘(易伤、猎人标记、减伤)
}

// 修正钩子拿到的写入口。钩子必须是纯计算: 只调用这些方法, 不改 dmg, 不产生副作用,
// 这样伤害预览才能安全复用同一批钩子。
export interface DamageModifierSink {
  addFlat(value: number): void;
  addDealtPct(pct: number): void;
  mulDealt(multiplier: number): void;
  addTakenPct(pct: number): void;
  mulTaken(multiplier: number): void;
}
