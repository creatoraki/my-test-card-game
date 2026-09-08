// 音频偏好项的统一存取: 内存值 + localStorage 持久化 + 订阅通知。
// ★ 只管「存」与「通知」, 不碰任何音频副作用 —— 暂停音轨、改 gain 由调用方在 set 之后自己做。
//   bgmPlayer 与 sfxPlayer 各自持有「开关」与「音量」两个偏好项, 四份样板收敛到这里一份。

export interface AudioPref<T> {
  get: () => T;
  set: (value: T) => boolean; // 值真的变了返回 true(调用方据此决定要不要跑副作用)
  subscribe: (listener: () => void) => () => void;
}

function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, raw: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, raw);
  } catch {}
}

// 布尔偏好项: 与旧实现逐字节同口径 —— 只有字符串 "false" 才算关, 其余(含缺失)一律开。
export function createBoolPref(key: string, fallback = true): AudioPref<boolean> {
  const stored = read(key);
  let value = stored === null ? fallback : stored !== "false";
  const listeners = new Set<() => void>();

  return {
    get: () => value,
    set: (next) => {
      if (value === next) return false;
      value = next;
      write(key, String(next));
      listeners.forEach((listener) => listener());
      return true;
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const clamp01 = (value: number) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 1);

// 音量偏好项: 0~1, 解析失败或越界一律夹回。
export function createVolumePref(key: string, fallback = 1): AudioPref<number> {
  const stored = read(key);
  let value = stored === null ? clamp01(fallback) : clamp01(Number.parseFloat(stored));
  const listeners = new Set<() => void>();

  return {
    get: () => value,
    set: (next) => {
      const clamped = clamp01(next);
      if (value === clamped) return false;
      value = clamped;
      write(key, String(clamped));
      listeners.forEach((listener) => listener());
      return true;
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
