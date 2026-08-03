import type { NodeEventKind } from "../explore/types";
import placeholderArt from "../assets/占位素材.png";

const EVENT_ART: Record<NodeEventKind, string> = {
  retreat: placeholderArt,
  loot: placeholderArt,
  heal: placeholderArt,
  merchant: placeholderArt,
  route: placeholderArt,
  energy: placeholderArt,
  hazard: placeholderArt,
};

export function eventArt(kind: NodeEventKind): string {
  return EVENT_ART[kind];
}
