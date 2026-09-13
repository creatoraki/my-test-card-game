import { useEffect } from "react";
import { energyTier } from "@/explore/session";
import { canWalkCorridor, hasCorridorRewards } from "@/explore/corridor/session";
import { useExploreStore } from "@/store/exploreStore";
import { useRunStore } from "@/store/runStore";
import { StageCanvas } from "@/ui/app/StageCanvas";
import { CorridorScene } from "@/ui/explore/CorridorScene/CorridorScene";
import RewardOverlay from "@/ui/explore/RewardOverlay";
import LootPickup from "@/ui/explore/LootPickup";
import { CurioPanel } from "./CurioPanel";
import { ExploreDock } from "./ExploreDock";
import { ExploreInventory } from "./ExploreInventory";
import { useExploreInventory } from "./useExploreInventory";
import s from "./CorridorScreen.module.css";

/** 主界面只编排场景、小地图、底部 HUD 和浮层；移动、房间规则与美术各自独立。 */
export function ExploreScreen() {
  const session = useExploreStore((state) => state.session);
  const enterEncounter = useRunStore((state) => state.enterEncounter);
  const finishExpedition = useRunStore((state) => state.finishExpedition);
  const inventory = useExploreInventory(session);
  const phase = session?.phase;

  useEffect(() => {
    if (phase === "inBattle") enterEncounter();
    if (phase === "retreated" || phase === "wiped") finishExpedition();
  }, [phase, enterEncounter, finishExpedition]);

  if (!session?.corridor || !session.dungeon) return null;
  const locked = phase === "encounter" || phase === "inBattle";
  const pending = hasCorridorRewards(session);
  const blocked = !canWalkCorridor(session) || inventory.blocked;
  const tier = energyTier(session.energy);
  const curioOpen = (phase === "landed" || phase === "resolving") && Boolean(session.corridor.activeObjectId);
  const bossRoom = session.dungeon.currentRoomId === session.dungeon.bossRoomId;

  return <StageCanvas className={s.screen} viewportClassName={s.viewport} data-explore-stage>
    <CorridorScene key={session.corridor.roomId} corridor={session.corridor} blocked={blocked} encountering={locked} bossRoom={bossRoom} />
    <div className={s.readout}>
      <span>净化粒子</span><strong style={{ color: tier.color }}>{session.energy}<small> / 100</small></strong>
      <div className={s.energyTrack}><i style={{ width: `${Math.min(100, session.energy)}%`, background: tier.color }} /></div>
      <p>{tier.name} · 居民积分 {session.loot}</p>
    </div>
    <ExploreInventory session={session} inventory={inventory} />
    <ExploreDock session={session} inventory={inventory} locked={locked} pending={pending} />
    {curioOpen && !inventory.target && <CurioPanel session={session} covered={inventory.blocked || pending} onOpenBag={() => inventory.setBagOpen(true)} />}
    <RewardOverlay gate={!locked} />
    <LootPickup gate={!locked && !session.pendingActions.length} />
  </StageCanvas>;
}
