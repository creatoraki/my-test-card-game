import type { CSSProperties, ReactNode } from "react";
import { DossierActionGrid, type DossierAction } from "./DossierButton";
import { DossierBody, DossierInfoBox, DossierPhase } from "./DossierParts";
import s from "./DossierResult.module.css";

/** 结算页：剧情放在描述区，结果条目逐条浮现在左下信息框，右下仍是按钮网格。 */
export function DossierResult({
  story,
  notes,
  footNote,
  actions,
}: {
  story: ReactNode;
  notes: string[];
  footNote: string;
  actions: DossierAction[];
}) {
  return (
    <section aria-label="事件结算结果" aria-live="polite">
      <DossierPhase no="03" label="搜寻结果" />
      <DossierBody wide>{story}</DossierBody>
      <DossierInfoBox>
        <div className={s.notes}>
          {notes.length ? notes.map((text, index) => (
            <span key={`${text}-${index}`} style={{ "--note-delay": `${180 + index * 120}ms` } as CSSProperties}>{text}</span>
          )) : <em>本次搜寻没有额外收获</em>}
        </div>
      </DossierInfoBox>
      <p className={s.foot}><i aria-hidden />{footNote}</p>
      <DossierActionGrid actions={actions} />
    </section>
  );
}
