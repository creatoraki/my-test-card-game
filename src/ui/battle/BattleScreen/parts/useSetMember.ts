import { useLayoutEffect, useRef, type MutableRefObject } from "react";

// 把元素挂载期间登记进一个 Set(相机 rig 的写入目标集合)。
export function useSetMember<T extends HTMLElement>(setRef: MutableRefObject<Set<HTMLElement>>) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = setRef.current;
    set.add(el);
    return () => {
      set.delete(el);
    };
  }, [setRef]);
  return ref;
}
