import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { CHARACTERS, nutritionPods } from "@/data";
import { useTownStore } from "@/store/townStore";
import { prefersReducedMotion } from "@/ui/app/transitions";
import { cx } from "@/ui/common/cx";
import { AwakenPanel } from "../AwakenPanel";
import { CryoPanelShell, PANEL_OUT_MS, PANEL_OUT_REDUCED_MS } from "../CryoPanelShell";
import { NutritionPanel } from "../NutritionPanel";
import s from "./CryoScene.module.css";

const cn = (...values: Array<string | false | null | undefined>) =>
  cx(...values.map((value) => (typeof value === "string" ? s[value] : value)));

type PanelId = "awaken" | "nutrition";

const PANEL_SIZE: Record<PanelId, { w: number; h: number }> = {
  awaken: { w: 1180, h: 660 },
  nutrition: { w: 1240, h: 700 },
};

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
  const [panel, setPanel] = useState<PanelId | null>(null);
  const [closing, setClosing] = useState(false);
  const [podSlot, setPodSlot] = useState(0);

  const openPanel = useCallback((nextPanel: PanelId) => {
    setClosing(false);
    setPanel(nextPanel);
  }, []);

  const closePanel = useCallback(() => setClosing(true), []);

  useEffect(() => {
    if (!closing) return;
    const id = window.setTimeout(() => {
      setPanel(null);
      setClosing(false);
    }, prefersReducedMotion() ? PANEL_OUT_REDUCED_MS : PANEL_OUT_MS);
    return () => window.clearTimeout(id);
  }, [closing]);

  useEffect(() => {
    if (!panel) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, closePanel]);

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
          onClick={() => openPanel("awaken")}
        />
        <EntryTile
          icon={<NutritionIcon />}
          name="营养舱"
          desc={`${nutritionCount}/${nutritionCapacity} 舱位疗养中`}
          onClick={() => openPanel("nutrition")}
        />
      </div>

      {panel && (
        <CryoPanelShell size={PANEL_SIZE[panel]} closing={closing} onClose={closePanel} kicker={panel === "awaken" ? "冬眠舱阵列" : "营养液循环系统"} title={panel === "awaken" ? "冬眠唤醒 · 舱位解封" : "营养舱 · 体力极限疗养"}>
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

function EntryTile({ icon, name, desc, onClick }: { icon: ReactNode; name: string; desc: string; onClick: () => void }) {
  return (
    <button className={cn("cryo-entry")} type="button" onClick={onClick}>
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
