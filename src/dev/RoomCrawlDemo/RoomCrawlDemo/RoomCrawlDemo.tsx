import { useRef, useState } from "react";
import { StageCanvas } from "@/ui/app/StageCanvas";
import EnergyReadout from "@/ui/explore/EnergyReadout";
import { ExploreDock } from "@/ui/explore/ExploreScreen/parts/ExploreDock";
import { ExploreInventory } from "@/ui/explore/ExploreScreen/parts/ExploreInventory";
import { useExploreInventory } from "@/ui/explore/ExploreScreen/useExploreInventory";
import { DEFAULT_MAP_ID, getMap, MAPS } from "../data";
import { CalibLegend } from "../parts/CalibLegend";
import { CrawlStage, type CrawlStageHandle } from "../parts/CrawlStage";
import { EncounterCard } from "../parts/EncounterCard";
import { InteractPrompt } from "../parts/InteractPrompt";
import { LoadingVeil } from "../parts/LoadingVeil";
import { LootToast } from "../parts/LootToast";
import { MapSwitch } from "../parts/MapSwitch";
import type { EncounterChoice, MapId } from "../types";
import { useCrawlHud } from "./useCrawlHud";
import { useDemoSession } from "./useDemoSession";
import s from "./RoomCrawlDemo.module.css";

/**
 * 2.5D 房间探索演示(类 DNF 横版, 可切换《废弃楼层》/《生态方舟》): shader 绘制的舞台铺底,
 * 上面叠真实探索 HUD(演示会话驱动)、调查提示、获得飘字、遭遇卡与地图切换按钮。
 * 切换地图时以 key 重建舞台(重新编译与烘焙), 探索会话保留。
 * 本组件只负责编排, 场景与逻辑都在 render/ 与 engine/。
 */
export function RoomCrawlDemo() {
  const session = useDemoSession();
  const inventory = useExploreInventory(session);
  const hud = useCrawlHud();
  const stageRef = useRef<CrawlStageHandle>(null);
  const [mapId, setMapId] = useState<MapId>(DEFAULT_MAP_ID);
  const blocked = inventory.blocked || hud.encounter !== null;

  const choose = (choice: EncounterChoice) => {
    if (hud.encounter) stageRef.current?.resolveEncounter(hud.encounter, choice);
    hud.setEncounter(null);
  };

  const switchMap = (id: MapId) => {
    hud.reset();
    setMapId(id);
  };

  return <StageCanvas className={s.screen} viewportClassName={s.viewport}>
    <CrawlStage key={mapId} ref={stageRef} map={getMap(mapId)} blocked={blocked} callbacks={hud.callbacks} />
    <LoadingVeil state={hud.loading} />
    <InteractPrompt ref={hud.promptRef} info={hud.encounter ? null : hud.prompt} />
    <LootToast items={hud.loots} onDone={hud.dropLoot} />
    {hud.debug && <CalibLegend />}
    {session && <>
      <div className={s.readout}><EnergyReadout energy={session.energy} /></div>
      <ExploreInventory session={session} inventory={inventory} />
      <ExploreDock session={session} inventory={inventory} locked={hud.encounter !== null} pending={false} />
    </>}
    <MapSwitch maps={MAPS} current={mapId} onChange={switchMap} />
    <EncounterCard open={hud.encounter !== null} onChoose={choose} />
  </StageCanvas>;
}
