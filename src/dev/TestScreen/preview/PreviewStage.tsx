import { useEffect, useState, type ReactNode } from "react";
import { StageCanvas } from "@/ui/app/StageCanvas";
import sceneArt from "@/assets/占位场景素材.webp";
import s from "./PreviewStage.module.css";

/** 演示画布占满容器，可选的控制按钮悬浮在画布外层。 */
export function PreviewStage({ children, controls }: { children: ReactNode; controls?: ReactNode }) {
  const [ready, setReady] = useState(false);
  // 先挂载画布，再让弹窗寻找 portal 宿主，避免首次渲染时落到页面根部。
  useEffect(() => setReady(true), []);

  return (
    <div className={s.root}>
      <StageCanvas>
        <img className={s.scene} src={sceneArt} alt="" draggable={false} />
        {ready && children}
      </StageCanvas>
      {controls && <div className={s.tools}>{controls}</div>}
    </div>
  );
}
