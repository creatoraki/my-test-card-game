import type { AssembleId } from "@/engine";

interface Props {
  id: AssembleId;
  className?: string;
}

export const ASSEMBLE_ACCENT: Record<AssembleId, string> = {
  assembleA: "#5ad6ff",
  assembleB: "#ff7a45",
  assembleC: "#d8b04a",
  assembleD: "#7f8cff",
};

export function AssembleIcon({ id, className }: Props) {
  if (id === "assembleA") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <path d="m12 3 9 17H3L12 3Z" />
        <path d="M8.5 14.5h7M10 11.5h4" />
      </svg>
    );
  }

  if (id === "assembleB") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <path d="M3 4h18l-9 17L3 4Z" />
        <path d="M8.5 9.5h7M10 12.5h4" />
      </svg>
    );
  }

  if (id === "assembleC") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <path d="M3 4h18l-9 17L3 4Z" />
        <path d="M7 13h10M9 9h6" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="m12 3 9 17H3L12 3Z" />
      <path d="M7 11h10M9 15h6" />
    </svg>
  );
}