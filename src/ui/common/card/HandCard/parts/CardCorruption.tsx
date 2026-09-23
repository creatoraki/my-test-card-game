import s from "./CardCorruption.module.css";
import { buildCrackPath, type CrackPoint } from "./crackGeometry";

const MAIN_CRACK_POINTS: readonly (readonly CrackPoint[])[] = [
  [[16, 0], [20, 5], [24, 9], [29, 7], [33, 4], [42, 16]],
  [[88, 0], [92, 5], [96, 11], [101, 8], [107, 5], [120, 17]],
  [[168, 0], [164, 5], [160, 10], [166, 13], [171, 16], [181, 5]],
  [[220, 42], [215, 46], [211, 50], [214, 55], [216, 60], [203, 68]],
  [[220, 157], [215, 152], [211, 148], [214, 143], [216, 138], [203, 130]],
  [[188, 308], [183, 303], [179, 298], [173, 301], [168, 304], [156, 291]],
  [[69, 308], [75, 303], [80, 299], [78, 294], [76, 290], [63, 301]],
  [[0, 164], [5, 160], [10, 155], [7, 149], [4, 144], [17, 134]],
] as const;

const HAIR_CRACK_POINTS: readonly (readonly CrackPoint[])[] = [
  [[24, 9], [22, 5], [20, 0]],
  [[24, 9], [29, 12], [34, 20]],
  [[96, 11], [92, 15], [91, 20]],
  [[107, 5], [112, 1], [117, 0]],
  [[160, 10], [154, 8], [149, 3]],
  [[171, 16], [177, 21], [184, 24]],
  [[211, 50], [207, 45], [205, 39]],
  [[214, 55], [220, 59], [223, 64]],
  [[211, 148], [206, 153], [201, 158]],
  [[214, 143], [219, 138], [223, 136]],
  [[179, 298], [184, 294], [189, 288]],
  [[173, 301], [170, 308], [168, 312]],
  [[80, 299], [86, 296], [92, 291]],
  [[78, 294], [73, 288], [70, 283]],
  [[76, 290], [81, 284], [86, 281]],
  [[10, 155], [14, 150], [18, 146]],
  [[7, 149], [3, 144], [0, 138]],
  [[10, 155], [16, 160], [21, 164]],
] as const;

const MAIN_CRACKS = MAIN_CRACK_POINTS.map((points) => buildCrackPath(points, 2.8));
const HAIR_CRACKS = HAIR_CRACK_POINTS.map((points) => buildCrackPath(points, 0.9));

export function CardCorruption() {
  return (
    <>
      <span className={s.stain} aria-hidden="true" />
      <span className={s.cracks} aria-hidden="true">
        <svg viewBox="-2 -2 224 312" preserveAspectRatio="none" width="100%" height="100%">
          <g className={s.crackDepth} transform="translate(0.6, 0.7)">
            {[...MAIN_CRACKS, ...HAIR_CRACKS].map((path) => <path key={path} d={path} />)}
          </g>
          <g className={s.crackFill}>
            {MAIN_CRACKS.map((path) => <path key={path} d={path} />)}
          </g>
          <g className={s.crackHair}>
            {HAIR_CRACKS.map((path) => <path key={path} d={path} />)}
          </g>
        </svg>
      </span>
    </>
  );
}