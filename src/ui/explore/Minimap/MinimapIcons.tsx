// 小地图房间图标 —— 内联 SVG, 统一 48×48 视框、currentColor 着色, 发光由外层 CSS 的 drop-shadow 负责。

import type { ReactElement } from "react";
import type { MapIcon } from "./minimapModel";

const PATHS: Record<MapIcon, ReactElement> = {
  // 导航箭头: 细长三角, 底边内凹。
  arrow: <path d="M24 5 38 41 24 33 10 41Z" />,
  check: <path d="M9 25.5 13.2 21.3 20 28.1 34.8 13.3 39 17.5 20 36.5Z" />,
  // 交叉双剑: 两把剑互为镜像。
  swords: <g>
    <path d="M7 7h5l20 20-5 5L7 12Z" />
    <path d="M24 34l10-10 3 3-10 10Z" />
    <path d="M33 35l2-2 6 6-2 2Z" />
    <path d="M41 7h-5L16 27l5 5 20-20Z" />
    <path d="M24 34 14 24l-3 3 10 10Z" />
    <path d="M15 35l-2-2-6 6 2 2Z" />
  </g>,
  question: <path d="M17 17.5c0-5 3.3-8.5 8-8.5 4.8 0 8 3.1 8 7.3 0 3.3-1.7 5.2-4.5 7-2 1.3-2.5 2.2-2.5 4.2v1.5h-5.2v-2c0-3.2 1.1-5 3.8-6.8 2-1.3 3-2.2 3-3.8 0-1.9-1.3-3.2-3.2-3.2-2.1 0-3.3 1.5-3.4 4.3ZM20.6 33.5h5.8v5.5h-5.8Z" />,
  lock: <g>
    <path d="M16 21v-5.5a8 8 0 0 1 16 0V21h-4.5v-5.5a3.5 3.5 0 0 0-7 0V21Z" />
    <path fillRule="evenodd" d="M13 21h22a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2V23a2 2 0 0 1 2-2ZM24 26.5a2.6 2.6 0 0 0-1.3 4.9V35h2.6v-3.6A2.6 2.6 0 0 0 24 26.5Z" />
  </g>,
  // 精英: 尖耳恶魔面具。
  demon: <path fillRule="evenodd" d="M6 8l7 10 5-3h12l5 3 7-10-2 14-4 5-2 8-5 5h-2l-1-4h-4l-1 4h-2l-5-5-2-8-4-5ZM17 22l6 3-1 3-5-2ZM31 22l-6 3 1 3 5-2Z" />,
  // BOSS: 上弯犄角 + 面具。
  boss: <path fillRule="evenodd" d="M8 4c-1 6 1 10 6 12l3-1h14l3 1c5-2 7-6 6-12-2 4-5 6-9 6H17c-4 0-7-2-9-6ZM13 18l4 5 1 8 5 7h2l5-7 1-8 4-5-3 1H16ZM18.5 24l4.5 2-1 3-3.5-1ZM29.5 24l-4.5 2 1 3 3.5-1Z" />,
  chest: <path fillRule="evenodd" d="M9 18c0-6 4-9 9-9h12c5 0 9 3 9 9v2H9Zm0 4h30v16H9Zm12 1v6h6v-6Zm-6-11v6h3v-6Zm15 0v6h3v-6Z" />,
};

export function MinimapIcon({ icon, className }: { icon: MapIcon; className?: string }) {
  return <svg className={className} viewBox="0 0 48 48" fill="currentColor" aria-hidden>{PATHS[icon]}</svg>;
}
