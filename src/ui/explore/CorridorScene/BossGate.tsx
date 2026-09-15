import { CORRIDOR_PORTAL_ART, CORRIDOR_PORTAL_Y_OFFSET } from "@/ui/art/corridorArt";
import s from "./CorridorScene.module.css";

export function BossGate({
  x,
  top,
  near,
  blocked,
  onClick,
}: {
  x: number;
  top: number;
  near: boolean;
  blocked: boolean;
  onClick: () => void;
}) {
  const disabled = blocked || !near;
  return <div className={`${s.object} ${s.bossGate}`} style={{ left: x, top: top + CORRIDOR_PORTAL_Y_OFFSET }}>
    <button
      className={s.objectButton}
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={near ? "首领红门，靠近后交互" : "首领红门，查看"}
    >
      <img
        aria-hidden
        alt=""
        draggable={false}
        src={CORRIDOR_PORTAL_ART}
        className={`${s.bossGateArt} ${near ? s.bossGateLit : ""}`}
        style={{ height: 455 }}
      />
    </button>
    {near && <span className={s.bossGatePrompt}>空格 · 挑战首领</span>}
  </div>;
}
