import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { loadCorridorPlayerFrames } from "@/ui/art/corridor/corridorPlayerFrames";
import { CORRIDOR_PLAYER_MOTION_FPS, getCorridorPlayerFrameOffset } from "../../corridorPlayerMotion";
import { advancePlayerAnimation, createPlayerAnimation } from "./playerAnimationState";

export function useCorridorPlayerAnimation(walking: boolean, facing: -1 | 1) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const input = useRef({ walking, facing });
  const paint = useRef<(() => void) | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    input.current = { walking, facing };
    // 朝向与当前动作帧在同一次绘制中提交，站立时也保留最后朝向。
    paint.current?.();
  }, [walking, facing]);

  useEffect(() => {
    let disposed = false;
    let request = 0;
    const state = createPlayerAnimation();

    void loadCorridorPlayerFrames().then((frames) => {
      const canvas = canvasRef.current;
      const firstFrame = frames[0];
      if (disposed || !canvas || !firstFrame) return;
      const context = canvas.getContext("2d");
      if (!context) return;
      canvas.width = firstFrame.width;
      canvas.height = firstFrame.height;
      let drawnFrame = -1;
      let drawnFacing = 0;

      const draw = () => {
        const direction = input.current.facing;
        if (drawnFrame === state.frame && drawnFacing === direction) return;
        const frame = frames[state.frame];
        if (!frame) return;
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.setTransform(direction, 0, 0, 1, direction < 0 ? canvas.width : 0, 0);
        // 偏移在镜像前施加，转身后校准量随画面一起翻转。
        const offset = getCorridorPlayerFrameOffset(state.frame);
        context.drawImage(frame, offset.x, offset.y, canvas.width, canvas.height);
        drawnFrame = state.frame;
        drawnFacing = direction;
      };
      paint.current = draw;
      draw();
      setReady(true);
      let previousTime: number | undefined;
      const frameDuration = 1000 / CORRIDOR_PLAYER_MOTION_FPS;

      const tick = (now: number) => {
        if (document.hidden) {
          previousTime = undefined;
          state.elapsed = 0;
        } else {
          const elapsed = previousTime === undefined ? 0 : now - previousTime;
          previousTime = now;
          // 长时间卡顿后从当前步态继续，避免一次跳过多帧。
          state.elapsed += Math.min(elapsed, 50);
          while (state.elapsed + 0.001 >= frameDuration) {
            state.elapsed = Math.max(0, state.elapsed - frameDuration);
            advancePlayerAnimation(state, input.current.walking);
          }
          draw();
        }
        request = requestAnimationFrame(tick);
      };
      request = requestAnimationFrame(tick);
    }).catch(() => {
      // 素材加载失败时保留站立图，不把缺失帧当成第零帧混入动画。
    });

    return () => {
      disposed = true;
      paint.current = null;
      cancelAnimationFrame(request);
    };
  }, []);

  return { canvasRef, ready };
}
