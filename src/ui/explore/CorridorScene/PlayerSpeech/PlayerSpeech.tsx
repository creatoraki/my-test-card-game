import { ChatBubble, useChatLinePresence, type ChatLine } from "@/ui/common/ChatBot";
import s from "./PlayerSpeech.module.css";

export function PlayerSpeech({ line }: { line: ChatLine | null }) {
  const { shown, leaving } = useChatLinePresence(line);
  if (!shown) return null;
  return (
    <div className={`${s.bubbleSlot} ${leaving ? s.bubbleOut : ""}`} key={shown.id}>
      <ChatBubble text={shown.text} variant="glass" tail="center" />
    </div>
  );
}
