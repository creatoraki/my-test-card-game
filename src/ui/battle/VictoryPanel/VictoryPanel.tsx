import { useEffect, useState, type CSSProperties } from "react";
import { RULES } from "@/engine";
import { getItemDef } from "@/data";
import { useExploreStore } from "@/store/exploreStore";
import { useRunStore } from "@/store/runStore";
import { useTownStore } from "@/store/townStore";
import ItemInventoryPanel from "@/ui/common/item/ItemInventoryPanel";
import type { ContextMenuItem } from "@/ui/common/item/ItemContextMenu";
import { useChangePulse } from "@/ui/hooks/useChangePulse";
import { cx } from "@/ui/common/cx";
import { victoryChoreoVars } from "@/ui/battle/victoryChoreo";
import { VictoryExpRow } from "@/ui/battle/VictoryExpRow";
import { VictoryLootTray } from "@/ui/battle/VictoryLootTray";
import s from "./VictoryPanel.module.css";

const INVENTORY_COLORS = {
  panel: "#071116f2",
  panelDeep: "#03090def",
  panelGlow: "#69d9ff12",
  panelLine: "#6fd2ff42",
  frame: "#69d9ff",
  frameHot: "#d8fbff",
  accent: "#69d9ff",
  accentAlt: "#ffb86b",
  text: "#edfaff",
  muted: "#72939e",
  tray: "#00000066",
  trayBorder: "#6fd2ff24",
  slot: "#071a24dd",
  slotBorder: "#6fd2ff30",
  slotHover: "#16495d99",
  selected: "#ffb86b",
  selectedGlow: "#ffb86b66",
  emptySlot: "#69d9ff0d",
};

export function VictoryPanel() {
  const battleSettled = useRunStore((state) => state.battleSettled);
  const expReport = useRunStore((state) => state.expReport);
  const lastLoot = useRunStore((state) => state.lastLoot);
  const lastDropK = useRunStore((state) => state.lastDropK);
  const lastDropTier = useRunStore((state) => state.lastDropTier);
  const lastSlotBonus = useRunStore((state) => state.lastSlotBonus);
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
    const timer = window.setTimeout(() => setContinueNudge(false), 120);
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
      <section className={s["victory-panel"]}>
        <span className={s["panel-sweep"]} aria-hidden="true" />
        <header className={s["panel-head"]}>
          <div>
            <span className={s["kicker"]}>COMBAT RECOVERY // BATTLE COMPLETE</span>
            <h2>战斗胜利</h2>
            <p>战场已清空，处理本场回收物资后继续推进。</p>
          </div>
          <div className={s["head-readout"]}>
            <span className={s["loot-credit"]}>居民积分 +{lastLoot}</span>
            <button className={s["drop-chip"]} type="button">
              <span>掉落倍率 ×{lastDropK.toFixed(2)}</span>
              <span className={s["drop-popover"]}>
                能量档位：{lastDropTier?.name ?? "未知"}<br />
                档位倍率：×{(lastDropTier?.rewardMultiplier ?? 0).toFixed(2)}<br />
                战斗签加成：+{lastSlotBonus.toFixed(2)}
              </span>
            </button>
          </div>
        </header>

        <div className={s["panel-content"]}>
          <section className={s["exp-section"]}>
            <div className={s["section-heading"]}>
              <span>队伍经验池</span>
              <small>本场战斗经验已入账</small>
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

          <section className={s["loot-section"]}>
            <div className={s["section-heading"]}>
              <span>战利品回收</span>
              <small>{pendingLoot.length ? `${pendingLoot.length} 件待拾取` : "已全部处理"}</small>
            </div>
            <VictoryLootTray
              onPicked={(uid) => setPickedUids((current) => new Set([...current, uid]))}
            />
            <p className={s["hint"]}>点击格子收入背包，悬浮查看物品详情。</p>
          </section>

          <section className={s["backpack-section"]}>
            <div className={s["section-heading"]}>
              <span>远征背包</span>
              <small>右键丢弃 · 拖动整理</small>
            </div>
            <ItemInventoryPanel
              stacks={backpack}
              rows={4}
              columns={6}
              capacity={RULES.burden.backpackSlots}
              title="回收背包"
              kicker="BATTLE HAUL // PACK-24"
              subtitle="战场回收物资"
              panelId="victory-backpack-panel"
              className={s["backpack-panel"]}
              pulseUids={new Set([...pulsedUids, ...pickedUids])}
              onReorder={handleReorder}
              contextMenuItems={contextMenuItems}
              colorMap={INVENTORY_COLORS}
              compact
            />
          </section>
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
            className={cx(s["action-button"], s["continue"], pendingLoot.length && s["is-blocked"], continueNudge && s["is-nudging"])}
            type="button"
            aria-disabled={pendingLoot.length > 0}
            onClick={handleContinue}
          >
            {pendingLoot.length ? `还有 ${pendingLoot.length} 件战利品未处理` : "继续"}
          </button>
        </footer>
      </section>
    </div>
  );
}
