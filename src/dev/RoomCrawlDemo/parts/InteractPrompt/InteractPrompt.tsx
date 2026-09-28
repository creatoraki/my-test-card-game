import { forwardRef } from "react";
import type { PromptInfo } from "../../types";
import s from "./InteractPrompt.module.css";

/**
 * 交互物上方的「E 调查」提示。位置由运行时每帧直接写 transform(不经过 React 渲染),
 * 内容变化时以 id 为 key 重新挂载, 播放弹出动画。
 */
export const InteractPrompt = forwardRef<HTMLDivElement, { info: PromptInfo | null }>(function InteractPrompt({ info }, ref) {
  return <div ref={ref} className={s.anchor} aria-live="polite">
    {info && <div key={info.id} className={s.bubble}>
      <kbd className={s.key} aria-hidden>E</kbd>
      <span className={s.verb}>调查</span>
      <span className={s.dot} aria-hidden />
      <span className={s.name}>{info.name}</span>
      <span className={s.tail} aria-hidden />
    </div>}
  </div>;
});
