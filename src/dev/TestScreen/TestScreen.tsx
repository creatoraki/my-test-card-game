import { lazy, Suspense, useState } from "react";
import { DEMO_TABS, readDemoTab, writeDemoTab, type DemoTabId } from "./demoTabs";
import s from "./TestScreen.module.css";

// 测试页按演示类型切换，各演示按需加载组件与素材。
const ExplorePropScene = lazy(() => import("./exploreProps/ExplorePropScene").then((m) => ({ default: m.ExplorePropScene })));
const SvgCursorShowcase = lazy(() => import("./svgDemo/SvgCursorShowcase").then((m) => ({ default: m.SvgCursorShowcase })));

export function TestScreen() {
  const [tab, setTab] = useState<DemoTabId>(readDemoTab);
  const select = (id: DemoTabId) => {
    setTab(id);
    writeDemoTab(id);
  };
  return (
    <div className={s.root}>
      <Suspense fallback={<p className={s.loading}>正在加载演示……</p>}>
        {tab === "props" ? <ExplorePropScene /> : <SvgCursorShowcase />}
      </Suspense>
      <nav className={s.tabs} aria-label="演示类型">
        {DEMO_TABS.map((item) => (
          <button key={item.id} type="button" className={`${s.tab} ${tab === item.id ? s.tabOn : ""}`} onClick={() => select(item.id)}>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
