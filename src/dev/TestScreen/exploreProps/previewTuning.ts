import { useCallback, useEffect, useState } from "react";
import { clampScale } from "./showcaseProps";
import { DEFAULT_BACKDROP, type DemoBackdrop } from "./DemoNearLayer";
import { DEFAULT_NEAR_LAYER_ID, DEMO_NEAR_LAYERS } from "./demoNearLayers";

/** 预览页全部调节项：交互物缩放倍率、是否启用、背景近景缩放与偏移、当前近景图层。 */
export interface PreviewTuning {
  multipliers: Record<string, number>;
  /** 只决定是否参与打印；未记录的物件默认未启用。 */
  enabled: Record<string, boolean>;
  backdrop: DemoBackdrop;
  nearLayerId: string;
}

const STORAGE_KEY = "测试页.交互物预览.调节项";

const EMPTY: PreviewTuning = { multipliers: {}, enabled: {}, backdrop: DEFAULT_BACKDROP, nearLayerId: DEFAULT_NEAR_LAYER_ID };

export const isPropEnabled = (tuning: PreviewTuning, id: string) => tuning.enabled[id] ?? false;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** 读取并逐项校验，坏数据直接丢弃，不影响页面渲染。 */
function load(): PreviewTuning {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!isRecord(raw)) return EMPTY;
    const multipliers: Record<string, number> = {};
    if (isRecord(raw.multipliers)) for (const [id, value] of Object.entries(raw.multipliers)) {
      if (typeof value === "number" && Number.isFinite(value)) multipliers[id] = clampScale(value);
    }
    const enabled: Record<string, boolean> = {};
    if (isRecord(raw.enabled)) for (const [id, value] of Object.entries(raw.enabled)) {
      if (typeof value === "boolean") enabled[id] = value;
    }
    const backdrop = { ...DEFAULT_BACKDROP };
    if (isRecord(raw.backdrop)) {
      const { scale, offsetY } = raw.backdrop;
      if (typeof scale === "number" && Number.isFinite(scale)) backdrop.scale = clampScale(scale);
      if (typeof offsetY === "number" && Number.isFinite(offsetY)) backdrop.offsetY = Math.round(offsetY);
    }
    const nearLayerId = DEMO_NEAR_LAYERS.some((layer) => layer.id === raw.nearLayerId)
      ? raw.nearLayerId as string : DEFAULT_NEAR_LAYER_ID;
    return { multipliers, enabled, backdrop, nearLayerId };
  } catch {
    return EMPTY;
  }
}

/** 调节项随改随存到本地，刷新后保留。 */
export function usePreviewTuning() {
  const [tuning, setTuning] = useState(load);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tuning)); } catch { /* 存储不可用时只保留本次会话 */ }
  }, [tuning]);
  const setMultiplier = useCallback((id: string, value: number) => {
    setTuning((current) => ({ ...current, multipliers: { ...current.multipliers, [id]: value } }));
  }, []);
  const setEnabled = useCallback((id: string, value: boolean) => {
    setTuning((current) => ({ ...current, enabled: { ...current.enabled, [id]: value } }));
  }, []);
  const setBackdrop = useCallback((backdrop: DemoBackdrop) => {
    setTuning((current) => ({ ...current, backdrop }));
  }, []);
  const setNearLayer = useCallback((nearLayerId: string) => {
    setTuning((current) => ({ ...current, nearLayerId }));
  }, []);
  return { tuning, setMultiplier, setEnabled, setBackdrop, setNearLayer };
}
