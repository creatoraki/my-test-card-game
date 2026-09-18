import type { AssembleId } from "@/engine";
import { assembleBuffArtOf } from "@/ui/art/buffArt";

interface Props {
  id: AssembleId;
  className?: string;
}

export const ASSEMBLE_ACCENT: Record<AssembleId, string> = {
  assembleA: "#5ad6ff",
  assembleB: "#ff7a45",
  assembleC: "#d8b04a",
  assembleD: "#7f8cff",
};

export function AssembleIcon({ id, className }: Props) {
  return <img className={className} src={assembleBuffArtOf(id)} alt="" aria-hidden="true" />;
}
