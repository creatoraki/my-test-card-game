import { useId } from "react";
import { TECH_TREE_ART } from "@/ui/art/techTreeArt";

export function TechnologyArtwork({ kind, className }: {
  kind: keyof typeof TECH_TREE_ART.regions;
  className?: string;
}) {
  const clipId = useId();
  const region = TECH_TREE_ART.regions[kind];
  return (
    <svg className={className} viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
      <defs><clipPath id={clipId}><polygon points="50,0 100,25 100,75 50,100 0,75 0,25" /></clipPath></defs>
      <g clipPath={`url(#${clipId})`}>
        <svg width="100" height="100" viewBox={`${region.x} ${region.y} ${region.size} ${region.size}`}>
          <image href={TECH_TREE_ART.source} width={TECH_TREE_ART.width} height={TECH_TREE_ART.height} preserveAspectRatio="none" />
        </svg>
      </g>
    </svg>
  );
}
