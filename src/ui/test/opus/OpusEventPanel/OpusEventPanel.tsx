import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useTypewriter } from "@/ui/hooks/useTypewriter";
import { EventSigil } from "../EventSigil";
import {
  EVENT_DEMOS,
  EVENT_KINDS,
  RESOURCE_META,
  RESOURCE_POOL,
  type EventDemo,
  type EventKind,
  type EventOption,
  type ResourceId,
} from "../eventData";
import s from "./OpusEventPanel.module.css";

// 事件面板 demo。
//
// ★ 视觉立场: 「柔性全息」—— 圆角、曲线、玻璃与辉光, 没有一个直角切角、没有硬投影。
//   所有分组都靠**圆角容器 + 明度差**划分, 不靠描边; 唯一的高饱和色是事件主色, 且只出现在
//   徽记、选中态和关键数值上。别处一律靠灰阶拉开层次 —— 满屏都亮 = 满屏都不亮。
// ★ 质感来自**节拍**, 不是更多的框:
//   徽记浮现 → 标题落位 → 正文逐字 → 选项一条条推进来 → 选中后其余收拢 → 结算展开。
//   每一拍都等上一拍站稳再起, 玩家的视线因此只有一条路可走。
// ⚠ CSS 里所有出场动画都靠 --i(序号)算 delay, 所以「加一个选项」不需要动任何时间常量。
//
// 状态机只有四段, 复杂度全压在 CSS 上:
//   reading(读题, 选项未就位) → picking(已选中, 播放选择反馈) → settling(结算展开) → done(已确认)

type Phase = "reading" | "picking" | "settling" | "done";

/** 选择反馈的时长 —— 选中项闪一下、其余选项收起, 然后才展开结算。 */
const PICK_FEEDBACK_MS = 520;
/** 正文起播延迟, 等 CSS 入场把右栏送到位。 */
const DESC_DELAY_MS = 620;

function costOf(option: EventOption, res: ResourceId): number {
  return option.costs.find((c) => c.res === res)?.amount ?? 0;
}

function isAffordable(option: EventOption): boolean {
  return option.costs.every((c) => RESOURCE_POOL[c.res] >= c.amount);
}

/** 一次事件的完整生命周期。换事件 / 重置时整体重挂载, 动画自然重播。 */
function EventRun({ demo }: { demo: EventDemo }) {
  const [phase, setPhase] = useState<Phase>("reading");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const timerRef = useRef(0);

  const desc = useTypewriter(demo.desc, DESC_DELAY_MS, 36);
  // 选项要等正文打完才推进来 —— 提前出现会和文字抢视线。
  const optionsIn = desc.done;

  const picked = useMemo(
    () => demo.options.find((o) => o.id === pickedId) ?? null,
    [demo.options, pickedId],
  );
  const rewardPending = Boolean(picked?.reward) && !rewardClaimed;

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const pick = useCallback((option: EventOption) => {
    setPickedId(option.id);
    setPhase("picking");
    timerRef.current = window.setTimeout(() => setPhase("settling"), PICK_FEEDBACK_MS);
  }, []);

  // 悬停/选中的选项决定资源条上的「预扣」高亮。
  const previewOption = picked ?? demo.options.find((o) => o.id === hoverId) ?? null;
  const previewUsable = previewOption ? isAffordable(previewOption) : false;

  const chosenIndex = picked ? demo.options.findIndex((o) => o.id === picked.id) : -1;

  return (
    <article className={s.panel} data-kind={demo.kind} data-phase={phase}>
      <span className={s.panelSheen} aria-hidden />

      <header className={s.head}>
        <div className={s.headLeft}>
          <span className={s.kindBadge}>
            <span className={s.kindDot} aria-hidden />
            {demo.kindLabel}事件
          </span>
          <span className={s.code}>{demo.code}</span>
        </div>
        <ul className={s.resBar}>
          {(Object.keys(RESOURCE_META) as ResourceId[]).map((res) => {
            const spend = previewOption ? costOf(previewOption, res) : 0;
            const left = RESOURCE_POOL[res] - spend;
            return (
              <li
                key={res}
                className={s.resItem}
                data-active={spend > 0 || undefined}
                data-lack={spend > 0 && !previewUsable && left < 0 ? "" : undefined}
              >
                <span className={s.resSigil} aria-hidden>
                  {RESOURCE_META[res].sigil}
                </span>
                <span className={s.resLabel}>{RESOURCE_META[res].label}</span>
                <span className={s.resValue}>
                  {RESOURCE_POOL[res]}
                  {spend > 0 && <em className={s.resDelta}>-{spend}</em>}
                </span>
              </li>
            );
          })}
        </ul>
      </header>

      <div className={s.body}>
        {/* 徽记: 现画的 SVG 线稿, 装在一个圆角玻璃容器里(仍是严格 1:1)。 */}
        <figure className={s.sigilBox}>
          <div className={s.sigilInner}>
            <span className={s.sigilBloom} aria-hidden />
            <EventSigil kind={demo.kind} />
          </div>
          <figcaption className={s.tags}>
            {demo.tags.map((tag, i) => (
              <span key={tag} className={s.tag} style={{ "--i": i } as CSSProperties}>
                {tag}
              </span>
            ))}
          </figcaption>
        </figure>

        <section className={s.main}>
          <div className={s.titleBlock}>
            <h2 className={s.title}>{demo.title}</h2>
            <p className={s.subtitle}>{demo.subtitle}</p>
          </div>

          <p className={s.desc} data-typing={!desc.done || undefined}>
            {desc.shown}
          </p>

          <ul className={s.options} data-in={optionsIn || undefined}>
            {demo.options.map((option, i) => {
              const usable = isAffordable(option);
              const isPicked = option.id === pickedId;
              const dimmed = pickedId !== null && !isPicked;
              return (
                <li
                  key={option.id}
                  className={s.optionRow}
                  style={
                    { "--i": i, "--out": chosenIndex >= 0 ? i - chosenIndex : 0 } as CSSProperties
                  }
                  data-dimmed={dimmed || undefined}
                >
                  <button
                    type="button"
                    className={s.option}
                    data-picked={isPicked || undefined}
                    disabled={!usable || pickedId !== null}
                    aria-disabled={!usable}
                    onMouseEnter={() => setHoverId(option.id)}
                    onMouseLeave={() => setHoverId((cur) => (cur === option.id ? null : cur))}
                    onFocus={() => setHoverId(option.id)}
                    onBlur={() => setHoverId((cur) => (cur === option.id ? null : cur))}
                    onClick={() => pick(option)}
                  >
                    {/* 圆形编号徽章: hover/选中时描边环补满一圈。 */}
                    <span className={s.optIndex}>
                      <svg className={s.optRing} viewBox="0 0 36 36" aria-hidden>
                        <circle className={s.optRingTrack} cx="18" cy="18" r="16" />
                        <circle className={s.optRingFill} cx="18" cy="18" r="16" />
                      </svg>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className={s.optText}>
                      <span className={s.optName}>{option.name}</span>
                      <span className={s.optHint}>
                        {usable ? option.hint : "资源不足 · 无法选择"}
                      </span>
                    </span>
                    <span className={s.optCosts}>
                      {option.costs.length === 0 ? (
                        <span className={s.costFree}>无消耗</span>
                      ) : (
                        option.costs.map((c) => (
                          <span
                            key={c.res}
                            className={s.cost}
                            data-lack={RESOURCE_POOL[c.res] < c.amount ? "" : undefined}
                          >
                            <em aria-hidden>{RESOURCE_META[c.res].sigil}</em>
                            {RESOURCE_META[c.res].label} {c.amount}
                          </span>
                        ))
                      )}
                    </span>
                    <span className={s.optArrow} aria-hidden>
                      <svg viewBox="0 0 24 24" width="18" height="18">
                        <path
                          d="M5 12h13M12.5 6.5 18 12l-5.5 5.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className={s.optFlash} aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {picked && phase !== "picking" && (
        <Settlement
          option={picked}
          rewardPending={rewardPending}
          claimed={rewardClaimed}
          confirmed={phase === "done"}
          onClaim={() => setRewardClaimed(true)}
          onConfirm={() => setPhase("done")}
        />
      )}
    </article>
  );
}

/** 结算区: 故事结果 + 结算摘要 + 奖励待处理 + 确认。 */
function Settlement({
  option,
  rewardPending,
  claimed,
  confirmed,
  onClaim,
  onConfirm,
}: {
  option: EventOption;
  rewardPending: boolean;
  claimed: boolean;
  confirmed: boolean;
  onClaim: () => void;
  onConfirm: () => void;
}) {
  // 结算区自己也有一拍: 面板展开 → 结果逐字 → 摘要一条条点亮。
  const story = useTypewriter(option.story, 320, 44);

  return (
    <section className={s.settle} data-confirmed={confirmed || undefined}>
      <div className={s.settleGrid}>
        <div className={s.storyBlock}>
          <h3 className={s.blockTitle}>故事结果</h3>
          <p className={s.story} data-typing={!story.done || undefined}>
            {story.shown}
          </p>
        </div>

        <div className={s.outcomeBlock}>
          <h3 className={s.blockTitle}>结算摘要</h3>
          <ul className={s.outcome}>
            {option.outcome.map((entry, i) => (
              <li
                key={entry.label}
                className={s.outcomeRow}
                data-tone={entry.tone}
                style={{ "--i": i } as CSSProperties}
              >
                <span className={s.outLabel}>{entry.label}</span>
                <span className={s.outDots} aria-hidden />
                <span className={s.outValue}>{entry.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <footer className={s.settleFoot}>
        {option.reward ? (
          <div className={s.reward} data-claimed={claimed || undefined}>
            <span className={s.rewardDot} aria-hidden />
            <span className={s.rewardText}>
              <strong>{claimed ? "奖励已处理" : option.reward.title}</strong>
              <em>{claimed ? "可以确认本节点了" : option.reward.detail}</em>
            </span>
            {!claimed && (
              <button type="button" className={s.rewardBtn} onClick={onClaim}>
                前往处理
              </button>
            )}
          </div>
        ) : (
          <div className={s.reward} data-claimed="">
            <span className={s.rewardDot} aria-hidden />
            <span className={s.rewardText}>
              <strong>无待处理奖励</strong>
              <em>本次选择不产出需要另行处理的收益</em>
            </span>
          </div>
        )}

        <button
          type="button"
          className={s.confirm}
          disabled={rewardPending || confirmed}
          onClick={onConfirm}
        >
          <span className={s.confirmLabel}>
            {confirmed ? "节点已确认" : rewardPending ? "奖励待处理" : "确认离开"}
          </span>
          <span className={s.confirmGlow} aria-hidden />
        </button>
      </footer>
    </section>
  );
}

export function OpusEventPanel() {
  const [kind, setKind] = useState<EventKind>("survival");
  // runId 只用来强制重挂载 EventRun —— 重置 = 让整套入场动画从头再来一遍。
  const [runId, setRunId] = useState(0);

  const switchKind = (next: EventKind) => {
    setKind(next);
    setRunId((n) => n + 1);
  };

  const activeIndex = EVENT_KINDS.indexOf(kind);

  return (
    <div className={s.stage} data-kind={kind}>
      <div className={s.stageGlow} aria-hidden />

      <nav className={s.switcher} aria-label="事件类型">
        {/* 胶囊切换器: 高亮块是**一个**滑块, 在三档之间平移 —— 位置由 --active 算, 不是三份状态样式。 */}
        <div className={s.segments} style={{ "--active": activeIndex } as CSSProperties}>
          <span className={s.thumb} aria-hidden />
          {EVENT_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              className={s.segment}
              data-on={k === kind || undefined}
              aria-pressed={k === kind}
              onClick={() => switchKind(k)}
            >
              {EVENT_DEMOS[k].kindLabel}
              <small>{EVENT_DEMOS[k].serial}</small>
            </button>
          ))}
        </div>

        <button type="button" className={s.reset} onClick={() => setRunId((n) => n + 1)}>
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
            <path
              d="M20 12a8 8 0 1 1-2.6-5.9M20 4.5v4h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          重播
        </button>
      </nav>

      <EventRun key={`${kind}-${runId}`} demo={EVENT_DEMOS[kind]} />
    </div>
  );
}
