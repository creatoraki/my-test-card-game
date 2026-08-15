import {
  AdditiveBlending,
  BufferGeometry,
  CubicBezierCurve3,
  CylinderGeometry,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { legacyColor } from "./lanternColorSpace";
import { MATERIAL_HEX } from "./lanternConstants";

export interface LanternBody {
  group: Group;
  innerGlow: Mesh<SphereGeometry, MeshBasicMaterial>;
  glassMaterial: MeshPhysicalMaterial;
  geometries: BufferGeometry[];
  materials: Material[];
}

export function createLanternBody(): LanternBody {
  const group = new Group();
  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];

  const glassMaterial = new MeshPhysicalMaterial({
    color: legacyColor(MATERIAL_HEX.glass),
    transparent: true,
    opacity: 0.25,
    roughness: 0.12,
    metalness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    reflectivity: 0.5,
    ior: 1.5,
  });
  materials.push(glassMaterial);

  const glassGeometry = new SphereGeometry(1.1, 48, 48);
  const glass = new Mesh(glassGeometry, glassMaterial);
  glass.scale.set(0.95, 0.9, 0.95);
  glass.castShadow = true;
  glass.receiveShadow = true;
  group.add(glass);
  geometries.push(glassGeometry);

  const innerMaterial = new MeshBasicMaterial({
    color: legacyColor(MATERIAL_HEX.glass),
    transparent: true,
    opacity: 0.55,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const innerGeometry = new SphereGeometry(0.75, 32, 32);
  const innerGlow = new Mesh(innerGeometry, innerMaterial);
  innerGlow.name = "innerGlow";
  innerGlow.renderOrder = 1;
  group.add(innerGlow);
  geometries.push(innerGeometry);
  materials.push(innerMaterial);

  const ringMaterial = new MeshStandardMaterial({
    color: legacyColor(MATERIAL_HEX.ring),
    metalness: 0.8,
    roughness: 0.3,
  });
  const darkMaterial = new MeshStandardMaterial({
    color: legacyColor(MATERIAL_HEX.dark),
    metalness: 0.9,
    roughness: 0.4,
  });
  const brightMaterial = new MeshStandardMaterial({
    color: legacyColor(MATERIAL_HEX.bright),
    metalness: 0.85,
    roughness: 0.35,
    emissive: legacyColor(0x111111),
  });
  const handleMaterial = new MeshStandardMaterial({
    color: legacyColor(MATERIAL_HEX.handle),
    metalness: 0.7,
    roughness: 0.4,
  });
  const jointMaterial = new MeshStandardMaterial({
    color: legacyColor(MATERIAL_HEX.joint),
    metalness: 0.9,
    roughness: 0.3,
  });
  materials.push(ringMaterial, darkMaterial, brightMaterial, handleMaterial, jointMaterial);

  const addMesh = <TGeometry extends BufferGeometry>(
    geometry: TGeometry,
    material: Material,
    position?: Vector3,
    rotation?: Vector3,
  ) => {
    const mesh = new Mesh(geometry, material);
    if (position) mesh.position.copy(position);
    if (rotation) mesh.rotation.set(rotation.x, rotation.y, rotation.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    geometries.push(geometry);
    return mesh;
  };

  addMesh(
    new TorusGeometry(1.02, 0.07, 16, 64),
    ringMaterial,
    new Vector3(0, 0.55, 0),
    new Vector3(Math.PI / 2, 0, 0),
  );
  addMesh(
    new TorusGeometry(1.02, 0.07, 16, 64),
    ringMaterial,
    new Vector3(0, -0.55, 0),
    new Vector3(Math.PI / 2, 0, 0),
  );
  addMesh(
    new TorusGeometry(0.98, 0.06, 16, 64),
    ringMaterial,
    new Vector3(0, 0, 0),
    new Vector3(Math.PI / 2, 0, 0),
  );

  const verticalRingGeometry = new TorusGeometry(1.02, 0.06, 16, 64);
  geometries.push(verticalRingGeometry);
  for (let index = 0; index < 4; index += 1) {
    const ring = new Mesh(verticalRingGeometry, ringMaterial);
    ring.rotation.y = (index * Math.PI) / 4;
    ring.rotation.x = Math.PI / 2;
    ring.castShadow = true;
    ring.receiveShadow = true;
    group.add(ring);
  }

  addMesh(new CylinderGeometry(0.45, 0.6, 0.25, 16), darkMaterial, new Vector3(0, 1.1, 0));
  addMesh(new SphereGeometry(0.2, 16), brightMaterial, new Vector3(0, 1.32, 0));
  addMesh(new CylinderGeometry(0.5, 0.55, 0.2, 16), darkMaterial, new Vector3(0, -1.1, 0));

  const handleCurve = new CubicBezierCurve3(
    new Vector3(-0.7, 1.4, 0),
    new Vector3(-0.9, 2.0, 0.2),
    new Vector3(0.9, 2.0, -0.2),
    new Vector3(0.7, 1.4, 0),
  );
  addMesh(new TubeGeometry(handleCurve, 64, 0.09, 8, false), handleMaterial);
  addMesh(new SphereGeometry(0.12, 8), jointMaterial, new Vector3(-0.7, 1.4, 0));
  addMesh(new SphereGeometry(0.12, 8), jointMaterial, new Vector3(0.7, 1.4, 0));

  return { group, innerGlow, glassMaterial, geometries, materials };
}
