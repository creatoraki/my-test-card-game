import { useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { nutritionPods, SANCTUARY_RULES } from "@/data";
import { useTownStore } from "@/store/townStore";
import { PanelShell } from "@/ui/common/PanelShell";
import { cx } from "@/ui/common/cx";
import { RevivePanel } from "../RevivePanel";
import { NutritionPanel } from "../NutritionPanel";
import { SanctuaryPanel } from "../SanctuaryPanel";
import { PANEL_RECT } from "../cryoMorph/cryoChoreo";
import { useEntryRise } from "@/ui/hooks/useEntryRise";
import { useCryoMorph, type PanelId } from "../cryoMorph/useCryoMorph";
import s from "./CryoScene.module.css";

const cn = (...values: Array<string | false | null | undefined>) =>
  cx(...values.map((value) => (typeof value === "string" ? s[value] : value)));

const MED_ACCENT = "#4fd6b8";
const FALLEN_ACCENT = "#ff6f8b";
const SANCTUARY_ACCENT = "#f1d276";
const MED_THEME = {
  "--asm-frame": MED_ACCENT,
  "--asm-glow": MED_ACCENT,
  "--asm-select": "#d7fff4",
  "--asm-cyan": "#d7fff4",
  "--asm-line": "#4fd6b82e",
  "--asm-ink": "#e9fbf6",
  "--asm-ink-dim": "#8fb0a8",
  "--asm-panel-bg": "#071613d9",
  "--panel-shell-title-size": "34px",
  "--panel-shell-status-size": "20px",
  "--panel-shell-close-size": "36px",
} as CSSProperties;

const SANCTUARY_THEME = {
  "--asm-frame": SANCTUARY_ACCENT,
  "--asm-glow": SANCTUARY_ACCENT,
  "--asm-select": "#fff0b4",
  "--asm-cyan": "#fff0b4",
  "--asm-line": "#d7b55d2e",
  "--asm-ink": "#f6ead1",
  "--asm-ink-dim": "#a89a7c",
  "--asm-panel-bg": "#100d06d9",
  "--panel-shell-title-size": "34px",
  "--panel-shell-status-size": "20px",
  "--panel-shell-close-size": "36px",
} as CSSProperties;

interface PanelStatusContext {
  fallenCount: number;
  loot: number;
  nutritionCount: number;
  nutritionCapacity: number;
  purifyingCount: number;
}

interface PanelMeta {
  title: string;
  status: (context: PanelStatusContext) => string;
  closeLabel: string;
  icon: ReactNode;
  accent: string;
  theme: CSSProperties;
  sfx: boolean;
}

const PANEL_META: Record<PanelId, PanelMeta> = {
  revive: {
    title: "复苏舱",
    status: ({ fallenCount, loot }) => `复苏舱位 · 待复苏 ${fallenCount} 名 · 居民积分 ${loot.toLocaleString()}`,
    closeLabel: "关闭复苏舱",
    icon: <ReviveIcon />,
    accent: MED_ACCENT,
    theme: MED_THEME,
    sfx: true,
  },
  nutrition: {
    title: "疗养舱",
    status: ({ nutritionCount, nutritionCapacity, loot }) => `体力极限恢复 · 席位 ${nutritionCount}/${nutritionCapacity} · 居民积分 ${loot.toLocaleString()}`,
    closeLabel: "关闭疗养舱",
    icon: <NutritionIcon />,
    accent: MED_ACCENT,
    theme: MED_THEME,
    sfx: false,
  },
  sanctuary: {
    title: "圣水池",
    status: ({ purifyingCount, loot }) => `遗物净化 · 席位 ${purifyingCount}/${SANCTUARY_RULES.capacity} · 居民积分 ${loot.toLocaleString()}`,
    closeLabel: "关闭圣水池",
    icon: <SanctuaryIcon />,
    accent: SANCTUARY_ACCENT,
    theme: SANCTUARY_THEME,
    sfx: false,
  },
};

interface Props {
  leaving?: boolean;
}

export function CryoScene({ leaving = false }: Props) {
  const awakened = useTownStore((state) => state.awakened);
  const fallen = useTownStore((state) => state.fallen);
  const loot = useTownStore((state) => state.loot);
  const reviveFallen = useTownStore((state) => state.reviveFallen);
  const admitToNutritionPods = useTownStore((state) => state.admitToNutritionPods);
  const researchNutritionTech = useTownStore((state) => state.researchNutritionTech);
  const nutrition = useTownStore((state) => state.nutrition);
  const sanctuary = useTownStore((state) => state.sanctuary);
  const purifyRelic = useTownStore((state) => state.purifyRelic);
  const [podSlot, setPodSlot] = useState(0);
  const entryRise = useEntryRise();
  const morph = useCryoMorph();
  const { panel } = morph;

  const fallenCount = fallen.length;
  const nutritionCount = nutrition.occupants.length;
  const nutritionCapacity = nutritionPods(nutrition.techs);
  const panelContext = {
    fallenCount,
    loot,
    nutritionCount,
    nutritionCapacity,
    purifyingCount: sanctuary.purifying.length,
  };
  const panelMeta = panel ? PANEL_META[panel] : null;

  return (
    <div className={cn("cryo-scene", leaving && "is-leaving")}>
      <header className={cn("cryo-header")} style={{ left: "56px", top: "42px" }}>
        <span className={cn("cryo-kicker")}>生命维持医疗区</span>
        <h2 className={cn("cryo-title")}>医疗室</h2>
        <p className={cn("cryo-sub")}>复苏舱 · 体力疗养 · 遗物净化</p>
      </header>

      <div className={cn("cryo-readout")} style={{ right: "56px", top: "42px" }}>
        <div className={cn("cryo-chip")}>
          <span className={cn("cryo-chip-label")}>在编队员</span>
          <strong className={cn("cryo-chip-value")}>{awakened.length}</strong>
        </div>
        {fallenCount > 0 && (
          <div
            className={cn("cryo-chip", "is-alert")}
            style={{ "--cryo-chip-accent": FALLEN_ACCENT } as CSSProperties}
          >
            <span className={cn("cryo-chip-label")}>阵亡</span>
            <strong className={cn("cryo-chip-value")}>{fallenCount}</strong>
          </div>
        )}
        <div className={cn("cryo-chip")}>
          <span className={cn("cryo-chip-label")}>居民积分</span>
          <strong className={cn("cryo-chip-value")}>{loot.toLocaleString()}</strong>
        </div>
      </div>

      <div
        className={cn("cryo-entries")}
        {...entryRise}
        style={{
          right: "0px",
          top: "200px",
          width: "460px",
          gap: "12px",
          gridTemplateRows: "100px 100px 100px",
          "--peek": "268px",
          ...morph.entryVars,
        } as CSSProperties}
      >
        <EntryTile
          icon={<ReviveIcon />}
          name="复苏舱"
          desc={fallenCount > 0 ? `${fallenCount} 名队员待复苏` : "暂无阵亡队员"}
          entryId="revive"
          hidden={morph.hiddenEntry === "revive" && morph.phase !== "closing"}
          revealing={morph.phase === "closing" && morph.hiddenEntry === "revive"}
          onClick={(event) => morph.openPanel("revive", event.currentTarget)}
        />
        <EntryTile
          icon={<NutritionIcon />}
          name="疗养舱"
          desc={`${nutritionCount}/${nutritionCapacity} 席位疗养中`}
          entryId="nutrition"
          hidden={morph.hiddenEntry === "nutrition" && morph.phase !== "closing"}
          revealing={morph.phase === "closing" && morph.hiddenEntry === "nutrition"}
          onClick={(event) => morph.openPanel("nutrition", event.currentTarget)}
        />
        <EntryTile
          icon={<SanctuaryIcon />}
          name="圣水池"
          desc={`${sanctuary.purifying.length}/${SANCTUARY_RULES.capacity} 席位净化中`}
          entryId="sanctuary"
          glow={SANCTUARY_ACCENT}
          hidden={morph.hiddenEntry === "sanctuary" && morph.phase !== "closing"}
          revealing={morph.phase === "closing" && morph.hiddenEntry === "sanctuary"}
          onClick={(event) => morph.openPanel("sanctuary", event.currentTarget)}
        />
      </div>

      {panel && panelMeta && (
        <PanelShell
          accent={panelMeta.accent}
          title={panelMeta.title}
          status={panelMeta.status(panelContext)}
          closeLabel={panelMeta.closeLabel}
          closing={morph.phase === "closing"}
          onClose={morph.closePanel}
          sfx={panelMeta.sfx}
          themeStyle={panelMeta.theme}
          className={s["cryo-modal"]}
          morph={{
            ref: morph.panelRef,
            rect: PANEL_RECT[panel],
            ready: morph.ready,
            seed: panelMeta.icon,
            seedLabel: panelMeta.title,
          }}
        >
          {panel === "revive" ? (
            <RevivePanel awakened={awakened} fallen={fallen} loot={loot} slot={podSlot} onSelect={setPodSlot} onRevive={reviveFallen} />
          ) : panel === "nutrition" ? (
            <NutritionPanel onAdmit={admitToNutritionPods} onResearch={researchNutritionTech} />
          ) : (
            <SanctuaryPanel onPurify={purifyRelic} />
          )}
        </PanelShell>
      )}
    </div>
  );
}

function EntryTile({ icon, name, desc, entryId, hidden, revealing = false, glow, onClick }: { icon: ReactNode; name: string; desc: string; entryId: PanelId; hidden: boolean; revealing?: boolean; glow?: string; onClick: (event: MouseEvent<HTMLButtonElement>) => void }) {
  return (
    <button
      className={cn("cryo-entry", revealing && "is-revealing")}
      type="button"
      data-cryo-entry={entryId}
      onClick={onClick}
      style={{ visibility: hidden ? "hidden" : "visible", ...(glow ? { "--cryo-glow": glow } : {}) } as CSSProperties}
    >
      <span className={cn("cryo-rim")} aria-hidden />
      <span className={cn("cryo-entry-icon")} aria-hidden>{icon}</span>
      <span className={cn("cryo-entry-text")}>
        <span className={cn("cryo-entry-head")}><span className={cn("cryo-entry-name")}>{name}</span></span>
        <span className={cn("cryo-entry-desc")}>{desc}</span>
      </span>
      <span className={cn("cryo-entry-go")} aria-hidden>▸</span>
    </button>
  );
}

function ReviveIcon() {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round"><path d="M14 14h20v30H14z" strokeWidth={1.2} strokeLinejoin="round" opacity={0.38} /><circle cx="24" cy="26" r="4.5" strokeWidth={1.6} /><path d="M17 40c0-4.4 3.1-7.5 7-7.5s7 3.1 7 7.5M24 4v5M15.5 6.5l2.5 4M32.5 6.5L30 10.5" strokeWidth={1.5} /></svg>;
}

function NutritionIcon() {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round"><path d="M14 6h20v36H14z" strokeWidth={1.2} strokeLinejoin="round" opacity={0.38} /><path d="M18 29c3-7 9-7 12 0M24 15v13M20 19h8" strokeWidth={1.6} /><path d="M19 35h10" strokeWidth={1.2} opacity={0.72} /></svg>;
}

function SanctuaryIcon() {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M9 22 24 15l15 7-15 7-15-7Z" strokeWidth={1.4} opacity={0.42} /><path d="M9 22v11l15 7 15-7V22" strokeWidth={1.4} opacity={0.76} /><path d="M13 25v6l11 5 11-5v-6" strokeWidth={1.5} /><path d="M17 20c0-2 1.2-3 1.2-4.8M25 17c0-2.2 1.3-3.2 1.3-5M31 21c0-1.6 1-2.5 1-4" strokeWidth={1.2} /><circle cx="18.2" cy="13.5" r="1.2" strokeWidth={1.1} /><circle cx="26.3" cy="10.5" r="1.2" strokeWidth={1.1} /><circle cx="32" cy="15" r="1.1" strokeWidth={1.1} /></svg>;
}
