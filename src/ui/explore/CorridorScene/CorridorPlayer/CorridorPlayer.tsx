import { CORRIDOR_ALCHEMIST_SPRITE_ART } from "@/ui/art/corridorPlayerArt";
import s from "./CorridorPlayer.module.css";

export function CorridorPlayer({ walking }: { walking: boolean }) {
  return <span
    className={`${s.art} ${walking ? s.moving : ""}`}
    style={{ backgroundImage: `url(${CORRIDOR_ALCHEMIST_SPRITE_ART})` }}
    aria-hidden="true"
  />;
}
