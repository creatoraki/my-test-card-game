import { useState } from "react";
import { OpusTwinArrowDemo } from "@/ui/test/opus";
import { AttackArtsDemo } from "@/ui/test/AttackArtsDemo";
import { ATTACK_ARTS, type AttackArtId } from "@/ui/battle/fx/AttackArtsFx";
import s from "./TestScreen.module.css";

type TestTab = AttackArtId | "blade-reference" | "twin-reference";
const TABS: { id: TestTab; name: string }[] = [
  ...ATTACK_ARTS.map(art => ({ id: art.id, name: art.name })),
  { id: "blade-reference", name: "刀光斩对照" },
  { id: "twin-reference", name: "原版双箭" },
];

export function TestScreen() {
  const [activeTab, setActiveTab] = useState<TestTab>("moon-cleave");
  const art = ATTACK_ARTS.find(entry => entry.id === activeTab);
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
        {activeTab === "twin-reference" ? <OpusTwinArrowDemo /> : <AttackArtsDemo art={art} />}
      </section>
    </main>
  );
}
