import type { ReactNode } from "react";
import { DossierActionGrid, type DossierAction } from "./DossierButton";
import { DossierBody, DossierPhase } from "./DossierParts";

/**
 * 结算页：剧情与结算条目接在同一段逐字正文里(条目用强调色)，占满左栏；
 * 掉落物品栏(loot)浮在右侧插画区下部，右下仍是按钮网格。
 */
export function DossierResult({
  story,
  notes,
  loot,
  actions,
}: {
  story: string[];
  notes: string[];
  /** 可拾取物品栏(DossierLoot)。 */
  loot?: ReactNode;
  actions: DossierAction[];
}) {
  return (
    <section aria-label="事件结算结果" aria-live="polite">
      <DossierPhase no="03" label="搜寻结果" />
      <DossierBody lines={[...story, ...notes]} notesFrom={story.length} />
      {loot}
      <DossierActionGrid actions={actions} />
    </section>
  );
}
