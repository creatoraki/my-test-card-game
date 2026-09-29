import { useId } from "react";
import s from "./CardBack.module.css";

// 卡背矢量层 —— 与卡牌正面(HandCard 的蚀刻黑钢)同一套工艺语言:
//   外沿: 跟着 14px 斜切角走的三层棱(高光棱 / 金属芯面 / 内沉暗槽), 光源恒在左上;
//   边框: 一圈 8 单位宽的金属框带, 四边中点各一颗铆钉, 让卡背有明确的"框"而不是一张贴图;
//   中心: 六角徽章托着一枚法力水晶 —— 与正面左上角的费用水晶呼应, 是卡背唯一带色相的实体件。
// viewBox 与卡的基准尺寸 220×308 相同, 所有几何都是基准像素, 随卡等比缩放。

const OUTER = "M14 0H220V294L206 308H0V14Z";
const GROOVE = "M15.24 3H217V292.76L204.76 305H3V15.24Z";
const BAND_OUT = "M27 11H209V281L193 297H11V27Z";
const BAND_IN = "M33 19H201V275L187 289H19V33Z";
const HEX_OUT = "M110 110L148.1 132V176L110 198L71.9 176V132Z";
const HEX_IN = "M110 118L141.2 136V172L110 190L78.8 172V136Z";
const GEM = "M110 134L130 154L110 174L90 154Z";
const GEM_INNER = "M110 141L123 154L110 167L97 154Z";
const PLATE = "M84 0H136L140 4V6L136 10H84L80 6V4Z";

const RIVETS: [number, number][] = [[110, 15], [110, 293], [15, 154], [205, 154]];

export function CardBackArt() {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ref = (name: string) => `url(#${id}-${name})`;

  return (
    <svg className={s.art} viewBox="0 0 220 308" preserveAspectRatio="none" aria-hidden focusable="false">
      <defs>
        {/* 受光斜向渐变: 左上亮 → 右下暗, 近似正面"上/左取受光、下/右取背光"的逐边配色。 */}
        <linearGradient id={`${id}-edge`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="220" y2="308">
          <stop offset="0" stopColor="#dbe5ec" />
          <stop offset="0.5" stopColor="#8a97a2" />
          <stop offset="1" stopColor="#3a444b" />
        </linearGradient>
        <linearGradient id={`${id}-core`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="220" y2="308">
          <stop offset="0" stopColor="#8d9ba6" />
          <stop offset="0.5" stopColor="#505c66" />
          <stop offset="1" stopColor="#1d2429" />
        </linearGradient>
        <linearGradient id={`${id}-band`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="220" y2="308">
          <stop offset="0" stopColor="#3d4952" />
          <stop offset="0.45" stopColor="#232b31" />
          <stop offset="1" stopColor="#0f1417" />
        </linearGradient>
        <linearGradient id={`${id}-hex`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4a5761" />
          <stop offset="0.5" stopColor="#262e34" />
          <stop offset="1" stopColor="#0e1215" />
        </linearGradient>
        <linearGradient id={`${id}-gem`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0077be" />
          <stop offset="1" stopColor="#00d2ff" />
        </linearGradient>
        <radialGradient id={`${id}-rivet`} cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#e4edf4" />
          <stop offset="0.55" stopColor="#6b7882" />
          <stop offset="1" stopColor="#1d2429" />
        </radialGradient>
        <radialGradient id={`${id}-field`} cx="0.5" cy="0.5" r="0.62">
          <stop offset="0" stopColor="#1a4a5c" stopOpacity="0.32" />
          <stop offset="0.55" stopColor="#0c1418" stopOpacity="0.1" />
          <stop offset="1" stopColor="#020405" stopOpacity="0.6" />
        </radialGradient>
        {/* 内场的 45° 交叉蚀刻网, 与正面 uncommon 档的蚀刻纹同一种工艺。 */}
        <pattern id={`${id}-etch`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0V7M0 0H7" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" />
        </pattern>
      </defs>

      {/* 内场: 蚀刻网 + 中心泛蓝的暗角 */}
      <path d={BAND_IN} fill={ref("etch")} />
      <path d={BAND_IN} fill={ref("field")} />

      {/* 同心刻环与中轴刻度线 */}
      <circle cx="110" cy="154" r="62" className={s["ring-dash"]} />
      <circle cx="110" cy="154" r="54" className={s.ring} />
      <path d="M110 46V92M110 216V262" className={s.axis} />
      <path d="M110 50V90M110 218V258" className={s.ticks} />
      <path d="M28 154H44M176 154H192" className={s.axis} />
      <path d="M44 150L48 154L44 158L40 154ZM176 150L180 154L176 158L172 154Z" className={s.stud} />

      {/* 上下两块铭牌: 刻槽代替文字 */}
      <g transform="translate(0 28)">
        <path d={PLATE} className={s.nameplate} />
        <path d="M89 5H131" className={s["nameplate-groove"]} />
      </g>
      <g transform="translate(0 270)">
        <path d={PLATE} className={s.nameplate} />
        <path d="M89 5H131" className={s["nameplate-groove"]} />
      </g>

      {/* 内场四角: 斜口处嵌角板, 直角处压 L 形卡扣 */}
      <path d="M21 37L37 21H46L21 46Z" className={s.gusset} />
      <path d="M199 271L183 287H174L199 262Z" className={s.gusset} />
      <path d="M178 27H193V42" className={s.bracket} />
      <path d="M27 266V281H42" className={s.bracket} />

      {/* 六角徽章 + 法力水晶 */}
      <path d={HEX_OUT} fill={ref("hex")} stroke={ref("edge")} strokeWidth="2.4" strokeLinejoin="round" />
      <path d={HEX_IN} className={s["hex-well"]} />
      <g className={s.gem}>
        <path d={GEM} fill={ref("gem")} />
        <path d="M110 134L90 154H110Z" fill="#ffffff" fillOpacity="0.24" />
        <path d="M110 174L130 154H110Z" fill="#000000" fillOpacity="0.22" />
        <path d={GEM_INNER} className={s["gem-inner"]} />
      </g>

      {/* 边框带: 外轮廓减内轮廓, 带暗槽与受光内沿 */}
      <path d={`${BAND_OUT}${BAND_IN}`} fillRule="evenodd" fill={ref("band")} />
      <path d={BAND_OUT} className={s["band-groove"]} />
      <path d={BAND_IN} fill="none" stroke={ref("edge")} strokeWidth="1" strokeOpacity="0.7" />
      {RIVETS.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.6" fill={ref("rivet")} className={s.rivet} />
      ))}

      {/* 外沿三层棱: 描边居中于轮廓, 外侧一半被卡的 clip-path 裁掉 ⇒ 净露芯面 3 + 高光棱 1 */}
      <path d={OUTER} fill="none" stroke={ref("core")} strokeWidth="6" />
      <path d={OUTER} fill="none" stroke={ref("edge")} strokeWidth="2" />
      <path d={GROOVE} className={s.groove} />
    </svg>
  );
}
