import { GROUND_DEBUG, PARTS, SEAM, TORSO_DEBUG } from "../../render/actors/heroCalibration";
import s from "./CalibLegend.module.css";

const hex = (c: number) => `#${c.toString(16).padStart(6, "0")}`;

const ROWS = [
  ...PARTS.map((p) => ({ label: p.label, color: hex(p.debug) })),
  { label: "躯干(接缝以上的其余部分)", color: hex(TORSO_DEBUG) },
  { label: "腿部(接缝以下, 取步态帧)", color: hex(GROUND_DEBUG) },
];

/** F2 校准叠层的图例: 部件颜色、骨骼支点与接缝线的含义。 */
export function CalibLegend() {
  return <aside className={s.panel} aria-label="角色校准叠层">
    <h3 className={s.title}>角色校准叠层</h3>
    <ul className={s.list}>
      {ROWS.map((r) => <li key={r.label} className={s.row}>
        <span className={s.swatch} style={{ background: r.color }} />
        <span>{r.label}</span>
      </li>)}
      <li className={s.row}>
        <span className={s.pivot} />
        <span>骨骼支点(白点黑圈)</span>
      </li>
      <li className={s.row}>
        <span className={s.seam} />
        <span>上下半身接缝: 源图第 {SEAM[0]}～{SEAM[1]} 行</span>
      </li>
    </ul>
    <p className={s.note}>坐标均为源图像素(单帧 180×240, 左上为原点)。对照叠层修改源码里的角色校准表即可。</p>
  </aside>;
}
