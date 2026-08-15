import { useLayoutEffect, useRef, type CSSProperties, type MouseEvent } from "react";
import type { EventChoice, ExploreState, NodeEvent, NpcEventLike } from "@/explore/types";
import type { ItemStack } from "@/items/types";
import { getItemDef } from "@/data";
import { npcChoices } from "@/explore/session";
import { countByItemId } from "@/items/inventory";
import { eventArt } from "@/ui/art/eventArt";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { cx } from "@/ui/common/cx";
import { panelRevealVars } from "@/ui/explore/styles/panelReveal";
import s from "./ExploreScreen.module.css";

export interface TextBeat {
  shown: string;
  done: boolean;
}

export interface EventModalView {
  session: ExploreState;
  ev: NodeEvent;
  choiceList: { id: string; label: string; cost?: EventChoice["cost"] }[];
  desc: TextBeat;
  story: TextBeat;
  storyText: string;
  beats: {
    noteAt: (index: number) => number;
  };
  choiceReady: boolean;
  committing: number | null;
  narrationDone: boolean;
  mustReplace: boolean;
  hasLoot: boolean;
  hasPendingAction: boolean;
  reducedMotion: boolean;
}

export interface RestModalView {
  session: ExploreState;
  hiddenRest: NonNullable<NodeEvent["hiddenRest"]>;
  restFood: ItemStack | null;
}

export interface NpcModalView {
  session: ExploreState;
  npc: NpcEventLike;
  beats: {
    storyAt: (index: number) => number;
    noteAt: (index: number) => number;
  };
  hasLoot: boolean;
  hasPendingAction: boolean;
  narrationDone: boolean;
}

interface EventModalProps {
  view: EventModalView;
  closing: boolean;
  onTakeOption: (index: number) => void;
  onConfirm: () => void;
}

export function EventModal({ view, closing, onTakeOption, onConfirm }: EventModalProps) {
  const { session, ev } = view;
  const descScrollRef = useRef<HTMLParagraphElement>(null);
  const descLiveRef = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const scrollBox = descScrollRef.current;
    const liveText = descLiveRef.current;
    if (!scrollBox || !liveText) return;
    scrollBox.scrollTop = Math.max(0, liveText.scrollHeight - scrollBox.clientHeight);
  }, [view.desc.shown, view.story.shown]);

  return (
    <div
      className={s["expl-modal"]}
      data-closing={closing || undefined}
      key={`${session.round}-${session.currentSegment}-${ev.id}`}
    >
      <section
        className={cx(
          s["expl-panel"],
          s[`k-${ev.kind}`],
          s["panel-reveal"],
          (session.phase === "landed" || session.phase === "roundBattle" || session.phase === "inBattle") && s["has-choices"],
          session.phase === "shopping" && s["is-shopping"],
        )}
        data-closing={closing || undefined}
        style={panelRevealVars()}
      >
        <span className={s["panel-bar"]} aria-hidden />
        <span className={s["panel-frame"]} aria-hidden />
        <span className={s["panel-scan"]} aria-hidden />
        <aside className={s["expl-panel-aside"]} aria-hidden="true">
          <div className={s["expl-panel-art"]}>
            <img className={s["expl-panel-image"]} src={eventArt(ev.kind)} alt="" />
            <div className={s["expl-panel-art-grid"]} />
            <span className={s["expl-panel-art-mark"]}>◆</span>
          </div>
        </aside>
        <div className={s["expl-panel-content"]}>
          <h3 className={s["expl-panel-title"]}>
            {view.reducedMotion
              ? ev.title
              : Array.from(ev.title).map((ch, i) => (
                  <span
                    key={i}
                    className={s["expl-title-char"]}
                    style={{ animationDelay: `${EVENT_BEAT.titleStart + i * EVENT_BEAT.titleChar}ms` } as CSSProperties}
                  >
                    {ch === " " ? " " : ch}
                  </span>
                ))}
          </h3>
          <div className={s["expl-panel-read"]}>
            <p
              className={s["expl-panel-desc"]}
              ref={descScrollRef}
              aria-label={[ev.description, view.storyText].filter(Boolean).join("\n\n")}
            >
              <span className={s["expl-desc-ghost"]} aria-hidden>
                {ev.description}
                {view.storyText ? `\n\n${view.storyText}` : ""}
              </span>
              <span className={s["expl-desc-live"]} ref={descLiveRef} aria-hidden>
                {view.desc.shown}
                {view.desc.done && view.storyText ? `\n\n${view.story.shown}` : ""}
                {(!view.desc.done || (view.desc.done && view.storyText && !view.story.done)) && (
                  <span className={s["expl-caret"]} />
                )}
              </span>
            </p>
          </div>
          {session.phase !== "shopping" && (
            <div className={s["expl-panel-act"]}>
              {session.phase === "landed" || session.phase === "roundBattle" || session.phase === "inBattle" ? (
                <div
                  className={cx(
                    s["expl-choices"],
                    view.choiceReady && s["is-armed"],
                    view.committing != null && s["is-closing"],
                  )}
                  style={{ "--choice-stagger": `${EVENT_BEAT.choiceStagger}ms` } as CSSProperties}
                >
                  {view.choiceList.map((choice, index) => {
                    const state =
                      view.committing == null
                        ? undefined
                        : view.committing === index
                          ? s["is-chosen"]
                          : s["is-dimmed"];
                    const requiredCount = choice.cost?.count ?? 0;
                    const availableCount = choice.cost
                      ? countByItemId(session.backpack, choice.cost.itemId)
                      : 0;
                    const costUnavailable = Boolean(choice.cost && availableCount < requiredCount);
                    return (
                      <button
                        key={choice.id}
                        className={cx(s["expl-choice"], state, costUnavailable && s["is-cost-locked"])}
                        type="button"
                        disabled={!view.choiceReady || view.committing != null || costUnavailable || session.phase === "inBattle"}
                        title={
                          choice.cost
                            ? costUnavailable
                              ? "背包中没有指定食品"
                              : `需要 ${getItemDef(choice.cost.itemId).name} ×${requiredCount}`
                            : undefined
                        }
                        style={{ "--i": index } as CSSProperties}
                        onClick={() => onTakeOption(index)}
                      >
                        <span className={s["expl-choice-bar"]} aria-hidden />
                        <span className={s["expl-choice-index"]} aria-hidden>{String(index + 1).padStart(2, "0")}</span>
                        <span className={s["expl-choice-label"]}>{choice.label}</span>
                        {choice.cost && (
                          <span className={s["expl-choice-cost"]}>
                            {costUnavailable ? "背包中没有指定食品" : `需要 ${getItemDef(choice.cost.itemId).name} ×${requiredCount}`}
                          </span>
                        )}
                        <span className={s["expl-choice-arrow"]} aria-hidden>▸</span>
                      </button>
                    );
                  })}
                </div>
              ) : session.phase === "resolving" ? (
                <>
                  <div className={s["expl-notes"]}>
                    {session.pendingNotes.length ? (
                      session.pendingNotes.map((note, index) => (
                        <span key={index} className={s["expl-note"]} style={{ animationDelay: `${view.beats.noteAt(index)}ms` } as CSSProperties}>
                          {note}
                        </span>
                      ))
                    ) : (
                      <span className={cx(s["expl-note"], s["is-muted"])} style={{ animationDelay: `${view.beats.noteAt(0)}ms` } as CSSProperties}>
                        无结算
                      </span>
                    )}
                  </div>
                  <div className={s["expl-panel-foot"]}>
                    <span className={s["expl-panel-cost"]}>
                      {view.mustReplace
                        ? "先在背包里处理完拿不下的东西"
                        : view.hasLoot
                          ? "先处理事件物品"
                          : view.hasPendingAction
                            ? "先处理事件奖励"
                            : "结算完毕"}
                    </span>
                    <button
                      className={cx(s["expl-btn"], s["is-primary"], s["expl-confirm"])}
                      type="button"
                      disabled={view.mustReplace || view.hasLoot || view.hasPendingAction || !view.narrationDone}
                      style={{ animationDelay: `${view.beats.noteAt(Math.max(1, session.pendingNotes.length) - 1)}ms` } as CSSProperties}
                      onClick={onConfirm}
                    >
                      确认 ▸
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

interface RestModalProps {
  view: RestModalView;
  closing: boolean;
  onEat: (uid: string) => void;
  onSkip: () => void;
}

export function RestModal({ view, closing, onEat, onSkip }: RestModalProps) {
  const { restFood, hiddenRest } = view;
  return (
    <div className={s["expl-modal"]} data-closing={closing || undefined}>
      <section
        className={cx(s["expl-panel"], s["expl-panel-decide"], s["panel-reveal"])}
        data-closing={closing || undefined}
        style={panelRevealVars()}
      >
        <span className={s["panel-bar"]} aria-hidden />
        <span className={s["panel-frame"]} aria-hidden />
        <span className={s["panel-scan"]} aria-hidden />
        <span className={s["expl-kicker"]}>隐藏休息 · 事件后的额外选择</span>
        <h3 className={s["expl-panel-title"]}>要在这里休息吗？</h3>
        <div className={s["expl-panel-slot"]}>
          <p className={s["expl-panel-desc"]}>你可以消耗指定食品，唤来隐藏访客；也可以跳过休息，继续前往下一个节点。</p>
          {hiddenRest && restFood ? (
            <div className={s["expl-rest-food"]}>
              <ItemSlot stack={restFood} showName={false} onClick={() => onEat(restFood.uid)} />
              <span>食用 {getItemDef(restFood.itemId).name}，唤来隐藏访客</span>
            </div>
          ) : (
            <p className={s["expl-empty"]}>背包中没有指定食品。</p>
          )}
        </div>
        <div className={s["expl-panel-foot"]}>
          <span className={s["expl-panel-cost"]}>{hiddenRest && restFood ? "食品会从背包中消耗" : "无法触发隐藏访客"}</span>
          <button className={s["expl-btn"]} type="button" onClick={onSkip}>跳过休息</button>
        </div>
      </section>
    </div>
  );
}

interface NpcModalProps {
  view: NpcModalView;
  closing: boolean;
  onChoose: (index: number) => void;
  onConfirm: () => void;
}

export function NpcModal({ view, closing, onChoose, onConfirm }: NpcModalProps) {
  const { session, npc } = view;
  const resolving = session.phase === "npcResolving";
  return (
    <div className={s["expl-modal"]} data-closing={closing || undefined}>
      <section
        className={cx(s["expl-panel"], s["expl-panel-decide"], s["panel-reveal"])}
        data-closing={closing || undefined}
        style={panelRevealVars()}
      >
        <span className={s["panel-bar"]} aria-hidden />
        <span className={s["panel-frame"]} aria-hidden />
        <span className={s["panel-scan"]} aria-hidden />
        <span className={s["expl-kicker"]}>{resolving ? "隐藏 NPC · 结果记录" : "隐藏 NPC · 特殊事件"}</span>
        <h3 className={s["expl-panel-title"]}>{npc.title}</h3>
        <div className={s["expl-panel-slot"]}>
          {resolving ? (
            <>
              {session.pendingStory.length > 0 && (
                <div className={s["expl-story"]} aria-live="polite">
                  {session.pendingStory.map((story, index) => (
                    <p key={`${story}-${index}`} style={{ animationDelay: `${view.beats.storyAt(index)}ms` } as CSSProperties}>{story}</p>
                  ))}
                </div>
              )}
              <div className={s["expl-notes"]}>
                {session.pendingNotes.map((note, index) => (
                  <span className={s["expl-note"]} key={`${note}-${index}`} style={{ animationDelay: `${view.beats.noteAt(index)}ms` } as CSSProperties}>{note}</span>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className={s["expl-panel-desc"]}>{npc.description}</p>
              <div className={s["expl-decide-row"]}>
                {npcChoices(session).map((choice, index) => (
                  <button className={s["expl-choice"]} type="button" key={choice.id} style={{ "--i": index } as CSSProperties} onClick={() => onChoose(index)}>
                    <span className={s["expl-choice-bar"]} aria-hidden />
                    <span className={s["expl-choice-label"]}>{choice.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        {resolving && (
          <div className={s["expl-panel-foot"]}>
            <span className={s["expl-panel-cost"]}>{view.hasLoot || view.hasPendingAction ? "先处理上方奖励" : "隐藏事件已结算"}</span>
            <button className={cx(s["expl-btn"], s["is-primary"])} type="button" disabled={view.hasLoot || view.hasPendingAction || !view.narrationDone} onClick={onConfirm}>
              返回路线 ▸
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

const EVENT_BEAT = {
  titleStart: 380,
  titleChar: 45,
  choiceStagger: 90,
} as const;