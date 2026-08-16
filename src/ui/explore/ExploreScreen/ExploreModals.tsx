import { type CSSProperties, type MouseEvent, type ReactNode } from "react";
import type { EventChoice, ExploreState, NodeEvent, NpcEventLike } from "@/explore/types";
import type { ItemStack } from "@/items/types";
import { getItemDef } from "@/data";
import { npcChoices } from "@/explore/session";
import { countByItemId } from "@/items/inventory";
import ItemSlot from "@/ui/common/item/ItemSlot";
import {
  EventPanel,
  EventPanelBriefing,
  EventPanelChoice,
  EventPanelResult,
  type EventPanelOption,
  type EventPanelScene,
} from "@/ui/common/EventPanel";
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
  scene: EventPanelScene;
}

export interface RestModalView {
  session: ExploreState;
  hiddenRest: NonNullable<NodeEvent["hiddenRest"]>;
  restFood: ItemStack | null;
  scene: EventPanelScene;
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
  scene: EventPanelScene;
}

interface EventModalProps {
  view: EventModalView;
  closing: boolean;
  onTakeOption: (index: number, event?: MouseEvent<HTMLButtonElement>) => void;
  onConfirm: () => void;
  onAdvance: () => void;
  onBack: () => void;
}

const eventKindLabel: Record<NodeEvent["kind"], string> = {
  hazard: "风险事件",
  loot: "成长事件",
  heal: "生存事件",
  merchant: "经济事件",
  route: "路线事件",
  energy: "能量事件",
  retreat: "撤离事件",
  battle: "战斗事件",
  empty: "空节点",
};

function EventShell({ children, view, closing }: { children: ReactNode; view: EventModalView; closing: boolean }) {
  const { session, ev } = view;
  return (
    <div className={s["expl-modal"]} data-closing={closing || undefined}>
      <section
        className={cx(s["expl-panel"], s[`k-${ev.kind}`], s["panel-reveal"], session.phase === "shopping" && s["is-shopping"])}
        data-closing={closing || undefined}
        style={panelRevealVars()}
      >
        <span className={s["panel-bar"]} aria-hidden />
        <span className={s["panel-frame"]} aria-hidden />
        <span className={s["panel-scan"]} aria-hidden />
        {children}
      </section>
    </div>
  );
}

export function EventModal({ view, closing, onTakeOption, onConfirm, onAdvance, onBack }: EventModalProps) {
  const { session, ev } = view;
  const shopping = session.phase === "shopping";
  const briefing = view.scene === "briefing";
  const choiceOptions: EventPanelOption[] = view.choiceList.map((choice, index) => {
    const requiredCount = choice.cost?.count ?? 0;
    const availableCount = choice.cost ? countByItemId(session.backpack, choice.cost.itemId) : 0;
    const costUnavailable = Boolean(choice.cost && availableCount < requiredCount);
    return {
      id: choice.id,
      name: choice.label,
      cost: choice.cost
        ? costUnavailable
          ? "背包中没有指定食品"
          : `需要 ${getItemDef(choice.cost.itemId).name} ×${requiredCount}`
        : undefined,
      costTone: costUnavailable ? "red" : choice.cost ? "cyan" : undefined,
      disabled: costUnavailable || session.phase === "inBattle" || view.committing != null,
      disabledReason: costUnavailable ? "背包中没有指定食品" : undefined,
      state: view.committing == null ? undefined : view.committing === index ? "chosen" : "dimmed",
      index: index * 90 + 100,
    };
  });

  const resultNotes = session.pendingNotes.length
    ? session.pendingNotes.map((note, index) => ({ text: note, delayMs: view.beats.noteAt(index) }))
    : [{ text: "无结算", delayMs: view.beats.noteAt(0) }];
  const footNote = view.mustReplace
    ? "先在背包里处理完拿不下的东西"
    : view.hasLoot
      ? "先处理事件物品"
      : view.hasPendingAction
        ? "先处理事件奖励"
        : "结算完毕";

  return (
    <EventShell view={view} closing={closing}>
      <EventPanel
        accent="var(--k)"
        kicker={`${eventKindLabel[ev.kind]} · ${ev.category}`}
        title={eventKindLabel[ev.kind]}
        scene={view.scene}
        sceneKey={`${session.round}-${session.currentSegment}-${ev.id}`}
      >
        {briefing && (
          <EventPanelBriefing
            sceneName={ev.kind.toUpperCase()}
            glyph={ev.kind === "battle" ? "!" : "◆"}
            heading={ev.title}
            label={`${eventKindLabel[ev.kind]} / 情报`}
            subtitle=""
            body={view.desc.shown}
            typingBody={!view.desc.done}
            meta={[
              { icon: "⌁", text: "当前区域 · 废弃楼层" },
              { icon: "◷", text: "节点剩余 02" },
            ]}
            advanceLabel={shopping ? "交易终端已打开" : "查看可用行动"}
            advanceDisabled={shopping || !view.choiceReady}
            onAdvance={onAdvance}
          />
        )}
        {view.scene === "choice" && (
          <EventPanelChoice
            heading="你要怎么做？"
            hint="选择一条行动路径。点击后立即结算事件结果。"
            signal={<>可用路径 {choiceOptions.filter((option) => !option.disabled).length} / {choiceOptions.length}</>}
            options={choiceOptions}
            onPick={(index, event) => onTakeOption(index, event)}
            backLabel={session.phase === "roundBattle" || session.phase === "inBattle" ? undefined : "返回情报"}
            onBack={session.phase === "roundBattle" || session.phase === "inBattle" ? undefined : onBack}
          />
        )}
        {view.scene === "result" && (
          <EventPanelResult
            seal="✓"
            eyebrow="03 / RESOLVED"
            heading="事件已结算"
            story={view.story.shown}
            typingStory={!view.story.done}
            notes={resultNotes}
            footNote={footNote}
            confirmLabel="确认 ▸"
            confirmDisabled={view.mustReplace || view.hasLoot || view.hasPendingAction || !view.narrationDone}
            onConfirm={onConfirm}
          />
        )}
      </EventPanel>
    </EventShell>
  );
}

interface RestModalProps {
  view: RestModalView;
  closing: boolean;
  onEat: (uid: string) => void;
  onSkip: () => void;
  onAdvance: () => void;
  onBack: () => void;
}

export function RestModal({ view, closing, onEat, onSkip, onAdvance, onBack }: RestModalProps) {
  const { restFood, hiddenRest } = view;
  const options: EventPanelOption[] = [
    {
      id: "eat",
      name: restFood ? `食用 ${getItemDef(restFood.itemId).name}，唤来隐藏访客` : "食用指定食品，唤来隐藏访客",
      leading: restFood ? <ItemSlot stack={restFood} showName={false} /> : undefined,
      cost: restFood ? "食品会从背包中消耗" : "背包中没有指定食品",
      costTone: restFood ? "amber" : "red",
      disabled: !restFood,
      disabledReason: !restFood ? "资源不足" : undefined,
    },
    { id: "skip", name: "跳过休息" },
  ];
  return (
    <div className={s["expl-modal"]} data-closing={closing || undefined}>
      <section className={cx(s["expl-panel"], s["panel-reveal"])} data-closing={closing || undefined} style={panelRevealVars()}>
        <span className={s["panel-bar"]} aria-hidden />
        <span className={s["panel-frame"]} aria-hidden />
        <span className={s["panel-scan"]} aria-hidden />
        <EventPanel
          accent="#b9df54"
          kicker="隐藏休息 · 事件后的额外选择"
          title="隐藏休息"
          scene={view.scene}
          sceneKey={`rest-${hiddenRest.foodItemId}`}
        >
          {view.scene === "briefing" ? (
            <EventPanelBriefing
              sceneName="SAFE REST"
              glyph="+"
              heading="要在这里休息吗？"
              body="你可以消耗指定食品，唤来隐藏访客；也可以跳过休息，继续前往下一个节点。"
              meta={[{ icon: "⌁", text: "隐藏休息点" }]}
              advanceLabel="查看可用行动"
              onAdvance={onAdvance}
            />
          ) : (
            <EventPanelChoice
              heading="选择休息方式"
              hint="食品会在确认行动时从背包中消耗。"
              signal={<>可用路径 {restFood ? 2 : 1} / 2</>}
              options={options}
              onPick={(index) => index === 0 && restFood ? onEat(restFood.uid) : onSkip()}
              backLabel="返回情报"
              onBack={onBack}
            />
          )}
        </EventPanel>
      </section>
    </div>
  );
}

interface NpcModalProps {
  view: NpcModalView;
  closing: boolean;
  onChoose: (index: number) => void;
  onConfirm: () => void;
  onAdvance: () => void;
  onBack: () => void;
}

export function NpcModal({ view, closing, onChoose, onConfirm, onAdvance, onBack }: NpcModalProps) {
  const { session, npc } = view;
  const resolving = session.phase === "npcResolving";
  const story: ReactNode = session.pendingStory.length ? (
    <div className={s["eventResultStory"]}>
      {session.pendingStory.map((part, index) => (
        <p key={`${part}-${index}`} style={{ "--story-delay": `${view.beats.storyAt(index)}ms` } as CSSProperties}>{part}</p>
      ))}
    </div>
  ) : "";
  const options = npcChoices(session).map((choice) => ({ id: choice.id, name: choice.label }));
  const notes = session.pendingNotes.map((note, index) => ({ text: note, delayMs: view.beats.noteAt(index) }));
  return (
    <div className={s["expl-modal"]} data-closing={closing || undefined}>
      <section className={cx(s["expl-panel"], s["panel-reveal"])} data-closing={closing || undefined} style={panelRevealVars()}>
        <span className={s["panel-bar"]} aria-hidden />
        <span className={s["panel-frame"]} aria-hidden />
        <span className={s["panel-scan"]} aria-hidden />
        <EventPanel
          accent="#63d6d1"
          kicker={resolving ? "隐藏 NPC · 结果记录" : "隐藏 NPC · 特殊事件"}
          title="隐藏 NPC"
          scene={view.scene}
          sceneKey={`npc-${npc.id}`}
        >
          {view.scene === "briefing" && (
            <EventPanelBriefing
              sceneName="HIDDEN VISITOR"
              glyph="?"
              heading={npc.title}
              body={npc.description}
              meta={[{ icon: "⌁", text: "隐藏事件" }]}
              advanceLabel="查看可用行动"
              onAdvance={onAdvance}
            />
          )}
          {view.scene === "choice" && (
            <EventPanelChoice
              heading="选择回应方式"
              hint="你的选择将决定隐藏访客留下的记录。"
              signal={<>可用路径 {options.length} / {options.length}</>}
              options={options}
              onPick={onChoose}
              backLabel="返回情报"
              onBack={onBack}
            />
          )}
          {view.scene === "result" && (
            <EventPanelResult
              seal="✓"
              eyebrow="03 / HIDDEN RECORD"
              heading="隐藏事件已结算"
              story={story}
              notes={notes}
              footNote={view.hasLoot || view.hasPendingAction ? "先处理上方奖励" : "隐藏事件已结算"}
              confirmLabel="返回路线 ▸"
              confirmDisabled={view.hasLoot || view.hasPendingAction || !view.narrationDone}
              onConfirm={onConfirm}
            />
          )}
        </EventPanel>
      </section>
    </div>
  );
}
