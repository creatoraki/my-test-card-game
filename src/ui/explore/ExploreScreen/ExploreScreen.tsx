import { useEffect } from "react";
import { canWalkCorridor, hasCorridorRewards } from "@/explore/corridor/session";
import { useExploreStore } from "@/store/exploreStore";
import { useRunStore } from "@/store/runStore";
import { StageCanvas } from "@/ui/app/StageCanvas";
import { CorridorScene } from "@/ui/explore/CorridorScene/CorridorScene";
import RewardOverlay from "@/ui/explore/RewardOverlay";
import LootPickup from "@/ui/explore/LootPickup";
import EnergyReadout from "@/ui/explore/EnergyReadout";
import { CurioPanel } from "./CurioPanel";
import { BossGatePanel } from "./BossGatePanel";
import { WanderingMerchantPanel } from "../WanderingMerchant/WanderingMerchantPanel";
import { ExploreDock } from "./ExploreDock";
import { ExploreInventory } from "./ExploreInventory";
import { useExploreInventory } from "./useExploreInventory";
import { usePortalTravelTransition } from "./usePortalTravelTransition";
import s from "./CorridorScreen.module.css";

/** 主界面只编排场景、小地图、底部 HUD 和浮层；移动、房间规则与美术各自独立。 */
export function ExploreScreen() {
  const session = useExploreStore((state) => state.session);
  const enterEncounter = useRunStore((state) => state.enterEncounter);
  const finishExpedition = useRunStore((state) => state.finishExpedition);
  const inventory = useExploreInventory(session);
  const phase = session?.phase;
  const travelTransition = usePortalTravelTransition(session?.corridor?.roomId ?? "");

  useEffect(() => {
    if (phase === "inBattle") enterEncounter();
    if (phase === "retreated" || phase === "wiped") finishExpedition();
  }, [phase, enterEncounter, finishExpedition]);

  if (!session?.corridor || !session.dungeon) return null;
  const locked = phase === "encounter" || phase === "inBattle";
  const pending = hasCorridorRewards(session);
  const blocked = !canWalkCorridor(session) || inventory.blocked;
  const curioOpen = (phase === "landed" || phase === "resolving") && Boolean(session.corridor.activeObjectId);
  const currentRoom = session.dungeon.rooms[session.dungeon.currentRoomId];
  const activeObject = session.corridor.objects.find((object) => object.id === session.corridor?.activeObjectId);
  const merchantOpen = Boolean(activeObject?.kind === "merchant" && (phase === "landed" || phase === "shopping"));
  const sceneBlocked = blocked || travelTransition.phase !== "idle";
  const encountering = phase === "encounter" && travelTransition.phase === "idle";

  return <StageCanvas className={s.screen} viewportClassName={s.viewport} data-explore-stage>
    <CorridorScene key={session.corridor.roomId} corridor={session.corridor} blocked={sceneBlocked} encountering={encountering} nearMapVariant={currentRoom?.nearMapVariant ?? "standard"} onPortalTravel={travelTransition.start} />
    <div className={s.readout}><EnergyReadout energy={session.energy} /></div>
    <ExploreInventory session={session} inventory={inventory} />
    <ExploreDock session={session} inventory={inventory} locked={locked} pending={pending} />
    {curioOpen && !inventory.target && activeObject?.kind !== "merchant" && <CurioPanel session={session} covered={inventory.blocked || pending} onOpenBag={() => inventory.setBagOpen(true)} />}
    {session.corridor.bossGateOpen && !inventory.target && <BossGatePanel session={session} />}
    {merchantOpen && !inventory.target && <WanderingMerchantPanel session={session} />}
    <RewardOverlay gate={!locked} />
    <LootPickup gate={!locked && !session.pendingActions.length} />
    {travelTransition.phase !== "idle" && <div
      aria-hidden
      className={`${s["portal-travel-curtain"]} ${travelTransition.phase === "fade-out" ? s["portal-travel-fade-out"] : s["portal-travel-fade-in"]}`}
      onAnimationEnd={travelTransition.finishAnimation}
    />}
  </StageCanvas>;
}
