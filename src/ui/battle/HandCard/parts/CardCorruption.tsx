import s from "./CardCorruption.module.css";

const MAIN_PATHS = [
  "M 16 0 L 24 9 L 33 4 L 42 16",
  "M 88 0 L 96 11 L 107 5 L 120 17",
  "M 168 0 L 160 10 L 171 16 L 181 5",
  "M 220 42 L 211 50 L 216 60 L 203 68",
  "M 220 157 L 211 148 L 216 138 L 203 130",
  "M 188 308 L 179 298 L 168 304 L 156 291",
  "M 69 308 L 80 299 L 76 290 L 63 301",
  "M 0 164 L 10 155 L 4 144 L 17 134",
] as const;

const BRANCH_PATHS = [
  "M 24 9 L 20 0",
  "M 96 11 L 91 18",
  "M 211 50 L 220 54",
  "M 211 148 L 204 140",
  "M 179 298 L 185 290",
  "M 10 155 L 18 160",
] as const;

export function CardCorruption() {
  return (
    <>
      <span className={s.stain} aria-hidden="true" />
      <span className={s.cracks} aria-hidden="true">
        <svg viewBox="-2 -2 224 312" preserveAspectRatio="none" width="100%" height="100%">
          <g className={s.crackShadow}>
            {[...MAIN_PATHS, ...BRANCH_PATHS].map((path) => <path key={path} d={path} />)}
          </g>
          <g className={s.mainCracks}>
            {MAIN_PATHS.map((path) => <path key={path} d={path} />)}
          </g>
          <g className={s.branchCracks}>
            {BRANCH_PATHS.map((path) => <path key={path} d={path} />)}
          </g>
        </svg>
      </span>
    </>
  );
}