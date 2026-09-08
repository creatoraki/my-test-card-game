import { type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { useTownStore } from "@/store/townStore";
import { cx } from "@/ui/common/cx";
import { PanelShell } from "@/ui/common/PanelShell";
import { CLOSE_MS, usePanelMorph } from "@/ui/common/panelMorph";
import { useEntryRise } from "@/ui/hooks/useEntryRise";
import { useFacilityPanelExit } from "@/ui/town/facilityExit";
import { codexProgress } from "../codexCatalog";
import { MuseumPanel } from "../MuseumPanel";
import s from "./MuseumScene.module.css";

const cn = (...values: Array<string | false | null | undefined>) =>
  cx(...values.map((value) => (typeof value === "string" ? s[value] : value)));

const MUSEUM_ACCENT = "#6ed6b8";
const MUSEUM_RECT = { x: 110, y: 90, w: 1700, h: 900 };
const MUSEUM_THEME = {
  "--asm-frame": MUSEUM_ACCENT,
  "--asm-glow": MUSEUM_ACCENT,
  "--asm-select": "#a4efd7",
  "--asm-cyan": "#c6f5e8",
  "--asm-line": "#b8e5d533",
  "--asm-ink": "#e7f2ed",
  "--asm-ink-dim": "#91aaa3",
  "--event-panel-title-size": "var(--museum-font-panel-title, 56px)",
  "--panel-shell-title-size": "var(--museum-font-panel-title, 56px)",
  "--panel-shell-status-size": "var(--museum-font-body, 20px)",
} as CSSProperties;

interface Props {
  leaving?: boolean;
}

export function MuseumScene({ leaving = false }: Props) {
  const codex = useTownStore((state) => state.codex);
  const progress = codexProgress(codex);
  const entryRise = useEntryRise();
  const morph = usePanelMorph<"museum">({ rects: { museum: MUSEUM_RECT } });

  useFacilityPanelExit(() => {
    if (!morph.panel) return 0;
    morph.closePanel();
    return CLOSE_MS;
  });

  return (
    <div className={cn("scene", leaving && "is-leaving")}>
      <header className={cn("header")} style={{ left: "56px", top: "42px" }}>
        <span className={cn("kicker")}>据点档案收录中心</span>
        <h2 className={cn("title")}>博物馆</h2>
        <p className={cn("subtitle")}>物品 · 卡牌 · 怪物</p>
      </header>

      <div className={cn("readout")} style={{ right: "56px", top: "42px" }}>
        <Readout label="总收录" value={`${progress.unlocked}/${progress.total}`} />
        <Readout label="物品 · 卡牌 · 怪物" value={`${progress.items.unlocked} · ${progress.cards.unlocked} · ${progress.enemies.unlocked}`} />
      </div>

      <div
        className={cn("entries")}
        {...entryRise}
        style={{ right: "0px", top: "338px", width: "480px", height: "100px", "--peek": "270px", ...morph.entryVars } as CSSProperties}
      >
        <EntryTile
          icon={<MuseumIcon />}
          name="博物馆图鉴"
          desc={`${progress.unlocked}/${progress.total} 已收录`}
          hidden={morph.hiddenEntry === "museum" && morph.phase !== "closing"}
          revealing={morph.phase === "closing" && morph.hiddenEntry === "museum"}
          onClick={(event) => morph.openPanel("museum", event.currentTarget)}
        />
      </div>

      {morph.panel === "museum" && (
        <PanelShell
          accent={MUSEUM_ACCENT}
          title="博物馆图鉴"
          status={`总收录 ${progress.unlocked} / ${progress.total}`}
          closeLabel="关闭博物馆图鉴"
          closing={morph.phase === "closing"}
          onClose={morph.closePanel}
          themeStyle={MUSEUM_THEME}
          className={cn("panel")}
          morph={{
            ref: morph.panelRef,
            rect: MUSEUM_RECT,
            ready: morph.ready,
            seed: <MuseumIcon />,
            seedLabel: "博物馆图鉴",
          }}
        >
          <MuseumPanel initialHall="items" />
        </PanelShell>
      )}
    </div>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn("chip")}>
      <span className={cn("chip-label")}>{label}</span>
      <strong className={cn("chip-value")}>{value}</strong>
    </div>
  );
}

function EntryTile({ icon, name, desc, hidden, revealing = false, onClick }: { icon: ReactNode; name: string; desc: string; hidden: boolean; revealing?: boolean; onClick: (event: MouseEvent<HTMLButtonElement>) => void }) {
  return (
    <button className={cn("entry", revealing && "is-revealing")} type="button" onClick={onClick} style={{ visibility: hidden ? "hidden" : "visible" }}>
      <span className={cn("entry-rim")} aria-hidden />
      <span className={cn("entry-icon")} aria-hidden>{icon}</span>
      <span className={cn("entry-copy")}>
        <span className={cn("entry-name")}>{name}</span>
        <span className={cn("entry-desc")}>{desc}</span>
      </span>
      <span className={cn("entry-go")} aria-hidden>▸</span>
    </button>
  );
}

function MuseumIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 18 24 8l17 10v25H7z" strokeWidth={1.2} opacity={0.42} />
      <path d="M5 18 24 7l19 11M10 20v21M17 20v21M31 20v21M38 20v21M5 41h38" strokeWidth={1.6} />
      <path d="M13 17h22M24 11v30" strokeWidth={1.2} opacity={0.42} />
    </svg>
  );
}
