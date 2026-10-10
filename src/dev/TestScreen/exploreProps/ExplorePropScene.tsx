import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { CORRIDOR } from "@/explore/corridor/types";
import { CorridorFar } from "@/ui/explore/CorridorScene/parts/CorridorBackdrop";
import { CorridorPlayer } from "@/ui/explore/CorridorScene/parts/CorridorPlayer";
import { applyCorridorFrame } from "@/ui/explore/CorridorScene/corridorFrame";
import { CORRIDOR_LAYOUT, CORRIDOR_SCENE_SCALE } from "@/ui/explore/CorridorScene/corridorLayout";
import scene from "@/ui/explore/CorridorScene/CorridorScene.module.css";
import { SHOWCASE_PAGES } from "./showcaseProps";
import { ShowcaseProp } from "./ShowcaseProp";
import { PropScalePanel } from "./PropScalePanel";
import { usePreviewMovement } from "./usePreviewMovement";
import { PropShowcasePager } from "./PropShowcasePager";
import { paginateShowcasePages } from "./showcasePagination";
import { DemoAbyss, DemoNearLayer, demoBackdropGeometry } from "./DemoNearLayer";
import { isPropEnabled, usePreviewTuning } from "./previewTuning";
import { BackdropPanel } from "./BackdropPanel";
import { NearLayerPager } from "./NearLayerPager";
import { findNearLayer } from "./demoNearLayers";
import s from "./ExplorePropScene.module.css";

const FLOOR = CORRIDOR.floorY + CORRIDOR_LAYOUT.entityGroundOffset;

/** 按系列翻页预览物品，沿用探索场景落地方式与缩放旋钮。 */
export function ExplorePropScene() {
  const world = useRef<HTMLDivElement>(null);
  const farStrip = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ scale: 1, width: 1920 });
  const { scale } = viewport;
  const [pageId, setPageId] = useState(SHOWCASE_PAGES[0].id);
  const itemsPerPage = Math.max(1, Math.min(4, Math.floor(viewport.width / 320)));
  const pages = useMemo(() => paginateShowcasePages(SHOWCASE_PAGES, itemsPerPage), [itemsPerPage]);
  const activePage = pages.find((page) => page.id === pageId)
    ?? pages.find((page) => pageId.startsWith(`${page.sourceId}-part-`)) ?? pages[0];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = activePage.props.find((prop) => prop.id === selectedId);
  const { tuning, setMultiplier, setOffset, setEnabled, setBackdrop, setNearLayer } = usePreviewTuning();
  const { backdrop } = tuning;
  const [backdropOpen, setBackdropOpen] = useState(false);
  const nearLayer = findNearLayer(tuning.nearLayerId);
  const width = demoBackdropGeometry(backdrop, nearLayer.width).width;
  const widthRef = useRef(width);
  widthRef.current = width;
  const onFrame = useCallback((x: number) => {
    applyCorridorFrame({ world: world.current, farStrip: farStrip.current, player: player.current }, x, widthRef.current);
  }, [activePage.id]);
  const movement = usePreviewMovement(width, onFrame);
  useEffect(() => {
    // 铺满全屏：按较大比例覆盖视口，超出 16:9 的部分裁掉。
    const resize = () => setViewport({
      scale: Math.max(window.innerWidth / 1920, window.innerHeight / 1080),
      width: window.innerWidth,
    });
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  useEffect(() => {
    if (selectedId && !selected) { setSelectedId(null); return; }
    if (!selectedId && !backdropOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSelectedId(null);
      setBackdropOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [selectedId, selected, backdropOpen]);
  const selectPage = (id: string) => {
    setPageId(id);
    setSelectedId(null);
  };
  return <div className={s.root}>
    <div className={s.canvas} style={{
      transform: `translate(-50%, -50%) scale(${scale})`, "--preview-ui-scale": 1 / scale,
    } as CSSProperties}>
      <div className={scene.scene} aria-label="探索场景交互物预览" style={{
        "--corridor-scale": CORRIDOR_SCENE_SCALE,
        "--corridor-floor-y": `${CORRIDOR.floorY}px`,
      } as CSSProperties}>
        <CorridorFar ref={farStrip} mapId="eco-ark" />
        <DemoAbyss backdrop={backdrop} />
        <div className={scene.haze} aria-hidden />
        <div className={scene.stage}>
          <div ref={world} className={scene.world} style={{ width }}>
            <DemoNearLayer backdrop={backdrop} art={nearLayer} />
            {activePage.props.map((prop) => <ShowcaseProp
              key={prop.id}
              prop={prop}
              multiplier={tuning.multipliers[prop.id] ?? 1}
              offset={tuning.offsets[prop.id] ?? 0}
              floor={FLOOR}
              selected={prop.id === selectedId}
              onSelect={() => {
                setBackdropOpen(false);
                setSelectedId((current) => current === prop.id ? null : prop.id);
              }}
            />)}
            <div ref={player} className={scene.playerAnchor} style={{ top: FLOOR }}>
              <div className={scene.player}><CorridorPlayer {...movement} /></div>
            </div>
          </div>
        </div>
        <div className={scene.vignette} aria-hidden />
      </div>
    </div>
    <button type="button" className={`${s.backdropButton} ${backdropOpen ? s.backdropButtonActive : ""}`} aria-pressed={backdropOpen} onClick={() => {
      setSelectedId(null);
      setBackdropOpen((open) => !open);
    }}>背景</button>
    {selected && <PropScalePanel prop={selected} tuning={tuning} onChange={setMultiplier} onOffset={setOffset} onToggle={setEnabled} onClose={() => setSelectedId(null)} />}
    {backdropOpen && <BackdropPanel tuning={tuning} onChange={setBackdrop} onClose={() => setBackdropOpen(false)} />}
    <div className={s.bottomBar}>
      <NearLayerPager activeId={tuning.nearLayerId} onSelect={setNearLayer} />
      <PropShowcasePager pages={pages} activePage={activePage} enabledCount={activePage.props.filter((prop) => isPropEnabled(tuning, prop.id)).length} onSelect={selectPage} />
    </div>
  </div>;
}
