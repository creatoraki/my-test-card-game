import { crack, createLayers, fbm, fillPixels, mix, mulberry32, smoothstep, stain, tileNoise, type SurfaceLayers } from "./canvasNoise";

const SIZE = 512;
/** 墙面贴图覆盖 3m×3m, 画布顶端对应墙顶。 */
const WALL_METERS = 3;
const DADO = 0.95 / WALL_METERS;

/**
 * 墙面: 上半截浅色乳胶漆(材质颜色再染房间主色), 下半截深色护墙漆;
 * 从顶部渗下的水痕、大块剥落露出的抹灰、贴地的霉斑。
 */
export function paintWall(seed = 71): SurfaceLayers {
  const layers = createLayers(SIZE);
  fillPixels(layers, (u, v, px) => {
    const up = 1 - v; // 0 = 地面, 1 = 墙顶
    const lower = up < DADO;
    const mottled = fbm(u, v, 4, 4, seed);
    const streak = smoothstep(0.5, 0.9, tileNoise(u, v * 0.08, 40, seed + 3) * 0.7 + tileNoise(u, v * 0.2, 90, seed + 4) * 0.3);
    const streakFade = smoothstep(0.15, 0.95, up);
    const peelField = fbm(u, v, 5, 5, seed + 7);
    const peel = peelField > 0.64;
    const peelRim = peelField > 0.615 && !peel;
    const moldField = fbm(u, v, 12, 4, seed + 11);
    const mold = smoothstep(0.52, 0.72, moldField) * smoothstep(0.34, 0.02, up);
    const floorGrime = smoothstep(0.08, 0, up);

    let r: number; let g: number; let b: number; let rough: number; let height: number;
    if (peel) {
      const plaster = 0.5 + (tileNoise(u, v, 160, seed + 13) - 0.5) * 0.12;
      r = plaster * 1.02; g = plaster * 0.97; b = plaster * 0.88;
      rough = 0.95;
      height = 0.3;
    } else if (lower) {
      r = 0.36; g = 0.4; b = 0.4;
      rough = 0.55;
      height = 0.6;
    } else {
      r = 0.86; g = 0.85; b = 0.81;
      rough = 0.78;
      height = 0.62;
    }
    if (peelRim) { r = mix(r, 0.95, 0.4); g = mix(g, 0.93, 0.4); b = mix(b, 0.88, 0.4); height = 0.75; }
    const vary = 1 + (mottled - 0.5) * 0.14;
    const streakDark = 1 - streak * streakFade * 0.32;
    const moldDark = 1 - mold * 0.8;
    const grime = 1 - floorGrime * 0.45;
    r *= vary * streakDark * moldDark * grime;
    g *= vary * streakDark * moldDark * grime * (1 + mold * 0.08);
    b *= vary * streakDark * moldDark * grime * (1 - streak * streakFade * 0.12);
    px.r = r; px.g = g; px.b = b;
    px.rough = rough - streak * streakFade * 0.3;
    px.height = height + (mottled - 0.5) * 0.1;
  });
  const { cc, hc, rc } = layers;
  // 护墙线
  const railY = SIZE * (1 - DADO);
  cc.fillStyle = "rgba(30,34,34,0.8)"; cc.fillRect(0, railY - 3, SIZE, 6);
  hc.fillStyle = "rgb(220,220,220)"; hc.fillRect(0, railY - 3, SIZE, 6);
  rc.fillStyle = "rgb(110,110,110)"; rc.fillRect(0, railY - 3, SIZE, 6);
  const rng = mulberry32(seed);
  for (let i = 0; i < 4; i += 1) crack(layers, rng, rng() * SIZE, rng() * SIZE * 0.5, 80 + rng() * 120, 1.2);
  for (let i = 0; i < 4; i += 1) {
    stain(layers, rng, rng() * SIZE, SIZE * (0.75 + rng() * 0.2), 30 + rng() * 40, { color: "rgba(20,24,16,1)", alpha: 0.25, rough: 0.5, roughAlpha: 0.2 });
  }
  return layers;
}

/** 喷漆钢板: 划痕、锈斑、磕碰。颜色偏中性, 由材质颜色染色。一张图覆盖 1m。 */
export function paintMetal(seed = 91): SurfaceLayers {
  const layers = createLayers(SIZE);
  fillPixels(layers, (u, v, px) => {
    const mottled = fbm(u, v, 6, 4, seed);
    const rustField = fbm(u, v, 5, 5, seed + 3);
    const rust = smoothstep(0.64, 0.74, rustField);
    const grime = smoothstep(0.45, 0.8, fbm(u, v, 3, 4, seed + 5));
    const paint = 0.78 + (mottled - 0.5) * 0.08;
    const dark = 1 - grime * 0.3;
    px.r = mix(paint * dark, 0.4, rust);
    px.g = mix(paint * dark, 0.2, rust);
    px.b = mix(paint * dark, 0.11, rust);
    px.rough = mix(0.42 + grime * 0.2, 0.92, rust);
    px.height = 0.55 + rust * 0.2 * tileNoise(u, v, 160, seed + 9) + (mottled - 0.5) * 0.08;
  });
  const rng = mulberry32(seed);
  const { cc, rc, hc } = layers;
  for (let i = 0; i < 140; i += 1) {
    const x = rng() * SIZE;
    const y = rng() * SIZE;
    const len = 6 + rng() * 40;
    const angle = rng() * Math.PI;
    const light = rng() > 0.4;
    cc.strokeStyle = light ? "rgba(235,232,225,0.45)" : "rgba(40,32,26,0.4)";
    cc.lineWidth = 0.6 + rng() * 0.8;
    cc.beginPath(); cc.moveTo(x, y); cc.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len); cc.stroke();
    rc.strokeStyle = "rgba(60,60,60,0.6)";
    rc.lineWidth = 1;
    rc.beginPath(); rc.moveTo(x, y); rc.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len); rc.stroke();
    hc.strokeStyle = "rgba(0,0,0,0.35)";
    hc.lineWidth = 1;
    hc.beginPath(); hc.moveTo(x, y); hc.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len); hc.stroke();
  }
  return layers;
}
