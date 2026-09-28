import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { DESIGN_W } from "../../data/layout";
import { CrawlRuntime } from "../../render/core/runtime";
import type { CrawlCallbacks, EncounterChoice, MapDef } from "../../types";
import s from "./CrawlStage.module.css";

export interface CrawlStageHandle {
  resolveEncounter(guardId: string, choice: EncounterChoice): void;
}

export interface CrawlStageProps {
  /** 运行时只在挂载时读取地图; 切换地图请换 key 重建本组件。 */
  map: MapDef;
  blocked: boolean;
  callbacks: CrawlCallbacks;
}

/** 铺满 1920×1080 画布的 2.5D 舞台。运行时只建一次, 回调通过 ref 转发到最新版本。 */
export const CrawlStage = forwardRef<CrawlStageHandle, CrawlStageProps>(function CrawlStage({ map, blocked, callbacks }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runtimeRef = useRef<CrawlRuntime | null>(null);
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  useImperativeHandle(ref, () => ({
    resolveEncounter: (guardId, choice) => runtimeRef.current?.resolveEncounter(guardId, choice),
  }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const runtime = new CrawlRuntime(canvas, {
      onLoading: (state) => cbRef.current.onLoading(state),
      onPrompt: (info) => cbRef.current.onPrompt(info),
      onPromptMove: (x, y) => cbRef.current.onPromptMove(x, y),
      onLoot: (notice) => cbRef.current.onLoot(notice),
      onEncounter: (id) => cbRef.current.onEncounter(id),
      onDebug: (on) => cbRef.current.onDebug(on),
    }, map);
    runtimeRef.current = runtime;
    // 画布经 CSS 缩放: 实际显示宽度 / 设计宽度 = 缩放系数, 再乘设备像素比
    const measure = () => {
      const rect = canvas.getBoundingClientRect();
      const scale = rect.width > 0 ? rect.width / DESIGN_W : 1;
      runtime.resize(scale * (window.devicePixelRatio || 1));
    };
    measure();
    let timer = 0;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(measure, 80);
    };
    window.addEventListener("resize", onResize);
    runtime.start();
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(timer);
      runtime.dispose();
      runtimeRef.current = null;
    };
    // 地图变化由父组件换 key 重建, 这里只在挂载时建一次运行时
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    runtimeRef.current?.setBlocked(blocked);
  }, [blocked]);

  return <canvas ref={canvasRef} className={s.canvas} aria-label={`${map.name}场景`} onContextMenu={(event) => event.preventDefault()} />;
});
