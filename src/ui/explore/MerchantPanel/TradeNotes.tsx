// 面板底栏 —— 左侧本节点结算记录, 右侧「关闭终端」。
// ★ 底栏只有这一条: 购买按钮已经收进右详情栏, 这里不再重复报价。

import { EventPanelButton } from "@/ui/common/EventPanel";
import s from "./MerchantPanel.module.css";

interface Props {
  notes: string[];
  canClose: boolean;
  onClose: () => void;
}

export default function TradeNotes({ notes, canClose, onClose }: Props) {
  return (
    <footer className={s.foot}>
      <div className={s.notes} aria-live="polite" aria-label="本节点结算记录">
        {notes.length ? (
          notes.map((note, index) => (
            <span className={s.note} key={`${note}-${index}`}>{note}</span>
          ))
        ) : (
          <span className={s.muted}>本节点尚未产生额外记录。</span>
        )}
      </div>
      <EventPanelButton disabled={!canClose} onClick={onClose}>关闭终端</EventPanelButton>
    </footer>
  );
}
