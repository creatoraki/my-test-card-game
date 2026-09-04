import { useState } from "react";
import { DsFastSlashDemo } from "@/ui/test/ds";
import { OpusHudFrameDemo, OpusKeenEdgeDemo } from "@/ui/test/opus";
import { QwenCharacterCardDemo } from "@/ui/test/qwen";
import { LunaPanelDemo } from "@/ui/test/luna/LunaPanelDemo/LunaPanelDemo";
import { SlashSfxDemo } from "@/ui/test/luna/SlashSfxDemo/SlashSfxDemo";
import { TarotIconDemo } from "@/ui/test/luna/TarotIconDemo/TarotIconDemo";
import s from "./TestScreen.module.css";

// 测试 demo 页面：多个开发者可以同时开发相同内容的组件 demo，并通过各自的 tab 进行评选。
// 每位开发者独占一个文件夹和一个 tab，互相不干扰；AI 不得抄袭其他开发者的代码成果。
type TestTab = "opus" | "ds" | "qwen" | "luna";

const TABS: TestTab[] = ["opus", "ds", "qwen", "luna"];

// 页签文案与 tab 值分开: tab 值同时是 key 与 aria 标签的词根, 改文案不影响其它两处。
const TAB_LABEL: Record<TestTab, string> = {
  opus: "opus",
  ds: "ds",
  qwen: "qwen",
  luna: "luna",
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
        {activeTab === "opus" ? <OpusHudFrameDemo /> : null}
        {activeTab === "qwen" ? <QwenCharacterCardDemo /> : null}
        {activeTab === "luna" ? <LunaPanelDemo /> : null}
      </section>
    </main>
  );
}
