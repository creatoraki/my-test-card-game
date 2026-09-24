import { forwardRef } from "react";
import type { FocusInfo } from "../../three/core/focusTracker";
import s from "./PropLabel.module.css";

/**
 * 场景内的物体 / 门标签。外层定位由 3D 运行时每帧直写 transform(不走 React 渲染),
 * 内容只在焦点变化时更新。纯展示, 不接交互。
 */
export const PropLabel = forwardRef<HTMLDivElement, { info: FocusInfo | null }>(function PropLabel({ info }, ref) {
  return <div ref={ref} className={s.anchor} aria-hidden={!info}>
    {info && <div key={info.key} className={s.card} data-kind={info.kind} role="status">
      <span className={s.gem} aria-hidden />
      {info.kind === "door"
        ? <><span className={s.hint}>{info.hint}</span><span className={s.title}>{info.title}</span></>
        : <><span className={s.title}>{info.title}</span><span className={s.hint}>靠近 · {info.hint}</span></>}
    </div>}
  </div>;
});
