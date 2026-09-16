import defaultBotArt from "@/assets/通用素材/售货机器人.png";
import { cx } from "@/ui/common/cx";
import { ChatBubble } from "./ChatBubble";
import { useChatLinePresence } from "./useChatLinePresence";
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

export function ChatBot({
  line,
  onClick,
  art = defaultBotArt,
  alt = "售货机器人",
  className,
  bubbleVariant = "solid",
}: ChatBotProps) {
  const { shown, leaving } = useChatLinePresence(line);

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
