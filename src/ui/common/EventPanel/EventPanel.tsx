// ★ 事件面板 ★ —— 探索页所有「浮层」的唯一版式真相。
//
// 这里同时给出两层 API:
//   · EventPanelFrame  —— 外壳(页眉 kicker + 大标题 + 右侧状态位 + 带扫光的内容视口)。
//     事件面板本身、以及事件结算之后弹出的所有后续浮层(奖励 / 拾取 / 交易 / 背包)都用它,
//     这样切换浮层时页眉基线、字号与内容视口的内边距完全不动, 不会有「面板跳一下」的偏移感。
//   · EventPanelBriefing / Choice / Result —— 事件面板专属的三段分镜。
//   · EventPanelScene / Body / Foot / Button / Pick —— 后续浮层用的通用版式原语,
//     控件观感与三段分镜里的 advanceButton / option 保持同一套。
//
// ⚠ 颜色一律走 --event-accent: 各浮层保留自己的主色(奖励=蓝 / 拾取=绿 / 交易=金 / 背包=青),
//   但着色规则只有这一份, 不要在调用方重写页眉、边线或按钮的颜色。
import { useLayoutEffect, useRef, type ButtonHTMLAttributes, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
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

interface EventPanelFrameProps {
  accent: string;
  kicker: string;
  title: ReactNode;
  /** 页眉右侧的状态位。事件面板放三段分镜进度, 后续浮层放「待处理奖励」「3 件」这类读数。 */
  status?: ReactNode;
  headerExtra?: ReactNode;
  /** 换 key 会重播视口的扫光 —— 内容整块换掉时给一个新值。 */
  contentKey?: string;
  scene?: EventPanelScene;
  children: ReactNode;
  className?: string;
}

export function EventPanelFrame({
  accent,
  kicker,
  title,
  status,
  headerExtra,
  contentKey,
  scene,
  children,
  className,
}: EventPanelFrameProps) {
  const style = { "--event-accent": accent } as CSSProperties;
  return (
    <div className={cx(s.eventDemo, className)} style={style}>
      <header className={s.demoHeader}>
        <div className={s.headerTitle}>
          <span className={s.demoKicker}>{kicker}</span>
          <h1>{title}</h1>
        </div>
        <div className={s.headerActions}>
          {status}
          {headerExtra}
        </div>
      </header>
      <main className={s.sceneViewport} data-scene={scene} key={contentKey}>
        {children}
      </main>
    </div>
  );
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
  return (
    <EventPanelFrame
      accent={accent}
      kicker={kicker}
      title={title}
      scene={scene}
      contentKey={`${sceneKey}-${scene}`}
      headerExtra={headerExtra}
      className={className}
      status={
        <span className={s.sceneProgress} aria-label={`当前分镜 ${scene === "briefing" ? 1 : scene === "choice" ? 2 : 3} / 3`}>
          <i className={scene === "briefing" ? s.progressActive : ""} />
          <i className={scene === "choice" ? s.progressActive : ""} />
          <i className={scene === "result" ? s.progressActive : ""} />
          <span>{sceneLabel}</span>
        </span>
      }
    >
      {children}
    </EventPanelFrame>
  );
}

// ---- 后续浮层的通用版式原语 ----
// 一层 Scene(撑满视口的纵向流) + Body(唯一的滚动区) + Foot(左说明右按钮, 与结算分镜同款)。
// ★ 浮层内容再复杂也只允许 Body 滚动: 页眉与底栏必须钉死, 否则各浮层的按钮位置又会各说各话。

export function EventPanelStage({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx(s.overlayScene, className)}>{children}</section>;
}

export function EventPanelBody({
  caption,
  children,
  className,
}: {
  caption?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={s.overlayBody}>
      {caption && <p className={s.overlayCaption}>{caption}</p>}
      <div className={cx(s.overlayScroll, className)}>{children}</div>
    </div>
  );
}

export function EventPanelFoot({ note, children }: { note?: ReactNode; children?: ReactNode }) {
  return (
    <footer className={s.overlayFoot}>
      <span className={s.overlayFootNote}>{note}</span>
      <div className={s.overlayActions}>{children}</div>
    </footer>
  );
}

export function EventPanelNotice({ children }: { children: ReactNode }) {
  return <p className={s.overlayNotice}>{children}</p>;
}

interface EventPanelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: "primary" | "ghost" | "danger";
}

export function EventPanelButton({ tone = "ghost", className, ...rest }: EventPanelButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        s.panelButton,
        tone === "primary" && s.panelButtonPrimary,
        tone === "danger" && s.panelButtonDanger,
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

/** 单张选择卡 —— 与行动分镜的 .option 同一套几何与交互, 供后续浮层的列表复用。 */
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
  const costClass = noteTone ? s[`cost${noteTone[0].toUpperCase()}${noteTone.slice(1)}`] : "";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{ "--option-delay": `${index * 60 + 80}ms` } as CSSProperties}
      className={cx(s.option, selected && s.optionChosen, className)}
    >
      {leading ? (
        <span className={s.optionLeading}>{leading}</span>
      ) : (
        <span className={s.optionNumber}>{String(index + 1).padStart(2, "0")}</span>
      )}
      <span className={s.optionMain}>
        <strong>{name}</strong>
        {desc && <span>{desc}</span>}
        {note && <em className={costClass}><i /> {note}</em>}
      </span>
      <span className={s.optionArrow} aria-hidden="true">↗</span>
    </button>
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
