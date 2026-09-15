import { useMemo, useState } from "react";
import { useTownStore } from "@/store/townStore";
import { useSwapTransition } from "@/ui/hooks/useSwapTransition";
import { ShopHeader } from "@/ui/town/shop/ShopHeader";
import { NavigationRail } from "@/ui/town/shop/ShopNavigation";
import { ShopWindow } from "@/ui/town/shop/ShopWindow";
import { codexProgress } from "../codexCatalog";
import { MuseumCardHall } from "../MuseumCardHall";
import { MuseumEnemyHall } from "../MuseumEnemyHall";
import { MuseumItemHall } from "../MuseumItemHall";
import { MuseumNavIcon } from "./MuseumNavIcon";
import s from "./MuseumPanel.module.css";

export type MuseumHallId = "items" | "cards" | "enemies";

const TABS: { id: MuseumHallId; label: string }[] = [
  { id: "items", label: "物品" },
  { id: "cards", label: "卡牌" },
  { id: "enemies", label: "怪物" },
];

const TITLES: Record<MuseumHallId, string> = {
  items: "物品图鉴",
  cards: "卡牌图鉴",
  enemies: "怪物图鉴",
};

const SUBTITLES: Record<MuseumHallId, string> = {
  items: "浏览据点内已发现的物资与装备。",
  cards: "回看已纳入卡组研究的战术卡牌。",
  enemies: "记录远征途中遭遇过的敌对单位。",
};

const PAGE_LEAVE_MS = 170;
const PAGE_ENTER_MS = 280;

interface Props {
  initialHall?: MuseumHallId;
  onBack?: () => void;
}

export function MuseumPanel({ initialHall = "items", onBack }: Props) {
  const codex = useTownStore((state) => state.codex);
  const [hall, setHall] = useState<MuseumHallId>(initialHall);
  const { value: shownHall, phase } = useSwapTransition(hall, hall, PAGE_LEAVE_MS, PAGE_ENTER_MS);
  const progress = codexProgress(codex);

  const entries = useMemo(
    () => TABS.map((tab) => ({
      id: tab.id,
      label: `${tab.label} ${progress[tab.id].unlocked}/${progress[tab.id].total}`,
      icon: <MuseumNavIcon hall={tab.id} />,
    })),
    [progress],
  );

  const current = progress[shownHall];

  return (
    <>
      <NavigationRail entries={entries} value={hall} onChange={setHall} ariaLabel="博物馆展厅" />
      <ShopWindow
        className={s.window}
        frameTone="teal"
        ariaLabel={TITLES[shownHall]}
        header={
          <ShopHeader
            title={TITLES[shownHall]}
            subtitle={SUBTITLES[shownHall]}
            stats={
              <>
                <MuseumStat label="总收录" value={`${progress.unlocked}/${progress.total}`} />
                <MuseumStat label="本馆" value={`${current.unlocked}/${current.total}`} />
              </>
            }
            onBack={onBack}
            closeLabel="关闭博物馆，返回据点"
          />
        }
      >
        <div className={s.page} data-page-phase={phase}>
          {shownHall === "items" && <MuseumItemHall />}
          {shownHall === "cards" && <MuseumCardHall />}
          {shownHall === "enemies" && <MuseumEnemyHall />}
        </div>
      </ShopWindow>
    </>
  );
}

function MuseumStat({ label, value }: { label: string; value: string }) {
  return (
    <div className={s.stat}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
