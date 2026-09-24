// 最终调色(在 OutputPass 之后, 作用于 sRGB): 轻微色差、冷青色暗部、去饱和、对比度、暗角、胶片颗粒。

export const GradeShader = {
  name: "FloorGradeShader",
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uResolution: { value: [1920, 1080] },
    uVignette: { value: 0.62 },
    uGrain: { value: 0.045 },
    uAberration: { value: 0.0016 },
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
    uniform vec2 uResolution;
    uniform float uVignette;
    uniform float uGrain;
    uniform float uAberration;
    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

    void main() {
      vec2 c = vUv - 0.5;
      float r2 = dot(c, c);
      vec2 shift = c * r2 * uAberration * 18.0;
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + shift).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - shift).b;

      float luma = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(luma), col, 0.86);
      // 暗部偏冷青, 高光保持中性偏暖
      vec3 shadowTint = vec3(0.012, 0.03, 0.04);
      col += shadowTint * (1.0 - smoothstep(0.0, 0.45, luma));
      col = (col - 0.5) * 1.06 + 0.5;

      float vig = smoothstep(0.85, 0.18, length(c * vec2(1.0, 0.82)));
      col *= mix(1.0 - uVignette, 1.0, vig);

      float g = hash(vUv * uResolution + fract(uTime * 13.7) * 91.0) - 0.5;
      col += g * uGrain * (0.6 + 0.4 * (1.0 - luma));
      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }
  `,
};
