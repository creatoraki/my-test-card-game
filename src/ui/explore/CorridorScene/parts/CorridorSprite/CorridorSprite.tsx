import type { CSSProperties } from "react";
import type { CurioKind } from "@/explore/corridor/types";
import { CORRIDOR_PROP_ART, CORRIDOR_PROP_BASE_SCALE } from "@/ui/art/corridor/corridorArt";
import s from "../../CorridorScene.module.css";

/**
 * 交互物按素材原始宽高与尺寸档位绘制，素材底部的透明留白用负外边距吃掉，
 * 这样容器底边就是物件的视觉底边，能直接对齐地面线。
 * 靠近时的外圈呼吸光是垫在物件后面的同图副本：阴影只绘制一次，呼吸只改透明度，不逐帧重绘。
 */
export function CorridorSprite({
  kind,
  interacting,
  outlined = false,
}: {
  kind: CurioKind;
  interacting: boolean;
  outlined?: boolean;
}) {
  const art = CORRIDOR_PROP_ART[kind];
  const width = art.width * CORRIDOR_PROP_BASE_SCALE * art.scale;
  const height = art.height * CORRIDOR_PROP_BASE_SCALE * art.scale;
  const backgroundImage = `url(${art.src})`;
  return <>
    {outlined && <span aria-hidden className={s.propGlow} style={{ width, height, backgroundImage }} />}
    <span aria-hidden className={`${s.sprite} ${outlined ? s.propOutline : ""} ${interacting ? s.interacting : ""}`} style={{
      width, height, marginBottom: -height * art.groundTrim,
      backgroundImage,
    } as CSSProperties} />
  </>;
}
