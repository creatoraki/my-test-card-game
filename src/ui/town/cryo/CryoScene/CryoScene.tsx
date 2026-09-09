import { useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { CHARACTERS, nutritionPods } from "@/data";
import { useTownStore } from "@/store/townStore";
import { PanelShell } from "@/ui/common/PanelShell";
import { cx } from "@/ui/common/cx";
import { AwakenPanel } from "../AwakenPanel";
import { NutritionPanel } from "../NutritionPanel";
import { PANEL_RECT } from "../cryoMorph/cryoChoreo";
import { useEntryRise } from "@/ui/hooks/useEntryRise";
import { useCryoMorph, type PanelId } from "../cryoMorph/useCryoMorph";
import s from "./CryoScene.module.css";

const cn = (...values: Array<string | false | null | undefined>) =>
  cx(...values.map((value) => (typeof value === "string" ? s[value] : value)));

const MED_ACCENT = "#4fd6b8";
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

interface Props {
  leaving?: boolean;
}

export function CryoScene({ leaving = false }: Props) {
  const awakened = useTownStore((state) => state.awakened);
  const loot = useTownStore((state) => state.loot);
  const awaken = useTownStore((state) => state.awaken);
  const admitToNutritionPods = useTownStore((state) => state.admitToNutritionPods);
  const researchNutritionTech = useTownStore((state) => state.researchNutritionTech);
  const nutrition = useTownStore((state) => state.nutrition);
  const [podSlot, setPodSlot] = useState(0);
  const entryRise = useEntryRise();
  const morph = useCryoMorph();
  const { panel } = morph;

  const sealedCount = CHARACTERS.length - awakened.length;
  const nutritionCount = nutrition.occupants.length;
  const nutritionCapacity = nutritionPods(nutrition.techs);

  return (
    <div className={cn("cryo-scene", leaving && "is-leaving")}>
      <header className={cn("cryo-header")} style={{ left: "56px", top: "42px" }}>
        <span className={cn("cryo-kicker")}>生命维持医疗区</span>
        <h2 className={cn("cryo-title")}>医疗室</h2>
        <p className={cn("cryo-sub")}>休眠唤醒 · 体力疗养</p>
      </header>

      <div className={cn("cryo-readout")} style={{ right: "56px", top: "42px" }}>
        <div className={cn("cryo-chip")}>
          <span className={cn("cryo-chip-label")}>已唤醒</span>
          <strong className={cn("cryo-chip-value")}>{awakened.length}</strong>
        </div>
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
          top: "240px",
          width: "460px",
          gap: "12px",
          gridTemplateRows: "100px 100px",
          "--peek": "268px",
          ...morph.entryVars,
        } as CSSProperties}
      >
        <EntryTile
          icon={<AwakenIcon />}
          name="休眠唤醒"
          desc={sealedCount > 0 ? `${sealedCount} 具休眠体待唤醒` : "暂无待唤醒的休眠体"}
          entryId="awaken"
          hidden={morph.hiddenEntry === "awaken" && morph.phase !== "closing"}
          revealing={morph.phase === "closing" && morph.hiddenEntry === "awaken"}
          onClick={(event) => morph.openPanel("awaken", event.currentTarget)}
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
      </div>

      {panel && (
        <PanelShell
          accent={MED_ACCENT}
          title={panel === "awaken" ? "休眠唤醒" : "疗养舱"}
          status={
            panel === "awaken"
              ? `舱位解封 · 待唤醒 ${sealedCount} 具 · 居民积分 ${loot.toLocaleString()}`
              : `体力极限恢复 · 席位 ${nutritionCount}/${nutritionCapacity} · 居民积分 ${loot.toLocaleString()}`
          }
          closeLabel={panel === "awaken" ? "关闭休眠唤醒" : "关闭疗养舱"}
          closing={morph.phase === "closing"}
          onClose={morph.closePanel}
          sfx={panel === "awaken"}
          themeStyle={MED_THEME}
          className={s["cryo-modal"]}
          morph={{
            ref: morph.panelRef,
            rect: PANEL_RECT[panel],
            ready: morph.ready,
            seed: panel === "awaken" ? <AwakenIcon /> : <NutritionIcon />,
            seedLabel: panel === "awaken" ? "休眠唤醒" : "疗养舱",
          }}
        >
          {panel === "awaken" ? (
            <AwakenPanel awakened={awakened} loot={loot} slot={podSlot} onSelect={setPodSlot} onAwaken={awaken} />
          ) : (
            <NutritionPanel onAdmit={admitToNutritionPods} onResearch={researchNutritionTech} />
          )}
        </PanelShell>
      )}
    </div>
  );
}

function EntryTile({ icon, name, desc, entryId, hidden, revealing = false, onClick }: { icon: ReactNode; name: string; desc: string; entryId: PanelId; hidden: boolean; revealing?: boolean; onClick: (event: MouseEvent<HTMLButtonElement>) => void }) {
  return (
    <button className={cn("cryo-entry", revealing && "is-revealing")} type="button" data-cryo-entry={entryId} onClick={onClick} style={{ visibility: hidden ? "hidden" : "visible" }}>
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

function AwakenIcon() {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round"><path d="M14 14h20v30H14z" strokeWidth={1.2} strokeLinejoin="round" opacity={0.38} /><circle cx="24" cy="26" r="4.5" strokeWidth={1.6} /><path d="M17 40c0-4.4 3.1-7.5 7-7.5s7 3.1 7 7.5M24 4v5M15.5 6.5l2.5 4M32.5 6.5L30 10.5" strokeWidth={1.5} /></svg>;
}

function NutritionIcon() {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round"><path d="M14 6h20v36H14z" strokeWidth={1.2} strokeLinejoin="round" opacity={0.38} /><path d="M18 29c3-7 9-7 12 0M24 15v13M20 19h8" strokeWidth={1.6} /><path d="M19 35h10" strokeWidth={1.2} opacity={0.72} /></svg>;
}
