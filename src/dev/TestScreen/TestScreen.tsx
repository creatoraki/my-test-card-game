import { lazy, Suspense } from "react";
import s from "./TestScreen.module.css";

// 测试页全屏展示探索场景交互物预览, 按需加载组件与素材。
const ExplorePropScene = lazy(() => import("./exploreProps/ExplorePropScene").then((m) => ({ default: m.ExplorePropScene })));

export function TestScreen() {
  return (
    <div className={s.root}>
      <Suspense fallback={<p className={s.loading}>正在加载演示……</p>}>
        <ExplorePropScene />
      </Suspense>
    </div>
  );
}
