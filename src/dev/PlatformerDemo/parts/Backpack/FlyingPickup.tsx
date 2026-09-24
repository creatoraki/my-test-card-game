import type { CSSProperties } from "react";
import type { PickupKind, Vec } from "../../types";
import { PickupIcon } from "../Pickups";
import s from "./Backpack.module.css";

export interface Flight {
  id: number;
  kind: PickupKind;
  from: Vec;
  to: Vec;
}

const SIZE = 96;

/** 拾取飞入动画：横向匀速、纵向先上抛再落入背包格，同时缩小。 */
export function FlyingPickup({ flight, onArrive }: { flight: Flight; onArrive: (flight: Flight) => void }) {
  const style = {
    left: flight.from.x - SIZE / 2,
    top: flight.from.y - SIZE / 2,
    "--dx": `${flight.to.x - flight.from.x}px`,
    "--dy": `${flight.to.y - flight.from.y}px`,
  } as CSSProperties;
  return (
    <div className={s.flyX} style={style} aria-hidden>
      <div className={s.flyY} onAnimationEnd={() => onArrive(flight)}>
        <PickupIcon kind={flight.kind} size={SIZE} />
      </div>
    </div>
  );
}
