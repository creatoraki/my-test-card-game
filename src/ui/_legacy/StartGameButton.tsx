/**
 * 「开始游戏」像素科技风艺术字按钮：内联 SVG 8-bit 像素字，替代原来的平滑立体挤出字。
 *
 * 像素质感靠**经典 pixelation 滤镜**(#sgPixel)实现 —— 把「画好的矢量字 + 金属渐变」整体切成
 * CELL×CELL 的方块像素，金属高光被自然量化成「像素金属」。立体不再用多层挤出，而是一个整格
 * 偏移的**硬像素暗影**(扁平硬朗)。外加全套 HUD 终端装饰:角框 [ ]、闪烁光标 _、CRT 扫描线、
 * 底部像素能量线。字面/暗影/HUD/辉光的颜色全走 CSS 自定义属性(--sg-*),悬停时在 StartGameButton.css
 * 里整组从「黑白金属」切到「蓝白」,颜色变量经 @property 注册为 <color> 做平滑过渡。
 * SVG 本身只是「画」,交互态与配色都在 CSS,方便统一主题。
 */

import "./StartGameButton.css";

const TEXT = "开始游戏";
const CELL = 6; // 像素格边长(=颗粒粗细,调大更块、调小更细)

// 四个字共用的排版参数(字面/暗影/扫描线裁剪都按这套画,才能严丝合缝地叠在一起)
const TYPO = {
  x: 260,
  y: 104,
  textAnchor: "middle" as const,
  fontSize: 86,
  fontWeight: 900,
  letterSpacing: 8,
  fontFamily: '"BebasNeue", "SourceHanSansSC", sans-serif',
};

export function StartGameButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="start-art-btn" onClick={onClick} aria-label="开始游戏">
      <svg
        className="start-art"
        viewBox="0 0 520 160"
        role="img"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 像素化滤镜:任何套上它的图形都被切成 CELL×CELL 方块像素。
              原理 —— 造一个每格中心一小点的采样网格,把源图"采样"到网格点上,再把每个点膨胀填满整格。 */}
          <filter
            id="sgPixel"
            x="0"
            y="0"
            width="520"
            height="160"
            filterUnits="userSpaceOnUse"
          >
            {/* 每个 CELL 格中心放一个小方点 */}
            <feFlood x={CELL / 2 - 1} y={CELL / 2 - 1} width="2" height="2" floodColor="#fff" result="dot" />
            <feComposite in="dot" width={CELL} height={CELL} result="cell" />
            <feTile in="cell" result="grid" />
            {/* 只在网格点处采样源色 → 每格得到一点代表色 */}
            <feComposite in="SourceGraphic" in2="grid" operator="in" result="samp" />
            {/* 采样点膨胀填满整格 → 方块像素 */}
            <feMorphology in="samp" operator="dilate" radius={CELL / 2} />
          </filter>

          {/* 字面金属渐变(竖向 chrome):顶部近白高光 → 中段主色 → 约 45% 处一条窄亮带(镜面反光,金属感关键) → 底部深色 */}
          <linearGradient id="sgFace" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="18%" stopColor="var(--sg-c1)" />
            <stop offset="43%" stopColor="var(--sg-c1)" />
            <stop offset="46%" stopColor="#ffffff" />
            <stop offset="49%" stopColor="var(--sg-c2)" />
            <stop offset="100%" stopColor="var(--sg-c3)" />
          </linearGradient>

          {/* CRT 扫描线图案:每 3px 一条 1px 暗线 */}
          <pattern id="sgScan" width="4" height="3" patternUnits="userSpaceOnUse">
            <rect width="4" height="1" fill="#000" />
          </pattern>

          {/* 外发光滤镜:模糊底层文字做辉光 */}
          <filter id="sgGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" />
          </filter>

          {/* 扫描线裁剪:把叠加层裁到字面形状内 */}
          <clipPath id="sgClip">
            <text {...TYPO}>{TEXT}</text>
          </clipPath>
        </defs>

        {/* 1) 底层辉光(整字模糊光晕) */}
        <text {...TYPO} className="sg-glow" fill="var(--sg-glow)" filter="url(#sgGlow)">
          {TEXT}
        </text>

        {/* 2) 硬像素暗影:同一行字整格偏移 + 暗色,套像素滤镜 */}
        <text
          {...TYPO}
          transform={`translate(${CELL} ${CELL})`}
          fill="var(--sg-shadow)"
          filter="url(#sgPixel)"
        >
          {TEXT}
        </text>

        {/* 3) 像素字面:金属渐变,套像素滤镜 */}
        <text {...TYPO} fill="url(#sgFace)" filter="url(#sgPixel)">
          {TEXT}
        </text>

        {/* 4) 扫描线叠加:裁到字面范围内 */}
        <rect
          className="sg-scan"
          x="0"
          y="0"
          width="520"
          height="160"
          fill="url(#sgScan)"
          clipPath="url(#sgClip)"
        />

        {/* 5) HUD 角框 [ ]:左右两组像素直角括号(本身即方块,不像素化) */}
        <g className="sg-bracket" fill="var(--sg-hud)">
          {/* 左括号 [ */}
          <rect x="40" y="44" width="7" height="72" />
          <rect x="40" y="44" width="22" height="7" />
          <rect x="40" y="109" width="22" height="7" />
          {/* 右括号 ] */}
          <rect x="473" y="44" width="7" height="72" />
          <rect x="458" y="44" width="22" height="7" />
          <rect x="458" y="109" width="22" height="7" />
        </g>

        {/* 6) 闪烁光标 _:末字后一个小方块 */}
        <rect className="sg-cursor" x="424" y="106" width="26" height="8" fill="var(--sg-hud)" />

        {/* 7) 像素能量底线:一排等距小方块 */}
        <g className="sg-underline" fill="var(--sg-glow)">
          {Array.from({ length: 18 }).map((_, i) => (
            <rect key={i} x={92 + i * 18} y="130" width="10" height="5" />
          ))}
        </g>
      </svg>
    </button>
  );
}
