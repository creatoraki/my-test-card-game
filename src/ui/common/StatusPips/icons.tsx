import type { ReactNode } from "react";
import { SHIELD_ART } from "@/ui/art/statusArt";

interface IconProps {
  className?: string;
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <img className={className} src={SHIELD_ART} alt="" aria-hidden />
  );
}

export function ChargedShellIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 8 50 16v16c0 12-8 20-18 24-10-4-18-12-18-24V16Z" fill="#263c50" stroke="#8fd9ff" strokeWidth="3" />
      <path d="M34 14 24 34h9l-3 16 10-22h-9Z" fill="#ffd166" />
    </svg>
  );
}

export const STATUS_ICONS: Record<string, (p: IconProps) => ReactNode> = {
  chargedShell: ChargedShellIcon,
};
