import { useId } from "react";

interface Props {
  className?: string;
}

export function ManaCrystalIcon({ className }: Props) {
  const gradientId = useId();

  return (
    <svg className={className} viewBox="0 0 32 40" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradientId} x1="10" y1="4" x2="23" y2="37" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e3fbff" />
          <stop offset="0.22" stopColor="#70d5ff" />
          <stop offset="0.57" stopColor="#1788dc" />
          <stop offset="1" stopColor="#064487" />
        </linearGradient>
      </defs>
      <path d="M16 2C12.7 8.2 6 14.6 6 24c0 8 4.5 13 10 13s10-5 10-13C26 14.6 19.3 8.2 16 2Z" fill={`url(#${gradientId})`} />
      <path d="M16 2c3.3 6.2 10 12.6 10 22 0 8-4.5 13-10 13 3.8-5.3 5.3-10.3 4.4-15.2C19.6 16.3 17.4 9 16 2Z" fill="#04336e" opacity="0.38" />
      <path d="M13.9 7.2c-2.8 4.7-4.8 9-4.8 14.7 0 2.5.5 4.8 1.5 6.5-2.5-7.5.5-13.3 3.3-21.2Z" fill="#fff" opacity="0.44" />
      <path d="M11.5 30.3c1.2 2.2 2.7 3.5 4.5 3.5 2.6 0 4.7-2.5 5.3-6.4-2.9 3.1-6.1 4.1-9.8 2.9Z" fill="#6ee0ff" opacity="0.42" />
    </svg>
  );
}