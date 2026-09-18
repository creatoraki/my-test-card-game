// ★ 区域图大图 ★ —— 点击左上角小地图后弹出, 按设计图还原的完整地图面板。
//
// 结构(自上而下): 霓虹主框(背景剪影 + 徽标标题 + 棋盘 + 指北针) → 图例条 → 底部装饰线。
// 棋盘与 HUD 缩略图共用 MinimapBoard, 只是按主框可用区域自动放大(方块上限 88px)。
// 大图打开期间场景行走被锁定(见 useExploreInventory.blocked), Esc / 关闭按钮 / 点遮罩关闭。

import type { CorridorState } from "@/explore/corridor/types";
import type { DungeonState } from "@/explore/dungeon/types";
import { useDialogFocus } from "@/ui/explore/ExploreScreen/useDialogFocus";
import sceneArt from "@/assets/占位场景素材.png";
import { MinimapBoard } from "../MinimapBoard";
import { fitMetrics } from "../minimapLayout";
import { buildMapModel, portalTargetId } from "../minimapModel";
import frame from "../MinimapFrame.module.css";
import { MinimapCompass } from "./MinimapCompass";
import { MinimapLegend } from "./MinimapLegend";
import s from "./MinimapAtlas.module.css";

/** 主框内棋盘可用区域; 与 MinimapAtlas.module.css 的 .board 定位保持一致。 */
const BOARD_AREA = { width: 790, height: 590 };

export function MinimapAtlas({
  dungeon,
  corridor,
  onClose,
}: {
  dungeon: DungeonState;
  corridor: CorridorState;
  onClose: () => void;
}) {
  const { panel, onKeyDown } = useDialogFocus({ active: true, onEscape: onClose });
  const { cells, links } = buildMapModel(dungeon);
  const metrics = fitMetrics(dungeon.bounds, BOARD_AREA, 88);
  const visited = cells.filter((cell) => cell.room.visited).length;

  return <div className={s.overlay} onClick={onClose}>
    <section
      ref={panel}
      className={s.panel}
      role="dialog"
      aria-modal="true"
      aria-label="区域图"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onClick={(event) => event.stopPropagation()}
    >
      <div className={`${frame.frame} ${s.main}`}>
        <div className={s.scene} style={{ backgroundImage: `url(${sceneArt})` }} aria-hidden />
        <i className={s.planet} aria-hidden />

        <header className={s.emblem}>
          <MinimapCompass size={96} className={s.emblemStar} />
          <div className={s.heading}>
            <h2>区域图</h2>
            <p>已访问 {visited} / {dungeon.order.length}</p>
          </div>
        </header>
        <i className={`${s.tick} ${s.tickLeft}`} aria-hidden />
        <i className={`${s.tick} ${s.tickRight}`} aria-hidden />

        <button type="button" className={s.close} aria-label="关闭区域图" onClick={onClose}>
          <svg viewBox="0 0 24 24" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>

        <div className={s.board}>
          <MinimapBoard
            dungeon={dungeon}
            cells={cells}
            links={links}
            metrics={metrics}
            road={Math.max(5, Math.round(metrics.tile * 0.1))}
            numSize={Math.max(18, Math.round(metrics.tile * 0.27))}
            targetId={portalTargetId(corridor)}
          />
        </div>

        <div className={s.north} aria-hidden>
          <span>北</span>
          <MinimapCompass size={66} ring={false} />
        </div>
      </div>

      <MinimapLegend />

      <svg className={s.footer} viewBox="0 0 870 34" aria-hidden>
        <path className={s.footerLine} d="M0 10H250L270 26H600L620 10H830" />
        <path className={s.footerGlow} d="M290 26H580" />
        <path className={s.footerLine} d="M842 30 856 6M852 30 866 6" />
      </svg>
    </section>
  </div>;
}

export default MinimapAtlas;
