import { useState } from "react";
import { LunaRouteBoardDemo } from "../luna/LunaRouteBoardDemo";
import { OpusEventPanel, OpusRoutePanel } from "../opus";
import { DsEventPanel, DsRouteBoard } from "../ds";
import s from "./TestScreen.module.css";

type TestTab = "opus" | "opus-route" | "luna" | "ds" | "ds-route";

const TABS: TestTab[] = ["opus", "opus-route", "luna", "ds", "ds-route"];

// 页签文案与 tab 值分开: tab 值同时是 key 与 aria 标签的词根, 改文案不影响其它两处。
const TAB_LABEL: Record<TestTab, string> = {
  opus: "opus",
  "opus-route": "opus 路线图",
  luna: "luna",
  ds: "ds",
  "ds-route": "ds 路线图",
};

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
            {TAB_LABEL[tab]}
          </button>
        ))}
      </nav>
      <section className={s.page} key={activeTab} aria-label={`${activeTab} 测试页面`}>
        {activeTab === "opus" ? (
          <OpusEventPanel />
        ) : activeTab === "opus-route" ? (
          <OpusRoutePanel />
        ) : activeTab === "luna" ? (
          <LunaRouteBoardDemo />
        ) : activeTab === "ds" ? (
          <DsEventPanel />
        ) : (
          <DsRouteBoard />
        )}
      </section>
    </main>
  );
}
