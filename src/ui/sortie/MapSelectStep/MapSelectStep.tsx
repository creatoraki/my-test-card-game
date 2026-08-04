import { useCallback, useEffect, useRef, useState, type CSSProperties, type WheelEvent } from "react";
import { MAPS } from "@/data";
import { useTownStore } from "@/store/townStore";
import { useSortieStore } from "@/store/sortieStore";
import { cx } from "@/ui/common/cx";
import { mapArt, warmMapArt } from "@/ui/art/mapArt";
import s from "./MapSelectStep.module.css";

interface Props {
  onCancel: () => void;
}

/* 切片步进 = 切片高 + 间隙, 必须与 MapSelectStep.module.css 的 .sm-slice 保持一致。 */
const SLICE_STEP = 214;
/* 滚轮节流: 触控板惯性会连发 wheel, 不节流会一次跳过多张。 */
const WHEEL_GAP_MS = 180;
/* 背景推移时长, 必须与 MapSelectStep.module.css 的 smBgIn / smBgOut 一致。 */
const BG_SLIDE_MS = 460;

interface BgLayer {
  id: string;
  seq: number;
  dir: 1 | -1;
}

export function MapSelectStep({ onCancel }: Props) {
  const party = useTownStore((state) => state.party);
  const pickMap = useSortieStore((state) => state.pickMap);
  const [mapId, setMapId] = useState(MAPS[0]?.id ?? "");
  const selected = MAPS.find((map) => map.id === mapId) ?? MAPS[0];
  const wheelAtRef = useRef(0);
  /* 背景推移方向: +1 表示往下一张地图走(新图从下方推入), -1 相反。 */
  const dirRef = useRef<1 | -1>(1);
  const seqRef = useRef(0);
  const [layers, setLayers] = useState<BgLayer[]>(() => [{ id: MAPS[0]?.id ?? "", seq: 0, dir: 1 }]);

  useEffect(warmMapArt, []);

  /* 换图时压入一张新层, 旧层留到动画结束再摘, 才能做出"一进一出"的上下推移。 */
  useEffect(() => {
    setLayers((prev) => {
      if (prev[prev.length - 1]?.id === mapId) return prev;
      seqRef.current += 1;
      return [...prev, { id: mapId, seq: seqRef.current, dir: dirRef.current }];
    });
  }, [mapId]);

  useEffect(() => {
    if (layers.length < 2) return;
    const timer = window.setTimeout(() => setLayers((prev) => prev.slice(-1)), BG_SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [layers]);

  const select = useCallback((nextId: string) => {
    setMapId((currentId) => {
      if (nextId === currentId) return currentId;
      const from = MAPS.findIndex((map) => map.id === currentId);
      const to = MAPS.findIndex((map) => map.id === nextId);
      dirRef.current = to >= from ? 1 : -1;
      return nextId;
    });
  }, []);

  const step = useCallback((offset: number) => {
    dirRef.current = offset > 0 ? 1 : -1;
    setMapId((currentId) => {
      const currentIndex = Math.max(0, MAPS.findIndex((map) => map.id === currentId));
      const nextIndex = (currentIndex + offset + MAPS.length) % MAPS.length;
      return MAPS[nextIndex]?.id ?? currentId;
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const back = event.key === "ArrowUp" || event.key === "ArrowLeft";
      const next = event.key === "ArrowDown" || event.key === "ArrowRight";
      if (!back && !next) return;
      event.preventDefault();
      step(next ? 1 : -1);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [step]);

  const onWheel = (event: WheelEvent<HTMLElement>) => {
    if (event.deltaY === 0) return;
    const now = performance.now();
    if (now - wheelAtRef.current < WHEEL_GAP_MS) return;
    wheelAtRef.current = now;
    step(event.deltaY > 0 ? 1 : -1);
  };

  if (!selected) return null;

  const selectedIndex = Math.max(0, MAPS.findIndex((map) => map.id === selected.id));
  /* 让选中切片的中心停在画布竖直中点; 父级已 skew, 局部纯 translateY 在屏幕上即沿斜带轴线滑动。 */
  const shift = -(selectedIndex + 0.5) * SLICE_STEP;

  return (
    <section className={s["sm-step"]} aria-labelledby="sortie-map-title" onWheel={onWheel}>
      {layers.map((layer, index) => (
        <img
          key={layer.seq}
          className={cx(s["sm-bg"], index < layers.length - 1 && s["sm-bg-out"])}
          style={{ "--dir": layer.dir } as CSSProperties}
          src={mapArt(layer.id)}
          alt=""
          draggable={false}
        />
      ))}
      <div className={s["sm-veil"]} />

      <header className={s["sm-info"]}>
        <h1 id="sortie-map-title" className={s["sm-info-name"]}>{selected.name}</h1>
        <p className={s["sm-info-desc"]}>{selected.desc}</p>
        <span className={s["sm-info-stars"]} aria-label={`难度 ${selected.difficulty} / 5`}>
          {"★".repeat(selected.difficulty)}{"☆".repeat(5 - selected.difficulty)}
        </span>
      </header>

      <div className={s["sm-band"]}>
        <div className={s["sm-band-list"]} style={{ "--shift": shift } as CSSProperties} role="listbox" aria-label="目标层">
          {MAPS.map((map, index) => (
            <button
              key={map.id}
              className={cx(s["sm-slice"], map.id === selected.id && s["sm-is-on"])}
              type="button"
              role="option"
              aria-selected={map.id === selected.id}
              aria-label={`选择${map.name}`}
              onClick={() => select(map.id)}
            >
              <img className={s["sm-slice-art"]} src={mapArt(map.id)} alt="" draggable={false} />
              <span className={s["sm-slice-copy"]}>
                <span className={s["sm-slice-no"]}>{`SECTOR-${String(index + 1).padStart(2, "0")}`}</span>
                <strong className={s["sm-slice-name"]}>{map.name}</strong>
              </span>
            </button>
          ))}
        </div>
      </div>

      <button
        className={s["sm-confirm"]}
        type="button"
        disabled={party.length === 0}
        onClick={() => pickMap(selected.id)}
      >
        确认目标层 <span aria-hidden>▸</span>
      </button>
      <button className={s["sm-back"]} type="button" onClick={onCancel}>
        ← 返回据点
      </button>
    </section>
  );
}
