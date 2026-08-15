import { useState } from "react";
import { LunaEventPanel } from "../luna";
import { OpusEventPanel } from "../opus";
import { DsEventPanel } from "../ds";
import s from "./TestScreen.module.css";

type TestTab = "opus" | "luna" | "ds";

const TABS: TestTab[] = ["opus", "luna", "ds"];

export function TestScreen() {
  const [activeTab, setActiveTab] = useState<TestTab>("opus");

  return (
    <main className={s.root}>
      <nav className={s.tabs} aria-label="测试页面">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? s.activeTab : undefined}
            aria-current={activeTab === tab ? "page" : undefined}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>
      <section className={s.page} key={activeTab} aria-label={`${activeTab} 测试页面`}>
        {activeTab === "opus" ? (
          <OpusEventPanel />
        ) : activeTab === "luna" ? (
          <LunaEventPanel />
        ) : (
          <DsEventPanel />
        )}
      </section>
    </main>
  );
}
