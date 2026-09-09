import { useLayoutEffect, useRef, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { SceneSkyline } from "./SceneArt";
import type { EventPanelOption } from "./EventPanel";
import briefing from "./styles/eventPanelBriefing.module.css";
import choiceResult from "./styles/eventPanelChoiceResult.module.css";

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
    <section className={briefing.briefingScene} aria-label="事件情报">
      <div className={briefing.scenePlaceholder} aria-label="事件插图占位区域">
        {art ?? (
          <>
            <SceneSkyline />
            <div className={briefing.sceneOrb} />
            <div className={briefing.sceneCaption}>事件档案 · {sceneName}</div>
            <div className={briefing.sceneGlyph} aria-hidden="true">{glyph}</div>
          </>
        )}
      </div>
      <div className={briefing.briefingCopy}>
        {label && <div className={briefing.eventLabel}><span /> {label}</div>}
        {heading && <h2>{heading}</h2>}
        <div className={[briefing.storySubtitle, typingSubtitle ? briefing.typingText : ""].filter(Boolean).join(" ")}>{subtitle}</div>
        <p className={[briefing.storyBody, typingBody ? briefing.typingText : ""].filter(Boolean).join(" ")} ref={bodyRef}>{body}</p>
        {meta.length > 0 && (
          <div className={briefing.storyMeta}>
            {meta.map((item) => (
              <span key={`${item.icon}-${item.text}`}><b>{item.icon}</b> {item.text}</span>
            ))}
          </div>
        )}
        <button type="button" className={briefing.advanceButton} disabled={advanceDisabled} onClick={onAdvance}>
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
    <section className={choiceResult.choiceScene} aria-label="事件行动选择">
      <div className={choiceResult.choiceIntro}>
        <span className={choiceResult.sceneEyebrow}>02 / 行动阶段</span>
        <h2>{heading}</h2>
        <p>{hint}</p>
        <div className={choiceResult.choiceSignal}><span /> {signal}</div>
      </div>
      <div className={choiceResult.optionsList}>
        {options.map((option, optionIndex) => {
          const costClass = option.costTone
            ? choiceResult[`cost${option.costTone[0].toUpperCase()}${option.costTone.slice(1)}`]
            : "";
          const disabled = Boolean(option.disabled);
          const className = [
            choiceResult.option,
            option.state === "chosen" ? choiceResult.optionChosen : "",
            option.state === "dimmed" ? choiceResult.optionDimmed : "",
          ].filter(Boolean).join(" ");
          const style = {
            "--option-delay": `${option.index ?? optionIndex * 60 + 100}ms`,
          } as CSSProperties;
          const accessibleLabel = option.disabledReason ? `${option.name}，${option.disabledReason}` : option.name;
          const content = (
            <>
              {option.leading ? (
                <span className={choiceResult.optionLeading}>{option.leading}</span>
              ) : (
                <span className={choiceResult.optionNumber}>{String(optionIndex + 1).padStart(2, "0")}</span>
              )}
              <span className={choiceResult.optionMain}>
                <strong>{option.name}</strong>
                {option.description && <span>{option.description}</span>}
                {option.cost && <em className={costClass}><i /> {option.cost}</em>}
              </span>
              <span className={choiceResult.optionArrow} aria-hidden="true">↗</span>
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
                aria-label={accessibleLabel}
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
              aria-label={option.disabledReason ? accessibleLabel : undefined}
              onClick={(event) => onPick(optionIndex, event)}
            >
              {content}
            </button>
          );
        })}
      </div>
      {backLabel && onBack && (
        <button type="button" className={choiceResult.backButton} data-sfx="back" onClick={onBack}>
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
    <section className={choiceResult.resultScene} aria-label="事件结算结果" aria-live="polite">
      <div className={choiceResult.resultSeal}>{seal}</div>
      <span className={choiceResult.sceneEyebrow}>{eyebrow}</span>
      <h2>{heading}</h2>
      <div className={[choiceResult.resultStory, typingStory ? choiceResult.typingText : ""].filter(Boolean).join(" ")}>{story}</div>
      {summaryLabel && summaryValue !== undefined && (
        <div className={choiceResult.summaryRow}>
          <span>{summaryLabel}</span>
          <strong>{summaryValue}</strong>
        </div>
      )}
      {notes.length > 0 && (
        <div className={choiceResult.resultNotes}>
          {notes.map((note, index) => (
            <span key={`${note.text}-${index}`} className={choiceResult.resultNote} style={{ "--note-delay": `${note.delayMs}ms` } as CSSProperties}>
              {note.text}
            </span>
          ))}
        </div>
      )}
      {notice && (
        <div className={choiceResult.rewardNotice}>
          <span className={choiceResult.rewardPulse} />
          <div><strong>{notice.title}</strong><span>{notice.desc}</span></div>
          <span className={choiceResult.rewardArrow}>→</span>
        </div>
      )}
      <div className={choiceResult.resultFoot}>
        <span className={choiceResult.resultFootNote}>{footNote}</span>
        <button type="button" className={briefing.advanceButton} disabled={confirmDisabled} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </section>
  );
}
