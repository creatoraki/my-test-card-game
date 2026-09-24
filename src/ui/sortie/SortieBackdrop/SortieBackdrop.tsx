import { memo, useEffect, useRef, useState, type CSSProperties } from "react";
import type { MapDef } from "@/data";
import type { SortieStep } from "@/store/sortie/sortieStore";
import { mapArt, warmMapArt } from "@/ui/art/explore/mapArt";
import { cx } from "@/ui/common/shared/cx";
import { MapMissionInfo } from "@/ui/sortie/MapMissionInfo";
import type { StepMotion } from "@/ui/sortie/SortieScreen/sortieStepTransition";
import s from "./SortieBackdrop.module.css";

const BACKGROUND_SLIDE_MS = 460;

interface Props {
  maps: readonly MapDef[];
  mapId: string;
  /** 纵深: 进入物资准备 = 镜头推近一层并压暗, 返回选层时拉远。 */
  depth: SortieStep;
  /** 任务信息随选层步骤进出场; hidden 时不渲染。 */
  infoMotion: StepMotion;
  lockReason?: string | null;
}

interface BackgroundLayer {
  id: string;
  seq: number;
  dir: 1 | -1;
}

function SortieBackdrop({
  maps,
  mapId,
  depth,
  infoMotion,
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
    <div className={s.backdrop} data-depth={depth} aria-label={`当前目标层：${map.name}`}>
      {/* ★ 纵深缩放挂在包裹层上: 背景图自带的切换动画(fill both)会占住 img 自身的 transform。 */}
      <div className={s.layers}>
        {layers.map((layer, index) => (
          <img
            key={layer.seq}
            className={cx(s.background, index < layers.length - 1 && s.backgroundOut)}
            style={{ "--dir": layer.dir } as CSSProperties}
            src={mapArt(layer.id)}
            alt=""
            aria-hidden
            draggable={false}
            decoding="async"
          />
        ))}
      </div>
      <div className={s.veil} aria-hidden />
      <div className={s.depthShade} aria-hidden />

      {infoMotion !== "hidden" && (
        <MapMissionInfo map={map} index={maps.indexOf(map)} motion={infoMotion} lockReason={lockReason} />
      )}
    </div>
  );
}

const MemoSortieBackdrop = memo(SortieBackdrop);
export { MemoSortieBackdrop as SortieBackdrop };
