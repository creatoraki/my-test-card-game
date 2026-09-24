import {
  clamp01, crack, createLayers, fbm, fillPixels, mix, mulberry32, smoothstep, stain, tileNoise, type SurfaceLayers,
} from "./canvasNoise";

const SIZE = 512;

/** 水磨石: 碎石子、铜分隔条、大片积垢与水渍。一张图覆盖 4m。 */
export function paintTerrazzo(seed = 11): SurfaceLayers {
  const layers = createLayers(SIZE);
  fillPixels(layers, (u, v, px) => {
    const mottled = fbm(u, v, 6, 4, seed);
    const grime = smoothstep(0.42, 0.82, fbm(u, v, 3, 5, seed + 3));
    const wet = smoothstep(0.6, 0.7, fbm(u, v, 4, 4, seed + 9));
    const chipA = tileNoise(u, v, 150, seed + 21);
    const chipB = tileNoise(u, v, 90, seed + 33);
    let r = 0.5 + (mottled - 0.5) * 0.12;
    let g = 0.48 + (mottled - 0.5) * 0.12;
    let b = 0.44 + (mottled - 0.5) * 0.1;
    if (chipA > 0.8) { const k = (chipA - 0.8) * 5; r = mix(r, 0.86, k); g = mix(g, 0.84, k); b = mix(b, 0.79, k); }
    if (chipB > 0.84) { const k = (chipB - 0.84) * 6; r = mix(r, 0.18, k); g = mix(g, 0.18, k); b = mix(b, 0.2, k); }
    if (chipA < 0.1) { const k = (0.1 - chipA) * 8; r = mix(r, 0.55, k); g = mix(g, 0.33, k); b = mix(b, 0.24, k); }
    const dark = 1 - grime * 0.42 - wet * 0.12;
    px.r = r * dark;
    px.g = g * dark;
    px.b = b * dark;
    px.rough = mix(0.46, 0.8, grime) * (1 - wet * 0.72) + 0.02;
    px.height = 0.5 + (mottled - 0.5) * 0.3 - grime * 0.1;
  });
  const rng = mulberry32(seed);
  // 铜分隔条, 每米一道
  const { cc, rc, hc } = layers;
  for (let i = 0; i < 4; i += 1) {
    const p = (i * SIZE) / 4;
    cc.fillStyle = "rgba(150,112,62,0.55)";
    cc.fillRect(p, 0, 2, SIZE); cc.fillRect(0, p, SIZE, 2);
    rc.fillStyle = "rgb(90,90,90)";
    rc.fillRect(p, 0, 2, SIZE); rc.fillRect(0, p, SIZE, 2);
    hc.fillStyle = "rgb(170,170,170)";
    hc.fillRect(p, 0, 2, SIZE); hc.fillRect(0, p, SIZE, 2);
  }
  for (let i = 0; i < 7; i += 1) {
    stain(layers, rng, rng() * SIZE, rng() * SIZE, 30 + rng() * 60, { color: "rgba(34,26,18,1)", alpha: 0.18, rough: 0.2, roughAlpha: 0.25 });
  }
  for (let i = 0; i < 6; i += 1) crack(layers, rng, rng() * SIZE, rng() * SIZE, 60 + rng() * 110, 1.2);
  return layers;
}

/** 办公地毯: 0.5m 方块地毯, 拼接方向交替, 大片水渍与踩踏磨损。一张图覆盖 2m。 */
export function paintCarpet(seed = 23): SurfaceLayers {
  const layers = createLayers(SIZE);
  const tiles = 4;
  fillPixels(layers, (u, v, px) => {
    const tx = Math.floor(u * tiles);
    const ty = Math.floor(v * tiles);
    const tint = tileNoise(tx / tiles, ty / tiles, tiles, seed + 5) - 0.5;
    const rotated = (tx + ty) % 2 === 0;
    const fiberDir = rotated ? u : v;
    const pile = Math.sin(fiberDir * SIZE * 1.6) * 0.5 + 0.5;
    const fiber = tileNoise(u, v, 256, seed + 7) * 0.6 + pile * 0.4;
    const grime = smoothstep(0.45, 0.85, fbm(u, v, 3, 5, seed + 11));
    const worn = smoothstep(0.55, 0.75, fbm(u, v, 2, 3, seed + 13));
    const edge = Math.min(u * tiles - tx, v * tiles - ty, tx + 1 - u * tiles, ty + 1 - v * tiles);
    const seam = edge < 0.012 ? 0.55 : 1;
    const base = 0.8 + fiber * 0.28 + tint * 0.14;
    const dark = (1 - grime * 0.45) * seam * (1 + worn * 0.18);
    px.r = 0.2 * base * dark;
    px.g = 0.235 * base * dark;
    px.b = 0.27 * base * dark;
    px.rough = 0.93 + fiber * 0.05;
    px.height = clamp01(0.45 + fiber * 0.35 - grime * 0.1) * seam;
  });
  const rng = mulberry32(seed);
  for (let i = 0; i < 6; i += 1) {
    const x = rng() * SIZE;
    const y = rng() * SIZE;
    const r = 40 + rng() * 70;
    stain(layers, rng, x, y, r, { color: "rgba(40,30,18,1)", alpha: 0.28, rough: 0.8, roughAlpha: 0.2 });
    // 水渍干涸后的深色边缘环
    const { cc } = layers;
    cc.strokeStyle = "rgba(30,22,14,0.25)";
    cc.lineWidth = 3;
    cc.beginPath(); cc.ellipse(x, y, r * 0.8, r * 0.6, rng() * Math.PI, 0, Math.PI * 2); cc.stroke();
  }
  return layers;
}

/** 茶水间瓷砖: 0.3m 方砖、脏污的砖缝、个别碎裂与缺失。一张图覆盖 1.2m。 */
export function paintTile(seed = 37): SurfaceLayers {
  const layers = createLayers(SIZE);
  const tiles = 4;
  fillPixels(layers, (u, v, px) => {
    const tx = Math.floor(u * tiles);
    const ty = Math.floor(v * tiles);
    const lu = u * tiles - tx;
    const lv = v * tiles - ty;
    const edge = Math.min(lu, lv, 1 - lu, 1 - lv);
    const grout = edge < 0.022;
    const bevel = smoothstep(0.022, 0.06, edge);
    const id = tileNoise(tx / tiles, ty / tiles, tiles, seed);
    const missing = id < 0.07;
    const dirt = smoothstep(0.4, 0.85, fbm(u, v, 3, 4, seed + 3));
    const speck = tileNoise(u, v, 200, seed + 8);
    if (grout || missing) {
      const g = missing ? 0.26 + speck * 0.06 : 0.2 + speck * 0.05;
      px.r = g * (1 - dirt * 0.3); px.g = g * 0.96 * (1 - dirt * 0.3); px.b = g * 0.9 * (1 - dirt * 0.3);
      px.rough = 0.92;
      px.height = missing ? 0.2 + speck * 0.1 : 0.15;
      return;
    }
    const tint = (id - 0.5) * 0.06;
    const base = 0.7 + tint + (speck - 0.5) * 0.03;
    const dark = 1 - dirt * 0.32 - (1 - bevel) * 0.08;
    px.r = base * dark;
    px.g = (base + 0.01) * dark;
    px.b = (base - 0.03) * dark;
    px.rough = mix(0.16, 0.55, dirt) + (1 - bevel) * 0.1;
    px.height = 0.55 + bevel * 0.3;
  });
  const rng = mulberry32(seed);
  for (let i = 0; i < 5; i += 1) crack(layers, rng, rng() * SIZE, rng() * SIZE, 40 + rng() * 60, 1);
  for (let i = 0; i < 5; i += 1) {
    stain(layers, rng, rng() * SIZE, rng() * SIZE, 25 + rng() * 45, { color: "rgba(60,44,20,1)", alpha: 0.2, rough: 0.1, roughAlpha: 0.3 });
  }
  return layers;
}

/** 素混凝土: 斑驳、气孔、裂缝。bright 用于剖切面的浅色断面。一张图覆盖 3m。 */
export function paintConcrete(seed = 51, bright = 0): SurfaceLayers {
  const layers = createLayers(SIZE);
  fillPixels(layers, (u, v, px) => {
    const mottled = fbm(u, v, 5, 5, seed);
    const pores = tileNoise(u, v, 220, seed + 4);
    const aggregate = tileNoise(u, v, 120, seed + 6);
    const grime = smoothstep(0.5, 0.85, fbm(u, v, 3, 4, seed + 9));
    const wet = smoothstep(0.64, 0.72, fbm(u, v, 3, 4, seed + 15));
    let g = 0.4 + bright + (mottled - 0.5) * 0.16;
    if (aggregate > 0.82) g += (aggregate - 0.82) * 0.6;
    if (pores > 0.9) g *= 0.55;
    g *= 1 - grime * 0.35 - wet * 0.15;
    px.r = g * 1.02;
    px.g = g;
    px.b = g * 0.95;
    px.rough = 0.88 - wet * 0.6;
    px.height = 0.5 + (mottled - 0.5) * 0.4 - (pores > 0.9 ? 0.3 : 0);
  });
  const rng = mulberry32(seed);
  if (!bright) {
    for (let i = 0; i < 6; i += 1) crack(layers, rng, rng() * SIZE, rng() * SIZE, 70 + rng() * 120, 1.4);
    for (let i = 0; i < 6; i += 1) {
      stain(layers, rng, rng() * SIZE, rng() * SIZE, 35 + rng() * 60, { color: "rgba(24,20,16,1)", alpha: 0.22, rough: 0.25, roughAlpha: 0.3 });
    }
  }
  return layers;
}
