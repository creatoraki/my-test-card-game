import { useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { CHARACTERS, nutritionPods } from "@/data";
import { useTownStore } from "@/store/townStore";
import { cx } from "@/ui/common/cx";
import { AwakenPanel } from "../AwakenPanel";
import { CryoPanelShell } from "../CryoPanelShell";
import { NutritionPanel } from "../NutritionPanel";
import { PANEL_RECT } from "../cryoMorph/cryoChoreo";
import { useCryoMorph, type PanelId } from "../cryoMorph/useCryoMorph";
import s from "./CryoScene.module.css";

const cn = (...values: Array<string | false | null | undefined>) =>
  cx(...values.map((value) => (typeof value === "string" ? s[value] : value)));

interface Props {
  leaving?: boolean;
}

export function CryoScene({ leaving = false }: Props) {
  const awakened = useTownStore((state) => state.awakened);
  const loot = useTownStore((state) => state.loot);
  const awaken = useTownStore((state) => state.awaken);
  const admitToNutritionPod = useTownStore((state) => state.admitToNutritionPod);
  const researchNutritionTech = useTownStore((state) => state.researchNutritionTech);
  const nutrition = useTownStore((state) => state.nutrition);
  const [podSlot, setPodSlot] = useState(0);
  const morph = useCryoMorph();
  const { panel } = morph;

  const sealedCount = CHARACTERS.length - awakened.length;
  const nutritionCount = nutrition.occupants.length;
  const nutritionCapacity = nutritionPods(nutrition.techs);

  return (
    <div className={cn("cryo-scene", leaving && "is-leaving")}>
      <header className={cn("cryo-header")} style={{ left: "56px", top: "42px" }}>
        <span className={cn("cryo-kicker")}>冷冻生命维持区</span>
        <h2 className={cn("cryo-title")}>冬眠仓</h2>
        <p className={cn("cryo-sub")}>队员唤醒 · 生命疗养</p>
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
        style={{
          right: "0px",
          top: "240px",
          width: "460px",
          gap: "10px",
          gridTemplateRows: "88px 88px",
          "--peek": "260px",
        } as CSSProperties}
      >
        <EntryTile
          icon={<AwakenIcon />}
          name="冬眠唤醒"
          desc={sealedCount > 0 ? `${sealedCount} 具休眠体待解封` : "无休眠体信号"}
          entryId="awaken"
          hidden={morph.hiddenEntry === "awaken"}
          onClick={(event) => morph.openPanel("awaken", event.currentTarget)}
        />
        <EntryTile
          icon={<NutritionIcon />}
          name="营养舱"
          desc={`${nutritionCount}/${nutritionCapacity} 舱位疗养中`}
          entryId="nutrition"
          hidden={morph.hiddenEntry === "nutrition"}
          onClick={(event) => morph.openPanel("nutrition", event.currentTarget)}
        />
      </div>

      {panel && (
        <CryoPanelShell
          ref={morph.panelRef}
          rect={PANEL_RECT[panel]}
          ready={morph.ready}
          onClose={morph.closePanel}
          seed={panel === "awaken" ? <AwakenIcon /> : <NutritionIcon />}
          kicker={panel === "awaken" ? "冬眠舱阵列" : "营养液循环系统"}
          title={panel === "awaken" ? "冬眠唤醒 · 舱位解封" : "营养舱 · 体力极限疗养"}
        >
          {panel === "awaken" ? (
            <AwakenPanel awakened={awakened} loot={loot} slot={podSlot} onSelect={setPodSlot} onAwaken={awaken} />
          ) : (
            <NutritionPanel onAdmit={admitToNutritionPod} onResearch={researchNutritionTech} />
          )}
        </CryoPanelShell>
      )}
    </div>
  );
}

function EntryTile({ icon, name, desc, entryId, hidden, onClick }: { icon: ReactNode; name: string; desc: string; entryId: PanelId; hidden: boolean; onClick: (event: MouseEvent<HTMLButtonElement>) => void }) {
  return (
    <button className={cn("cryo-entry")} type="button" data-cryo-entry={entryId} onClick={onClick} style={{ visibility: hidden ? "hidden" : "visible" }}>
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
