import { useState } from "react";
import { useTownStore } from "@/store/townStore";
import { codexProgress } from "../codexCatalog";
import { MuseumCardHall } from "../MuseumCardHall";
import { MuseumEnemyHall } from "../MuseumEnemyHall";
import { MuseumItemHall } from "../MuseumItemHall";
import s from "./MuseumPanel.module.css";

export type MuseumHallId = "items" | "cards" | "enemies";

const TABS: { id: MuseumHallId; label: string }[] = [
  { id: "items", label: "物品" },
  { id: "cards", label: "卡牌" },
  { id: "enemies", label: "怪物" },
];

export function MuseumPanel({ initialHall }: { initialHall: MuseumHallId }) {
  const codex = useTownStore((state) => state.codex);
  const [hall, setHall] = useState<MuseumHallId>(initialHall);
  const progress = codexProgress(codex);

  return (
    <div className={s["panel"]}>
      <nav className={s["tabs"]} aria-label="图鉴展厅">
        {TABS.map((tab) => {
          const count = progress[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              className={s["tab"]}
              data-active={hall === tab.id ? "true" : undefined}
              aria-pressed={hall === tab.id}
              onClick={() => setHall(tab.id)}
            >
              <span>{tab.label}</span>
              <small>{count.unlocked}/{count.total}</small>
            </button>
          );
        })}
      </nav>
      <div className={s["content"]}>
        {hall === "items" && <MuseumItemHall />}
        {hall === "cards" && <MuseumCardHall />}
        {hall === "enemies" && <MuseumEnemyHall />}
      </div>
    </div>
  );
}
