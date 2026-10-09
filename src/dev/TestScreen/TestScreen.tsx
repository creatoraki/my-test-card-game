import { lazy, Suspense } from "react";
import s from "./TestScreen.module.css";

// 测试页仅保留卡牌三选一预览，按需加载其组件与素材。
const CardPickPreview = lazy(() => import("./cardPick/CardPickPreview").then((m) => ({ default: m.CardPickPreview })));

export function TestScreen() {
  return <div className={s.root}>
    <Suspense fallback={null}>
      <CardPickPreview />
    </Suspense>
  </div>;
}
