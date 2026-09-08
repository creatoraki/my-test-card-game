// 机器人的聊天气泡。只认一段文字 —— 什么时候出现、什么时候消失全由 useVendorChatter 决定,
// 组件这边一句状态都不留(整块靠 key 重挂载来重放动画)。

import { cx } from "@/ui/common/cx";
import s from "./VendorBubble.module.css";

interface Props {
  text: string;
  className?: string;
}

export function VendorBubble({ text, className }: Props) {
  return (
    <div className={cx(s.bubble, className)} role="status" aria-live="polite">
      <span className={s.text}>{text}</span>
      <span className={s.tail} aria-hidden />
    </div>
  );
}

export default VendorBubble;
