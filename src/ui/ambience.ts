// ============================================================================
// ★ 战斗场景氛围预设表(纯 UI 表现层)。按 MapDef.id 登记, 与 battleBg.ts / enemyArt.ts
// 同约定 —— 数据层不碰表现, 「地图 → 氛围」的关联全部落在这里。
//
// 一份 AmbienceDef 拆成三段, 分别由三种机制实现(见 ui/AmbienceLayer.tsx):
//   emitters → Canvas 粒子(雨/光尘/雾), 在世界内 ⇒ 跟随分镜相机
//   flicker  → 世界内的一层灯光闪烁(CSS), 模拟霓虹招牌/火光, 同样跟随相机
//   grade    → 屏幕空间调色(暗角/色调/扫描线), 在世界**之外** ⇒ 是「镜头」而非「场景」,
//              刻意不跟相机缩放, 否则暗角会随推近一起被放大而失效
//
// 基调是「细腻克制」: 粒子数量与不透明度都刻意压低, 目的是让静止画面有呼吸感,
// 而不是把背景盖住。调氛围主要改这一个文件。
// ============================================================================

// 粒子种类。新增一种 = 这里加一个成员 + AmbienceLayer 的 drawParticle 加一个分支。
export type ParticleKind =
  | "rain" // 倾斜细线, 自上而下快速掠过
  | "dust" // 柔和光点, 缓慢上浮 + 正弦横摆
  | "mist"; // 大半径低透明雾团, 极慢横向漂移

export interface EmitterDef {
  kind: ParticleKind;
  // far = 画在敌我单位之下(远景), near = 画在单位之上(近景)。
  // 近景那层是纵深的全部来源: 同样的雨, 近的更大更快更糊, 画面立刻分出前后。
  layer: "far" | "near";
  count: number; // 粒子数(恒定, 出界即回收复用, 无 GC 压力)
  color: string; // CSS 颜色(不含 alpha —— alpha 由 opacity 区间逐粒子随机)
  size: [number, number]; // 尺寸区间(设计 px): rain=线长, dust/mist=半径
  speed: [number, number]; // 速度区间(设计 px/s)
  opacity: [number, number]; // 不透明度区间
  angle?: number; // 下落方向偏离垂直的弧度(仅 rain; 正=向右倾)
  blur?: number; // 失焦半径(设计 px), 近景层用它拉开景深
  drift?: number; // 横向摆动幅度(设计 px, 仅 dust/mist)
}

export interface AmbienceDef {
  emitters: EmitterDef[];
  // 世界内的灯光闪烁: color 是叠加的光色(screen 混合), period 是一整圈的时长(ms)。
  // 关键帧刻意做成不规则的(见 ui/AmbienceLayer.css 的 ambienceFlicker), 才像坏掉的霓虹管。
  flicker?: { color: string; period: number };
  // 屏幕空间调色。vignette = 四角压暗强度(0~1), tint = 整体色偏(叠加色, 很淡),
  // scanline = 扫描线不透明度(0 = 不画)。
  grade?: { vignette: number; tint?: string; scanline?: number };
}

const AMBIENCE: Record<string, AmbienceDef> = {
  // 废弃楼层(neon-city): 背景是**静态图** —— 靠低空雾团 + 冷调暗角把它撑出呼吸感。
  // 注: 这里原先还有远/近两层 rain 和一组 flicker(顶部灯光闪), 因观感诉求已移除, 不要再加回来。
  "neon-city": {
    emitters: [
      // 低空雾团: 极慢横漂, 给地面一层湿冷的空气感
      {
        kind: "mist",
        layer: "far",
        count: 8,
        color: "#2b5f73",
        size: [180, 340],
        speed: [8, 20],
        opacity: [0.05, 0.12],
        drift: 40,
      },
    ],
    grade: { vignette: 0.28, tint: "#0a1520", scanline: 0.04 },
  },
};

// 未登记的地图回退到一层最轻的光尘 + 淡暗角 —— 任何背景都不出戏。
const FALLBACK_AMBIENCE: AmbienceDef = {
  emitters: [
    {
      kind: "dust",
      layer: "far",
      count: 40,
      color: "#dfe9ff",
      size: [1.5, 3],
      speed: [8, 20],
      opacity: [0.12, 0.3],
      drift: 22,
    },
  ],
  grade: { vignette: 0.22 },
};

export function ambience(mapId: string | null): AmbienceDef {
  return (mapId && AMBIENCE[mapId]) || FALLBACK_AMBIENCE;
}
