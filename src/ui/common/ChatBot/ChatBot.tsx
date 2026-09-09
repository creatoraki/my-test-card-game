import { useEffect, useRef, useState } from "react";
import defaultBotArt from "@/assets/通用素材/售货机器人.png";
import { cx } from "@/ui/common/cx";
import { ChatBubble } from "./ChatBubble";
import type { ChatLine } from "./useBotChatter";
import s from "./ChatBot.module.css";

export interface ChatBotProps {
  line: ChatLine | null;
  onClick?: () => void;
  art?: string;
  alt?: string;
  className?: string;
  bubbleVariant?: "solid" | "glass";
}

const OUT_MS = 200;

export function ChatBot({
  line,
  onClick,
  art = defaultBotArt,
  alt = "售货机器人",
  className,
  bubbleVariant = "solid",
}: ChatBotProps) {
  const [shown, setShown] = useState<ChatLine | null>(line);
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

  const image = <img className={s.art} src={art} alt={alt} draggable={false} />;

  return (
    <div className={cx(s.bot, className)}>
      {shown && (
        <div key={shown.id} className={cx(s.bubbleSlot, leaving && s.bubbleOut)}>
          <ChatBubble text={shown.text} variant={bubbleVariant} />
        </div>
      )}
      {onClick ? (
        <button className={s.artButton} type="button" aria-label="与机器人交谈" onClick={onClick}>
          {image}
        </button>
      ) : (
        image
      )}
    </div>
  );
}

export default ChatBot;
