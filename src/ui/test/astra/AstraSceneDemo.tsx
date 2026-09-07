import { useId } from "react";
import backgroundUrl from "@/assets/场景/测试/背景素材.png";
import { BUILDING_CONTOURS, SCENE_HEIGHT, SCENE_WIDTH } from "./buildingContours";
import s from "./AstraSceneDemo.module.css";

export function AstraSceneDemo() {
  const id = useId().replace(/:/g, "");

  return (
    <div className={s.root}>
      <svg
        className={s.scene}
        viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
        aria-labelledby={`${id}-title ${id}-description`}
      >
        <title id={`${id}-title`}>空间站</title>
        <desc id={`${id}-description`}>
          将鼠标移到建筑上，或使用 Tab 键聚焦建筑，查看沿建筑外轮廓环绕的光效。
        </desc>
        <defs>
          {BUILDING_CONTOURS.map((building) => (
            <path key={building.id} id={`${id}-${building.id}`} d={building.path} />
          ))}
        </defs>
        <image href={backgroundUrl} width={SCENE_WIDTH} height={SCENE_HEIGHT} />
        {BUILDING_CONTOURS.map((building) => {
          const href = `#${id}-${building.id}`;
          return (
            <g
              key={building.id}
              className={s.building}
              tabIndex={0}
              role="img"
              aria-label={building.label}
              data-building={building.id}
            >
              <title>{building.label}</title>
              <use href={href} className={s.hitArea} />
              <g className={s.highlight} aria-hidden="true">
                <use href={href} className={s.halo} />
                <use href={href} className={s.edge} />
                <use href={href} className={s.core} />
                <use href={href} className={s.orbit} />
              </g>
            </g>
          );
        })}
      </svg>
      <p className={s.hint}>悬浮建筑，点亮轮廓<span> / </span>也可用 Tab 键逐个查看</p>
    </div>
  );
}
