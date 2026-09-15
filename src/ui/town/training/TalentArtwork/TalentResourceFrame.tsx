import { useId } from "react";
import s from "./TalentResourceFrame.module.css";

export function TalentResourceFrame() {
  const id = useId();
  const outer = "M35 3H1537L1559 20 1574 43V101L1556 119 1539 131H32L13 115 2 94V40L15 16Z";
  const inner = "M40 15H1534L1550 31 1562 49V94L1545 116H34L16 98V43L28 26Z";
  return (
    <svg className={s.frame} viewBox="0 0 1576 140" preserveAspectRatio="none" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={id}><stop stopColor="#795b33" /><stop offset=".2" stopColor="#e8cb96" />
          <stop offset=".48" stopColor="#fff0c3" /><stop offset=".75" stopColor="#aa7c3e" /><stop offset="1" stopColor="#e6c487" /></linearGradient>
        <linearGradient id={id + "-body"} x2="0" y2="1"><stop stopColor="#19232bcf" />
          <stop offset=".3" stopColor="#060c14ed" /><stop offset=".8" stopColor="#060b11f5" /><stop offset="1" stopColor="#19222ae8" /></linearGradient>
      </defs>
      <path d={outer} fill={`url(#${id}-body)`} stroke={`url(#${id})`} strokeWidth="3" />
      <path d={inner} stroke={`url(#${id})`} strokeWidth=".9" />
      <path d="M38 8H765M810 8h726M32 127h733M810 127h728" stroke="#fff0c4" opacity=".65" />
      <path d="M41 22Q24 28 27 62V84Q25 108 47 112M1529 22q20 6 17 40v22q3 24-20 28"
        stroke="#b89353" strokeWidth="1.3" />
      {[false, true].map(flip => <g key={String(flip)} transform={flip ? "translate(1576 0) scale(-1 1)" : undefined}
        stroke={`url(#${id})`} fill="#31261b">
        <path d="M0 40 16 11 42 0 32 13 16 29 9 49v35l7 15 19 28 17 6-21 1-18-21L0 93Z" strokeWidth="1.2" />
        <path d="m18 54 9 11 11 1-11 6-7 13 1-14-10-6Z" fill="#b29155" fillOpacity=".3" />
        <path d="m33 119 18 11h26M13 27l9-12h20M22 43v48" strokeWidth=".7" fill="none" />
      </g>)}
      {[7, 136].map(y => <g key={y} transform={`translate(788 ${y})`} stroke="#f5d397">
        <path d="m0-15 11 15L0 15-11 0Z" fill="#3c2b16" strokeWidth="2" />
        <path d="M0-11 4 0 0 11-4 0Z" fill="#fff4cb" strokeWidth=".5" />
        <path d="M-43 0h24l8-6M43 0H19l-8-6" />
      </g>)}
    </svg>
  );
}
