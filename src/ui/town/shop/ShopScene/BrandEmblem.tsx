import { useId } from "react";

/** 铭牌徽标：暗色圆盘 + 断开的细圆环 + 棱角 “e” 字形，主色取 --rail-accent。 */
export function BrandEmblem({ size = 46 }: { size?: number }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-disc`} cx=".4" cy=".35" r=".75">
          <stop stopColor="#2a2224" />
          <stop offset="1" stopColor="#0c0909" />
        </radialGradient>
        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
      </defs>
      <circle cx="24" cy="24" r="21" fill={`url(#${id}-disc)`} />
      <circle cx="24" cy="24" r="21" stroke="#5a5254" strokeWidth=".9" strokeDasharray="30 3 22 3 40 3 30" />
      <path d="M7 31a18.5 18.5 0 0 0 11 10.5" stroke="var(--rail-accent, #ff3b4e)" strokeWidth=".9" opacity=".6" />
      <path d="M40 15a18.5 18.5 0 0 0-6-6" stroke="var(--rail-accent, #ff3b4e)" strokeWidth=".9" opacity=".4" />
      <g stroke="var(--rail-accent, #ff3b4e)" strokeWidth="4.6" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M31.5 32 24 36.5 14.5 27 24 11.5l9.5 9.5L20 28.5" opacity=".55" filter={`url(#${id}-glow)`} />
        <path d="M31.5 32 24 36.5 14.5 27 24 11.5l9.5 9.5L20 28.5" />
      </g>
      <path d="m22 18.5 5.5 3.5-6 1.5" stroke="#1a0a0c" strokeWidth="1.1" />
    </svg>
  );
}
