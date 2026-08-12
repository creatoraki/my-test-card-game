interface IconProps {
  className?: string;
}

export function RedrawIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 11a8 8 0 0 0-14.8-4.2L3 9m0-5v5h5M4 13a8 8 0 0 0 14.8 4.2L21 15m0 5v-5h-5" />
    </svg>
  );
}

export function DiscardIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
    </svg>
  );
}

export function WaitIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3h10M7 21h10M8 3c0 4 2 5 4 6-2 1-4 2-4 6m8-12c0 4-2 5-4 6 2 1 4 2 4 6" />
    </svg>
  );
}