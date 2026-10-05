import type { AssembleId } from "@/engine";
import { assembleBuffArtOf } from "@/ui/art/battle/buffArt";

interface Props {
  id: AssembleId;
  className?: string;
}

export const ASSEMBLE_ACCENT: Record<AssembleId, string> = {
  assembleA: "#5ad6ff",
  assembleB: "#ffd34a",
  assembleC: "#45e5e8",
  assembleD: "#cf65ff",
};

export function AssembleIcon({ id, className }: Props) {
  return <img className={className} src={assembleBuffArtOf(id)} alt="" aria-hidden="true" />;
}
