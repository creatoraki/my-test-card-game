export const LUNA_TIMELINE = {
  telegraph: 0,
  draw: 240,
  contact: 640,
  impact: 820,
  afterglow: 980,
  total: 1320,
} as const;

export type LunaTone = "amber" | "vermilion" | "ivory";

export interface LunaArcSlash {
  angle: number;
  tone: Exclude<LunaTone, "ivory">;
  at: number;
}

export const LUNA_SLASH: LunaArcSlash = {
  angle: -28,
  tone: "amber",
  at: LUNA_TIMELINE.draw,
};

export interface LunaSpark {
  along: number;
  dx: number;
  dy: number;
  size: number;
  rotate: number;
  delay: number;
}

export const SPARKS: readonly LunaSpark[] = Array.from({ length: 18 }, (_, index) => {
    const along = -290 + index * 84;
    const direction = index % 3 === 0 ? -1 : 1;
    return {
      along,
      dx: direction * (20 + (index % 4) * 16),
      dy: -44 + (index % 5) * 22,
      size: 4 + (index % 3),
      rotate: -32 + (index % 5) * 18,
      delay: index * 14,
    };
  });

export interface LunaEmber {
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  rotate: number;
  tone: LunaTone;
  delay: number;
}

const EMBER_TONES: readonly LunaTone[] = [
  "amber",
  "amber",
  "vermilion",
  "ivory",
];

export const EMBERS: readonly LunaEmber[] = Array.from({ length: 16 }, (_, index) => {
  const angle = (index / 16) * Math.PI * 2;
  const distance = 38 + (index % 5) * 16;
  const size = 5 + (index % 4) * 2;
  return {
    x: Math.round(Math.cos(angle) * distance * 0.52),
    y: Math.round(Math.sin(angle) * distance * 0.28),
    dx: Math.round(Math.cos(angle) * (74 + (index % 4) * 24)),
    dy: Math.round(Math.sin(angle) * (54 + (index % 3) * 18)),
    size,
    rotate: (index * 37) % 180,
    tone: EMBER_TONES[index % EMBER_TONES.length]!,
    delay: (index % 9) * 14,
  };
});