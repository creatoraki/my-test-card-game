// 出击准备页的售货机器人 —— 货架旁那台会说话的补给终端。
//
// ★ 它不持有任何台词逻辑: 说什么由 useVendorChatter 决定并从上层传进来。这样「谁会让它
//   说话」(货架、仓库、背包)全部集中在 PrepStep 一处, 组件本身只是一张会浮动的立绘。
//
// 唯一的本地状态是**退场**: line 变 null 时立刻卸载气泡会显得台词被掐断, 故留住最后一句
// 再播 200ms 的淡出。

import { useEffect, useRef, useState } from "react";
import vendorBotArt from "@/assets/通用素材/售货机器人.png";
import { cx } from "@/ui/common/cx";
import { VendorBubble } from "./VendorBubble";
import type { VendorLine } from "./useVendorChatter";
import s from "./VendorBot.module.css";

interface Props {
  line: VendorLine | null;
  className?: string;
}

const OUT_MS = 200;

export function VendorBot({ line, className }: Props) {
  const [shown, setShown] = useState<VendorLine | null>(line);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef(0);

  useEffect(() => {
    window.clearTimeout(timerRef.current);
    if (line) {
      setShown(line);
      setLeaving(false);
      return;
    }
    setLeaving(true);
    timerRef.current = window.setTimeout(() => setShown(null), OUT_MS);
    return () => window.clearTimeout(timerRef.current);
  }, [line]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return (
    <div className={cx(s.bot, className)}>
      {shown && (
        <div key={shown.id} className={cx(s.bubbleSlot, leaving && s.bubbleOut)}>
          <VendorBubble text={shown.text} />
        </div>
      )}
      <img
        className={s.art}
        src={vendorBotArt}
        alt="售货机器人"
        draggable={false}
      />
    </div>
  );
}

export default VendorBot;
