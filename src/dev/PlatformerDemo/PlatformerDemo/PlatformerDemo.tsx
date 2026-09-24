import { Fragment } from "react";
import { StageCanvas } from "@/ui/app/StageCanvas";
import { ENEMIES, PICKUPS } from "../engine/level";
import { Backpack, FlyingPickup } from "../parts/Backpack";
import { DemoHud } from "../parts/DemoHud";
import { PickupItem } from "../parts/Pickups";
import { ShadowEnemy } from "../parts/ShadowEnemy";
import { ArtDefs } from "../parts/shared/artStyle";
import { PixelStage } from "../render/PixelStage";
import { useDemoScene } from "./useDemoScene";
import s from "./PlatformerDemo.module.css";

/** 生态方舟 2D 横版跳跃演示：1920×1080 设计画布，场景以 480×270 像素画布程序化绘制并 4 倍放大。 */
export function PlatformerDemo() {
  const scene = useDemoScene();

  return (
    <StageCanvas viewportClassName={s.viewport} className={s.stage}>
      <ArtDefs />
      <PixelStage ref={scene.stage}>
        <div ref={scene.worldLayer} className={s.world}>
          <Fragment key={scene.resetKey}>
            {PICKUPS.filter((spawn) => !scene.taken.has(spawn.id)).map((spawn) => (
              <PickupItem key={spawn.id} spawn={spawn} register={scene.registerPickup} onPick={scene.pick} />
            ))}
            {ENEMIES.map((enemy) => <ShadowEnemy key={enemy.id} id={enemy.id} register={scene.registerEnemy} />)}
          </Fragment>
        </div>
      </PixelStage>
      <DemoHud
        shadowsLeft={scene.shadows.left}
        shadowsTotal={ENEMIES.length}
        alerted={scene.shadows.alerted}
        onReset={scene.reset}
      />
      <Backpack counts={scene.counts} register={scene.registerSlot} />
      {scene.flights.map((flight) => <FlyingPickup key={flight.id} flight={flight} onArrive={scene.arrive} />)}
    </StageCanvas>
  );
}
