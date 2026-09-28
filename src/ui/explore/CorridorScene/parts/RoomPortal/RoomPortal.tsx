import {
  ROOM_PORTAL_GEOMETRY,
  ROOM_PORTAL_PROGRAM,
  ROOM_PORTAL_UNIFORMS,
  type PortalTheme,
} from "@/ui/art/portal";
import { GlslSprite } from "@/ui/common/fx/GlslSprite";

/**
 * 房间传送门 —— 四个方向共用同一副外观，由着色器程序化绘制。
 * 方向刻意不在场景里透露：玩家只能站上去，再从小地图读出它通往哪一间房。
 */
export function RoomPortal({ theme, standing, seed }: { theme: PortalTheme; standing: boolean; seed: number }) {
  return <GlslSprite
    program={ROOM_PORTAL_PROGRAM}
    width={ROOM_PORTAL_GEOMETRY.width}
    height={ROOM_PORTAL_GEOMETRY.height}
    uniforms={ROOM_PORTAL_UNIFORMS[theme]}
    active={standing}
    seed={seed}
  />;
}
