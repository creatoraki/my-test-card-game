import { cx } from "@/ui/common/shared/cx";
import s from "./ChatBubble.module.css";

export interface ChatBubbleProps {
  text: string;
  variant?: "solid" | "glass";
  /** 尾巴指向：说话者在气泡左侧用 left，正下方用 center。 */
  tail?: "left" | "center";
  className?: string;
}

export function ChatBubble({ text, variant = "solid", tail = "left", className }: ChatBubbleProps) {
  return (
    <div
      className={cx(s.bubble, variant === "glass" && s.glass, tail === "center" && s.tailCenter, className)}
      role="status"
      aria-live="polite"
    >
      <span className={s.text}>{text}</span>
      <span className={s.tail} aria-hidden />
    </div>
  );
}

export default ChatBubble;
