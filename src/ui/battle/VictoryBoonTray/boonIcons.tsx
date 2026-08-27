interface IconProps {
  className?: string;
}

export function HealDewIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5c-2.7 3.2-5.2 6.2-5.2 9.4a5.2 5.2 0 0 0 10.4 0c0-3.2-2.5-6.2-5.2-9.4Z" />
      <path d="M9.2 13.3a2.9 2.9 0 0 0 2.8 2.5" />
      <path d="M18.2 4.5v4M16.2 6.5h4" />
    </svg>
  );
}

export function CardOfferIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="3.5" width="12" height="16" rx="1.5" />
      <path d="M8.5 7.5h5M8.5 11h5M8.5 14.5h2.5" />
      <path d="M17 7.5h2v13H7v-1.5" />
    </svg>
  );
}

export function EquipCrateIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4.5 7 7.5-3 7.5 3v10l-7.5 3-7.5-3V7Z" />
      <path d="m4.5 7 7.5 3 7.5-3M12 10v10M9.2 5.1 16.8 8.2" />
      <path d="M9.2 12.2h5.6" />
    </svg>
  );
}