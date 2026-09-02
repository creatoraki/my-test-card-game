import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { MapDef } from "@/data";
import { mapArt, warmMapArt } from "@/ui/art/mapArt";
import { cx } from "@/ui/common/cx";
import s from "./SortieBackdrop.module.css";

const BACKGROUND_SLIDE_MS = 460;

interface Props {
  maps: readonly MapDef[];
  mapId: string;
  showInfo: boolean;
  intro: boolean;
  infoEntering?: boolean;
  infoExiting?: boolean;
  lockReason?: string | null;
}

interface BackgroundLayer {
  id: string;
  seq: number;
  dir: 1 | -1;
}

export function SortieBackdrop({
  maps,
  mapId,
  showInfo,
  intro,
  infoEntering = false,
  infoExiting = false,
  lockReason = null,
}: Props) {
  const map = maps.find((candidate) => candidate.id === mapId) ?? maps[0];
  const directionRef = useRef<1 | -1>(1);
  const sequenceRef = useRef(0);
  const [layers, setLayers] = useState<BackgroundLayer[]>(() => [
    { id: maps[0]?.id ?? "", seq: 0, dir: 1 },
  ]);

  useEffect(warmMapArt, []);

  useEffect(() => {
    setLayers((previous) => {
      const currentId = previous[previous.length - 1]?.id;
      if (currentId === mapId) return previous;

      const from = maps.findIndex((candidate) => candidate.id === currentId);
      const to = maps.findIndex((candidate) => candidate.id === mapId);
      directionRef.current = to >= from ? 1 : -1;
      sequenceRef.current += 1;
      return [
        ...previous,
        { id: mapId, seq: sequenceRef.current, dir: directionRef.current },
      ];
    });
  }, [mapId, maps]);

  useEffect(() => {
    if (layers.length < 2) return;
    const timer = window.setTimeout(
      () => setLayers((previous) => previous.slice(-1)),
      BACKGROUND_SLIDE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [layers]);

  if (!map) return null;

  return (
    <div className={s.backdrop} aria-label={`当前目标层：${map.name}`}>
      {layers.map((layer, index) => (
        <img
          key={layer.seq}
          className={cx(s.background, index < layers.length - 1 && s.backgroundOut)}
          style={{ "--dir": layer.dir } as CSSProperties}
          src={mapArt(layer.id)}
          alt=""
          aria-hidden
          draggable={false}
        />
      ))}
      <div className={s.veil} aria-hidden />

      {showInfo && (
        <header
          className={cx(
            s.info,
            intro && s.infoIntro,
            infoEntering && s.infoEntering,
            infoExiting && s.infoExiting,
          )}
          aria-live="polite"
        >
          <span className={s.kicker}>TARGET SECTOR / ACTIVE ROUTE</span>
          <h1 className={s.name}>{map.name}</h1>
          <p className={s.desc}>{map.desc}</p>
          <div className={s.meta}>
            <span className={s.stars} aria-label={`难度 ${map.difficulty} / 5`}>
              {"★".repeat(map.difficulty)}{"☆".repeat(5 - map.difficulty)}
            </span>
            <span>{map.roundCount} 轮</span>
            <span>粒子 {map.startingEnergy}</span>
            {lockReason && <span className={s.lockReason}>{lockReason}</span>}
          </div>
        </header>
      )}
    </div>
  );
}