// 以当前房间为中心的棋盘 —— HUD 缩略图与展开大图共用。
// 父容器负责裁切(overflow: hidden)并确定可视范围; 这里只把当前房间的中心对齐到父容器中心。
// 容器越大、方块越小, 能看到的范围就越大。

import { MinimapBoard, type MinimapBoardProps } from "./MinimapBoard";
import { placeRoom } from "./minimapLayout";
import s from "./MinimapFocus.module.css";

export function MinimapFocus(props: MinimapBoardProps) {
  const { dungeon, metrics } = props;
  const current = dungeon.rooms[dungeon.currentRoomId];
  const origin = current ? placeRoom(current, dungeon.bounds, metrics) : { left: 0, top: 0 };
  const x = origin.left + metrics.tile / 2;
  const y = origin.top + metrics.tile / 2;
  return <div className={s.anchor} style={{ transform: `translate(${-x}px, ${-y}px)` }}>
    <MinimapBoard {...props} />
  </div>;
}

export default MinimapFocus;
