import type { ShopPage } from "./ShopNavigation";

export function NavigationIcon({ page }: { page: ShopPage }) {
  return (
    <svg viewBox="0 0 38 38" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {page === "shop" && <>
        <path d="M2 4h5l5 23h19M9 9h25l-3 12H12" />
        <circle cx="14" cy="32" r="3" /><circle cx="28" cy="32" r="3" />
      </>}
      {page === "recycle" && <path d="m15 10 4-7 6 10M25 13l-6-1M25 13l1-6M29 19l6 10H24M24 29l4-5M24 29l4 4M15 29H5l6-11M11 18l2 6M11 18l-6 1" />}
      {page === "warehouse" && <>
        <rect x="5" y="15" width="28" height="19" rx="2" />
        <path d="M12 15V9a7 7 0 0 1 14 0v6" /><path d="M19 23v4" strokeWidth="3" />
      </>}
    </svg>
  );
}
