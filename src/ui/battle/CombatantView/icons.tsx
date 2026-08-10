interface IconProps {
  className?: string;
}

export function HourglassIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 4h12M6 20h12M8 4c0 4 2 5 4 8-2 3-4 4-4 8M16 4c0 4-2 5-4 8 2 3 4 4 4 8" />
      <path d="M9 16h6" />
    </svg>
  );
}
