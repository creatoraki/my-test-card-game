import { useEffect, useState, type CSSProperties } from "react";
import { MAPS, getCharacter } from "@/data";
import { deriveStats, useTownStore } from "@/store/townStore";
import { useSortieStore } from "@/store/sortieStore";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import { cx } from "@/ui/common/cx";
import { mapArt, warmMapArt } from "@/ui/art/mapArt";
import s from "./MapSelectStep.module.css";

interface Props {
  onCancel: () => void;
}

const stagger = (i: number): CSSProperties => ({ "--i": i }) as CSSProperties;

export function MapSelectStep({ onCancel }: Props) {
  const party = useTownStore((state) => state.party);
  const characters = useTownStore((state) => state.characters);
  const pickMap = useSortieStore((state) => state.pickMap);
  const [mapId, setMapId] = useState(MAPS[0]?.id ?? "");
  const selected = MAPS.find((map) => map.id === mapId) ?? MAPS[0];

  useEffect(warmMapArt, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      setMapId((currentId) => {
        const currentIndex = Math.max(0, MAPS.findIndex((map) => map.id === currentId));
        const offset = event.key === "ArrowRight" ? 1 : -1;
        const nextIndex = (currentIndex + offset + MAPS.length) % MAPS.length;
        return MAPS[nextIndex]?.id ?? currentId;
      });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!selected) return null;

  const selectedIndex = Math.max(0, MAPS.findIndex((map) => map.id === selected.id));
  const sectorLabel = `SECTOR-${String(selectedIndex + 1).padStart(2, "0")}`;

  return (
    <section className={s["sm-step"]} aria-labelledby="sortie-map-title">
      <img key={selected.id} className={s["sm-bg"]} src={mapArt(selected.id)} alt="" draggable={false} />
      <div className={s["sm-veil"]} />

      <header className={s["sm-header"]} style={{ left: "72px", top: "48px" }}>
        <span className={s["sm-kicker"]}>SORTIE ROUTE / TARGET SECTOR</span>
        <h1 id="sortie-map-title" className={s["sm-title"]}>选择目标层</h1>
        <p className={s["sm-sub"]}>先确定地下城，再为这趟远征装填物资</p>
      </header>

      <div className={s["sm-readout"]} style={{ right: "72px", top: "48px" }}>
        <div className={s["sm-chip"]}>
          <span className={s["sm-chip-label"]}>下降小队</span>
          <strong className={s["sm-chip-value"]}>{party.length} / 3</strong>
        </div>
        <div className={s["sm-chip"]}>
          <span className={s["sm-chip-label"]}>目标层</span>
          <strong className={s["sm-chip-value"]}>{sectorLabel}</strong>
        </div>
        <div className={s["sm-chip"]}>
          <span className={s["sm-chip-label"]}>区域轮数</span>
          <strong className={s["sm-chip-value"]}>{selected.roundCount} 轮</strong>
        </div>
      </div>

      <div className={s["sm-grid"]} style={{ left: "72px", top: "184px", width: "1776px", height: "452px", gap: "20px" }}>
        {MAPS.map((map, index) => (
          <button
            key={map.id}
            className={cx(s["sm-card"], map.id === selected.id && s["sm-is-on"])}
            style={stagger(index)}
            type="button"
            aria-label={`选择${map.name}`}
            aria-pressed={map.id === selected.id}
            onClick={() => setMapId(map.id)}
          >
            <span className={s["sm-card-preview"]}>
              <img src={mapArt(map.id)} alt="" draggable={false} />
            </span>
            {map.id === selected.id && <span className={s["sm-card-flag"]}>目标层</span>}
            <span className={s["sm-card-body"]}>
              <span className={s["sm-card-no"]}>{`SECTOR-${String(index + 1).padStart(2, "0")}`}</span>
              <strong className={s["sm-card-name"]}>{map.name}</strong>
              <span className={s["sm-card-stars"]} aria-label={`难度 ${map.difficulty} / 5`}>
                {"★".repeat(map.difficulty)}{"☆".repeat(5 - map.difficulty)}
              </span>
              <span className={s["sm-card-meta"]}>{map.roundCount} 轮区域推进 · 起始 {map.startingEnergy}</span>
              <span className={s["sm-card-go"]}>查看详情 ▸</span>
            </span>
          </button>
        ))}
      </div>

      <article className={s["sm-detail"]} style={{ left: "72px", top: "656px", width: "1776px", height: "292px" }}>
        <section className={s["sm-detail-left"]}>
          <span className={s["sm-detail-kicker"]}>DESTINATION LOCKED</span>
          <h2>{selected.name}</h2>
          <p>{selected.desc}</p>
        </section>
        <section className={s["sm-detail-stats"]} aria-label="地图参数">
          <div>
            <span>难度</span>
            <strong>{selected.difficulty} / 5</strong>
          </div>
          <div>
            <span>区域轮数</span>
            <strong>{selected.roundCount} 轮</strong>
          </div>
          <div>
            <span>起始粒子</span>
            <strong>{selected.startingEnergy}</strong>
          </div>
        </section>
        <section className={s["sm-detail-party"]}>
          <span className={s["sm-detail-kicker"]}>DESCENDING PARTY</span>
          {party.length === 0 ? (
            <p className={s["sm-empty-party"]}>尚未编成小队，请先返回编队。</p>
          ) : (
            <div className={s["sm-party-row"]}>
              {party.map((id) => {
                const character = getCharacter(id);
                const profile = characters[id];
                const stats = deriveStats(profile);
                return (
                  <div className={s["sm-party-chip"]} key={id}>
                    <span className={s["sm-party-portrait"]}>
                      <CharacterPortrait
                        characterId={character.id}
                        emoji={character.emoji}
                        alt={character.name}
                        className={s["sm-party-bust"]}
                      />
                    </span>
                    <span className={s["sm-party-copy"]}>
                      <strong>{character.name}</strong>
                      <small>{Math.round(stats.maxHp)} HP · 卡组 Lv.{profile.deckLevel}</small>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </article>

      <button className={s["sm-back"]} style={{ left: "72px", bottom: "48px" }} type="button" onClick={onCancel}>
        ← 返回据点
      </button>
      <p className={s["sm-note"]} style={{ bottom: "56px" }}>
        净化粒子只降不升，低能量会提高战斗压力与产出倍率。
      </p>
      <button
        className={s["sm-confirm"]}
        style={{ right: "72px", bottom: "48px" }}
        type="button"
        disabled={party.length === 0}
        onClick={() => pickMap(selected.id)}
      >
        确认目标层 <span aria-hidden>▸</span>
      </button>
    </section>
  );
}
