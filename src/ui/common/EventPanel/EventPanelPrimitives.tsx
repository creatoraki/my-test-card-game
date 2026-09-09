import { type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import choiceResult from "./styles/eventPanelChoiceResult.module.css";
import overlay from "./styles/eventPanelOverlay.module.css";

export function EventPanelStage({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx(overlay.overlayScene, className)}>{children}</section>;
}

export function EventPanelBody({
  caption,
  scroll = true,
  children,
  className,
}: {
  caption?: ReactNode;
  scroll?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={overlay.overlayBody}>
      {caption && <p className={overlay.overlayCaption}>{caption}</p>}
      <div className={cx(scroll ? overlay.overlayScroll : overlay.overlayStatic, className)}>{children}</div>
    </div>
  );
}

export function EventPanelFoot({ note, children }: { note?: ReactNode; children?: ReactNode }) {
  return (
    <footer className={overlay.overlayFoot}>
      <span className={overlay.overlayFootNote}>{note}</span>
      <div className={overlay.overlayActions}>{children}</div>
    </footer>
  );
}

export function EventPanelNotice({ children }: { children: ReactNode }) {
  return <p className={overlay.overlayNotice}>{children}</p>;
}

interface EventPanelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: "primary" | "ghost" | "danger";
}

export function EventPanelButton({ tone = "ghost", className, ...rest }: EventPanelButtonProps) {
  return (
    <button
      type="button"
      data-sfx={tone === "primary" || tone === "danger" ? "confirm" : undefined}
      {...rest}
      className={cx(
        overlay.panelButton,
        tone === "primary" && overlay.panelButtonPrimary,
        tone === "danger" && overlay.panelButtonDanger,
        className,
      )}
    />
  );
}

interface EventPanelPickProps {
  leading?: ReactNode;
  name: ReactNode;
  desc?: ReactNode;
  note?: ReactNode;
  noteTone?: "amber" | "cyan" | "red";
  selected?: boolean;
  disabled?: boolean;
  index?: number;
  onClick?: () => void;
  className?: string;
}

export function EventPanelPick({
  leading,
  name,
  desc,
  note,
  noteTone,
  selected = false,
  disabled = false,
  index = 0,
  onClick,
  className,
}: EventPanelPickProps) {
  const costClass = noteTone
    ? choiceResult[`cost${noteTone[0].toUpperCase()}${noteTone.slice(1)}`]
    : "";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{ "--option-delay": `${index * 60 + 80}ms` } as CSSProperties}
      className={cx(choiceResult.option, selected && choiceResult.optionChosen, className)}
    >
      {leading ? (
        <span className={choiceResult.optionLeading}>{leading}</span>
      ) : (
        <span className={choiceResult.optionIndicator} aria-hidden="true" />
      )}
      <span className={choiceResult.optionMain}>
        <strong>{name}</strong>
        {desc && <span>{desc}</span>}
        {note && <em className={costClass}><i /> {note}</em>}
      </span>
      <span className={choiceResult.optionArrow} aria-hidden="true">↗</span>
    </button>
  );
}
