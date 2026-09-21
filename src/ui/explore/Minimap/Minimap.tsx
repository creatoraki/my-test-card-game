// ★ 房间小地图 ★ —— 房间制唯一的空间信息来源。
//
// 场景里的四座传送门外观完全一致、方向不可辨认, 所以「这扇门通往哪里」只有这块小地图知道:
// 玩家站上某座传送门 → 那扇门的目标房间在这里亮起(位置已知, 内容仍未知)。
// 因此它不是装饰性 HUD, 而是这套玩法的主界面之一。
//
// 这里是左上角常驻的缩略版: 固定 1:1 外框, 只显示以当前房间为中心、外框装得下的范围;
// 点击面板(或「展开」)打开 MinimapAtlas 大图看更大范围, 传送选房也在大图里进行。
// 格子状态与视觉映射见 minimapModel.ts, 格子落点与折线道路见 minimapLayout.ts。

import type { CorridorState } from "@/explore/corridor/types";
import type { DungeonState } from "@/explore/dungeon/types";
import { MinimapFocus } from "./MinimapFocus";
import { buildMapModel, portalTargetId } from "./minimapModel";
import { MINIMAP_HUD_METRICS } from "./minimapHudLayout";
import frame from "./MinimapFrame.module.css";
import s from "./Minimap.module.css";

export function Minimap({
  dungeon,
  corridor,
  onExpand,
}: {
  dungeon: DungeonState;
  corridor: CorridorState;
  onExpand?: () => void;
}) {
  const { cells, links } = buildMapModel(dungeon);

  return <div
    className={`${frame.frame} ${s.map}`}
    data-expandable={onExpand ? true : undefined}
    aria-label="房间小地图"
    onClick={onExpand}
  >
    <div className={s.head}>
      <span className={s.title}>区域图</span>
      <b className={s.count}>{cells.filter((cell) => cell.room.visited).length} / {dungeon.order.length}</b>
      {onExpand && <button
        type="button"
        className={s.expand}
        aria-label="展开区域图"
        onClick={(event) => { event.stopPropagation(); onExpand(); }}
      >
        <svg viewBox="0 0 24 24" aria-hidden><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" /></svg>
        展开
      </button>}
    </div>
    <div className={s.viewport}>
      <MinimapFocus
        dungeon={dungeon}
        cells={cells}
        links={links}
        metrics={MINIMAP_HUD_METRICS}
        road={4}
        numSize={18}
        targetId={portalTargetId(corridor)}
      />
    </div>
  </div>;
}

export default Minimap;
