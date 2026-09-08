// 工房里的装备一侧: 装备升阶 / 羁绊重铸。
//
// ★ 这两件事原本住在「物资中转仓」。设施按语义合并后, 装备侧功能归入工房;
//   模组侧功能则迁入研究中心。
// ★ 入口砖与浮层必须共用同一份 morph 状态(开合动画要从被点的那条抽屉长出来), 但浮层
//   **不能**渲染在抽屉容器里 —— PanelShell 是绝对定位, 会被 460×188 的抽屉框裁住。
//   故本文件导出一个 hook, 一次返回配好对的 entries / panels 两段, 由场景各自安放。

import type { CSSProperties, ReactNode } from "react";
import { CLOSE_MS, usePanelMorph, type Rect } from "@/ui/common/panelMorph";
import { useFacilityPanelExit } from "@/ui/town/facilityExit";
import { DrawerEntry } from "@/ui/town/drawerEntry";
import { EquipReforgePanel } from "../EquipReforgePanel";
import { EquipUpgradePanel } from "../EquipUpgradePanel";

/** 装备一侧的主色: 与模组一侧的青蓝拉开, 走中转仓那支琥珀。 */
export const EQUIP_ACCENT = "#e59b3f";
export const REFORGE_ACCENT = "#2f9bff";

type EquipPanelId = "upgrade" | "reforge";

const EQUIP_PANEL_RECT: Record<EquipPanelId, Rect> = {
  upgrade: { x: 160, y: 80, w: 1600, h: 920 },
  reforge: { x: 160, y: 80, w: 1600, h: 920 },
};

export interface EquipPanels {
  /** 关闭时入口砖滑回的节拍变量。摊到公共 .entries 容器的 style 上, 由子孙的 CSS 读取。 */
  entryVars: CSSProperties;
  /** 放进公共 .entries 抽屉容器里的两条入口。 */
  entries: ReactNode;
  /** 放在场景根下(与抽屉容器同级)的两个浮层。 */
  panels: ReactNode;
}

export function useEquipPanels(): EquipPanels {
  const morph = usePanelMorph<EquipPanelId>({
    rects: EQUIP_PANEL_RECT,
  });
  const { panel } = morph;
  useFacilityPanelExit(() => {
    if (!morph.panel) return 0;
    morph.closePanel();
    return CLOSE_MS;
  });

  const entries = (
    <>
        <DrawerEntry
          icon={<UpgradeIcon />}
          name="装备升阶"
          desc="提升装备阶级与词条预算"
          entryId="upgrade"
          glow={EQUIP_ACCENT}
          hidden={morph.hiddenEntry === "upgrade" && morph.phase !== "closing"}
          revealing={morph.phase === "closing" && morph.hiddenEntry === "upgrade"}
          onClick={(event) => morph.openPanel("upgrade", event.currentTarget)}
        />
        <DrawerEntry
          icon={<ReforgeIcon />}
          name="羁绊重铸"
          desc="消耗地区材料重掷装备羁绊"
          entryId="reforge"
          glow={REFORGE_ACCENT}
          hidden={morph.hiddenEntry === "reforge" && morph.phase !== "closing"}
          revealing={morph.phase === "closing" && morph.hiddenEntry === "reforge"}
          onClick={(event) => morph.openPanel("reforge", event.currentTarget)}
        />
    </>
  );

  const panels = (
    <>
      {panel === "upgrade" && (
        <EquipUpgradePanel
          closing={morph.phase === "closing"}
          onClose={morph.closePanel}
          morph={{
            ref: morph.panelRef,
            rect: EQUIP_PANEL_RECT.upgrade,
            ready: morph.ready,
            seed: <UpgradeIcon />,
            seedLabel: "装备升阶",
          }}
        />
      )}
      {panel === "reforge" && (
        <EquipReforgePanel
          closing={morph.phase === "closing"}
          onClose={morph.closePanel}
          morph={{
            ref: morph.panelRef,
            rect: EQUIP_PANEL_RECT.reforge,
            ready: morph.ready,
            seed: <ReforgeIcon />,
            seedLabel: "羁绊重铸",
          }}
        />
      )}
    </>
  );

  return { entryVars: morph.entryVars, entries, panels };
}

// 入口图标。与 ui/art/itemArt.tsx 同约定: 内联线框 SVG, 不用 emoji、不依赖素材。
const iconBase = {
  viewBox: "0 0 32 32",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const UpgradeIcon = () => (
  <svg {...iconBase}>
    <path d="M7 25h6v-6h6v-6h6" />
    <path d="m20 8 5 5-5 5" />
    <path d="M7 29h19" opacity=".5" />
  </svg>
);

const ReforgeIcon = () => (
  <svg {...iconBase}>
    <path d="M9 9h8l4 4-9 9-4-4Z" />
    <path d="m12 22 8 8" />
    <path d="M23 8a8 8 0 0 1 5 12" />
    <path d="m28 20-1 5-5-1" />
    <path d="M9 24a8 8 0 0 1-5-12" />
    <path d="m4 12 1-5 5 1" />
  </svg>
);
