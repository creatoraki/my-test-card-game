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