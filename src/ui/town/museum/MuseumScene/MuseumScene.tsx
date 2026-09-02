import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useTownStore } from "@/store/townStore";
import { prefersReducedMotion } from "@/ui/app/transitions";
import { cx } from "@/ui/common/cx";
import { PanelShell, PANEL_OUT_MS, PANEL_OUT_REDUCED_MS } from "@/ui/common/PanelShell";
import { codexProgress } from "../codexCatalog";
import { MuseumPanel, type MuseumHallId } from "../MuseumPanel";
import s from "./MuseumScene.module.css";

const cn = (...values: Array<string | false | null | undefined>) =>
  cx(...values.map((value) => (typeof value === "string" ? s[value] : value)));

const MUSEUM_ACCENT = "#6ed6b8";
const MUSEUM_THEME = {
  "--asm-frame": MUSEUM_ACCENT,
  "--asm-glow": MUSEUM_ACCENT,
  "--asm-select": "#a4efd7",
  "--asm-cyan": "#c6f5e8",
  "--asm-line": "#b8e5d533",
  "--asm-ink": "#e7f2ed",
  "--asm-ink-dim": "#91aaa3",
  "--event-panel-title-size": "56px",
} as CSSProperties;

interface Props {
  leaving?: boolean;
}

export function MuseumScene({ leaving = false }: Props) {
  const codex = useTownStore((state) => state.codex);
  const [panel, setPanel] = useState<MuseumHallId | null>(null);
  const [closing, setClosing] = useState(false);
  const progress = codexProgress(codex);

  const openPanel = useCallback((hall: MuseumHallId) => {
    setClosing(false);
    setPanel(hall);
  }, []);
  const closePanel = useCallback(() => setClosing(true), []);

  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(() => {
      setPanel(null);
      setClosing(false);
    }, prefersReducedMotion() ? PANEL_OUT_REDUCED_MS : PANEL_OUT_MS);
    return () => window.clearTimeout(timer);
  }, [closing]);

  useEffect(() => {
    if (!panel) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, closePanel]);

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
        style={{ right: "0px", top: "238px", width: "480px", height: "300px", "--peek": "270px" } as CSSProperties}
      >
        <EntryTile icon={<ItemIcon />} name="物品展厅" desc={`${progress.items.unlocked}/${progress.items.total} 已收录`} onClick={() => openPanel("items")} />
        <EntryTile icon={<CardIcon />} name="卡牌展厅" desc={`${progress.cards.unlocked}/${progress.cards.total} 已收录`} onClick={() => openPanel("cards")} />
        <EntryTile icon={<EnemyIcon />} name="怪物展厅" desc={`${progress.enemies.unlocked}/${progress.enemies.total} 已遭遇`} onClick={() => openPanel("enemies")} />
      </div>

      {panel && (
        <PanelShell
          accent={MUSEUM_ACCENT}
          title="博物馆图鉴"
          status={`总收录 ${progress.unlocked} / ${progress.total}`}
          closeLabel="关闭博物馆图鉴"
          closing={closing}
          onClose={closePanel}
          themeStyle={MUSEUM_THEME}
          size={{ w: 1700, h: 900 }}
        >
          <MuseumPanel initialHall={panel} />
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

function EntryTile({ icon, name, desc, onClick }: { icon: ReactNode; name: string; desc: string; onClick: () => void }) {
  return (
    <button className={cn("entry")} type="button" onClick={onClick}>
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

function ItemIcon() {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round"><path d="M10 17h28v24H10z" strokeWidth={1.2} opacity={0.42} /><path d="M14 17V9h20v8M17 25h14M17 31h9" strokeWidth={1.6} /></svg>;
}

function CardIcon() {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="m15 8 25 7v25l-25-7z" strokeWidth={1.2} opacity={0.42} /><path d="m8 13 25 7v25L8 38z" strokeWidth={1.6} /><path d="m15 26 10 3M15 32l7 2" strokeWidth={1.3} /></svg>;
}

function EnemyIcon() {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round"><circle cx="24" cy="23" r="14" strokeWidth={1.2} opacity={0.42} /><path d="M16 18h5M27 18h5M18 29c4 3 8 3 12 0M10 38h28M15 35l-3 6M33 35l3 6" strokeWidth={1.6} /></svg>;
}
