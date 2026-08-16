import type { NodeEventKind } from "@/explore/types";
import placeholderArt from "@/assets/占位素材.png";

const EVENT_ART: Record<NodeEventKind, string> = {
  retreat: placeholderArt,
  loot: placeholderArt,
  heal: placeholderArt,
  merchant: placeholderArt,
  route: placeholderArt,
  energy: placeholderArt,
  hazard: placeholderArt,
  battle: placeholderArt,
  empty: placeholderArt,
};

export const EVENT_ART_SOURCES: readonly string[] = [...new Set(Object.values(EVENT_ART))];

export function eventArt(kind: NodeEventKind): string {
  return EVENT_ART[kind];
}
