import { useEffect, useId, useState } from "react";
import backgroundUrl from "@/assets/场景/测试/背景素材.png";
import { BUILDING_CONTOURS, SCENE_HEIGHT, SCENE_WIDTH } from "./buildingContours";
import s from "./AstraSceneDemo.module.css";

type Building = (typeof BUILDING_CONTOURS)[number];

function BuildingBillboard({ building, index }: { building: Building; index: number }) {
  const { x, y, anchorX, anchorY } = building.sign;
  const height = building.label.length * 32 + 64;

  return (
    <g className={s.billboard} aria-hidden="true">
      <path
        className={s.signConnector}
        d={`M ${x} ${y + height} V ${y + height + 14} L ${anchorX} ${anchorY}`}
      />
      <circle className={s.signAnchor} cx={anchorX} cy={anchorY} r="4" />
      <g transform={`translate(${x - 32} ${y})`}>
        <path
          className={s.signPanel}
          d={`M 10 0 H 64 V ${height - 10} L 54 ${height} H 0 V 10 Z`}
        />
        <path className={s.signRail} d={`M 0 42 V 12 L 10 2 H 34 M 64 ${height - 42} V ${height - 12} L 54 ${height - 2} H 30`} />
        <text className={s.signIndex} x="32" y="22" textAnchor="middle">
          {String(index + 1).padStart(2, "0")}
        </text>
        <path className={s.signDivider} d="M 17 32 H 47" />
        <text className={s.signName} textAnchor="middle">
          {Array.from(building.label).map((character, i) => (
            <tspan key={i} x="32" y={61 + i * 32}>{character}</tspan>
          ))}
        </text>
        <path className={s.signDivider} d={`M 22 ${height - 18} H 42`} />
        <circle className={s.signLight} cx="32" cy={height - 9} r="2" />
      </g>
    </g>
  );
}

function SortieButton() {
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    if (!launching) return;
    const timer = window.setTimeout(() => setLaunching(false), 1200);
    return () => window.clearTimeout(timer);
  }, [launching]);

  return (
    <div className={s.sortieDock}>
      <span className={s.sortieStatus} aria-hidden="true"><i /> 系统就绪 · READY</span>
      <button
        type="button"
        className={s.sortieButton}
        data-launching={launching}
        aria-label="出击，播放启动演示"
        onClick={() => setLaunching(true)}
      >
        <span className={s.sortieSurface} aria-hidden="true" />
        <span className={s.sortieReactor} aria-hidden="true">
          <svg viewBox="0 0 64 64" fill="none">
            <circle className={s.reactorOrbit} cx="32" cy="32" r="27" />
            <circle cx="32" cy="32" r="21" stroke="currentColor" strokeOpacity=".3" />
            <path d="m34 12-15 23h12l-2 17 16-25H33z" fill="currentColor" />
          </svg>
        </span>
        <span className={s.sortieCopy}>
          <span className={s.sortieEnglish} aria-hidden="true">{launching ? "LAUNCH SEQUENCE" : "SORTIE / DEPLOY"}</span>
          <span className={s.sortieTitle}>出击</span>
        </span>
        <span className={s.sortieArrows} aria-hidden="true"><i /><i /><i /></span>
      </button>
      <span className={s.sortieCaption} aria-hidden="true">ASTRA COMMAND <span>远征启航 //</span></span>
    </div>
  );
}

export function AstraSceneDemo() {
  const id = useId().replace(/:/g, "");

  return (
    <div className={s.root}>
      <svg
        className={s.scene}
        viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
        aria-labelledby={`${id}-title ${id}-description`}
      >
        <title id={`${id}-title`}>空间站</title>
        <desc id={`${id}-description`}>
          将鼠标移到建筑上，或使用 Tab 键聚焦建筑，查看沿建筑外轮廓环绕的光效。
        </desc>
        <defs>
          {BUILDING_CONTOURS.map((building) => (
            <path key={building.id} id={`${id}-${building.id}`} d={building.path} />
          ))}
        </defs>
        <image href={backgroundUrl} width={SCENE_WIDTH} height={SCENE_HEIGHT} />
        {BUILDING_CONTOURS.map((building, index) => {
          const href = `#${id}-${building.id}`;
          return (
            <g
              key={building.id}
              className={s.building}
              tabIndex={0}
              role="img"
              aria-label={building.label}
              data-building={building.id}
            >
              <title>{building.label}</title>
              <use href={href} className={s.hitArea} />
              <g className={s.highlight} aria-hidden="true">
                <use href={href} className={s.halo} />
                <use href={href} className={s.edge} />
                <use href={href} className={s.core} />
                <use href={href} className={s.orbit} />
              </g>
              <BuildingBillboard building={building} index={index} />
            </g>
          );
        })}
      </svg>
      <p className={s.hint}>悬浮建筑，点亮轮廓<span> / </span>也可用 Tab 键逐个查看</p>
      <SortieButton />
    </div>
  );
}
