import { memo, useLayoutEffect, useRef } from "react";
import type { BakedTile } from "@/ui/art/proceduralNear";
import s from "./BakedStrip.module.css";

/** 把烘焙好的分块 canvas 直接挂进世界层；之后它们只随世界层平移，不再重绘。className 用于指定层级。 */
export const BakedStrip = memo(function BakedStrip({ tiles, className }: { tiles: readonly BakedTile[]; className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    for (const tile of tiles) {
      tile.canvas.className = s.tile;
      tile.canvas.style.left = `${tile.x}px`;
      tile.canvas.style.width = `${tile.width}px`;
      host.appendChild(tile.canvas);
    }
    return () => tiles.forEach((tile) => tile.canvas.remove());
  }, [tiles]);

  return <div ref={hostRef} className={className ? `${s.strip} ${className}` : s.strip} aria-hidden />;
});
