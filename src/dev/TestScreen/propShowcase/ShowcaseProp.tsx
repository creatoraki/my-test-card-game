import type { ShowcasePropDef } from "./showcaseProps";
import s from "./ShowcaseProp.module.css";

/**
 * 单件演示容器：底边中心对齐地面线。
 * 靠近高亮与正式场景同参数：物件本体细描边，外圈呼吸光由垫在后面的同图副本负责，只动画透明度。
 */
export function ShowcaseProp({ prop, floorY, outlined, showName }: {
  prop: ShowcasePropDef;
  floorY: number;
  outlined: boolean;
  showName: boolean;
}) {
  const { Art } = prop;
  return <div className={s.prop} style={{ left: prop.x, top: floorY, width: prop.width, height: prop.height }}>
    {outlined && <span aria-hidden className={s.glow}><Art live={false} /></span>}
    <span aria-hidden className={`${s.art} ${outlined ? s.outline : ""}`}><Art /></span>
    {showName && <span className={s.plate}>
      <span className={s.name}>{prop.name}</span>
      <span className={s.verb}>{prop.verb}</span>
    </span>}
  </div>;
}
