import { useId } from "react";

interface Props {
  className?: string;
}

// 法力水晶图标(「光」资源)。演进史: 早期手绘 SVG(♦ 菱形) → 美术素材 png → 现回到**内联 SVG**,
// 但这次是一颗带 3D 感的六边形刻面宝石(低多边形切工):
//   · 6 片冠部刻面按「光从上方来」由亮到暗分色 —— 上方越亮、下方越暗, 制造立体切割感;
//   · 中央桌面(table)用径向渐变做玻璃核心高光, 且刻意留成一片较平的六边形空区 ——
//     调用方(卡面 / 手牌 / 出牌亮相)会把「费用数字」用绝对定位压在正中, 正好落在这片桌面上;
//   · 上缘一道亮边高光 + 下缘一道暗边阴影 + 左上一小片高光, 让宝石有打磨过的反光。
// ⚠ viewBox 是 1:1(0 0 48 48), 所有用 .mana-crystal 的地方尺寸都按正方形成对给(见 styles.css)。
// ⚠ 图内有渐变 <defs>, 而同屏会渲染多颗(顶栏水晶条就是一排), 故用 useId() 保证渐变 id 唯一,
//    否则多实例共享同一 id 会互相串色。off 态(mana-pip.off)的灰暗仍由 styles.css 的 filter 负责。
export function ManaCrystalIcon({ className }: Props) {
  const uid = useId();
  const tableId = `mc-table-${uid}`;
  const glowId = `mc-glow-${uid}`;

  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* 桌面玻璃核心: 中心亮、边缘沉, 数字压上来时正好衬在这团高光里 */}
        <radialGradient id={tableId} cx="42%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#e2f7ff" />
          <stop offset="45%" stopColor="#7fd0f8" />
          <stop offset="100%" stopColor="#2f93df" />
        </radialGradient>
        {/* 整颗宝石的底光: 兜底铺在刻面之下, 让缝隙也透着蓝光 */}
        <radialGradient id={glowId} cx="46%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#9fe0ff" />
          <stop offset="100%" stopColor="#1a5fb0" />
        </radialGradient>
      </defs>

      {/* 底: 六边形轮廓铺一层底光 */}
      <polygon points="24,2 43.05,13 43.05,35 24,46 4.95,35 4.95,13" fill={`url(#${glowId})`} />

      {/* 6 片冠部刻面: 光从上方来 —— 上亮下暗、左右过渡 */}
      <g stroke="#0d3f80" strokeOpacity="0.35" strokeWidth="0.4" strokeLinejoin="round">
        <polygon points="4.95,13 24,2 24,13 14.47,18.5" fill="#9fe3ff" />        {/* 左上·最亮 */}
        <polygon points="24,2 43.05,13 33.53,18.5 24,13" fill="#7ecffb" />       {/* 右上·亮 */}
        <polygon points="4.95,35 4.95,13 14.47,18.5 14.47,29.5" fill="#4fb0ef" />{/* 左·中亮 */}
        <polygon points="43.05,13 43.05,35 33.53,29.5 33.53,18.5" fill="#398fdb" />{/* 右·中 */}
        <polygon points="24,46 4.95,35 14.47,29.5 24,35" fill="#215fa9" />       {/* 左下·暗 */}
        <polygon points="43.05,35 24,46 24,35 33.53,29.5" fill="#164f97" />      {/* 右下·最暗 */}
      </g>

      {/* 中央桌面: 玻璃核心, 数字落点 */}
      <polygon
        points="24,13 33.53,18.5 33.53,29.5 24,35 14.47,29.5 14.47,18.5"
        fill={`url(#${tableId})`}
        stroke="#bfeeff"
        strokeOpacity="0.45"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />

      {/* 下缘暗边: 压出厚度 */}
      <polyline
        points="43.05,35 24,46 4.95,35"
        fill="none"
        stroke="#0a3572"
        strokeOpacity="0.7"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 上缘亮边: 打磨反光 */}
      <polyline
        points="4.95,13 24,2 43.05,13"
        fill="none"
        stroke="#e6f8ff"
        strokeOpacity="0.8"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 左上一小片高光: 让宝石像被点亮 */}
      <polygon points="10.5,13.2 19,7.3 21.4,11.6 14.2,16.8" fill="#ffffff" fillOpacity="0.35" />

      {/* 收边: 整颗六边形描一圈, 与背景拉开轮廓 */}
      <polygon
        points="24,2 43.05,13 43.05,35 24,46 4.95,35 4.95,13"
        fill="none"
        stroke="#0c3a78"
        strokeOpacity="0.85"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}
