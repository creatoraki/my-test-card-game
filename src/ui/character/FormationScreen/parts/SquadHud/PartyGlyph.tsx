// 「小队羁绊」标签前的小人图标 —— 两头一身的人群剪影。
// ⚠ 描边靠 currentColor, 尺寸与颜色由使用方的 class 给, 本文件不持有任何版面数值。

interface Props {
  className?: string;
}

export function PartyGlyph({ className }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.4 19c0-3.1 2.5-5.2 5.6-5.2s5.6 2.1 5.6 5.2" />
      <path d="M16 5.4a3.2 3.2 0 0 1 0 5.2" />
      <path d="M17.6 14.2c1.9.6 3 2.4 3 4.8" />
    </svg>
  );
}
