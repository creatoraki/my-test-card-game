import type { CSSProperties } from "react";
import type { CurioKind } from "@/explore/corridor/types";
import { CORRIDOR_PROP_ART } from "@/ui/art/corridorArt";
import s from "./CorridorScene.module.css";

/** 四格横向精灵图：首格常态，交互时依次播放后三格。 */
export function CorridorSprite({ kind, size, interacting }: { kind: CurioKind; size: number; interacting: boolean }) {
  return <span aria-hidden className={`${s.sprite} ${interacting ? s.interacting : ""}`} style={{
    width: size * .75, height: size, backgroundImage: `url(${CORRIDOR_PROP_ART[kind]})`,
  } as CSSProperties} />;
}
