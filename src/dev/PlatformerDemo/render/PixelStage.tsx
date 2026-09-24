import { forwardRef, useImperativeHandle, useRef, useState, type ReactNode } from "react";
import type { WorldState } from "../engine/world";
import { SCREEN_H, SCREEN_W } from "./core/grid";
import { HeroSprite } from "./actors/hero/heroSprite";
import { bakeScene, drawBack, drawFront, type ActorDrawer, type BakedScene } from "./sceneRenderer";
import s from "./PixelStage.module.css";

export interface PixelStageHandle {
  render(world: WorldState, frameDt: number): void;
}

/**
 * 像素舞台：两张 480×270 画布以 4 倍像素放大铺满设计画布。
 * 后景画布在角色之下，前景画布在角色之上；children 夹在两者之间。
 */
export const PixelStage = forwardRef<PixelStageHandle, { children?: ReactNode }>(function PixelStage({ children }, ref) {
  const back = useRef<HTMLCanvasElement>(null);
  const front = useRef<HTMLCanvasElement>(null);
  const [scene] = useState<BakedScene>(bakeScene);
  const [hero] = useState(() => new HeroSprite());

  useImperativeHandle(ref, () => {
    const actors: ActorDrawer[] = [(ctx, cam) => hero.draw(ctx, cam)];
    return {
      render(world, frameDt) {
        hero.update(world.player, frameDt, world.time);
        const backCtx = back.current?.getContext("2d");
        const frontCtx = front.current?.getContext("2d");
        if (backCtx) drawBack(backCtx, scene, world, actors);
        if (frontCtx) drawFront(frontCtx, scene, world);
      },
    };
  }, [scene, hero]);

  return (
    <>
      <canvas ref={back} className={s.back} width={SCREEN_W} height={SCREEN_H} aria-hidden />
      {children}
      <canvas ref={front} className={s.front} width={SCREEN_W} height={SCREEN_H} aria-hidden />
    </>
  );
});
