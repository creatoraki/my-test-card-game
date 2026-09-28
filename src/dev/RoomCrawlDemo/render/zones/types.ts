import type { AmbientStyle } from "../lighting/lightRig";
import type { GradeStyle } from "../postfx/composer";

/**
 * 一个子区域的全部 GLSL 片段与风格参数。各函数签名(由通用房间着色器调用):
 * - far:   vec3 zoneFar(vec2 scr)                    scr = 屏幕 px(x 向右, y 向上), 视差自行用 uCamX 计算
 * - wall:  Surf zoneWall(vec2 p)                     p = (房间 x, 离地高 h); 进房时烘焙, 不得使用 uTime,
 *                                                    动画发光只把 0~1 遮罩写进 s.anim
 * - wallLive: vec3 zoneWallLive(vec2 p, vec4 anim)   每帧: 按时间把遮罩调制成发光(只用廉价公式)
 *          void zoneFixture(vec2 d, float level, vec3 light, inout Surf s)   每帧; d = 相对灯具中心的 px
 * - floor: Surf zoneFloor(vec2 p)                    p = (房间 x, 纵深 z); 同上烘焙, anim.w 被高度占用, 只能用 xyz
 * - floorLive: vec3 zoneFloorLive(vec2 p, vec4 anim) 每帧
 * - fore:  vec4 zoneFore(vec2 scr)                   返回预乘 alpha 的前景色
 * 烘焙段与实时段分开拼接: 实时材质不带烘焙 GLSL, 编译更快。live 段只能依赖公共前缀与 ROOM_HEADER。
 */
export interface ZoneShaders {
  far: string;
  wall: string;
  wallLive: string;
  floor: string;
  floorLive: string;
  fore: string;
  ambient: AmbientStyle;
  grade: GradeStyle;
  /** 门、转场光圈、粒子的主色。 */
  accent: number;
  /** 浮尘粒子的颜色与密度。 */
  dust: { color: number; count: number };
}
