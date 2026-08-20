// ds 事件面板 —— 测试页演示组件。
//
// 一整轮演出读作一句话：
//   **面板横线展开 → 标题浮字 → 正文逐字 → 选项错峰就位 → 落子有回响 → 结果逐字 →
//     摘要逐条揭晓 → 奖励待处理 → 确认解锁 → 退场重播**。
// 面板在 closing 结束后通过 key 重挂载复位：所有入场动画与逐字机自然重播，
// 不需要手动回滚任何状态。
//
// 只做展示与交互编排，不承载任何游戏规则（demo 数据见 dsEventData.ts）。
// ⚠ 标题浮字/选项错峰的 animation-delay 由行内下发（关键帧与 animation-name 留在 CSS 里，
//   styles.md 的 @keyframes 陷阱其一）；逐字机复用 hooks/useTypewriter（自带 reduced-motion 降级）。

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { prefersReducedMotion } from "@/ui/app/transitions";
import { useTypewriter } from "@/ui/hooks/useTypewriter";
import { cx } from "@/ui/common/cx";
import placeholderArt from "@/assets/占位素材.png";
import { EVENT_CONTENT, EVENT_TYPE_LABELS, type DsEvent, type DsEventType } from "../dsEventData";
import s from "./DsEventPanel.module.css";

type Phase = "intro" | "choosing" | "committing" | "resolving";

// 演出节拍(ms) —— 单一真相。需要给 CSS 的时长经 --ds-* 变量下发(panelVars)，
// 两边的关键帧只引用变量，不各写一份数字。
const BEAT = {
  titleStart: 380, // 面板横线展开过半时标题开始浮字，早一点会被裁掉
  titleChar: 45, // 标题每字间隔
  descStart: 760, // 正文起播 —— 压着面板落定的那一刻
  descCps: 34, // 正文速度(字/秒)，标点处由 useTypewriter 自己加停顿
  choiceStagger: 90, // 选项逐个浮现的间隔
  commit: 460, // 点下选项 → 真正切到结算的「判定」停顿
  resultCps: 30, // 故事结果逐字速度
  noteGap: 160, // 故事打完到第一条摘要
  noteStagger: 180, // 结算摘要逐条间隔
  noteTail: 300, // 最后一条摘要到「确认」解锁的收尾
  closeMs: 380, // 面板退场时长
} as const;

const COST_ICON: Record<string, string> = {
  spend: "−",
  gain: "＋",
  none: "·",
  lock: "!",
};

/** 把 CSS 需要的时长下发成变量；reduced-motion 时动画被 CSS 降级块关闭，变量只影响退场等待。 */
function panelVars(): CSSProperties {
  return {
    "--ds-commit": `${prefersReducedMotion() ? 0 : BEAT.commit}ms`,
    "--ds-close": `${prefersReducedMotion() ? 0 : BEAT.closeMs}ms`,
  } as CSSProperties;
}

export function DsEventPanel() {
  const [eventType, setEventType] = useState<DsEventType>("hazard");
  // 重播批次号：每次 +1 都会让面板子树重挂载，入场演出从头再来。
  const [seq, setSeq] = useState(0);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  // 退场 → 换类型或原地重播。closing 期间不接受第二次触发，避免两个定时器叠着跑。
  const rerun = (next: DsEventType) => {
    if (closing) return;
    setClosing(true);
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      setEventType(next);
      setSeq((v) => v + 1);
      setClosing(false);
    }, prefersReducedMotion() ? 0 : BEAT.closeMs);
  };

  const event = EVENT_CONTENT[eventType];

  return (
    <div className={s.eventDemo} style={{ "--ds-accent": event.accent } as CSSProperties}>
      <header className={s.demoHeader}>
        <div>
          <span className={s.demoKicker}>DS EVENT PANEL / 事件面板原型</span>
          <h1>事件抉择</h1>
        </div>
        <div className={s.headerActions}>
          <span className={s.liveStatus}>
            <i aria-hidden="true" /> LIVE · {EVENT_TYPE_LABELS[eventType]}
          </span>
          <button type="button" className={s.resetButton} onClick={() => rerun(eventType)}>
            <span aria-hidden="true">↺</span> 重置演出
          </button>
        </div>
      </header>

      <div className={s.eventTypes} role="tablist" aria-label="事件类型">
        {(Object.keys(EVENT_CONTENT) as DsEventType[]).map((type) => (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={eventType === type}
            className={eventType === type ? s.eventTypeActive : undefined}
            onClick={() => rerun(type)}
            style={{ "--type-accent": EVENT_CONTENT[type].accent } as CSSProperties}
          >
            <span className={s.typeDot} aria-hidden="true" />
            <span>{EVENT_TYPE_LABELS[type]}</span>
            <small>{EVENT_CONTENT[type].label.split(" / ")[1]}</small>
          </button>
        ))}
      </div>

      <div className={s.stage}>
        <EventPanelStage
          key={`${eventType}-${seq}`}
          event={event}
          closing={closing}
          onConfirmed={() => rerun(event.type)}
        />
      </div>

      <footer className={s.hint}>
        <span aria-hidden="true">◈</span>
        悬停选项查看反馈 · 点击决策 → 结算播报 → 领取奖励 → 确认后自动重播
      </footer>
    </div>
  );
}

interface PanelStageProps {
  event: DsEvent;
  closing: boolean;
  /** 确认按钮被按下：由父组件安排退场与重播。 */
  onConfirmed: () => void;
}

function EventPanelStage({ event, closing, onConfirmed }: PanelStageProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [selected, setSelected] = useState<number | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [narrationDone, setNarrationDone] = useState(false);
  const timersRef = useRef<number[]>([]);
  const reduced = prefersReducedMotion();

  // 卸载时撤掉所有演出定时器（换事件/重播都靠重挂载，这里不留尾巴）。
  useEffect(
    () => () => {
      for (const t of timersRef.current) window.clearTimeout(t);
    },
    [],
  );

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    timersRef.current.push(id);
  };

  const option = selected != null ? event.options[selected] : null;

  // 正文逐字。面板重挂载即重播；正文播完自动放行选项。
  const desc = useTypewriter(event.description, BEAT.descStart, BEAT.descCps);
  useEffect(() => {
    if (phase === "intro" && desc.done) setPhase("choosing");
  }, [phase, desc.done]);

  // 故事结果逐字。selected 从 null 变为某个选项时 text 变化，useTypewriter 自然重播；
  // delay = commit 停顿，正好压在「判定」结束、结算区挂载的那一刻起播。
  const result = useTypewriter(option?.result ?? "", BEAT.commit, BEAT.resultCps);
  const showNotes = phase === "resolving" && result.done;

  // 摘要播完的解锁闸门：故事逐字结束之后，再等「逐条 + 收尾」的全长。
  useEffect(() => {
    if (phase !== "resolving" || !result.done || !option) {
      setNarrationDone(false);
      return;
    }
    if (reduced) {
      setNarrationDone(true);
      return;
    }
    const total =
      BEAT.noteGap + Math.max(0, option.notes.length - 1) * BEAT.noteStagger + BEAT.noteTail;
    const id = window.setTimeout(() => setNarrationDone(true), total);
    return () => window.clearTimeout(id);
  }, [phase, result.done, option, reduced]);

  const choose = (index: number) => {
    if (phase !== "choosing" || closing) return;
    const target = event.options[index];
    if (target.disabled) return;
    setSelected(index);
    // ★ 落子的回响：按钮先演完（选中锁死 + 扫光，其余暗淡，整体收起），结算才发生。
    setPhase("committing");
    later(() => setPhase("resolving"), reduced ? 0 : BEAT.commit);
  };

  const confirmReady =
    phase === "resolving" && narrationDone && (event.rewards.length === 0 || claimed);

  const confirm = () => {
    if (!confirmReady || closing) return;
    // 确认 = 结束本轮演出：退场与重播交给父组件（closing → key 重挂载）。
    onConfirmed();
  };

  const footHint = !narrationDone
    ? "结算播报中…"
    : event.rewards.length > 0 && !claimed
      ? "先领取事件奖励"
      : "结算完毕";

  return (
    <section
      className={cx(s.panel, s[`k-${event.type}`])}
      data-closing={closing ? "true" : undefined}
      style={panelVars()}
    >
      <span className={s.panelBar} aria-hidden="true" />
      <span className={s.panelFrame} aria-hidden="true" />
      <span className={s.panelScan} aria-hidden="true" />

      {/* 事件插图：1:1 占位素材 + 类型色辉光/网格/扫光装饰层。 */}
      <aside className={s.art} aria-label="事件插图占位区域">
        <div className={s.artBox}>
          <img className={s.artImg} src={placeholderArt} alt="" />
          <span className={s.artTint} aria-hidden="true" />
          <span className={s.artGrid} aria-hidden="true" />
          <span className={s.artSweep} aria-hidden="true" />
          <span className={s.artMark} aria-hidden="true">◆</span>
          <span className={s.artCaption}>
            <em>ARCHIVE IMAGE</em>
            <strong>{event.sceneName}</strong>
          </span>
        </div>
        <div className={s.artMeta}>
          <strong>事件档案 {event.label.split(" / ")[1]}</strong>
          <em>{EVENT_TYPE_LABELS[event.type]}</em>
        </div>
      </aside>

      <div className={s.content}>
        <span className={s.kicker}>{event.label}</span>

        <h2 className={s.title} aria-label={event.title}>
          {reduced
            ? event.title
            : Array.from(event.title).map((ch, i) => (
                <span
                  key={i}
                  className={s.titleChar}
                  aria-hidden="true"
                  style={{ animationDelay: `${BEAT.titleStart + i * BEAT.titleChar}ms` } as CSSProperties}
                >
                  {ch === " " ? "\u00A0" : ch}
                </span>
              ))}
        </h2>

        <p className={s.desc} aria-label={event.description}>
          <span className={s.descGhost} aria-hidden="true">{event.description}</span>
          <span className={s.descLive} aria-hidden="true">
            {desc.shown}
            {!desc.done && <span className={s.caret} />}
          </span>
        </p>

        <div className={s.act}>
          {phase === "resolving" && option ? (
            <section className={s.result} aria-live="polite">
              <header className={s.resultHead}>
                <span className={s.resultIcon} aria-hidden="true">◈</span>
                <div>
                  <span className={s.sectionKicker}>OUTCOME / 故事结果</span>
                  <h3>选择已生效</h3>
                </div>
              </header>
              <p className={s.resultStory}>
                {result.shown}
                {!result.done && <span className={s.caret} aria-hidden="true" />}
              </p>
              {showNotes && (
                <ul className={s.notes}>
                  {option.notes.map((note, i) => (
                    <li
                      key={note}
                      className={s.note}
                      style={{ animationDelay: `${BEAT.noteGap + i * BEAT.noteStagger}ms` } as CSSProperties}
                    >
                      {note}
                    </li>
                  ))}
                </ul>
              )}
              {showNotes && event.rewards.length > 0 && (
                <button
                  type="button"
                  className={cx(s.rewardNotice, claimed && s["is-claimed"])}
                  disabled={claimed || closing}
                  style={{
                    animationDelay: claimed
                      ? "0ms"
                      : `${BEAT.noteGap + option.notes.length * BEAT.noteStagger}ms`,
                  } as CSSProperties}
                  onClick={() => setClaimed(true)}
                >
                  <span className={s.rewardPulse} aria-hidden="true" />
                  <span className={s.rewardCopy}>
                    <strong>{claimed ? "奖励已领取" : "奖励待处理 · 点击领取"}</strong>
                    <em>{event.rewards.join(" · ")}</em>
                  </span>
                  <span className={s.rewardArrow} aria-hidden="true">{claimed ? "✓" : "→"}</span>
                </button>
              )}
              <footer className={s.resultFoot}>
                <span className={s.footHint}>{footHint}</span>
                <button
                  className={cx("primary", s.confirm)}
                  type="button"
                  disabled={!confirmReady}
                  onClick={confirm}
                >
                  确认 <span aria-hidden="true">▸</span>
                </button>
              </footer>
            </section>
          ) : (
            <div
              className={cx(
                s.choices,
                desc.done && s["is-armed"],
                phase === "committing" && s["is-exiting"],
              )}
              role="group"
              aria-label="事件选项"
            >
              {event.options.map((opt, index) => {
                const committing = phase === "committing";
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={cx(
                      s.choice,
                      committing && (index === selected ? s["is-chosen"] : s["is-dimmed"]),
                      opt.disabled && s["is-disabled"],
                    )}
                    disabled={opt.disabled || phase !== "choosing" || closing}
                    aria-pressed={selected === index}
                    style={{ animationDelay: `${index * BEAT.choiceStagger}ms` } as CSSProperties}
                    onClick={() => choose(index)}
                  >
                    <span className={s.choiceBar} aria-hidden="true" />
                    <span className={s.choiceIndex} aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className={s.choiceMain}>
                      <strong className={s.choiceName}>{opt.name}</strong>
                      <span className={s.choiceDesc}>{opt.desc}</span>
                      <span className={cx(s.costChip, s[`cost-${opt.costTone}`])}>
                        <i className={s.costIcon} aria-hidden="true">{COST_ICON[opt.costKind]}</i>
                        {opt.cost}
                      </span>
                    </span>
                    {opt.disabled && <span className={s.disabledTag}>{opt.disabledReason}</span>}
                    <span className={s.choiceArrow} aria-hidden="true">▸</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
