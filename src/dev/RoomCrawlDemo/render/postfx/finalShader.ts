import * as THREE from "three";

// 最终合成(一个全屏 pass 完成原来的 OutputPass + 调色 + 虹膜转场):
// 虹膜扭曲 → 色差采样(HDR) → ACES 色调映射 + sRGB 编码 → 区域色偏 → 冷青暗部 → 对比 →
// 冲击压红 → 暗角 → 颗粒 → 虹膜黑幕与能量光圈。
// ACES 与 sRGB 函数照抄 three r185 的 tonemapping / colorspace chunk, 改名避免与内置定义冲突。

export const FinalShader = {
  name: "CrawlFinalShader",
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uExposure: { value: 1.05 },
    uResolution: { value: new THREE.Vector2(1920, 1080) },
    uTint: { value: new THREE.Color(1, 1, 1) },
    uShadowTint: { value: new THREE.Color(0.012, 0.03, 0.04) },
    uVignette: { value: 0.58 },
    uSaturation: { value: 0.9 },
    uGrain: { value: 0.04 },
    uAberration: { value: 0.0014 },
    uImpact: { value: 0 },
    uIris: { value: 1 },
    uCenter: { value: new THREE.Vector2(0.5, 0.5) },
    uAspect: { value: 1920 / 1080 },
    uGlow: { value: new THREE.Color(0.35, 0.95, 1.0) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uExposure;
    uniform vec2 uResolution;
    uniform vec3 uTint;
    uniform vec3 uShadowTint;
    uniform float uVignette;
    uniform float uSaturation;
    uniform float uGrain;
    uniform float uAberration;
    uniform float uImpact;
    uniform float uIris;
    uniform vec2 uCenter;
    uniform float uAspect;
    uniform vec3 uGlow;
    varying vec2 vUv;

    float grainHash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    float irisHash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
    float angNoise(float a) {
      float i = floor(a);
      float f = fract(a);
      return mix(irisHash(vec2(i, 3.1)), irisHash(vec2(i + 1.0, 3.1)), f * f * (3.0 - 2.0 * f));
    }

    vec3 acesFit(vec3 v) {
      vec3 a = v * (v + 0.0245786) - 0.000090537;
      vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
      return a / b;
    }

    vec3 acesTone(vec3 color) {
      const mat3 inMat = mat3(
        vec3(0.59719, 0.07600, 0.02840),
        vec3(0.35458, 0.90834, 0.13383),
        vec3(0.04823, 0.01566, 0.83777)
      );
      const mat3 outMat = mat3(
        vec3(1.60475, -0.10208, -0.00327),
        vec3(-0.53108, 1.10813, -0.07276),
        vec3(-0.07367, -0.00605, 1.07602)
      );
      color *= uExposure / 0.6;
      color = inMat * color;
      color = acesFit(color);
      color = outMat * color;
      return clamp(color, 0.0, 1.0);
    }

    vec3 toSrgb(vec3 c) {
      return mix(pow(c, vec3(0.41666)) * 1.055 - vec3(0.055), c * 12.92, vec3(lessThanEqual(c, vec3(0.0031308))));
    }

    void main() {
      // 虹膜: 仅在转场期间计算锯齿边与向内吸的扭曲
      vec2 uv = vUv;
      float inside = 1.0;
      float ring = 0.0;
      if (uIris < 0.999) {
        vec2 d = (vUv - uCenter) * vec2(uAspect, 1.0);
        float r = length(d);
        float ang = atan(d.y, d.x);
        float jag = (angNoise(ang * 5.0 + uTime * 3.0) - 0.5) * 0.05 + (angNoise(ang * 17.0 - uTime * 5.0) - 0.5) * 0.018;
        float radius = uIris * 1.25 + jag * smoothstep(0.0, 0.15, uIris) * (1.0 - smoothstep(0.85, 1.0, uIris));
        float edge = radius - r;
        vec2 warp = normalize(d + 1e-4) * smoothstep(0.08, 0.0, abs(edge)) * 0.012;
        uv -= warp / vec2(uAspect, 1.0);
        inside = smoothstep(-0.004, 0.004, edge);
        ring = exp(-abs(edge) * 70.0) * step(0.001, uIris) * (1.0 - smoothstep(0.9, 1.0, uIris));
      }

      vec2 c = uv - 0.5;
      float r2 = dot(c, c);
      float ab = uAberration * (1.0 + uImpact * 7.0);
      vec2 shift = c * r2 * ab * 18.0 + vec2(uImpact * 0.004 * sin(uTime * 60.0), 0.0);
      vec3 hdr;
      hdr.r = texture2D(tDiffuse, uv + shift).r;
      hdr.g = texture2D(tDiffuse, uv).g;
      hdr.b = texture2D(tDiffuse, uv - shift).b;
      vec3 col = toSrgb(acesTone(hdr));

      float l = dot(col, vec3(0.299, 0.587, 0.114));
      col *= uTint;
      col = mix(vec3(l), col, uSaturation);
      col += uShadowTint * (1.0 - smoothstep(0.0, 0.42, l));
      col = (col - 0.5) * 1.07 + 0.5;

      // 冲击: 去饱和并压成暗红
      vec3 hurt = vec3(l * 1.25, l * 0.32, l * 0.3);
      col = mix(col, hurt, uImpact * 0.55);

      float vigAmt = uVignette + uImpact * 0.3;
      float vig = smoothstep(0.86, 0.16, length(c * vec2(1.0, 0.84)));
      col *= mix(1.0 - vigAmt, 1.0, vig);

      float g = grainHash(vUv * uResolution + fract(uTime * 13.7) * 91.0) - 0.5;
      col += g * uGrain * (0.6 + 0.4 * (1.0 - l));
      col = max(col, 0.0);

      col = col * inside + uGlow * ring * 1.4;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};
