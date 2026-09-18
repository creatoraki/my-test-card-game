import type { ReactNode } from "react";
import { DossierActionGrid, type DossierAction } from "./DossierButton";
import { DossierBody, DossierPhase } from "./DossierParts";

/** 行动选择页：阶段行 + 描述 + 左下信息框 + 右下按钮网格。 */
export function DossierChoice({
  body,
  info,
  actions,
}: {
  body: ReactNode;
  /** 左下信息框(DossierInfoBox)。 */
  info?: ReactNode;
  actions: DossierAction[];
}) {
  return (
    <section aria-label="事件行动选择">
      <DossierPhase no="02" label="行动阶段" />
      <DossierBody>{body}</DossierBody>
      {info}
      <DossierActionGrid actions={actions} />
    </section>
  );
}
