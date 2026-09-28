import { memo } from "react";
import type { CurioKind } from "@/explore/corridor/types";
import { CORRIDOR_CURIOS } from "@/data/curios";
import { CORRIDOR_PROP_Y_OFFSETS } from "@/ui/art/corridor/corridorArt";
import { CorridorSprite } from "@/ui/explore/CorridorScene/parts/CorridorSprite/CorridorSprite";
import s from "./DemoProps.module.css";

export interface DemoProp {
  id: string;
  kind: CurioKind;
  x: number;
}

const cls = (...names: (string | false)[]) => names.filter(Boolean).join(" ");

/**
 * 演示用交互物：复用探索场景的交互物素材与靠近描边 / 呼吸光。
 * 只做展示，不可操作；靠近时头顶浮出名称。
 */
export const DemoProps = memo(function DemoProps({ props, nearId, groundY }: {
  props: readonly DemoProp[];
  nearId: string | null;
  groundY: number;
}) {
  return <>
    {props.map((prop) => {
      const near = prop.id === nearId;
      return <div key={prop.id} className={cls(s.prop, near && s.near)} style={{ left: prop.x, top: groundY + CORRIDOR_PROP_Y_OFFSETS[prop.kind] }}>
        <span className={s.shadow} aria-hidden />
        <CorridorSprite kind={prop.kind} interacting={false} outlined={near} />
        <span className={s.label}>{CORRIDOR_CURIOS[prop.kind].name}</span>
      </div>;
    })}
  </>;
});
