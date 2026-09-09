import { cx } from "@/ui/common/cx";
import s from "./ChatBubble.module.css";

export interface ChatBubbleProps {
  text: string;
  variant?: "solid" | "glass";
  className?: string;
}

export function ChatBubble({ text, variant = "solid", className }: ChatBubbleProps) {
  return (
    <div className={cx(s.bubble, variant === "glass" && s.glass, className)} role="status" aria-live="polite">
      <span className={s.text}>{text}</span>
      <span className={s.tail} aria-hidden />
    </div>
  );
}

export default ChatBubble;
