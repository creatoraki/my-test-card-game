// 小地图棋盘 —— 道路 + 房间方块。HUD 缩略图与展开大图共用, 只差尺寸参数。

import type { CSSProperties } from "react";
import type { DungeonState } from "@/explore/dungeon/types";
import { layoutBoard, type BoardMetrics } from "./minimapLayout";
import { roomAriaLabel, type MapCell, type MapLink } from "./minimapModel";
import { MinimapRoutes } from "./MinimapRoutes";
import { MinimapTile } from "./MinimapTile";

export interface MinimapBoardProps {
  dungeon: DungeonState;
  cells: MapCell[];
  links: MapLink[];
  metrics: BoardMetrics;
  /** 道路管壁粗细。 */
  road: number;
  /** 房间序号字号, 不低于 18px。 */
  numSize: number;
  targetId: string | null;
  picking?: boolean;
  onPick?: (roomId: string) => void;
  className?: string;
}

export function MinimapBoard({
  dungeon, cells, links, metrics, road, numSize, targetId, picking = false, onPick, className,
}: MinimapBoardProps) {
  const board = layoutBoard(cells, links, dungeon.bounds, metrics);
  const style = { position: "relative", width: board.width, height: board.height, "--num-size": `${numSize}px` } as CSSProperties;
  return <div className={className} style={style} data-picking={picking || undefined}>
    <MinimapRoutes links={board.links} width={board.width} height={board.height} road={road} />
    {board.cells.map((cell) => {
      const pickable = picking && cell.room.visited && !cell.current;
      return <MinimapTile
        key={cell.room.id}
        tone={cell.tone}
        icon={cell.icon}
        size={metrics.tile}
        label={cell.room.visited || dungeon.layoutKnown ? cell.room.label : undefined}
        dim={cell.dim || (picking && !pickable)}
        target={cell.room.id === targetId}
        picking={pickable}
        left={cell.left}
        top={cell.top}
        ariaLabel={roomAriaLabel(cell)}
        onClick={pickable ? () => onPick?.(cell.room.id) : undefined}
      />;
    })}
  </div>;
}

export default MinimapBoard;
