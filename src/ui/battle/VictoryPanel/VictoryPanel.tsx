import { useEffect, useRef, useState, type CSSProperties } from "react";
import { RULES } from "@/engine";
import { getItemDef } from "@/data";
import { useExploreStore } from "@/store/exploreStore";
import { useRunStore } from "@/store/runStore";
import { useTownStore } from "@/store/townStore";
import type { ContextMenuItem } from "@/ui/common/item/ItemContextMenu";
import { useChangePulse } from "@/ui/hooks/useChangePulse";
import { cx } from "@/ui/common/cx";
import { victoryChoreoVars, victorySectionStagger, victoryTiming } from "@/ui/battle/victoryChoreo";
import { VictoryExpRow } from "@/ui/battle/VictoryExpRow";
import { VictoryDropSection } from "@/ui/battle/VictoryDropSection";
import { VictoryLootTray, type VictoryLootTrayHandle } from "@/ui/battle/VictoryLootTray";
import { VictoryBoonTray } from "@/ui/battle/VictoryBoonTray/VictoryBoonTray";
import { VictoryCardOffer } from "@/ui/battle/VictoryCardOffer/VictoryCardOffer";
import { VictoryBackpack } from "@/ui/battle/VictoryBackpack";
import { VictoryPlaque } from "@/ui/battle/VictoryPlaque";
import s from "./VictoryPanel.module.css";

const BACKPACK_COLUMNS = 12;
const BACKPACK_ROWS = Math.ceil(RULES.burden.backpackSlots / BACKPACK_COLUMNS);

export function VictoryPanel() {
  const battleSettled = useRunStore((state) => state.battleSettled);
  const expReport = useRunStore((state) => state.expReport);
  const lastDropK = useRunStore((state) => state.lastDropK);
  const lastDropTier = useRunStore((state) => state.lastDropTier);
  const lastChallengeBonus = useRunStore((state) => state.lastChallengeBonus);
  const lastChallenges = useRunStore((state) => state.lastChallenges);
  const confirmExpReport = useRunStore((state) => state.confirmExpReport);
  const session = useExploreStore((state) => state.session);
  const abandonLoot = useExploreStore((state) => state.abandonLoot);
  const abandonBoons = useExploreStore((state) => state.abandonBoons);
  const discardItem = useExploreStore((state) => state.discardItem);
  const reorderBackpack = useExploreStore((state) => state.reorderBackpack);
  const characters = useTownStore((state) => state.characters);
  const [confirmingAbandon, setConfirmingAbandon] = useState(false);
  const [continueNudge, setContinueNudge] = useState(false);
  const [pickedUids, setPickedUids] = useState<ReadonlySet<string>>(new Set());
  const trayRef = useRef<VictoryLootTrayHandle>(null);
  const pickedPulseTimersRef = useRef(new Map<string, number>());
  const backpack = session?.backpack ?? [];
  const pendingLoot = session?.pendingLoot ?? [];
  const pendingBoons = session?.pendingBoons ?? [];
  const pendingCardOffer = session?.pendingCardOffer ?? null;
  const pendingRewardCount = pendingLoot.length + pendingBoons.length + (pendingCardOffer ? 1 : 0);
  const timing = victoryTiming();
  const pulseSignature = Object.fromEntries(backpack.map((stack) => [stack.uid, stack.count]));
  const pulsedUids = useChangePulse(pulseSignature);
  const lootCountPulsed = useChangePulse({ count: pendingLoot.length }, timing.stateFadeMs);

  useEffect(() => {
    if (!continueNudge) return;
    const timer = window.setTimeout(() => setContinueNudge(false), victoryTiming().continueNudgeMs);
    return () => window.clearTimeout(timer);
  }, [continueNudge]);

  useEffect(() => () => {
    pickedPulseTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    pickedPulseTimersRef.current.clear();
  }, []);

  const handlePicked = (uid: string) => {
    setPickedUids((current) => new Set([...current, uid]));
    const previousTimer = pickedPulseTimersRef.current.get(uid);
    if (previousTimer != null) window.clearTimeout(previousTimer);
    const timer = window.setTimeout(() => {
      pickedPulseTimersRef.current.delete(uid);
      setPickedUids((current) => {
        if (!current.has(uid)) return current;
        const next = new Set(current);
        next.delete(uid);
        return next;
      });
    }, victoryTiming().pickPulseMs);
    pickedPulseTimersRef.current.set(uid, timer);
  };

  if (!battleSettled || !session) return null;

  const expByCharacter = new Map(expReport.map((gain) => [gain.charId, gain]));
  const handleReorder = (fromIndex: number, toIndex: number) => {
    const stack = backpack[fromIndex];
    if (stack) reorderBackpack(stack.uid, toIndex);
  };
  const contextMenuItems = (stack: (typeof backpack)[number]): ContextMenuItem[] => [
    {
      key: "discard",
      label: "丢弃这一堆",
      danger: true,
      onSelect: () => {
        if (window.confirm(`丢弃 ${getItemDef(stack.itemId).name}？`)) discardItem(stack.uid);
      },
    },
  ];
  const handleContinue = () => {
    if (pendingRewardCount) {
      setContinueNudge(true);
      return;
    }
    confirmExpReport();
  };
  const handleAbandon = () => {
    abandonLoot();
    abandonBoons();
    setConfirmingAbandon(false);
  };

  return (
    <div
      className={s["victory-layer"]}
      style={victoryChoreoVars()}
      onClick={(event) => event.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label="战斗胜利结算"
    >
      <div className={s["panel-stage"]}>
        <div className={s["panel-reveal"]}>
          <section className={s["victory-panel"]}>
          <span className={s["panel-sweep"]} aria-hidden="true" />
          <header className={s["panel-head"]}>
            <div>
              <span className={s["panel-kicker"]}>战斗结算</span>
              <h2>战斗胜利</h2>
            </div>
            <VictoryDropSection
              dropK={lastDropK}
              tier={lastDropTier}
              challenges={lastChallenges}
              challengeBonus={lastChallengeBonus}
              style={{ "--vc-delay": `${timing.contentDelayMs + Number.parseFloat(victorySectionStagger(0))}ms` } as CSSProperties}
            />
          </header>

          <div className={s["panel-body"]}>
            <main className={s["panel-main"]}>
              <section
                className={cx(s["exp-section"], s["victory-section"])}
                style={{ "--vc-delay": `${timing.contentDelayMs + Number.parseFloat(victorySectionStagger(1))}ms` } as CSSProperties}
              >
                <div className={s["exp-list"]}>
                  {session.party.map((member, index) => (
                    <VictoryExpRow
                      key={member.charId}
                      member={member}
                      gain={expByCharacter.get(member.charId) ?? null}
                      fallbackExp={characters[member.charId]?.exp ?? 0}
                      index={index}
                    />
                  ))}
                </div>
              </section>

              <div className={s["loot-stack"]}>
                <VictoryBoonTray
                  style={{ "--vc-delay": `${timing.contentDelayMs + Number.parseFloat(victorySectionStagger(2))}ms` } as CSSProperties}
                />
                <section
                  className={cx(s["loot-section"], s["victory-section"])}
                  style={{ "--vc-delay": `${timing.contentDelayMs + Number.parseFloat(victorySectionStagger(3))}ms` } as CSSProperties}
                >
                  <div className={s["section-row"]}>
                    <VictoryPlaque
                      label="战利品"
                      readout={pendingLoot.length ? `${pendingLoot.length} 件` : "已清空"}
                      pulse={lootCountPulsed.has("count")}
                    />
                    <VictoryLootTray ref={trayRef} onPicked={handlePicked} />
                  </div>
                </section>
              </div>

              <section
                className={cx(s["backpack-section"], s["victory-section"])}
                style={{ "--vc-delay": `${timing.contentDelayMs + Number.parseFloat(victorySectionStagger(4))}ms` } as CSSProperties}
              >
                <VictoryBackpack
                  stacks={backpack}
                  rows={BACKPACK_ROWS}
                  columns={BACKPACK_COLUMNS}
                  capacity={RULES.burden.backpackSlots}
                  pulseUids={new Set([...pulsedUids, ...pickedUids])}
                  onReorder={handleReorder}
                  contextMenuItems={contextMenuItems}
                />
              </section>
            </main>

          </div>
          <VictoryCardOffer />
          <footer className={s["panel-footer"]}>
            <div className={s["footer-switch"]}>
              {confirmingAbandon ? (
                <div key="confirm" className={cx(s["footer-state"], s["confirm-strip"])}>
                  <span>放弃剩余 {pendingRewardCount} 项奖励？</span>
                  <button className={cx(s["action-button"], s["danger"])} type="button" onClick={handleAbandon}>确认放弃</button>
                  <button className={s["action-button"]} type="button" onClick={() => setConfirmingAbandon(false)}>返回</button>
                </div>
              ) : (
                <div key="actions" className={s["footer-state"]}>
                  <button className={cx(s["action-button"], s["primary"])} type="button" onClick={() => trayRef.current?.takeAll()} disabled={!pendingLoot.length}>全部拾取</button>
                  <button className={cx(s["action-button"], s["danger"])} type="button" onClick={() => setConfirmingAbandon(true)} disabled={!pendingRewardCount}>放弃剩余</button>
                </div>
              )}
            </div>
            <button
              className={cx(s["action-button"], s["continue"], pendingRewardCount > 0 && s["is-blocked"], continueNudge && s["is-nudging"])}
              type="button"
              aria-disabled={pendingRewardCount > 0}
              onClick={handleContinue}
            >
              {pendingRewardCount ? `还有 ${pendingRewardCount} 项奖励未处理` : "继续"}
            </button>
          </footer>
          </section>
        </div>
      </div>
    </div>
  );
}
