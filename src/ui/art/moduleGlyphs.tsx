// ============================================================================
// 成品模组徽记 —— 每件模组一套专属图形与配色。
//
// ★ 设计逻辑照搬小队徽章(ui/town/training/BadgeSelectModal/badgeGlyphs.tsx +
//   styles/badgeTheme.ts): 配色抽成 hue / deep / ink 三档主题表, 由 CSS 变量注入;
//   图形按「外框断线 → 主体 core(吃径向渐变) → 细节 → 呼吸核心」分层, 动效只挂最内层。
//
// ★ 与其余物品图标的区别: 这里**不**用 currentColor 跟随稀有度 ——
//   模组要靠颜色一眼区分种类, 稀有度信息已经由 .item-slot 的边框表达了。
//
// 没在 MODULE_THEMES / ART 里登记的模组不走这里, 由 itemArt 的通用 ModuleIcon 兜底。
// ============================================================================

import type { CSSProperties, ReactNode } from "react";
import { GENERIC_T1_MODULE_ART, GENERIC_T1_MODULE_THEMES } from "./moduleGlyphsGenericT1";
import s from "./moduleGlyphs.module.css";

export interface ModuleTheme {
  hue: string; // 主色: 轮廓与主体描边
  deep: string; // 暗色: 底纹、速度线一类的次要笔画
  ink: string; // 亮色: 核心与最上层的高光笔画
}

export const MODULE_THEMES: Record<string, ModuleTheme> = {
  // 速攻 = 电蓝。与小队徽章的 rush 同族, 「快」在本作里一直是这个色。
  "rush-module": { hue: "#4fd1ff", deep: "#0a6f9c", ink: "#d6f4ff" },
  // 弃牌 = 品红紫。丢弃/回收一侧的语义色, 与电蓝在小图标上也拉得开。
  "discard-module": { hue: "#c86bff", deep: "#5f2394", ink: "#eddaff" },
  // 落差 = 断裂橙红。费用下坠与沉重标记需要更有冲击力的警示色。
  "gap-module": { hue: "#ff876d", deep: "#963c3b", ink: "#ffe4c9" },
  // 卫星 = 靛蓝与金色。星辉角色模组共用夜空色系, 以亮色区分回响方向。
  "satellite-module": { hue: "#7d8dff", deep: "#35418f", ink: "#ffe49a" },
  "starloan-module": { hue: "#e8bb5b", deep: "#765320", ink: "#fff2bd" },
  // 植物系模组 = 青绿, 与星辉系拉开颜色距离。
  "aim-module": { hue: "#5de0c0", deep: "#176d69", ink: "#d8fff1" },
  "ripen-module": { hue: "#a4d85d", deep: "#4b7b32", ink: "#f2ffc9" },
  // 通用模组按「改的是哪一项」分色, 清单在 moduleGlyphsGenericT1.tsx。
  ...GENERIC_T1_MODULE_THEMES,
};

interface ArtProps {
  coreId: string;
}

const ART: Record<string, (props: ArtProps) => ReactNode> = {
  // 速攻模组: 三重箭镞破风。外框断线 → 速度线 → 箭镞主体 → 内层薄镞 → 呼吸核心。
  "rush-module": ({ coreId }) => (
    <>
      <path d="M8 17V8h9M31 8h9v9M40 31v9h-9M17 40H8v-9" stroke="var(--mg-deep)" strokeWidth="1.3" opacity=".55" />
      <path d="M7 18h9M5 24h8M9 30h7" stroke="var(--mg-deep)" strokeWidth="1.6" opacity=".85" />
      <path className={s.core} d="m18 12 18 12-18 12 5-12-5-12Z" fill={`url(#${coreId})`} stroke="var(--mg-hue)" strokeWidth="1.7" />
      <path d="m27 15 12 9-12 9 3-9-3-9Z" stroke="var(--mg-hue)" strokeWidth="1.2" opacity=".8" />
      <circle className={s.breathe} cx="30" cy="24" r="3.6" fill={`url(#${coreId})`} stroke="var(--mg-ink)" strokeWidth="1.2" />
    </>
  ),
  // 弃牌模组: 一叠牌里最下那张被推出去。外框断线 → 牌堆 → 滑落的末牌 → 下落箭头 → 呼吸核心。
  "discard-module": ({ coreId }) => (
    <>
      <path d="M8 17V8h9M31 8h9v9M40 31v9h-9M17 40H8v-9" stroke="var(--mg-deep)" strokeWidth="1.3" opacity=".55" />
      <rect className={s.core} x="14" y="9" width="16" height="21" rx="2" fill={`url(#${coreId})`} stroke="var(--mg-hue)" strokeWidth="1.7" />
      <path d="M18 14h8M18 18h8" stroke="var(--mg-hue)" strokeWidth="1.3" opacity=".7" />
      {/* 被弃掉的末牌: 从牌堆右下滑出并压低, 与牌堆错开一个身位。 */}
      <rect x="24" y="22" width="14" height="19" rx="2" fill={`url(#${coreId})`} stroke="var(--mg-deep)" strokeWidth="1.5" transform="rotate(14 31 31)" />
      <path d="M9 24v10M9 34l-3-3M9 34l3-3" stroke="var(--mg-ink)" strokeWidth="1.6" opacity=".9" />
      <circle className={s.breathe} cx="31" cy="31" r="3.4" fill={`url(#${coreId})`} stroke="var(--mg-ink)" strokeWidth="1.2" />
    </>
  ),
  // 落差模组: 阶梯断裂后向下坠落的方块。
  "gap-module": ({ coreId }) => (
    <>
      <path d="M8 17V8h9M31 8h9v9M40 31v9h-9M17 40H8v-9" stroke="var(--mg-deep)" strokeWidth="1.3" opacity=".55" />
      <path d="M10 15h9v6h8M38 33h-9v-6h-8" stroke="var(--mg-deep)" strokeWidth="1.7" opacity=".9" />
      <path className={s.core} d="m15 13 12 4v8l-12-4Z" fill={`url(#${coreId})`} stroke="var(--mg-hue)" strokeWidth="1.7" />
      <path d="m21 27 12 4v8l-12-4Z" fill={`url(#${coreId})`} stroke="var(--mg-hue)" strokeWidth="1.7" />
      <path d="M36 17v9M36 26l-3-3M36 26l3-3" stroke="var(--mg-ink)" strokeWidth="1.5" />
      <circle className={s.breathe} cx="27" cy="25" r="3.2" fill={`url(#${coreId})`} stroke="var(--mg-ink)" strokeWidth="1.2" />
    </>
  ),
  // 卫星模组: 被小卫星环绕的星核。
  "satellite-module": ({ coreId }) => (
    <>
      <path d="M8 17V8h9M31 8h9v9M40 31v9h-9M17 40H8v-9" stroke="var(--mg-deep)" strokeWidth="1.3" opacity=".55" />
      <ellipse className={s.spin} cx="24" cy="24" rx="15" ry="8" transform="rotate(-28 24 24)" stroke="var(--mg-deep)" strokeWidth="1.4" opacity=".9" />
      <path className={s.core} d="m24 12 3.5 8.5L36 24l-8.5 3.5L24 36l-3.5-8.5L12 24l8.5-3.5Z" fill={`url(#${coreId})`} stroke="var(--mg-hue)" strokeWidth="1.7" />
      <circle cx="12" cy="31" r="2.2" fill="var(--mg-ink)" stroke="var(--mg-hue)" strokeWidth="1" />
      <circle cx="35" cy="17" r="2.2" fill="var(--mg-ink)" stroke="var(--mg-hue)" strokeWidth="1" />
      <circle className={s.breathe} cx="24" cy="24" r="3" fill={`url(#${coreId})`} stroke="var(--mg-ink)" strokeWidth="1.2" />
    </>
  ),
  // 借星模组: 星点在两道相向箭头之间交换。
  "starloan-module": ({ coreId }) => (
    <>
      <path d="M8 17V8h9M31 8h9v9M40 31v9h-9M17 40H8v-9" stroke="var(--mg-deep)" strokeWidth="1.3" opacity=".55" />
      <path d="M11 19h20l-4-4M37 29H17l4 4" stroke="var(--mg-deep)" strokeWidth="1.6" />
      <path className={s.core} d="m24 10 3.2 9.2L37 22.5l-9.8 3.3L24 35l-3.2-9.2L11 22.5l9.8-3.3Z" fill={`url(#${coreId})`} stroke="var(--mg-hue)" strokeWidth="1.7" />
      <path d="M17 24h14M24 17v14" stroke="var(--mg-ink)" strokeWidth="1.1" opacity=".9" />
      <circle className={s.breathe} cx="24" cy="24" r="3.2" fill={`url(#${coreId})`} stroke="var(--mg-ink)" strokeWidth="1.2" />
    </>
  ),
  // 瞄准模组: 叠在能量核上的准星。
  "aim-module": ({ coreId }) => (
    <>
      <path d="M8 17V8h9M31 8h9v9M40 31v9h-9M17 40H8v-9" stroke="var(--mg-deep)" strokeWidth="1.3" opacity=".55" />
      <circle className={s.core} cx="24" cy="24" r="12" fill={`url(#${coreId})`} stroke="var(--mg-hue)" strokeWidth="1.7" />
      <path d="M24 8v8M24 32v8M8 24h8M32 24h8" stroke="var(--mg-deep)" strokeWidth="1.8" />
      <circle cx="24" cy="24" r="6" stroke="var(--mg-ink)" strokeWidth="1.3" />
      <circle className={s.breathe} cx="24" cy="24" r="2.8" fill="var(--mg-ink)" />
    </>
  ),
  // 催熟模组: 穿过生长环的嫩芽。
  "ripen-module": ({ coreId }) => (
    <>
      <path d="M8 17V8h9M31 8h9v9M40 31v9h-9M17 40H8v-9" stroke="var(--mg-deep)" strokeWidth="1.3" opacity=".55" />
      <path className={s.core} d="M24 38V22c0-6 4-10 10-11 0 6-3 10-10 11Z" fill={`url(#${coreId})`} stroke="var(--mg-hue)" strokeWidth="1.7" />
      <path d="M24 29c-7 0-10-4-10-10 6 0 10 3 10 10Z" fill={`url(#${coreId})`} stroke="var(--mg-hue)" strokeWidth="1.5" />
      <path d="M12 15c3-3 7-4 11-4M36 15c-3-3-7-4-11-4" stroke="var(--mg-deep)" strokeWidth="1.3" opacity=".85" />
      <circle className={s.breathe} cx="24" cy="22" r="3" fill={`url(#${coreId})`} stroke="var(--mg-ink)" strokeWidth="1.2" />
    </>
  ),
  ...GENERIC_T1_MODULE_ART,
};

export function hasModuleGlyph(moduleId: string): boolean {
  return moduleId in ART;
}

export function getModuleTheme(moduleId: string): ModuleTheme | undefined {
  return MODULE_THEMES[moduleId];
}

/** 模组徽记。viewBox 与 itemArt 的通用图标一致(48), 调用方的尺寸/布局一行都不用改。 */
export function ModuleGlyph({ moduleId }: { moduleId: string }) {
  const theme = MODULE_THEMES[moduleId];
  const art = ART[moduleId];
  if (!theme || !art) return null;

  const coreId = `module-core-${moduleId}`;
  const style = {
    "--mg-hue": theme.hue,
    "--mg-deep": theme.deep,
    "--mg-ink": theme.ink,
  } as CSSProperties;

  return (
    <svg
      className={s.glyph}
      style={style}
      viewBox="0 0 48 48"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <defs>
        {/* 主体填充: 中心亮、边缘散尽 —— 小尺寸下靠这层把「实心块」压成「发光体」。 */}
        <radialGradient id={coreId} cx="50%" cy="42%" r="62%">
          <stop offset="0" stopColor="var(--mg-ink)" stopOpacity=".55" />
          <stop offset=".26" stopColor="var(--mg-hue)" stopOpacity=".3" />
          <stop offset="1" stopColor="var(--mg-hue)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {art({ coreId })}
    </svg>
  );
}
