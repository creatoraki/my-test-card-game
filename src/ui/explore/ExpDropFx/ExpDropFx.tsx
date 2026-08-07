import { useEffect } from "react";
import s from "./ExpDropFx.module.css";

export default function ExpDropFx({ amount }: { amount: number }) {
  useEffect(() => undefined, []);
  return (
    <span className={s["exp-drop"]} aria-live="polite">
      +{amount} EXP
    </span>
  );
}
