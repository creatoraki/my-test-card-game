import { useMemo, useRef, useState } from "react";
import { NEAR_MAP_GEOMETRY } from "@/explore/dungeon/nearMapGeometry";
import { StageCanvas } from "@/ui/app/StageCanvas";
import { CorridorFar } from "@/ui/explore/CorridorScene/parts/CorridorBackdrop";
import { CorridorPlayer } from "@/ui/explore/CorridorScene/parts/CorridorPlayer";
import { NEAR_SCENE_GEOMETRY } from "@/ui/art/proceduralNear";
import { BakedStrip } from "../parts/BakedStrip";
import { BoundsOverlay } from "../parts/BoundsOverlay";
import { DemoPanel, type WidthPreset } from "../parts/DemoPanel";
import { DemoProps, type DemoProp } from "../parts/DemoProps";
import { useNearBake } from "./useNearBake";
import { useDemoCamera } from "./useDemoCamera";
import { planDemoProps } from "./planProps";
import s from "./NearSceneDemo.module.css";

const WIDTH_PRESETS: readonly WidthPreset[] = [
  { id: "narrow", label: "窄", width: 2880 },
  { id: "standard", label: "标准", width: NEAR_MAP_GEOMETRY.standard.width },
  { id: "wide", label: "宽", width: 6400 },
];
/** 固定种子的五个房间：地面完全一致，只有建筑组合不同。 */
const ROOM_SEEDS = [1101, 2207, 3313, 4421, 5531] as const;
/** 交互物脚底略靠后于角色脚底，角色从它们前方走过。 */
const PROP_GROUND_Y = NEAR_SCENE_GEOMETRY.standY - 8;
const NO_PROPS: readonly DemoProp[] = [];

/** 程序化近景演示：沿用现有远景素材，近景建筑、街道设施与地面全部由代码烘焙（前景设施单独一层盖在角色之上），并随机摆放交互物。 */
export function NearSceneDemo() {
  const [seed, setSeed] = useState<number>(ROOM_SEEDS[0]);
  const [widthId, setWidthId] = useState("standard");
  const [showBounds, setShowBounds] = useState(false);
  const [auto, setAuto] = useState(false);
  const width = (WIDTH_PRESETS.find((preset) => preset.id === widthId) ?? WIDTH_PRESETS[1]).width;
  const { bake, progress, baking } = useNearBake(seed, width);
  const shownWidth = bake?.plan.width ?? width;
  const props = useMemo(() => (bake ? planDemoProps(bake.plan) : NO_PROPS), [bake]);

  const worldRef = useRef<HTMLDivElement>(null);
  const farStripRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const nodes = useMemo(() => ({ world: worldRef, farStrip: farStripRef, player: playerRef }), []);
  const motion = useDemoCamera(shownWidth, auto, nodes, props);

  const stats = bake && {
    drawMs: bake.drawMs,
    slowestTileMs: bake.slowestTileMs,
    tiles: bake.tiles.length,
    buildings: bake.plan.front.length,
    street: bake.plan.street.length + bake.plan.fore.length,
    props: props.length,
  };

  return <StageCanvas className={s.canvas} viewportClassName={s.viewport}>
    <CorridorFar ref={farStripRef} />
    <div ref={worldRef} className={s.world} style={{ width: shownWidth }}>
      {bake && <BakedStrip tiles={bake.tiles} />}
      {bake && showBounds && <BoundsOverlay plan={bake.plan} />}
      <DemoProps props={props} nearId={motion.nearId} groundY={PROP_GROUND_Y} />
      <div ref={playerRef} className={s.playerAnchor} style={{ top: NEAR_SCENE_GEOMETRY.standY }}>
        <div className={s.player}>
          <CorridorPlayer walking={motion.walking} facing={motion.facing} />
        </div>
      </div>
      {bake && <BakedStrip tiles={bake.foreTiles} className={s.foreStrip} />}
    </div>
    <div className={s.vignette} aria-hidden />
    {!bake && <div className={s.veil}>正在绘制场景…</div>}
    <DemoPanel
      seed={seed}
      roomSeeds={ROOM_SEEDS}
      onSeed={setSeed}
      onRandom={() => setSeed(Math.floor(Math.random() * 900000) + 100000)}
      widthPresets={WIDTH_PRESETS}
      widthId={widthId}
      onWidth={setWidthId}
      showBounds={showBounds}
      onToggleBounds={() => setShowBounds((v) => !v)}
      auto={auto}
      onToggleAuto={() => setAuto((v) => !v)}
      baking={baking}
      progress={progress}
      stats={stats}
    />
  </StageCanvas>;
}
