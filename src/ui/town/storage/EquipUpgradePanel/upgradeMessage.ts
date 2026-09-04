import { AFFIX_SCALE } from "@/items/equipRoll";
import type { EquipRoll } from "@/items/types";
import { STAT_LABEL } from "@/ui/common/item/ItemDetail";
import { signedValue } from "./upgradeRange";

export function upgradeChanges(before: EquipRoll, after: EquipRoll, nextDefName: string): string {
  const changes = Object.entries(after.points)
    .map(([stat, points]) => {
      const key = stat as keyof typeof AFFIX_SCALE;
      const scale = AFFIX_SCALE[key] ?? 1;
      const previous = (before.points[key] ?? 0) * scale;
      const next = (points ?? 0) * scale;
      if (previous === next) return null;
      return `${STAT_LABEL[key] ?? stat} ${signedValue(previous)} → ${signedValue(next)}`;
    })
    .filter((text): text is string => text !== null);

  return `升阶成功 · ${nextDefName}（${changes.join("，") || "无词条变化"}）`;
}