import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import * as THREE from "three";
import type { DoorFrame } from "../../engine/doorGeometry";
import type { FocusInfo } from "../../three/core/focusTracker";
import { DESIGN_W } from "../../three/core/isoCamera";
import { SceneRuntime } from "../../three/core/sceneRuntime";
import s from "./ThreeStage.module.css";

export interface ThreeStageProps {
  roomId: string;
  entryDoorId: string | null;
  blocked: boolean;
  onDoor(frame: DoorFrame): void;
  onFocus(info: FocusInfo | null): void;
  onLabelMove(x: number, y: number): void;
}

/** 铺满 1920×1080 画布的 3D 舞台。运行时只建一次, 房间切换走 loadRoom。 */
export function ThreeStage({ roomId, entryDoorId, blocked, onDoor, onFocus, onLabelMove }: ThreeStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runtimeRef = useRef<SceneRuntime | null>(null);
  const callbacks = useRef({ onDoor, onFocus, onLabelMove });
  callbacks.current = { onDoor, onFocus, onLabelMove };
  const ndc = useRef(new THREE.Vector2());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const runtime = new SceneRuntime(canvas, {
      onDoor: (frame) => callbacks.current.onDoor(frame),
      onFocus: (info) => callbacks.current.onFocus(info),
      onLabelMove: (x, y) => callbacks.current.onLabelMove(x, y),
    });
    runtimeRef.current = runtime;
    // 画布经 CSS zoom 缩放: 实际显示宽度 / 设计宽度 = 缩放系数, 再乘设备像素比
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
  }, []);

  useEffect(() => {
    runtimeRef.current?.loadRoom(roomId, entryDoorId);
  }, [roomId, entryDoorId]);

  useEffect(() => {
    runtimeRef.current?.setBlocked(blocked);
  }, [blocked]);

  const toNdc = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    ndc.current.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    return ndc.current;
  };

  return <canvas
    ref={canvasRef}
    className={s.canvas}
    aria-label="废弃楼层场景"
    onPointerMove={(event) => runtimeRef.current?.pointerMove(toNdc(event))}
    onPointerLeave={() => runtimeRef.current?.pointerLeave()}
    onPointerDown={(event) => {
      if (event.button !== 0) return;
      runtimeRef.current?.click(toNdc(event));
    }}
    onContextMenu={(event) => event.preventDefault()}
  />;
}
