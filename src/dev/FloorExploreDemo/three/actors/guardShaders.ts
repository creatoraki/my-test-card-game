import * as THREE from "three";

// 黑影守卫的两套着色器: 身体(不受光的虚空 + 菲涅尔冷边 + 顶点蠕动)与脚下的烟雾粒子。

const voidVertex = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  varying vec3 vNormal;
  varying float vHeight;
  void main() {
    vec3 p = position;
    vec4 world = modelMatrix * vec4(p, 1.0);
    // 轮廓不稳定: 沿法线的低频蠕动, 越往下摆越强
    float wob = sin(world.y * 7.0 + uTime * 2.3 + uSeed) * sin(world.x * 5.0 - uTime * 1.7) * 0.018;
    wob += sin(world.y * 13.0 - uTime * 4.1 + uSeed * 3.0) * 0.006;
    float hem = smoothstep(0.7, 0.0, world.y);
    p += normal * wob * (1.0 + hem * 2.5);
    vHeight = world.y;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const voidFragment = /* glsl */ `
  uniform vec3 uRim;
  uniform float uRimPower;
  uniform float uTime;
  uniform float uSeed;
  varying vec3 vNormal;
  varying float vHeight;
  void main() {
    float facing = abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
    float rim = pow(1.0 - facing, uRimPower);
    float pulse = 0.75 + 0.25 * sin(uTime * 1.4 + uSeed);
    float fadeLow = smoothstep(0.0, 0.5, vHeight);
    vec3 core = vec3(0.004, 0.004, 0.007);
    vec3 col = core + uRim * rim * pulse * (0.4 + 0.6 * fadeLow);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createVoidMaterial(seed: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: voidVertex,
    fragmentShader: voidFragment,
    uniforms: {
      uTime: { value: 0 },
      uSeed: { value: seed },
      uRim: { value: new THREE.Color(0x4f6dff).multiplyScalar(1.6) },
      uRimPower: { value: 2.6 },
    },
  });
}

const smokeVertex = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  attribute float aSeed;
  varying float vAlpha;
  varying float vTint;
  void main() {
    float life = fract(uTime * (0.18 + aSeed * 0.12) + aSeed * 7.0);
    float a = aSeed * 43.0 + life * 1.5;
    float r = 0.12 + life * (0.35 + aSeed * 0.25);
    vec3 p = vec3(cos(a) * r, life * (0.6 + aSeed * 0.9), sin(a) * r);
    vAlpha = smoothstep(0.0, 0.15, life) * (1.0 - life);
    vTint = aSeed;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + p, 1.0);
    gl_PointSize = uSize * (0.5 + life * 1.3) * (0.7 + aSeed * 0.6);
  }
`;

const smokeFragment = /* glsl */ `
  uniform vec3 uGlow;
  varying float vAlpha;
  varying float vTint;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vAlpha * 0.55;
    vec3 col = mix(vec3(0.0), uGlow, step(0.8, vTint) * 0.6);
    gl_FragColor = vec4(col, a);
  }
`;

/** 从脚下不断升起、旋散的黑烟, 少量带一点冷色。 */
export function createSmoke(count: number, pixelRatio: number): THREE.Points {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i += 1) seeds[i] = Math.random();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  const material = new THREE.ShaderMaterial({
    vertexShader: smokeVertex,
    fragmentShader: smokeFragment,
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: 34 * pixelRatio },
      uGlow: { value: new THREE.Color(0x3a4cff) },
    },
    transparent: true,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 7;
  points.userData.fx = true;
  return points;
}
