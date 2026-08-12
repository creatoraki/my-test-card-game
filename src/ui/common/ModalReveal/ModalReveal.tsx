import type { ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import s from "./ModalReveal.module.css";

interface ModalRevealProps {
  closing: boolean;
  className?: string;
  children: ReactNode;
}

export function ModalReveal({ closing, className, children }: ModalRevealProps) {
  return (
    <div className={cx(s.reveal, className)} data-closing={closing ? "true" : undefined}>
      {children}
    </div>
  );
}
