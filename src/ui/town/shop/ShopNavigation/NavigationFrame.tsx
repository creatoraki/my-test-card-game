import { NeonPlate, type Chamfer } from "@/ui/common/NeonPlate";

// 导航牌面：配色由 --plate-* / --edge-* 下发（见 ShopNavigation.module.css）。
const CHAMFER: Chamfer = { tl: 10, tr: 14, br: 14, bl: 6 };

export function NavigationFrame({ width, height }: { width: number; height: number }) {
  return <NeonPlate width={width} height={height} chamfer={CHAMFER} />;
}
