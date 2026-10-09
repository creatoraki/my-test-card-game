import { lazy, Suspense } from "react";
import s from "./TestScreen.module.css";

// 测试页直接全屏展示卡牌皮肤状态对照, 按需加载组件与素材。
const CardSkinStatesDemo = lazy(() => import("./cardSkinStates/CardSkinStatesDemo").then((m) => ({ default: m.CardSkinStatesDemo })));

export function TestScreen() {
  return (
    <div className={s.root}>
      <Suspense fallback={<p className={s.loading}>正在加载演示……</p>}>
        <CardSkinStatesDemo />
      </Suspense>
    </div>
  );
}
