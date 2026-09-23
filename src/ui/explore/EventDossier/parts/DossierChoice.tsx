import type { ReactNode } from "react";
import { DossierActionGrid, type DossierAction } from "./DossierButton";
import { DossierBody, DossierPhase } from "./DossierParts";

/** 行动选择页：阶段行 + 逐字描述 + (可选)左下信息框 + 右下按钮网格。 */
export function DossierChoice({
  lines,
  info,
  actions,
}: {
  /** 描述正文，一句一行。 */
  lines: string[];
  /** 左下信息框(DossierInfoBox)；有它时正文让出下方区域。 */
  info?: ReactNode;
  actions: DossierAction[];
}) {
  return (
    <section aria-label="事件行动选择">
      <DossierPhase no="02" label="行动阶段" />
      <DossierBody lines={lines} size={info ? "short" : "tall"} />
      {info}
      <DossierActionGrid actions={actions} reserveInfo={Boolean(info)} />
    </section>
  );
}
