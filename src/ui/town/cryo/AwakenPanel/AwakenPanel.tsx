import { useMemo, type CSSProperties } from "react";
import { CHARACTERS, getCharacter } from "@/data";
import { RULES } from "@/engine";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import { useCountUp } from "@/ui/hooks/useCountUp";
import { CONTENT_DELAY_MS, STAGGER_MS } from "../CryoPanelShell";
import kit from "../styles/cryoKit.module.css";
import s from "./AwakenPanel.module.css";

const stagger = (index: number): CSSProperties => ({ "--i": index } as CSSProperties);

const VITALS: { label: string; num?: number; decimals?: number; unit?: string; text?: string }[] = [
  { label: "舱内温度", num: -196.4, decimals: 1, unit: "°C" },
  { label: "代谢速率", num: 0.3, decimals: 1, unit: "%" },
  { label: "舱压", text: "标称" },
  { label: "维生余量", text: "充足" },
];

type Pod =
  | { kind: "awake"; charId: string }
  | { kind: "sealed"; charId: string }
  | { kind: "empty" };

interface Props {
  awakened: string[];
  loot: number;
  slot: number;
  onSelect: (index: number) => void;
  onAwaken: (charId: string) => void;
}

export function AwakenPanel({ awakened, loot, slot, onSelect, onAwaken }: Props) {
  const pods = useMemo<Pod[]>(() => {
    const awake: Pod[] = awakened.map((charId) => ({ kind: "awake", charId }));
    const sealed: Pod[] = CHARACTERS.filter((character) => !awakened.includes(character.id)).map((character) => ({
      kind: "sealed",
      charId: character.id,
    }));
    const filled = [...awake, ...sealed];
    const empty: Pod[] = Array.from({ length: Math.max(0, 6 - filled.length) }, () => ({ kind: "empty" }));
    return [...filled, ...empty];
  }, [awakened]);

  const active = pods[slot] ?? pods[0];
  const cost = RULES.progression.awakenCost;
  const affordable = loot >= cost;
  const canAwaken = active?.kind === "sealed" && affordable;

  return (
    <>
      <div className={s.body} style={{ gridTemplateColumns: "440px 1fr" }}>
        <div className={s.rack}>
          {pods.map((pod, index) => (
            <PodCard
              key={pod.kind === "empty" ? `empty-${index}` : pod.charId}
              pod={pod}
              index={index}
              selected={index === slot}
              onSelect={() => onSelect(index)}
            />
          ))}
        </div>

        <div className={s.detail} key={slot}>
          {active?.kind === "sealed" ? (
            <>
              <div className={s.sealedFigure} aria-hidden>
                <SealedIcon />
              </div>
              <span className={s.kicker}>休眠状态 · {active.charId}</span>
              <h4 className={s.name}>休眠体 · 身份未解析</h4>
              <p className={s.desc}>舱盖仍处于密封状态。解封前无法读取该冬眠体的档案, 只知道生命体征仍在。</p>
              <div className={s.vitals}>
                {VITALS.map((vital, index) => <VitalCell key={vital.label} vital={vital} index={index} />)}
              </div>
            </>
          ) : active?.kind === "awake" ? (
            <>
              <div className={s.awakeFigure}>
                <CharacterPortrait characterId={active.charId} emoji={getCharacter(active.charId).emoji} alt={getCharacter(active.charId).name} className={s.bust} />
              </div>
              <span className={s.kicker}>已解封</span>
              <h4 className={s.name}>{getCharacter(active.charId).name}</h4>
              <p className={s.desc}>该舱位已解封。档案与卡组请去队员档案查看, 出战编成去编队。</p>
            </>
          ) : (
            <>
              <div className={s.emptyFigure} aria-hidden><NoSignalIcon /></div>
              <span className={s.kicker}>无信号</span>
              <p className={s.desc}>此舱位没有冬眠体信号。</p>
            </>
          )}
        </div>
      </div>

      <div className={kit.panelFoot}>
        <p className={kit.note}>
          {active?.kind !== "sealed"
            ? "选中一个密封舱位才能解封。"
            : affordable
              ? "解封后该队员进入待命, 不会自动上阵。"
              : `残片不足, 还差 ${(cost - loot).toLocaleString()} 才够解封。`}
        </p>
        <button className={kit.primary} type="button" disabled={!canAwaken} onClick={() => active?.kind === "sealed" && onAwaken(active.charId)}>
          解封唤醒 −{cost} 残片
        </button>
      </div>
    </>
  );
}

function PodCard({ pod, index, selected, onSelect }: { pod: Pod; index: number; selected: boolean; onSelect: () => void }) {
  return (
    <button className={`${s.pod} ${s[`is-${pod.kind}`]} ${selected ? s["is-selected"] : ""}`} type="button" style={stagger(index)} onClick={onSelect}>
      <span className={s.lid} aria-hidden />
      <span className={s.frost} aria-hidden />
      <span className={s.no}>舱位-{String(index + 1).padStart(2, "0")}</span>
      {pod.kind === "awake" ? (
        <>
          <span className={`${s.figure} ${s.vitrine}`}><CharacterPortrait characterId={pod.charId} emoji={getCharacter(pod.charId).emoji} alt={getCharacter(pod.charId).name} className={s.portrait} /></span>
          <span className={s.text}><span className={s.name}>{getCharacter(pod.charId).name}</span><span className={s.meta}><i className={s.led} aria-hidden />已解封</span></span>
        </>
      ) : pod.kind === "sealed" ? (
        <>
          <span className={`${s.figure} ${s.icon}`}><SealedIcon /></span>
          <span className={s.text}><span className={s.name}>休眠体</span><span className={s.meta}><i className={s.led} aria-hidden />密封 · 体征稳定</span></span>
        </>
      ) : (
        <>
          <span className={`${s.figure} ${s.icon}`}><NoSignalIcon /></span>
          <span className={s.text}><span className={s.name}>无信号</span><span className={s.meta}><i className={s.led} aria-hidden />空舱</span></span>
        </>
      )}
    </button>
  );
}

function VitalCell({ vital, index }: { vital: (typeof VITALS)[number]; index: number }) {
  const shown = useCountUp(vital.num ?? 0, CONTENT_DELAY_MS + index * STAGGER_MS, 460, vital.decimals ?? 0);
  return (
    <div className={s.vital} style={stagger(index)}>
      <span className={s.label}>{vital.label}</span>
      <strong className={s.value}>{vital.num === undefined ? vital.text : `${shown.toFixed(vital.decimals ?? 0)} ${vital.unit ?? ""}`.trim()}</strong>
    </div>
  );
}

function SealedIcon() {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round"><path d="M14 5h20v38H14z" strokeWidth={1.2} opacity={0.38} /><circle cx="24" cy="17" r="4.5" strokeWidth={1.6} /><path d="M17 31c0-4.4 3.1-7.5 7-7.5s7 3.1 7 7.5M21 38h6v4h-6zM22.5 38v-2a1.5 1.5 0 013 0v2" strokeWidth={1.4} /></svg>;
}

function NoSignalIcon() {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round"><path d="M14 6h20v36H14z" strokeWidth={1.2} opacity={0.38} /><path d="M10 24h28" strokeWidth={1.6} strokeDasharray="5 4" /></svg>;
}