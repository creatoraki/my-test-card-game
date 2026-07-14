import { useId } from "react";

interface Props {
  className?: string;
}

// 扑克方块(♦)造型的蓝色宝石水晶: 菱形轮廓 + 刻面立体感 + 高光。
export function ManaCrystalIcon({ className }: Props) {
  const gradientId = useId();

  return (
    <svg className={className} viewBox="0 0 32 40" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradientId} x1="16" y1="3" x2="16" y2="37" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#dff6ff" />
          <stop offset="0.28" stopColor="#5cc6ff" />
          <stop offset="0.62" stopColor="#1a86e0" />
          <stop offset="1" stopColor="#08386f" />
        </linearGradient>
      </defs>
      {/* 主体菱形 */}
      <path d="M16 3 28 20 16 37 4 20Z" fill={`url(#${gradientId})`} />
      {/* 刻面: 左上亮面 / 右上中间调 */}
      <path d="M16 3 4 20 16 20Z" fill="#ffffff" opacity="0.28" />
      <path d="M16 3 28 20 16 20Z" fill="#ffffff" opacity="0.12" />
      {/* 刻面: 左下暗面 / 右下更暗 */}
      <path d="M4 20 16 37 16 20Z" fill="#03305f" opacity="0.30" />
      <path d="M28 20 16 37 16 20Z" fill="#03305f" opacity="0.45" />
      {/* 中心竖向高光 */}
      <path d="M16 3 20 12 16 20 12 12Z" fill="#ffffff" opacity="0.35" />
      {/* 外描边 */}
      <path d="M16 3 28 20 16 37 4 20Z" fill="none" stroke="#bfeaff" strokeOpacity="0.5" strokeWidth="1" />
    </svg>
  );
}
