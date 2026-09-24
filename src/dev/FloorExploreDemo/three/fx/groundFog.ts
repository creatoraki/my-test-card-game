import * as THREE from "three";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec2 vWorld;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uDensity;
  uniform float uSpeed;
  varying vec2 vUv;
  varying vec2 vWorld;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 4; i++) { v += noise(p) * a; p *= 2.03; a *= 0.5; }
    return v;
  }
  void main() {
    vec2 p = vWorld * 0.45;
    float n = fbm(p + vec2(uTime * 0.05, uTime * 0.03) * uSpeed);
    n = fbm(p + n * 1.6 - vec2(uTime * 0.02, 0.0) * uSpeed);
    vec2 edge = smoothstep(vec2(0.0), vec2(0.12), vUv) * smoothstep(vec2(0.0), vec2(0.12), 1.0 - vUv);
    float a = smoothstep(0.35, 0.85, n) * uDensity * edge.x * edge.y;
    gl_FragColor = vec4(uColor, a);
  }
`;

/** 贴地薄雾: 两层滚动的域扭曲噪声, 边缘淡出, 不写深度。 */
export function createGroundFog(width: number, depth: number, color: number, density: number): { group: THREE.Group; materials: THREE.ShaderMaterial[] } {
  const group = new THREE.Group();
  const materials: THREE.ShaderMaterial[] = [];
  const layers: [number, number, number][] = [[0.08, 1, 0.26], [0.32, 1.7, 0.14]];
  for (const [y, speed, strength] of layers) {
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uDensity: { value: density * strength },
        uSpeed: { value: speed },
      },
      transparent: true,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width + 1, depth + 1), material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(width / 2, y, depth / 2);
    mesh.renderOrder = 4;
    mesh.userData.fx = true;
    group.add(mesh);
    materials.push(material);
  }
  return { group, materials };
}
