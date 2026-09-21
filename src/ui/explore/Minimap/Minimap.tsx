// ★ 房间小地图 ★ —— 房间制唯一的空间信息来源。
//
// 场景里的四座传送门外观完全一致、方向不可辨认, 所以「这扇门通往哪里」只有这块小地图知道:
// 玩家站上某座传送门 → 那扇门的目标房间在这里亮起(位置已知, 内容仍未知)。
// 因此它不是装饰性 HUD, 而是这套玩法的主界面之一。
//
// 这里是左上角常驻的缩略版; 点击面板(或「展开」)打开 MinimapAtlas 大图。
// 格子状态与视觉映射见 minimapModel.ts, 格子落点与折线道路见 minimapLayout.ts。

import type { CorridorState } from "@/explore/corridor/types";
import type { DungeonState } from "@/explore/dungeon/types";
import { roomMoveCostFor } from "@/explore/energyCost";
import { MinimapBoard } from "./MinimapBoard";
import { buildMapModel, portalTargetId } from "./minimapModel";
import { minimapHudLayout } from "./minimapHudLayout";
import frame from "./MinimapFrame.module.css";
import s from "./Minimap.module.css";

export function Minimap({
  dungeon,
  corridor,
  picking = false,
  onPick,
  onExpand,
}: {
  dungeon: DungeonState;
  corridor: CorridorState;
  picking?: boolean;
  onPick?: (roomId: string) => void;
  onExpand?: () => void;
}) {
  const { cells, links } = buildMapModel(dungeon);
  const targetId = portalTargetId(corridor);
  const target = targetId ? dungeon.rooms[targetId] : null;
  const expandable = Boolean(onExpand) && !picking;
  const layout = minimapHudLayout(dungeon.bounds);

  return <div
    className={`${frame.frame} ${s.map}`}
    style={{ width: layout.width, height: layout.height }}
    data-picking={picking || undefined}
    data-expandable={expandable || undefined}
    aria-label="房间小地图"
    onClick={expandable ? onExpand : undefined}
  >
    <div className={s.head}>
      <span className={s.title}>区域图</span>
      <b className={s.count}>{cells.filter((cell) => cell.room.visited).length} / {dungeon.order.length}</b>
      {onExpand && <button
        type="button"
        className={s.expand}
        disabled={picking}
        aria-label="展开区域图"
        onClick={(event) => { event.stopPropagation(); onExpand(); }}
      >
        <svg viewBox="0 0 24 24" aria-hidden><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" /></svg>
        展开
      </button>}
    </div>
    <div className={s.viewport}>
      <MinimapBoard
        className={s.board}
        dungeon={dungeon}
        cells={cells}
        links={links}
        metrics={layout.metrics}
        road={4}
        numSize={18}
        targetId={targetId}
        picking={picking}
        onPick={onPick}
      />
    </div>
    <p className={s.hint} data-live={Boolean(target) || picking || undefined}>
      {picking
        ? "选择一间已访问的房间传送过去 · 不消耗净化粒子"
        : target
          ? `脚下传送门通往${target.visited ? ` ${target.label} 号房间` : "此处"} · 粒子 −${roomMoveCostFor(target.visited)}`
          : "站上传送门可点亮它通往的房间"}
    </p>
  </div>;
}

export default Minimap;
