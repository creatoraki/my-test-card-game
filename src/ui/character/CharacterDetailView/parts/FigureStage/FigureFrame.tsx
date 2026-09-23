import { memo, useId } from "react";
import s from "./FigureFrame.module.css";

// 边框按详情窗 594×772 绘制；装甲、金属细线、分段光轨逐层叠加。
// 装饰限制在边沿，不侵入人物展示区。
const OUTLINE = "M24 5H563L589 29V744L567 767H23L5 749V24Z";
const INNER = "M30 14H553L578 37V736L560 756H30L16 741V30Z";
const RAILS = "M6 146V25L25 6H112 M230 6H339 M502 7l22 22h57 M588 94v195 M587 595v148l-23 23h-97 M174 767H24L6 749v-97 M7 570V418l18-20V69";
const HOTSPOTS = "M7 47V25L25 7 M26 80v96 M7 443v-24l18-21v-45 M7 656v91l19 19h48 M502 7l22 22h42 M587 677v66l-22 23h-58";

export const FigureFrame = memo(function FigureFrame() {
  const id = useId();
  const metal = `${id}-metal`;
  const light = `${id}-light`;
  return (
    <svg className={s.frame} viewBox="0 0 594 772" preserveAspectRatio="none" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={metal} x1="0" y1="0" x2="594" y2="772" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d2e6ff" />
          <stop offset=".18" stopColor="#476b99" />
          <stop offset=".43" stopColor="#a4c9eb" />
          <stop offset=".6" stopColor="#344770" />
          <stop offset=".83" stopColor="#bdd5ff" />
          <stop offset="1" stopColor="#627ca6" />
        </linearGradient>
        <linearGradient id={light} x1="0" y1="0" x2="570" y2="772" gradientUnits="userSpaceOnUse">
          <stop stopColor="#edf4ff" />
          <stop offset=".15" stopColor="#ac8bff" />
          <stop offset=".34" stopColor="#6bd8ff" />
          <stop offset=".56" stopColor="#ac80ff" />
          <stop offset=".76" stopColor="#739fff" />
          <stop offset="1" stopColor="#e0c0ff" />
        </linearGradient>
      </defs>
      <path d={OUTLINE} stroke="#071124" strokeWidth="10" />
      <path d="M24 5H563L589 29H575L552 14H31L16 30V393L6 414V24Z M5 575l11-16v182l15 15h529l18-20V606l11-12v150l-22 23H23L5 749Z" fill="#233454" fillOpacity=".86" />
      <path d={OUTLINE} stroke={`url(#${metal})`} strokeWidth="1.5" />
      <path d={INNER} stroke={`url(#${metal})`} strokeWidth="1" opacity=".65" />
      <path d="M35 21H479 M33 51v277 M570 53v280 M35 747h280 M555 747h-88" stroke="#83c5ff" opacity=".22" />
      <path d={RAILS} stroke="#7164ff" strokeWidth="18" opacity=".07" />
      <path d={RAILS} stroke="#826aff" strokeWidth="10" opacity=".16" />
      <path d={RAILS} stroke="#84baff" strokeWidth="5" opacity=".28" />
      <path d={RAILS} stroke={`url(#${light})`} strokeWidth="2.5" />
      <path d={HOTSPOTS} stroke="#ae8eff" strokeWidth="7" opacity=".4" />
      <path d={HOTSPOTS} stroke={`url(#${light})`} strokeWidth="3.5" />
      <path d={HOTSPOTS} stroke="#f3eaff" strokeWidth="1.1" />
      <path d="m524 9 7 7h31l-8-7ZM12 423v20l9-10v-20Zm567 316-16 17h12l16-17v-13Z" fill="#bca3ff" />
      <path d="M538 22h35l8 8 M581 327v69 M20 598v39 M95 760h54" stroke="#b4d5ff" strokeWidth="2" opacity=".8" />
    </svg>
  );
});
