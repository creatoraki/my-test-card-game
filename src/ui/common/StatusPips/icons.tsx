import { SHIELD_ART } from "@/ui/art/statusArt";

interface IconProps {
  className?: string;
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <img className={className} src={SHIELD_ART} alt="" aria-hidden />
  );
}

