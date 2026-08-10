import { DEATH } from "@/ui/battle/deathChoreo";
import s from "./DeathVanishFx.module.css";

const MOTES = [
  { left: 18, delay: 80, size: 5, drift: -12 },
  { left: 31, delay: 220, size: 3, drift: 8 },
  { left: 44, delay: 30, size: 4, drift: -5 },
  { left: 57, delay: 180, size: 6, drift: 13 },
  { left: 69, delay: 320, size: 3, drift: -9 },
  { left: 82, delay: 120, size: 4, drift: 6 },
] as const;

export function DeathVanishFx() {
  return (
    <div
      className={s["death-vanish-fx"]}
      style={{ "--death-vanish-ms": `${DEATH.vanish}ms` } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className={s["death-ring"]} />
      <div className={s["death-motes"]}>
        {MOTES.map((mote, index) => (
          <i
            key={index}
            className={s["death-mote"]}
            style={
              {
                left: `${mote.left}%`,
                width: `${mote.size}px`,
                height: `${mote.size}px`,
                animationDelay: `${mote.delay}ms`,
                "--death-drift": `${mote.drift}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}