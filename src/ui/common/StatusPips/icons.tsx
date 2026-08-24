import type { ReactNode } from "react";

interface IconProps {
  className?: string;
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="sp-shield-body" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8a8e94" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#5e6268" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="sp-shield-highlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e6e8eb" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#b8bcc2" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M32 10 L50 18 L50 32 C50 44 32 54 32 54 C32 54 14 44 14 32 L14 18 Z" fill="url(#sp-shield-body)" />
      <path d="M32 14 L46 20 L46 30 C46 40 32 48 32 48 C32 48 18 40 18 30 L18 20 Z" fill="url(#sp-shield-highlight)" />
    </svg>
  );
}

export function SharpIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <polygon points="46,28 54,28 54,58 46,58" fill="#c8c8c8" />
      <polygon points="46,28 50,20 54,28" fill="#c8c8c8" />
      <rect x="36" y="58" width="28" height="6" fill="#8a8a8a" />
      <rect x="47" y="64" width="6" height="10" fill="#5a5a5a" />
    </svg>
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
  sharp: SharpIcon,
  chargedShell: ChargedShellIcon,
};