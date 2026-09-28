import type { GlslUniforms } from "@/ui/common/fx/GlslSprite";

export type PortalTheme = "ruins" | "ark";

interface PortalPalette {
  /** 旋涡暗部、主色、亮芯、边缘光。 */
  deep: string;
  main: string;
  core: string;
  rim: string;
}

interface PortalGeometry {
  /** 画布设计尺寸。 */
  width: number;
  height: number;
  /** 地面线距画布底边的距离；场景按它把画布下沉，使光斑落在地面上。 */
  groundInset: number;
  /** 悬浮椭圆：横半轴、竖半轴、底部离地高度、上下浮动幅度。 */
  oval: readonly [number, number, number, number];
}

/** 废弃楼层：青色能量，对齐近景的霓虹灯条。 */
const RUINS: PortalPalette = { deep: "#04232b", main: "#2fe0d2", core: "#dcfffa", rim: "#7ff8ff" };
/** 生态方舟：偏绿的蓝绿能量。 */
const ARK: PortalPalette = { deep: "#06304a", main: "#36d3b4", core: "#eafff6", rim: "#9dffd8" };
/** 首领红门：血红旋涡、橙色亮芯。 */
const BOSS: PortalPalette = { deep: "#1c0306", main: "#ee3a30", core: "#ffc08a", rim: "#ff7a4a" };

export const ROOM_PORTAL_GEOMETRY: PortalGeometry = {
  width: 300,
  height: 360,
  groundInset: 14,
  oval: [80, 128, 30, 5],
};

export const BOSS_GATE_GEOMETRY: PortalGeometry = {
  width: 420,
  height: 500,
  groundInset: 18,
  oval: [110, 170, 40, 6],
};

function rgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16 & 255) / 255, (value >> 8 & 255) / 255, (value & 255) / 255];
}

function buildUniforms(palette: PortalPalette, geometry: PortalGeometry): GlslUniforms {
  return {
    uDeep: rgb(palette.deep),
    uMain: rgb(palette.main),
    uCore: rgb(palette.core),
    uRim: rgb(palette.rim),
    uGround: geometry.groundInset,
    uOval: geometry.oval,
  };
}

/** 预先算好的 uniform 表，保持引用稳定。 */
export const ROOM_PORTAL_UNIFORMS: Record<PortalTheme, GlslUniforms> = {
  ruins: buildUniforms(RUINS, ROOM_PORTAL_GEOMETRY),
  ark: buildUniforms(ARK, ROOM_PORTAL_GEOMETRY),
};

export const BOSS_GATE_UNIFORMS: GlslUniforms = buildUniforms(BOSS, BOSS_GATE_GEOMETRY);

export function portalThemeFor(mapId: string | undefined): PortalTheme {
  return mapId === "eco-ark" ? "ark" : "ruins";
}
