import { useEffect, useState, type CSSProperties } from "react";
import { CHALLENGE_DEFS, RULES } from "@/engine";
import { getItemDef } from "@/data";
import { useExploreStore } from "@/store/exploreStore";
import { useRunStore } from "@/store/runStore";
import { useTownStore } from "@/store/townStore";
import ItemInventoryPanel from "@/ui/common/item/ItemInventoryPanel";
import type { ContextMenuItem } from "@/ui/common/item/ItemContextMenu";
import { useChangePulse } from "@/ui/hooks/useChangePulse";
import { cx } from "@/ui/common/cx";
import { VICTORY_CHOREO, victoryChoreoVars, victorySectionStagger } from "@/ui/battle/victoryChoreo";
import { VictoryExpRow } from "@/ui/battle/VictoryExpRow";
import { VictoryLootTray } from "@/ui/battle/VictoryLootTray";
import { VICTORY_INVENTORY_COLORS } from "@/ui/battle/styles/inventoryPalettes";
import s from "./VictoryPanel.module.css";

export function VictoryPanel() {
  const battleSettled = useRunStore((state) => state.battleSettled);
  const expReport = useRunStore((state) => state.expReport);
  const lastDropK = useRunStore((state) => state.lastDropK);
  const lastDropTier = useRunStore((state) => state.lastDropTier);
  const lastSlotBonus = useRunStore((state) => state.lastSlotBonus);
  const lastChallengeBonus = useRunStore((state) => state.lastChallengeBonus);
  const lastChallenges = useRunStore((state) => state.lastChallenges);
  const confirmExpReport = useRunStore((state) => state.confirmExpReport);
  const session = useExploreStore((state) => state.session);
  const takeAllLoot = useExploreStore((state) => state.takeAllLoot);
  const abandonLoot = useExploreStore((state) => state.abandonLoot);
  const discardItem = useExploreStore((state) => state.discardItem);
  const reorderBackpack = useExploreStore((state) => state.reorderBackpack);
  const characters = useTownStore((state) => state.characters);
  const [confirmingAbandon, setConfirmingAbandon] = useState(false);
  const [continueNudge, setContinueNudge] = useState(false);
  const [pickedUids, setPickedUids] = useState<ReadonlySet<string>>(new Set());
  const backpack = session?.backpack ?? [];
  const pendingLoot = session?.pendingLoot ?? [];
  const pulseSignature = Object.fromEntries(backpack.map((stack) => [stack.uid, stack.count]));
  const pulsedUids = useChangePulse(pulseSignature);

  useEffect(() => {
    if (!continueNudge) return;
    const timer = window.setTimeout(() => setContinueNudge(false), VICTORY_CHOREO.continueNudgeMs);
    return () => window.clearTimeout(timer);
  }, [continueNudge]);

  useEffect(() => {
    if (!pickedUids.size) return;
    const timer = window.setTimeout(() => setPickedUids(new Set()), 520);
    return () => window.clearTimeout(timer);
  }, [pickedUids]);

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
    if (pendingLoot.length) {
      setContinueNudge(true);
      return;
    }
    confirmExpReport();
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
      <div className={s["panel-reveal"]}>
        <section className={s["victory-panel"]}>
          <span className={s["panel-sweep"]} aria-hidden="true" />
          <header className={s["panel-head"]}>
          <div>
            <h2>战斗胜利</h2>
          </div>
          <div className={s["head-readout"]}>
            <button className={s["drop-chip"]} type="button">
              <span>掉落 ×{lastDropK.toFixed(2)}</span>
              <span className={s["drop-popover"]}>
                {lastDropTier?.name ?? "未知"} ×{(lastDropTier?.rewardMultiplier ?? 0).toFixed(2)}<br />
                战斗签 +{lastSlotBonus.toFixed(2)}<br />
                挑战 +{lastChallengeBonus.toFixed(2)}
                {lastChallenges.length > 0 && <>
                  <br />
                  {lastChallenges.map((run) => (
                    <span key={run.id}>
                      {CHALLENGE_DEFS[run.id].title} {run.broken ? "已打破" : "达成"}<br />
                    </span>
                  ))}
                </>}
              </span>
            </button>
          </div>
          </header>

          <div className={s["panel-content"]}>
          <section
            className={cx(s["exp-section"], s["victory-section"])}
            style={{ "--vc-delay": `${VICTORY_CHOREO.contentDelayMs + Number.parseFloat(victorySectionStagger(0))}ms` } as CSSProperties}
          >
            <div className={s["section-heading"]}>
              <span>队伍经验</span>
            </div>
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

          <div className={s["right-column"]}>
            <section
              className={cx(s["loot-section"], s["victory-section"])}
              style={{ "--vc-delay": `${VICTORY_CHOREO.contentDelayMs + Number.parseFloat(victorySectionStagger(1))}ms` } as CSSProperties}
            >
              <div className={s["section-heading"]}>
                <span>战利品</span>
                <small>{pendingLoot.length ? `${pendingLoot.length} 件待拾取` : "已清空"}</small>
              </div>
              <VictoryLootTray
                onPicked={(uid) => setPickedUids((current) => new Set([...current, uid]))}
              />
            </section>

            <section
              className={cx(s["backpack-section"], s["victory-section"])}
              style={{ "--vc-delay": `${VICTORY_CHOREO.contentDelayMs + Number.parseFloat(victorySectionStagger(2))}ms` } as CSSProperties}
            >
              <ItemInventoryPanel
                stacks={backpack}
                rows={4}
                columns={6}
                capacity={RULES.burden.backpackSlots}
                title="回收背包"
                panelId="victory-backpack-panel"
                className={s["backpack-panel"]}
                pulseUids={new Set([...pulsedUids, ...pickedUids])}
                onReorder={handleReorder}
                contextMenuItems={contextMenuItems}
                colorMap={VICTORY_INVENTORY_COLORS}
                compact
              />
            </section>
          </div>
          </div>

          <footer className={s["panel-foot"]}>
          {confirmingAbandon ? (
            <div className={s["confirm-strip"]}>
              <span>放弃剩余 {pendingLoot.length} 件战利品？</span>
              <button className={cx(s["action-button"], s["danger"])} type="button" onClick={abandonLoot}>确认放弃</button>
              <button className={s["action-button"]} type="button" onClick={() => setConfirmingAbandon(false)}>返回</button>
            </div>
          ) : (
            <>
              <button className={cx(s["action-button"], s["primary"])} type="button" onClick={takeAllLoot} disabled={!pendingLoot.length}>全部拾取</button>
              <button className={cx(s["action-button"], s["danger"])} type="button" onClick={() => setConfirmingAbandon(true)} disabled={!pendingLoot.length}>放弃剩余</button>
            </>
          )}
          <button
            className={cx(s["action-button"], s["continue"], pendingLoot.length > 0 && s["is-blocked"], continueNudge && s["is-nudging"])}
            type="button"
            aria-disabled={pendingLoot.length > 0}
            onClick={handleContinue}
          >
            {pendingLoot.length ? `还有 ${pendingLoot.length} 件战利品未处理` : "继续"}
          </button>
          </footer>
        </section>
      </div>
    </div>
  );
}
