import { useLayoutEffect, useRef, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import s from "./EventPanel.module.css";

export type EventPanelScene = "briefing" | "choice" | "result";

export interface EventPanelOption {
  id: string;
  name: string;
  description?: ReactNode;
  cost?: ReactNode;
  costTone?: "amber" | "cyan" | "red";
  disabled?: boolean;
  disabledReason?: string;
  state?: "chosen" | "dimmed";
  leading?: ReactNode;
  index?: number;
}

interface EventPanelProps {
  accent: string;
  kicker: string;
  title: string;
  scene: EventPanelScene;
  sceneKey: string;
  headerExtra?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function EventPanel({
  accent,
  kicker,
  title,
  scene,
  sceneKey,
  headerExtra,
  children,
  className,
}: EventPanelProps) {
  const sceneLabel = scene === "briefing" ? "情报" : scene === "choice" ? "行动" : "结算";
  const style = { "--event-accent": accent } as CSSProperties;
  return (
    <div className={cx(s.eventDemo, className)} style={style}>
      <header className={s.demoHeader}>
        <div>
          <span className={s.demoKicker}>{kicker}</span>
          <h1>{title}</h1>
        </div>
        <div className={s.headerActions}>
          <span className={s.sceneProgress} aria-label={`当前分镜 ${scene === "briefing" ? 1 : scene === "choice" ? 2 : 3} / 3`}>
            <i className={scene === "briefing" ? s.progressActive : ""} />
            <i className={scene === "choice" ? s.progressActive : ""} />
            <i className={scene === "result" ? s.progressActive : ""} />
            <span>{sceneLabel}</span>
          </span>
          {headerExtra}
        </div>
      </header>
      <main className={s.sceneViewport} data-scene={scene} key={`${sceneKey}-${scene}`}>
        {children}
      </main>
    </div>
  );
}

interface EventPanelBriefingProps {
  sceneName: string;
  glyph: string;
  heading?: ReactNode;
  subtitle?: ReactNode;
  body: ReactNode;
  typingSubtitle?: boolean;
  typingBody?: boolean;
  label?: ReactNode;
  meta?: { icon: string; text: string }[];
  advanceLabel: string;
  advanceDisabled?: boolean;
  onAdvance: () => void;
  art?: ReactNode;
}

export function EventPanelBriefing({
  sceneName,
  glyph,
  heading,
  subtitle,
  body,
  typingSubtitle = false,
  typingBody = false,
  label,
  meta = [],
  advanceLabel,
  advanceDisabled = false,
  onAdvance,
  art,
}: EventPanelBriefingProps) {
  const bodyRef = useRef<HTMLParagraphElement>(null);
  useLayoutEffect(() => {
    const bodyElement = bodyRef.current;
    if (!bodyElement) return;
    bodyElement.scrollTop = Math.max(0, bodyElement.scrollHeight - bodyElement.clientHeight);
  }, [body]);

  return (
    <section className={s.briefingScene} aria-label="事件情报">
      <div className={s.scenePlaceholder} aria-label="事件插图占位区域">
        {art ?? (
          <>
            <div className={s.sceneGrid} />
            <div className={s.sceneOrb} />
            <div className={s.sceneFrame}>
              <span>01</span>
              <span>VISUAL<br />PLACEHOLDER</span>
            </div>
            <div className={s.sceneCaption}>
              <span>ARCHIVE IMAGE</span>
              <strong>{sceneName}</strong>
            </div>
            <div className={s.sceneGlyph} aria-hidden="true">{glyph}</div>
          </>
        )}
      </div>
      <div className={s.briefingCopy}>
        {label && <div className={s.eventLabel}><span /> {label}</div>}
        {heading && <h2>{heading}</h2>}
        <div className={[s.storySubtitle, typingSubtitle ? s.typingText : ""].filter(Boolean).join(" ")}>{subtitle}</div>
        <p className={[s.storyBody, typingBody ? s.typingText : ""].filter(Boolean).join(" ")} ref={bodyRef}>{body}</p>
        {meta.length > 0 && (
          <div className={s.storyMeta}>
            {meta.map((item) => (
              <span key={`${item.icon}-${item.text}`}><b>{item.icon}</b> {item.text}</span>
            ))}
          </div>
        )}
        <button type="button" className={s.advanceButton} disabled={advanceDisabled} onClick={onAdvance}>
          {advanceLabel} <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}

interface EventPanelChoiceProps {
  heading: string;
  hint: string;
  signal: ReactNode;
  options: EventPanelOption[];
  onPick: (index: number, event?: MouseEvent<HTMLButtonElement>) => void;
  backLabel?: string;
  onBack?: () => void;
}

function handleChoiceKeyDown(event: KeyboardEvent<HTMLDivElement>, onPick: () => void) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  onPick();
}

export function EventPanelChoice({
  heading,
  hint,
  signal,
  options,
  onPick,
  backLabel,
  onBack,
}: EventPanelChoiceProps) {
  return (
    <section className={s.choiceScene} aria-label="事件行动选择">
      <div className={s.choiceIntro}>
        <span className={s.sceneEyebrow}>02 / ACTION PHASE</span>
        <h2>{heading}</h2>
        <p>{hint}</p>
        <div className={s.choiceSignal}><span /> {signal}</div>
      </div>
      <div className={s.optionsList}>
        {options.map((option, optionIndex) => {
          const costClass = option.costTone ? s[`cost${option.costTone[0].toUpperCase()}${option.costTone.slice(1)}`] : "";
          const disabled = Boolean(option.disabled);
          const className = [
            s.option,
            option.state === "chosen" ? s.optionChosen : "",
            option.state === "dimmed" ? s.optionDimmed : "",
          ].filter(Boolean).join(" ");
          const style = {
            "--option-delay": `${option.index ?? optionIndex * 60 + 100}ms`,
          } as CSSProperties;
          const content = (
            <>
              {option.leading ? (
                <span className={s.optionLeading}>{option.leading}</span>
              ) : (
                <span className={s.optionNumber}>{String(optionIndex + 1).padStart(2, "0")}</span>
              )}
              <span className={s.optionMain}>
                <strong>{option.name}</strong>
                {option.description && <span>{option.description}</span>}
                {option.cost && <em className={costClass}><i /> {option.cost}</em>}
              </span>
              <span className={s.optionArrow} aria-hidden="true">↗</span>
              {disabled && option.disabledReason && <small className={s.disabledTag}>{option.disabledReason}</small>}
            </>
          );
          if (option.leading) {
            return (
              <div
                key={option.id}
                className={className}
                style={style}
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-disabled={disabled}
                onClick={() => !disabled && onPick(optionIndex)}
                onKeyDown={(event) => !disabled && handleChoiceKeyDown(event, () => onPick(optionIndex))}
              >
                {content}
              </div>
            );
          }
          return (
            <button
              key={option.id}
              type="button"
              className={className}
              style={style}
              disabled={disabled}
              onClick={(event) => onPick(optionIndex, event)}
            >
              {content}
            </button>
          );
        })}
      </div>
      {backLabel && onBack && (
        <button type="button" className={s.backButton} onClick={onBack}>
          <span aria-hidden="true">←</span> {backLabel}
        </button>
      )}
    </section>
  );
}

interface EventPanelResultProps {
  seal: string;
  eyebrow: string;
  heading: string;
  story: ReactNode;
  typingStory?: boolean;
  notes: { text: string; delayMs: number }[];
  summaryLabel?: string;
  summaryValue?: ReactNode;
  notice?: { title: string; desc: string };
  footNote: string;
  confirmLabel: string;
  confirmDisabled?: boolean;
  onConfirm: () => void;
}

export function EventPanelResult({
  seal,
  eyebrow,
  heading,
  story,
  typingStory = false,
  notes,
  summaryLabel,
  summaryValue,
  notice,
  footNote,
  confirmLabel,
  confirmDisabled = false,
  onConfirm,
}: EventPanelResultProps) {
  return (
    <section className={s.resultScene} aria-label="事件结算结果" aria-live="polite">
      <div className={s.resultSeal}>{seal}</div>
      <span className={s.sceneEyebrow}>{eyebrow}</span>
      <h2>{heading}</h2>
      <div className={[s.resultStory, typingStory ? s.typingText : ""].filter(Boolean).join(" ")}>{story}</div>
      {summaryLabel && summaryValue !== undefined && (
        <div className={s.summaryRow}>
          <span>{summaryLabel}</span>
          <strong>{summaryValue}</strong>
        </div>
      )}
      {notes.length > 0 && (
        <div className={s.resultNotes}>
          {notes.map((note, index) => (
            <span key={`${note.text}-${index}`} className={s.resultNote} style={{ "--note-delay": `${note.delayMs}ms` } as CSSProperties}>
              {note.text}
            </span>
          ))}
        </div>
      )}
      {notice && (
        <div className={s.rewardNotice}>
          <span className={s.rewardPulse} />
          <div><strong>{notice.title}</strong><span>{notice.desc}</span></div>
          <span className={s.rewardArrow}>→</span>
        </div>
      )}
      <div className={s.resultFoot}>
        <span className={s.resultFootNote}>{footNote}</span>
        <button type="button" className={s.advanceButton} disabled={confirmDisabled} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </section>
  );
}
