import { memo, useMemo } from "react";
import { CORRIDOR } from "@/explore/corridor/types";
import { buildEcoArkArchitectureLayout } from "./layout";
import s from "./EcoArkArchitecture.module.css";

export const EcoArkArchitecture = memo(function EcoArkArchitecture({
  roomId,
  width,
  occupiedX,
}: {
  roomId: string;
  width: number;
  occupiedX: readonly number[];
}) {
  const occupiedKey = occupiedX.join(",");
  const placements = useMemo(
    () => buildEcoArkArchitectureLayout(roomId, width, occupiedX),
    [roomId, width, occupiedKey],
  );

  if (!placements.length) return null;

  return <div className={s.layer} aria-hidden="true">
    {placements.map((placement) => <img
      key={placement.id}
      className={s.structure}
      src={placement.art.src}
      alt=""
      draggable={false}
      style={{
        left: placement.x,
        top: CORRIDOR.floorY + 8 - placement.height
          + placement.height * placement.art.groundTrim,
        width: placement.height * placement.art.aspectRatio,
        height: placement.height,
        transform: `translateX(-50%) scaleX(${placement.mirrored ? -1 : 1})`,
      }}
    />)}
  </div>;
});
