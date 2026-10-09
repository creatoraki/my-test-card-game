import { lazy, Suspense } from "react";
import s from "./TestScreen.module.css";

// 测试页直接全屏展示换卡界面，按需加载组件与素材。
const CardReplacePreview = lazy(() => import("./cardReplace/CardReplacePreview").then((m) => ({ default: m.CardReplacePreview })));

export function TestScreen() {
  return (
    <div className={s.root}>
      <Suspense fallback={<p className={s.loading}>正在加载演示……</p>}>
        <CardReplacePreview />
      </Suspense>
    </div>
  );
}
