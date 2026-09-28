import * as THREE from "three";
import { worldY } from "../../data/layout";
import type { PropSpec } from "./propFactory";

/**
 * 探险者遗骸: 裹着破斗篷蜷坐的残骸、破背包、熄灭的提灯。
 * 调查: 提灯亮起(0~0.3) → 残骸从边缘溶解成尘(0.3~0.8) → 露出悬浮的遗物光点(0.7~1)。
 */
const REMAINS_GLSL = /* glsl */ `
float bodySdf(vec2 p) {
  // 兜帽 + 佝偻的背 + 蜷起的膝盖 + 垂下的头
  float hood = sdEllipse(rot2(-0.25) * (p - vec2(-8.0, 62.0)), vec2(34.0, 46.0));
  float back = sdEllipse(p - vec2(-18.0, 34.0), vec2(34.0, 32.0));
  float knees = sdEllipse(p - vec2(26.0, 34.0), vec2(24.0, 18.0));
  float shin = sdSegment(p, vec2(34.0, 30.0), vec2(40.0, 6.0)) - 8.0;
  float d = smin(smin(hood, back, 12.0), smin(knees, shin, 8.0), 10.0);
  // 斗篷破边
  d += (fbm3(p * 0.09) - 0.5) * 7.0 * (1.0 - smoothstep(0.0, 20.0, p.y));
  return d;
}

float packSdf(vec2 p) {
  float pack = sdRoundBox(p - vec2(-62.0, 22.0), vec2(20.0, 22.0), 5.0);
  float roll = sdRoundBox(p - vec2(-62.0, 48.0), vec2(22.0, 7.0), 6.0);
  return min(pack, roll);
}

float lanternSdf(vec2 p) {
  vec2 q = p - vec2(58.0, 0.0);
  float base = sdRoundBox(q - vec2(0.0, 3.0), vec2(10.0, 3.0), 1.0);
  float glass = sdRoundBox(q - vec2(0.0, 17.0), vec2(8.0, 11.0), 3.0);
  float cap = sdTrapezoid(q - vec2(0.0, 32.0), 10.0, 5.0, 4.0);
  float ring = abs(length(q - vec2(0.0, 40.0)) - 5.0) - 1.3;
  return min(min(base, glass), min(cap, ring));
}

float dissolveN(vec2 p) {
  return fbm(p * 0.05 + uPSeed);
}

float bodyGone() {
  return smoothstep(0.3, 0.8, uAnim);
}

float propSdf(vec2 p) {
  float th = bodyGone() * 1.2 - 0.1;
  float body = bodySdf(p) + step(dissolveN(p), th) * 60.0;
  return min(min(body, packSdf(p)), lanternSdf(p));
}

vec4 propShade(vec2 p, out vec3 n, out vec3 emit, out float gloss) {
  n = vec3(0.0, 0.0, 1.0);
  emit = vec3(0.0);
  gloss = 0.1;
  float t = uTime;
  float lamp = smoothstep(0.0, 0.3, uAnim);
  float flame = lamp * (0.85 + 0.15 * vnoise(vec2(t * 9.0, uPSeed)));
  vec3 warm = vec3(1.0, 0.62, 0.26);

  // 遗物光点: 胸口位置浮起
  float relicK = smoothstep(0.66, 0.95, uAnim) * (1.0 - uSearched);
  vec2 rp = p - vec2(4.0, 50.0 + relicK * 26.0 + sin(t * 2.0) * 3.0);
  float rd = length(rp * vec2(1.0, 0.7));
  vec3 cyan = vec3(0.4, 0.9, 1.0);
  emit += cyan * (exp(-rd / 4.0) * 3.0 + exp(-rd / 22.0) * 0.5) * relicK;
  float spark = exp(-abs(rp.x) / 1.2) * exp(-abs(rp.y) / 14.0) + exp(-abs(rp.y) / 1.2) * exp(-abs(rp.x) / 14.0);
  emit += cyan * spark * relicK * 0.8 * (0.7 + 0.3 * sin(t * 6.0));

  // 提灯光晕(地面与周围)
  vec2 lq = p - vec2(58.0, 17.0);
  emit += warm * exp(-length(lq * vec2(1.0, 1.4)) / 36.0) * flame * 0.45;

  float lan = lanternSdf(p);
  if (lan < 0.0) {
    vec2 q = p - vec2(58.0, 0.0);
    float glass = sdRoundBox(q - vec2(0.0, 17.0), vec2(8.0, 11.0), 3.0);
    float bars = fillAA(abs(q.x) - 1.0) + fillAA(abs(abs(q.x) - 6.0) - 1.0);
    vec3 col = vec3(0.18, 0.15, 0.12);
    if (glass < 0.0) {
      vec3 soot = vec3(0.06, 0.055, 0.05);
      float fl = exp(-length((q - vec2(0.0, 14.0)) * vec2(1.3, 0.8)) / 4.0);
      col = mix(soot, vec3(0.9, 0.7, 0.4), lamp * 0.6);
      emit += warm * (fl * 3.0 + 0.6) * flame * (1.0 - clamp(bars, 0.0, 1.0) * 0.7);
      gloss = 0.8;
    }
    col = mix(col, vec3(0.12, 0.1, 0.08), clamp(bars, 0.0, 1.0) * step(glass, 0.0));
    n = bumpWall(bevelH(lan, 2.0) * 2.0, 1.0);
    return vec4(col, 1.0);
  }

  float pk = packSdf(p);
  if (pk < 0.0) {
    vec3 canvas = weather(vec3(0.24, 0.22, 0.14), p * 2.0, 1.2, 0.0, clamp(-pk / 8.0, 0.0, 1.0), uPSeed + 2.0);
    float strap = fillAA(abs(p.x + 62.0) - 3.0) * step(p.y, 44.0);
    float buckle = fillAA(sdBox(p - vec2(-62.0, 26.0), vec2(4.0, 3.0)));
    float tear = smoothstep(0.62, 0.7, fbm3(p * 0.12 + 5.0));
    vec3 col = mix(canvas, vec3(0.1, 0.08, 0.06), strap);
    col = mix(col, vec3(0.45, 0.4, 0.3), buckle);
    col = mix(col, vec3(0.02), tear);
    n = bumpWall(bevelH(pk, 6.0) * 5.0 + strap * 1.5 - tear * 2.0, 1.0);
    return vec4(col, 1.0);
  }

  float bd = bodySdf(p);
  if (bd < 0.0) {
    float dn = dissolveN(p);
    float th = bodyGone() * 1.2 - 0.1;
    if (dn < th) return vec4(0.0);
    float ember = 1.0 - smoothstep(0.0, 0.05, dn - th);
    ember *= step(0.001, bodyGone()) * (1.0 - step(0.999, bodyGone()));
    // 斗篷 + 露出的骨白(头骨、手骨)
    vec3 cloak = weather(vec3(0.16, 0.13, 0.12), p * 1.5, 1.4, 0.0, clamp(-bd / 12.0, 0.0, 1.0), uPSeed);
    float fold = fbm3(vec2(p.x * 0.06, p.y * 0.02));
    cloak *= 0.7 + fold * 0.6;
    float skull = sdEllipse(p - vec2(8.0, 76.0), vec2(11.0, 12.0));
    float socket = min(length(p - vec2(13.0, 77.0)) - 2.6, length(p - vec2(5.0, 77.0)) - 2.4);
    float hand = min(sdSegment(p, vec2(8.0, 44.0), vec2(30.0, 46.0)), sdSegment(p, vec2(30.0, 46.0), vec2(40.0, 40.0))) - 2.6;
    float fingers = min(sdSegment(p, vec2(40.0, 40.0), vec2(46.0, 36.0)), sdSegment(p, vec2(40.0, 40.0), vec2(45.0, 42.0))) - 1.1;
    float bone = fillAA(min(min(skull, hand), fingers));
    vec3 bc = vec3(0.55, 0.5, 0.42) * (0.8 + 0.3 * fbm3(p * 0.3));
    vec3 col = mix(cloak, bc, bone);
    col = mix(col, vec3(0.02), fillAA(socket) * fillAA(skull));
    float h = bevelH(bd, 10.0) * 6.0 + fold * 3.0 + bone * 2.0;
    n = bumpWall(h, 1.0);
    emit += vec3(1.0, 0.5, 0.2) * ember * 2.5;
    return vec4(col, 1.0);
  }
  return vec4(0.0);
}
`;

export const REMAINS_SPEC: PropSpec = {
  bounds: { w: 260, h: 190, x0: -130, y0: -40 },
  glsl: REMAINS_GLSL,
  shadow: [86, 20],
  promptH: 150,
  choreo: (view, ctx, prev, cur) => {
    const { def } = view;
    const flip = def.flip ? -1 : 1;
    const warm = new THREE.Color(1, 0.6, 0.26);
    if (!view.light && cur > 0.02) view.light = ctx.lights.addDynamic({ x: def.x + 58 * flip, h: 26, z: def.z + 10, color: warm, intensity: 0, radius: 380 });
    if (view.light) view.light.intensity = Math.min(1, cur / 0.3) * 1.3;
    const y = worldY(def.z);
    // 残骸溶解期间持续飘出尘埃与余烬
    for (const mark of [0.36, 0.46, 0.56, 0.66, 0.76]) {
      if (prev < mark && cur >= mark) {
        ctx.fx.spawn("dust", def.x, y + 40 + (mark - 0.36) * 60, 12, y - 4);
        ctx.fx.spawn("ember", def.x, y + 50, 8, y - 4);
      }
    }
    if (prev < 0.9 && cur >= 0.9) ctx.fx.spawn("glint", def.x + 4 * flip, y + 76, 20, y - 6, new THREE.Color(0.4, 0.9, 1));
  },
};
