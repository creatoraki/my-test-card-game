import * as THREE from "three";
import { PROP_FOOTPRINT, PROP_INFO } from "../../data";
import type { PropDef, PropInfo, PropKind, Vec2 } from "../../types";
import type { BuildContext } from "../room/buildContext";
import { buildFilingCabinet } from "./filingCabinet";
import { createPropHighlight, type PropHighlight } from "./propHighlight";
import { buildRemains } from "./remains";
import { buildVendingMachine } from "./vendingMachine";

const BUILDERS: Record<PropKind, (ctx: BuildContext) => THREE.Group> = {
  filingCabinet: buildFilingCabinet,
  vendingMachine: buildVendingMachine,
  remains: buildRemains,
};

/** 提示菱形的悬浮高度。 */
const MARKER_HEIGHT: Record<PropKind, number> = {
  filingCabinet: 1.75,
  vendingMachine: 2.25,
  remains: 1.35,
};

export interface PropView {
  def: PropDef;
  info: PropInfo;
  /** 标签锚点(世界坐标)。 */
  anchor: THREE.Vector3;
  /** 点击物体时走到的位置: 正面前方一步。 */
  interactPoint: Vec2;
  highlight: PropHighlight;
}

export function buildProps(ctx: BuildContext): { group: THREE.Group; views: PropView[] } {
  const group = new THREE.Group();
  group.name = "props";
  const views: PropView[] = [];
  for (const def of ctx.room.props) {
    const root = new THREE.Group();
    root.position.set(def.x, 0, def.z);
    root.rotation.y = def.rot;
    root.add(BUILDERS[def.kind](ctx));
    const [w, d] = PROP_FOOTPRINT[def.kind];

    const highlight = createPropHighlight(ctx.disposer, Math.max(w, d) * 0.62, MARKER_HEIGHT[def.kind]);
    root.add(highlight.group);
    ctx.animated.push(highlight);

    const hit = new THREE.Mesh(new THREE.BoxGeometry(w, MARKER_HEIGHT[def.kind], d), ctx.kit.plain(0xffffff));
    hit.position.y = MARKER_HEIGHT[def.kind] / 2;
    hit.visible = false;
    hit.userData.pick = { kind: "prop", id: def.id };
    root.add(hit);
    ctx.pickables.push(hit);
    group.add(root);

    const front = { x: Math.sin(def.rot), z: Math.cos(def.rot) };
    const reach = d / 2 + 0.55;
    views.push({
      def,
      info: PROP_INFO[def.kind],
      anchor: new THREE.Vector3(def.x, MARKER_HEIGHT[def.kind] + 0.35, def.z),
      interactPoint: { x: def.x + front.x * reach, z: def.z + front.z * reach },
      highlight,
    });
  }
  return { group, views };
}
