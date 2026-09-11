type Kind = "growth" | "upgrade" | "draw" | "remove" | "common" | "uncommon" | "rare";

const PATHS: Record<Kind, string> = {
  growth: "M24 5 29 15 39 9 36 30 27 43 27 25 24 21 21 25 21 43 12 30 9 9 19 15ZM12 18 20 24M36 18 28 24",
  upgrade: "m9 25 15-15 15 15M9 39l15-15 15 15",
  draw: "m24 3 5 12-5 8-5-8ZM15 13 4 24l11 12M33 13l11 11-11 12M19 22l-5 9 10 14 10-14-5-9",
  remove: "M8 12h32M18 12V6h12v6M12 12l2 30h20l2-30M21 19v16M27 19v16",
  common: "m24 3 17 21-17 21L7 24ZM24 13l9 11-9 11-9-11Z",
  uncommon: "M24 5 44 41H4ZM24 18l10 18H14Z",
  rare: "M24 3 43 35H5ZM24 45 5 13h38Z",
};

export function GrowthGlyph({ kind }: { kind: Kind }) {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="miter" aria-hidden="true"><path d={PATHS[kind]} /></svg>;
}
