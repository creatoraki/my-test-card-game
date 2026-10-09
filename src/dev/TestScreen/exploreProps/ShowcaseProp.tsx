import scene from "@/ui/explore/CorridorScene/CorridorScene.module.css";
import { showcaseSize, type ShowcasePropDef } from "./showcaseProps";
import s from "./ExplorePropScene.module.css";

/** 与 CorridorSprite 相同的落地方式：底部透明留白用负外边距吃掉，容器底边贴地面线。 */
export function ShowcaseProp({ prop, multiplier, floor }: { prop: ShowcasePropDef; multiplier: number; floor: number }) {
  const { width, height } = showcaseSize(prop.art, multiplier);
  return <div className={scene.object} style={{ left: prop.x, top: floor }}>
    <span aria-hidden className={scene.sprite} style={{
      width, height, marginBottom: -height * prop.art.groundTrim,
      backgroundImage: `url(${prop.art.src})`,
    }} />
    <span className={s.label}>{prop.name}</span>
  </div>;
}
