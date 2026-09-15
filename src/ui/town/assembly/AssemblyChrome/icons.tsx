const iconBase = {
  viewBox: "0 0 32 32",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function UpgradeIcon() {
  return (
    <svg {...iconBase}>
      <path d="M7 25h6v-6h6v-6h6" />
      <path d="m20 8 5 5-5 5" />
      <path d="M7 29h19" opacity=".5" />
    </svg>
  );
}

export function ReforgeIcon() {
  return (
    <svg {...iconBase}>
      <path d="M9 9h8l4 4-9 9-4-4Z" />
      <path d="m12 22 8 8" />
      <path d="M23 8a8 8 0 0 1 5 12" />
      <path d="m28 20-1 5-5-1" />
      <path d="M9 24a8 8 0 0 1-5-12" />
      <path d="m4 12 1-5 5 1" />
    </svg>
  );
}
