import type { ReactNode } from "react";

export type ArcanaId = "strength" | "chariot" | "fool" | "priestess" | "judgement" | "tower";

export interface ArcanaMeta {
  id: ArcanaId;
  name: string;
  latin: string;
  code: string;
  numeral: string;
  accent: string;
  mood: string;
  art: ReactNode;
}

function Rays({
  cx,
  cy,
  from,
  to,
  count = 12,
  startDeg = 0,
  sweepDeg = 360,
}: {
  cx: number;
  cy: number;
  from: number;
  to: number;
  count?: number;
  startDeg?: number;
  sweepDeg?: number;
}) {
  const step = sweepDeg / count;
  return (
    <g data-dim="soft">
      {Array.from({ length: count }, (_, index) => {
        const rad = ((startDeg + index * step) * Math.PI) / 180;
        const dx = Math.cos(rad);
        const dy = Math.sin(rad);
        return (
          <line
            key={index}
            x1={cx + dx * from}
            y1={cy + dy * from}
            x2={cx + dx * to}
            y2={cy + dy * to}
          />
        );
      })}
    </g>
  );
}

function Ground({ y = 86, x1 = 12, x2 = 88 }: { y?: number; x1?: number; x2?: number }) {
  return (
    <g data-dim="hard">
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <line x1={x1 + 4} y1={y + 5} x2={x2 - 4} y2={y + 5} strokeDasharray="3 5" />
    </g>
  );
}

function Figure({
  x,
  y,
  scale = 1,
  rotate = 0,
}: {
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <circle cx="0" cy="-16" r="4.4" />
      <line x1="0" y1="-11" x2="0" y2="3" />
      <line x1="0" y1="-7" x2="-7" y2="-1" />
      <line x1="0" y1="-7" x2="7" y2="-2" />
      <line x1="0" y1="3" x2="-5" y2="14" />
      <line x1="0" y1="3" x2="6" y2="14" />
    </g>
  );
}

const strengthArt = (
  <>
    <g data-glow="true">
      <ellipse cx="42" cy="18" rx="8.5" ry="6.5" />
      <ellipse cx="58" cy="18" rx="8.5" ry="6.5" />
    </g>
    <g data-dim="soft">
      <path d="M28 33 Q50 43 72 33" strokeDasharray="4 4" />
      <circle cx="34" cy="35.4" r="2.2" />
      <circle cx="50" cy="39.6" r="2.6" />
      <circle cx="66" cy="35.4" r="2.2" />
    </g>
    <Rays cx={50} cy={63} from={21} to={29} count={16} startDeg={11} />
    <g data-glow="true">
      <circle cx="50" cy="63" r="18" />
    </g>
    <path d="M36 51 Q33 43 41 46" />
    <path d="M64 51 Q67 43 59 46" />
    <circle cx="43" cy="60" r="1.8" />
    <circle cx="57" cy="60" r="1.8" />
    <path d="M50 64 L50 69" />
    <path d="M43 71 Q50 78 57 71" />
    <path d="M45.5 69.5 Q50 72.5 54.5 69.5" />
  </>
);

const chariotArt = (
  <>
    <g data-dim="soft">
      <path d="M20 32 L34 20 H66 L80 32 Z" />
      <circle cx="42" cy="26" r="1.4" />
      <circle cx="50" cy="24" r="1.4" />
      <circle cx="58" cy="26" r="1.4" />
      <circle cx="50" cy="30" r="1.4" />
    </g>
    <line x1="20" y1="32" x2="80" y2="32" />
    <g data-glow="true">
      <path d="M30 34 H70 L67 62 H33 Z" />
    </g>
    <path d="M50 34 V62" data-dim="soft" />
    <path d="M38 40 h9 v10 h-9 Z" data-dim="soft" />
    <path d="M53 40 h9 v10 h-9 Z" data-dim="soft" />
    <path d="M23 38 a5 5 0 0 1 8 4" />
    <path d="M77 38 a5 5 0 0 0 -8 4" />
    <line x1="26" y1="66" x2="74" y2="66" data-dim="soft" />
    <g data-glow="true">
      <circle cx="33" cy="72" r="10" />
      <circle cx="67" cy="72" r="10" />
    </g>
    <g data-dim="soft">
      <circle cx="33" cy="72" r="2.6" />
      <circle cx="67" cy="72" r="2.6" />
      <line x1="33" y1="62" x2="33" y2="82" />
      <line x1="23" y1="72" x2="43" y2="72" />
      <line x1="26" y1="65" x2="40" y2="79" />
      <line x1="40" y1="65" x2="26" y2="79" />
      <line x1="67" y1="62" x2="67" y2="82" />
      <line x1="57" y1="72" x2="77" y2="72" />
      <line x1="60" y1="65" x2="74" y2="79" />
      <line x1="74" y1="65" x2="60" y2="79" />
    </g>
    <Ground y={86} x1={16} x2={84} />
  </>
);

const foolArt = (
  <>
    <Rays cx={24} cy={24} from={10} to={15} count={10} startDeg={9} />
    <g data-glow="true">
      <circle cx="24" cy="24" r="8" />
    </g>
    <g data-glow="true">
      <Figure x={48} y={60} scale={1.15} rotate={-6} />
    </g>
    <line x1="70" y1="18" x2="46" y2="56" />
    <path d="M64 20 q7 -9 12 -1 q-6 5 -12 1 Z" />
    <path d="M65.5 19.2 L74 20.6" data-dim="soft" />
    <g data-dim="soft">
      <circle cx="40" cy="54" r="3.2" />
      <path d="M40 54 L36 60" />
    </g>
    <g data-dim="hard">
      <path d="M10 70 H44 V84 H92" />
      <line x1="14" y1="75" x2="40" y2="75" strokeDasharray="3 6" />
      <line x1="52" y1="89" x2="88" y2="89" strokeDasharray="3 6" />
    </g>
  </>
);

const priestessArt = (
  <>
    <g data-dim="soft">
      <path d="M16 30 h14 v46 h-14 Z" />
      <path d="M70 30 h14 v46 h-14 Z" />
      <line x1="13" y1="30" x2="33" y2="30" />
      <line x1="67" y1="30" x2="87" y2="30" />
      <line x1="13" y1="76" x2="33" y2="76" />
      <line x1="67" y1="76" x2="87" y2="76" />
      <line x1="23" y1="36" x2="23" y2="70" strokeDasharray="4 5" />
      <line x1="77" y1="36" x2="77" y2="70" strokeDasharray="4 5" />
    </g>
    <path d="M34 34 H66 V76 H34 Z" data-dim="soft" strokeDasharray="5 4" />
    <g data-glow="true">
      <path d="M42 22 q8 -12 16 0" />
      <circle cx="50" cy="16" r="4" />
      <path d="M40 24 a4 4 0 1 0 4 -6" />
      <path d="M60 24 a4 4 0 1 1 -4 -6" />
    </g>
    <g data-glow="true">
      <path d="M43 42 h14 v22 h-14 Z" />
    </g>
    <g data-dim="soft">
      <line x1="46" y1="48" x2="54" y2="48" />
      <line x1="46" y1="53" x2="54" y2="53" />
      <line x1="46" y1="58" x2="52" y2="58" />
    </g>
    <g data-glow="true">
      <path d="M42 80 a8.5 8.5 0 1 0 8.5 -8.4 a6.6 6.6 0 0 1 -8.5 8.4 Z" />
    </g>
    <Ground y={86} x1={14} x2={86} />
  </>
);

const judgementArt = (
  <>
    <Rays cx={70} cy={34} from={16} to={26} count={9} startDeg={-96} sweepDeg={200} />
    <g data-glow="true">
      <path d="M24 22 L62 38" />
      <path d="M62 32 L82 24 V50 L62 43 Z" />
      <line x1="24" y1="20" x2="24" y2="25" />
    </g>
    <path d="M78 26 V48" data-dim="soft" />
    <g data-glow="true">
      <path d="M40 30 h18 v16 h-18" />
    </g>
    <g data-dim="soft">
      <line x1="49" y1="33" x2="49" y2="43" />
      <line x1="44" y1="38" x2="54" y2="38" />
    </g>
    <g data-glow="true">
      <Figure x={26} y={72} scale={0.86} />
      <Figure x={50} y={76} scale={0.86} />
      <Figure x={74} y={72} scale={0.86} />
    </g>
    <g data-dim="hard">
      <path d="M16 84 q10 -5 20 0" />
      <path d="M40 88 q10 -5 20 0" />
      <path d="M64 84 q10 -5 20 0" />
    </g>
  </>
);

const towerArt = (
  <>
    <g data-glow="true">
      <path d="M80 6 L64 26 L73 29 L56 50" />
    </g>
    <g data-glow="true">
      <path d="M60 24 L74 14 L74 20 L79 16 L79 22 L84 19 L82 27 Z" transform="rotate(18 72 20)" />
    </g>
    <g data-glow="true">
      <path d="M40 82 L43 30 H57 L60 82" />
      <path d="M41 30 H59" />
    </g>
    <g data-dim="soft">
      <path d="M43.6 40 h5 v8 h-5 Z" />
      <path d="M51.4 40 h5 v8 h-5 Z" />
      <path d="M46 58 h8 v11 a4 4 0 0 0 -8 0 Z" />
      <path d="M43.6 52 L57 56" strokeDasharray="3 3" />
      <path d="M56.6 70 L44 75" strokeDasharray="3 3" />
    </g>
    <g data-glow="true">
      <Figure x={22} y={58} scale={0.72} rotate={-152} />
      <Figure x={80} y={66} scale={0.72} rotate={138} />
    </g>
    <g data-dim="soft">
      <circle cx="32" cy="34" r="1.6" />
      <circle cx="68" cy="44" r="1.6" />
      <circle cx="27" cy="74" r="1.3" />
      <circle cx="72" cy="80" r="1.3" />
    </g>
    <Ground y={86} x1={14} x2={86} />
  </>
);

export function FallbackArcanaArt() {
  return (
    <g transform="translate(0 0) scale(2.083333)">
      <circle cx="24" cy="24" r="14" strokeWidth="1.2" opacity="0.45" />
      <path d="M16 24c0-5 3-8 8-8s8 3 8 8-3 8-8 8-8-3-8-8ZM24 10v6M24 32v6" strokeWidth="1.6" />
    </g>
  );
}

export const ARCANA: ArcanaMeta[] = [
  {
    id: "strength",
    name: "力量",
    latin: "STRENGTH",
    code: "VIII",
    numeral: "VIII",
    accent: "#d9a23c",
    mood: "以柔驯猛 · 持续的自我克制",
    art: strengthArt,
  },
  {
    id: "chariot",
    name: "战车",
    latin: "THE CHARIOT",
    code: "VII",
    numeral: "VII",
    accent: "#5fb8cc",
    mood: "意志前压 · 不容偏航的推进",
    art: chariotArt,
  },
  {
    id: "fool",
    name: "愚者",
    latin: "THE FOOL",
    code: "0",
    numeral: "0",
    accent: "#d6f238",
    mood: "起点 · 迈出崖沿的那一步",
    art: foolArt,
  },
  {
    id: "priestess",
    name: "女祭司",
    latin: "HIGH PRIESTESS",
    code: "II",
    numeral: "II",
    accent: "#9b83dd",
    mood: "帷幕之后 · 尚未说出的答案",
    art: priestessArt,
  },
  {
    id: "judgement",
    name: "审判",
    latin: "JUDGEMENT",
    code: "XX",
    numeral: "XX",
    accent: "#e8dcae",
    mood: "号角鸣响 · 一次性的总清算",
    art: judgementArt,
  },
  {
    id: "tower",
    name: "高塔",
    latin: "THE TOWER",
    code: "XVI",
    numeral: "XVI",
    accent: "#e2603f",
    mood: "崩解 · 旧秩序被一击掀翻",
    art: towerArt,
  },
];

export const ARCANA_BY_ID: Record<ArcanaId, ArcanaMeta> = ARCANA.reduce(
  (map, item) => {
    map[item.id] = item;
    return map;
  },
  {} as Record<ArcanaId, ArcanaMeta>,
);

export function getArcana(id: string): ArcanaMeta | undefined {
  return ARCANA_BY_ID[id as ArcanaId];
}

export function getArcanaAccent(id: string): string | undefined {
  return getArcana(id)?.accent;
}
