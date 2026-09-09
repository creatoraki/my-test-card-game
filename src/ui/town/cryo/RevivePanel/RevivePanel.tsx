import { useMemo, type CSSProperties } from "react";
import { CHARACTERS, getCharacter } from "@/data";
import { RULES } from "@/engine";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import { useCountUp } from "@/ui/hooks/useCountUp";
import { CryoFigureStrip } from "../CryoFigureStrip";
import { CONTENT_DELAY_MS, STAGGER_MS } from "../cryoMorph/cryoChoreo";
import kit from "../styles/cryoKit.module.css";
import figure from "../styles/cryoFigure.module.css";
import s from "./RevivePanel.module.css";

const stagger = (index: number): CSSProperties => ({ "--i": index } as CSSProperties);

const VITALS: { label: string; num?: number; decimals?: number; unit?: string; text?: string }[] = [
  { label: "舱内温度", num: -196.4, decimals: 1, unit: "°C" },
  { label: "代谢速率", num: 0.3, decimals: 1, unit: "%" },
  { label: "舱压", text: "标称" },
  { label: "维生余量", text: "充足" },
];

type Pod =
  | { kind: "active"; charId: string }
  | { kind: "fallen"; charId: string }
  | { kind: "empty" };

interface Props {
  awakened: string[];
  fallen: string[];
  loot: number;
  slot: number;
  onSelect: (index: number) => void;
  onRevive: (charId: string) => void;
}

export function RevivePanel({ awakened, fallen, loot, slot, onSelect, onRevive }: Props) {
  const pods = useMemo<Pod[]>(() => {
    const active: Pod[] = awakened.map((charId) => ({ kind: "active", charId }));
    const fallenPods: Pod[] = fallen
      .map((charId) => CHARACTERS.find((character) => character.id === charId))
      .filter((character): character is (typeof CHARACTERS)[number] => Boolean(character))
      .map((character) => ({ kind: "fallen", charId: character.id }));
    const filled = [...active, ...fallenPods];
    const empty: Pod[] = Array.from({ length: Math.max(0, 6 - filled.length) }, () => ({ kind: "empty" }));
    return [...filled, ...empty];
  }, [awakened, fallen]);

  const active = pods[slot] ?? pods[0];
  const cost = RULES.progression.reviveCost;
  const canRevive = active?.kind === "fallen";

  return (
    <div className={kit.shell}>
      <div className={s.body}>
        <CryoFigureStrip className={s.rack}>
          {pods.map((pod, index) => (
            <PodCard
              key={pod.kind === "empty" ? `empty-${index}` : pod.charId}
              pod={pod}
              index={index}
              selected={index === slot}
              onSelect={() => onSelect(index)}
            />
          ))}
        </CryoFigureStrip>

        <div className={s.detail} key={slot}>
          <div className={s.detailText}>
            {active?.kind === "fallen" ? (
              <>
                <span className={s.kicker}>生命信号中断</span>
                <h4 className={s.name}>{getCharacter(active.charId).name}</h4>
                <p className={s.desc}>复苏后档案将完全归零，装备与卡上模组不会回来。</p>
              </>
            ) : active?.kind === "active" ? (
              <>
                <span className={s.kicker}>已唤醒</span>
                <h4 className={s.name}>{getCharacter(active.charId).name}</h4>
                <p className={s.desc}>该舱位已唤醒。档案与卡组请去队员档案查看，出战编成去编队。</p>
              </>
            ) : (
              <>
                <span className={s.kicker}>无信号</span>
                <h4 className={s.name}>空舱</h4>
                <p className={s.desc}>此舱位没有可用信号。</p>
              </>
            )}
          </div>
          {active?.kind === "fallen" && (
            <div className={s.vitals}>
              {VITALS.map((vital, index) => <VitalCell key={vital.label} vital={vital} index={index} />)}
            </div>
          )}
        </div>
      </div>

      <div className={kit.panelFoot}>
        <p className={kit.note}>
          {active?.kind !== "fallen"
            ? "选中一名阵亡队员才能复苏。"
            : loot < cost
              ? `积分将透支至 ${(loot - cost).toLocaleString()}，复苏仍会执行。`
              : "复苏后该队员进入待命，不会自动上阵。"}
        </p>
        <button className={kit.primary} type="button" disabled={!canRevive} onClick={() => active?.kind === "fallen" && onRevive(active.charId)}>
          复苏唤醒 −{cost} 居民积分
        </button>
      </div>
    </div>
  );
}

function PodCard({ pod, index, selected, onSelect }: { pod: Pod; index: number; selected: boolean; onSelect: () => void }) {
  const character = pod.kind === "empty" ? null : getCharacter(pod.charId);
  return (
    <button className={`${s.pod} ${s[`is-${pod.kind}`]} ${selected ? s["is-selected"] : ""}`} type="button" style={stagger(index)} onClick={onSelect}>
      <span className={s.lid} aria-hidden />
      <span className={s.no}>舱位-{String(index + 1).padStart(2, "0")}</span>
      <span className={s.figure}>
        {pod.kind === "active" && character ? (
          <CharacterPortrait characterId={character.id} emoji={character.emoji} alt={character.name} className={s.portrait} />
        ) : pod.kind === "fallen" && character ? (
          <CharacterPortrait characterId={character.id} emoji={character.emoji} alt={character.name} className={s.portrait} />
        ) : <NoSignalIcon />}
        <span className={figure.figureScrim} aria-hidden />
      </span>
      <span className={s.text}>
        <span className={s.name}>{pod.kind !== "empty" && character ? character.name : "无信号"}</span>
        <span className={s.meta}><i className={s.led} aria-hidden />{pod.kind === "active" ? "在编队" : pod.kind === "fallen" ? "生命信号中断" : "空舱"}</span>
      </span>
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

function NoSignalIcon() {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round"><path d="M14 6h20v36H14z" strokeWidth={1.2} opacity={0.38} /><path d="M10 24h28" strokeWidth={1.6} strokeDasharray="5 4" /></svg>;
}
