import type { MuseumHallId } from "./MuseumPanel";

export function MuseumNavIcon({ hall }: { hall: MuseumHallId }) {
  return (
    <svg viewBox="0 0 38 38" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {hall === "items" && <>
        <path d="M8 6h22v26H8z" />
        <path d="M12 11h14M12 16h10M12 22h14M12 27h7" />
        <path d="m26 21 3 3-5 5-3-3z" opacity=".65" />
      </>}
      {hall === "cards" && <>
        <path d="m12 7 19 5-5 20-19-5z" opacity=".58" />
        <path d="m8 11 19 5-5 20-19-5z" />
        <path d="m13 17 9 2M12 22l8 2M11 27l5 1" />
      </>}
      {hall === "enemies" && <>
        <path d="M19 5 23 10l6 1 1 6 4 4-4 4-1 6-6 1-4 4-4-4-6-1-1-6-4-4 4-4 1-6 6-1z" />
        <path d="M13 17h1M24 17h1M14 24c3 2 7 2 10 0" strokeWidth="2.3" />
      </>}
    </svg>
  );
}
