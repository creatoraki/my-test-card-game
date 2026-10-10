import scene from "@/ui/explore/CorridorScene/CorridorScene.module.css";
import { showcaseSize, type ShowcasePropDef } from "./showcaseProps";
import s from "./ExplorePropScene.module.css";

/**
 * offset 为预览页的上下偏移修正（设计 px，正值往下），叠加在地面线上。
 * 与 CorridorSprite 相同的落地方式：底部透明留白用负外边距吃掉，容器底边贴地面线。名称签可点击，选中后弹出调节面板。
 * 名称签的定位与反缩放放在外层锚点上：全站按钮按下时会改写 transform，若写在按钮本身会让名称签跳位缩小、松手落空。
 */
export function ShowcaseProp({ prop, multiplier, offset, floor, selected, onSelect }: {
  prop: ShowcasePropDef; multiplier: number; offset: number; floor: number; selected: boolean; onSelect: () => void;
}) {
  const { width, height } = showcaseSize(prop.art, multiplier);
  return <div className={scene.object} style={{ left: prop.x, top: floor + offset }}>
    <span aria-hidden className={scene.sprite} style={{
      width, height, marginBottom: -height * prop.art.groundTrim,
      backgroundImage: `url(${prop.art.src})`,
    }} />
    <span className={s.labelAnchor}>
      <button type="button" className={`${s.label} ${selected ? s.labelSelected : ""}`} aria-pressed={selected} onClick={onSelect}>
        {prop.name}
      </button>
    </span>
  </div>;
}
