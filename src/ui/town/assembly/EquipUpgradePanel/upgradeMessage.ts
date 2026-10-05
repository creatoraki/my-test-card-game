import type { StatBlock } from "@/engine";
import { AFFIX_SCALE } from "@/items/equipRoll";
import type { EquipRoll } from "@/items/types";
import { STAT_LABEL } from "@/ui/common/item/ItemDetail";
import { isPercentStat } from "@/ui/common/shared/statGroups";
import { signedValue } from "./upgradeRange";

export interface UpgradeChangeRow {
  stat: keyof StatBlock;
  label: string;
  /** 已带符号与单位的展示文本。 */
  before: string;
  after: string;
  /** 升阶后数值变低(负面词条代价加重)。 */
  worse: boolean;
}

/** 升阶前后有变化的词条, 供升阶演出逐条展示。 */
export function upgradeChangeRows(before: EquipRoll, after: EquipRoll): UpgradeChangeRow[] {
  const stats = new Set([...Object.keys(before.points), ...Object.keys(after.points)] as (keyof StatBlock)[]);
  return [...stats].flatMap((stat) => {
    const scale = AFFIX_SCALE[stat] ?? 1;
    const previous = (before.points[stat] ?? 0) * scale;
    const next = (after.points[stat] ?? 0) * scale;
    if (Math.round(previous) === Math.round(next)) return [];
    const unit = isPercentStat(stat) ? "%" : "";
    return [{
      stat,
      label: STAT_LABEL[stat] ?? stat,
      before: `${signedValue(previous)}${unit}`,
      after: `${signedValue(next)}${unit}`,
      worse: next < previous,
    }];
  });
}
