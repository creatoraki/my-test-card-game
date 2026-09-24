import * as THREE from "three";

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying float vT;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vT = 1.0 - uv.y;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uTime;
  varying vec3 vNormal;
  varying float vT;
  varying vec2 vUv;
  void main() {
    // 正交镜头的视线恒为 (0,0,1): 面向镜头的中心更厚, 侧缘淡出。
    float facing = abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
    float edge = pow(facing, 1.8);
    float along = smoothstep(0.0, 0.18, vT) * pow(1.0 - vT, 1.1);
    float streak = 0.75 + 0.25 * sin(vUv.x * 40.0 + uTime * 0.6) * sin(vUv.x * 17.0 - uTime * 0.4);
    float a = edge * along * streak * uIntensity;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

export interface LightShaft {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  setIntensity(value: number): void;
}

/** 假体积光锥: 顶点在 from, 张开到 to 处半径 radius。加法混合, 不写深度, 被墙体自然遮挡。 */
export function createLightShaft(from: THREE.Vector3, to: THREE.Vector3, apexRadius: number, radius: number, color: number, strength: number): LightShaft {
  const dir = to.clone().sub(from);
  const len = dir.length();
  const geometry = new THREE.CylinderGeometry(apexRadius, radius, len, 32, 1, true);
  geometry.translate(0, -len / 2, 0);
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: strength },
      uTime: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(from);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize());
  mesh.renderOrder = 5;
  mesh.userData.fx = true;
  return {
    mesh,
    material,
    setIntensity: (value) => { material.uniforms.uIntensity.value = strength * value; },
  };
}
