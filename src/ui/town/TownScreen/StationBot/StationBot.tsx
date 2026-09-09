import { TOWN_BOT_LINES } from "@/data";
import { ChatBot, useBotChatter } from "@/ui/common/ChatBot";
import { playSfx } from "@/ui/audio";
import s from "./StationBot.module.css";

export function StationBot() {
  const { line, say } = useBotChatter(true, {
    lines: TOWN_BOT_LINES,
    greet: "greet",
    idle: "idle",
  });

  return (
    <div className={s.bot}>
      <ChatBot
        line={line}
        alt="据点管理终端"
        onClick={() => {
          playSfx("click");
          say("poke");
        }}
      />
    </div>
  );
}
