import s from "./PollutionVirusMark.module.css";

const CENTER = 12;
const RADIATION_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;

const SPOKES = RADIATION_ANGLES.map((angle) => {
  const radians = (angle * Math.PI) / 180;
  const x = Math.cos(radians);
  const y = Math.sin(radians);

  return {
    angle,
    startX: CENTER + x * 5.8,
    startY: CENTER + y * 5.8,
    endX: CENTER + x * 7.8,
    endY: CENTER + y * 7.8,
    capX: CENTER + x * 9.5,
    capY: CENTER + y * 9.5,
  };
});

export function PollutionVirusMark() {
  return (
    <span className={s.virus} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        {SPOKES.map((spoke) => (
          <g key={spoke.angle}>
            <line
              x1={spoke.startX}
              y1={spoke.startY}
              x2={spoke.endX}
              y2={spoke.endY}
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
            <circle cx={spoke.capX} cy={spoke.capY} r="1.5" />
          </g>
        ))}
        <circle cx={CENTER} cy={CENTER} r="5.2" />
        <circle cx="10.1" cy="10.4" r="0.85" />
        <circle cx="13.8" cy="10.7" r="0.8" />
        <circle cx="12.1" cy="13.8" r="0.9" />
      </svg>
    </span>
  );
}
