import s from "./CardCorruption.module.css";

export function CardCorruption() {
  return (
    <span className={s.corruption} aria-hidden="true">
      <svg viewBox="0 0 220 308" preserveAspectRatio="none" width="100%" height="100%">
        <g className={s.mainCracks}>
          <path d="M 16 0 L 24 9 L 33 4 L 42 16" />
          <path d="M 88 0 L 96 11 L 107 5 L 120 17" />
          <path d="M 168 0 L 160 10 L 171 16 L 181 5" />
          <path d="M 220 42 L 211 50 L 216 60 L 203 68" />
          <path d="M 220 157 L 211 148 L 216 138 L 203 130" />
          <path d="M 188 308 L 179 298 L 168 304 L 156 291" />
          <path d="M 69 308 L 80 299 L 76 290 L 63 301" />
          <path d="M 0 164 L 10 155 L 4 144 L 17 134" />
        </g>
        <g className={s.branchCracks}>
          <path d="M 24 9 L 20 0" />
          <path d="M 96 11 L 91 18" />
          <path d="M 211 50 L 220 54" />
          <path d="M 211 148 L 204 140" />
          <path d="M 179 298 L 185 290" />
          <path d="M 10 155 L 18 160" />
        </g>
      </svg>
    </span>
  );
}