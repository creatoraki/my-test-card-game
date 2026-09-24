import * as THREE from "three";
import type { Rng } from "../textures/canvasNoise";

export const DUST_LIGHTS = 6;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform vec4 uLights[${DUST_LIGHTS}];
  uniform vec3 uLightColors[${DUST_LIGHTS}];
  uniform vec3 uBase;
  uniform vec3 uBounds;
  attribute float aSeed;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float s = aSeed * 6.2831;
    p.x += sin(uTime * 0.13 + s) * 0.35 + sin(uTime * 0.37 + s * 2.0) * 0.08;
    p.z += cos(uTime * 0.11 + s * 1.3) * 0.35;
    p.y = mod(p.y + uTime * (0.015 + aSeed * 0.03), uBounds.y);
    vec3 glow = uBase;
    for (int i = 0; i < ${DUST_LIGHTS}; i++) {
      vec4 l = uLights[i];
      float d = distance(p, l.xyz);
      glow += uLightColors[i] * l.w * smoothstep(2.6, 0.0, d);
    }
    vColor = glow;
    vAlpha = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (0.8 + aSeed) + s * 3.0));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.45 + aSeed * 0.9);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d) * vAlpha;
    gl_FragColor = vec4(vColor * a, a);
  }
`;

export interface DustMotes {
  points: THREE.Points;
  material: THREE.ShaderMaterial;
  /** 登记会让浮尘发亮的光源位置(最多 DUST_LIGHTS 个)。 */
  setLight(index: number, position: THREE.Vector3, color: THREE.Color, strength: number): void;
}

/** 空气里缓慢漂浮的尘埃: 只有落在光源附近时才被照亮。 */
export function createDustMotes(width: number, depth: number, height: number, density: number, pixelRatio: number, rng: Rng): DustMotes {
  const count = Math.round(width * depth * 7 * density);
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = rng() * width;
    positions[i * 3 + 1] = rng() * height;
    positions[i * 3 + 2] = rng() * depth;
    seeds[i] = rng();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: 5 * pixelRatio },
      uLights: { value: Array.from({ length: DUST_LIGHTS }, () => new THREE.Vector4(0, -100, 0, 0)) },
      uLightColors: { value: Array.from({ length: DUST_LIGHTS }, () => new THREE.Color(0, 0, 0)) },
      uBase: { value: new THREE.Color(0.03, 0.035, 0.04) },
      uBounds: { value: new THREE.Vector3(width, height, depth) },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 6;
  points.userData.fx = true;
  return {
    points,
    material,
    setLight: (index, position, color, strength) => {
      if (index >= DUST_LIGHTS) return;
      (material.uniforms.uLights.value as THREE.Vector4[])[index].set(position.x, position.y, position.z, strength);
      (material.uniforms.uLightColors.value as THREE.Color[])[index].copy(color);
    },
  };
}
