import { useState } from "react";
import { OpusTwinArrowDemo } from "@/ui/test/opus";
import { AttackArtsDemo, ART_DEMOS, SLASH_DEMOS } from "@/ui/test/AttackArtsDemo";
import s from "./TestScreen.module.css";

const TWIN_TAB = "twin-reference";
const DEMOS = [...SLASH_DEMOS, ...ART_DEMOS];
const TABS: { id: string; name: string }[] = [
  ...DEMOS.map(demo => ({ id: demo.id, name: demo.name })),
  { id: TWIN_TAB, name: "原版双箭" },
];

export function TestScreen() {
  const [activeTab, setActiveTab] = useState("lunar-ring");
  const demo = DEMOS.find(entry => entry.id === activeTab);
  const label = TABS.find(entry => entry.id === activeTab)!.name;

  return (
    <main className={s.root}>
      <nav className={s.tabs} aria-label="测试页面">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? s.activeTab : undefined}
            aria-current={activeTab === tab.id ? "page" : undefined}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.name}
          </button>
        ))}
      </nav>
      <section className={s.page} key={activeTab} aria-label={`${label}演示`}>
        {demo ? <AttackArtsDemo fx={demo} /> : <OpusTwinArrowDemo />}
      </section>
    </main>
  );
}
