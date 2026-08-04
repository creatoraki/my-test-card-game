import { useEffect, useState } from "react";
import { MAPS, getCharacter } from "@/data";
import { deriveStats, useTownStore } from "@/store/townStore";
import { useSortieStore } from "@/store/sortieStore";
import { mapArt, warmMapArt } from "@/ui/art/mapArt";
import s from "./MapSelectStep.module.css";

export function MapSelectStep() {
  const party = useTownStore((state) => state.party);
  const characters = useTownStore((state) => state.characters);
  const pickMap = useSortieStore((state) => state.pickMap);
  const [mapId, setMapId] = useState(MAPS[0]?.id ?? "");
  const selected = MAPS.find((map) => map.id === mapId) ?? MAPS[0];

  useEffect(warmMapArt, []);

  if (!selected) return null;

  return (
    <section className={s.step} aria-labelledby="sortie-map-title">
      <header className={s.header}>
        <div>
          <span className={s.kicker}>SORTIE ROUTE / TARGET SECTOR</span>
          <h1 id="sortie-map-title">选择目标层</h1>
          <p>先确定地下城，再为这趟远征装填物资。</p>
        </div>
        <div className={s.headerReadout}>
          <span>下降小队</span>
          <strong>{party.length} / 3</strong>
        </div>
      </header>

      <div className={s.content}>
        <nav className={s.mapList} aria-label="地下城列表">
          <div className={s.panelLabel}>AVAILABLE SECTORS</div>
          {MAPS.map((map, index) => (
            <button
              key={map.id}
              className={`${s.mapRow} ${map.id === selected.id ? s.isActive : ""}`}
              type="button"
              onClick={() => setMapId(map.id)}
            >
              <span className={s.mapNo}>SECTOR-{String(index + 1).padStart(2, "0")}</span>
              <strong>{map.name}</strong>
              <span className={s.mapStars} aria-label={`难度 ${map.difficulty} / 5`}>
                {"★".repeat(map.difficulty)}{"☆".repeat(5 - map.difficulty)}
              </span>
              <span className={s.mapMeta}>{map.roundCount} 轮区域推进</span>
            </button>
          ))}
        </nav>

        <article className={s.detail}>
          <div className={s.mapArt}>
            <img src={mapArt(selected.id)} alt="" draggable={false} />
            <div className={s.artShade} />
            <div className={s.artCaption}>
              <span>DESTINATION LOCKED</span>
              <strong>{selected.name}</strong>
            </div>
          </div>
          <p className={s.description}>{selected.desc}</p>
          <div className={s.stats}>
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
          </div>
          <div className={s.partyBlock}>
            <div className={s.panelLabel}>DESCENDING PARTY</div>
            <div className={s.partyRow}>
              {party.length === 0 ? (
                <p className={s.emptyParty}>尚未编成小队，请先返回编队。</p>
              ) : (
                party.map((id) => {
                  const character = getCharacter(id);
                  const profile = characters[id];
                  const stats = deriveStats(profile);
                  return (
                    <div className={s.partyChip} key={id}>
                      <span className={s.partyEmoji}>{character.emoji}</span>
                      <span>
                        <strong>{character.name}</strong>
                        <small>{Math.round(stats.maxHp)} HP · 卡组 Lv.{profile.deckLevel}</small>
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </article>
      </div>

      <footer className={s.footer}>
        <p>净化粒子只降不升，低能量会提高战斗压力与产出倍率。</p>
        <button
          className={s.primary}
          type="button"
          disabled={party.length === 0}
          onClick={() => pickMap(selected.id)}
        >
          确认目标层 <span aria-hidden>▸</span>
        </button>
      </footer>
    </section>
  );
}
