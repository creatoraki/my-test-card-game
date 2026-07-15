// 编队 —— 城镇设施: 编辑上阵队伍 / 查看角色详情(属性、装备占位、个人卡组) /
// 分配属性点 / 花属性点抽卡改造个人卡组(3 选 1, 不可取消)。

import { useState } from "react";
import { CHARACTERS, getCardDef, getCharacter } from "../data";
import type { Card } from "../engine";
import { RULES, expToNext } from "../engine";
import { useRunStore } from "../store/runStore";
import {
  deriveStats,
  useTownStore,
  type CharacterAttrs,
  type CharacterState,
} from "../store/townStore";
import { CardView } from "./CardView";
import { CharacterPortrait } from "./CharacterPortrait";
import { TerminalNav } from "./TerminalNav";

const ATTR_ROWS: { key: keyof CharacterAttrs; label: string; hint: string }[] = [
  { key: "hp", label: "生命", hint: `每点生命上限 +${RULES.progression.hpPerPoint}` },
  { key: "attack", label: "攻击", hint: `每点本人卡牌伤害 +${RULES.progression.attackPerPoint}` },
  { key: "defense", label: "防御", hint: `每点本人卡牌格挡 +${RULES.progression.defensePerPoint}` },
  { key: "threat", label: "仇恨", hint: `每点初始仇恨 +${RULES.progression.threatPerPoint}` },
];

const EQUIP_SLOTS = [
  { id: "weapon", label: "武器", emoji: "🗡️" },
  { id: "armor", label: "护甲", emoji: "🛡️" },
  { id: "trinket", label: "饰品", emoji: "📿" },
];

export function FormationScreen() {
  const enterTown = useRunStore((s) => s.enterTown);
  const characters = useTownStore((s) => s.characters);
  const party = useTownStore((s) => s.party);
  const toggleParty = useTownStore((s) => s.toggleParty);
  const allocatePoint = useTownStore((s) => s.allocatePoint);
  const startDraw = useTownStore((s) => s.startDraw);
  const pickDraw = useTownStore((s) => s.pickDraw);

  const [selectedId, setSelectedId] = useState(CHARACTERS[0]?.id ?? "");
  const selected = characters[selectedId];

  // 任何角色有进行中的抽卡都强制弹 3 选 1 —— 属性点已消耗, 选完才能继续。
  const pendingChar = Object.values(characters).find((c) => c.pendingDraw);

  return (
    <div className="screen formation terminal-screen">
      <TerminalNav active="编队" />
      <main className="formation-main">
        <div className="formation-head">
          <div>
            <div className="screen-kicker">方舟 / 作战编成</div>
            <h1 className="terminal-heading">编队</h1>
          </div>
          <button onClick={() => enterTown()}>返回城镇</button>
        </div>
        <p className="muted formation-sub">
          上阵 {party.length}/{RULES.progression.partySize} —— 升级获得属性点，可分配四维属性，或消耗{" "}
          {RULES.progression.drawCost} 点抽取新的行动卡。
        </p>

        <div className="formation-layout">
          <aside className="roster-list">
            {CHARACTERS.map((c) => {
              const cs = characters[c.id];
              if (!cs) return null;
              const inParty = party.includes(c.id);
              return (
                <div
                  key={c.id}
                  className={[
                    "roster-item",
                    selectedId === c.id ? "selected" : "",
                    inParty ? "in-party" : "",
                  ].join(" ")}
                  onClick={() => setSelectedId(c.id)}
                >
                  <CharacterPortrait
                    characterId={c.id}
                    emoji={c.emoji}
                    alt={c.name}
                    className="roster-portrait"
                  />
                  <div className="roster-info">
                    <span className="roster-name">{c.name}</span>
                    <span className="roster-level">
                      LV {cs.level} · 属性点 {cs.attrPoints}
                    </span>
                  </div>
                  <div className="roster-side">
                    <span className={`roster-tag ${inParty ? "on" : ""}`}>
                      {inParty ? "已上阵" : "待命"}
                    </span>
                    <button
                      className="roster-toggle"
                      disabled={
                        inParty
                          ? party.length <= 1
                          : party.length >= RULES.progression.partySize
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleParty(c.id);
                      }}
                    >
                      {inParty ? "下阵" : "上阵"}
                    </button>
                  </div>
                </div>
              );
            })}
          </aside>

          {selected && (
            <CharacterDetail
              cs={selected}
              drawLocked={!!pendingChar}
              onAlloc={(attr) => allocatePoint(selected.charId, attr)}
              onDraw={() => startDraw(selected.charId)}
            />
          )}
        </div>
      </main>

      {pendingChar?.pendingDraw && (
        <DrawModal
          charName={getCharacter(pendingChar.charId).name}
          options={pendingChar.pendingDraw}
          onPick={(defId) => pickDraw(pendingChar.charId, defId)}
        />
      )}
    </div>
  );
}

function CharacterDetail({
  cs,
  drawLocked,
  onAlloc,
  onDraw,
}: {
  cs: CharacterState;
  drawLocked: boolean;
  onAlloc: (attr: keyof CharacterAttrs) => void;
  onDraw: () => void;
}) {
  const def = getCharacter(cs.charId);
  const stats = deriveStats(cs);
  const need = expToNext(cs.level);

  const finalValue = (key: keyof CharacterAttrs): string => {
    switch (key) {
      case "hp":
        return String(stats.maxHp);
      case "attack":
        return `+${stats.attack}`;
      case "defense":
        return `+${stats.defense}`;
      case "threat":
        return String(stats.threat);
    }
  };

  return (
    <section className="char-detail">
      <div className="detail-head">
        <CharacterPortrait
          characterId={def.id}
          emoji={def.emoji}
          alt={def.name}
          className="detail-portrait"
        />
        <div className="detail-id">
          <h2>
            {def.emoji} {def.name}
          </h2>
          <span className="muted">
            LV {cs.level} · EXP {cs.exp}/{need}
          </span>
          <div className="exp-bar">
            <div
              className="exp-bar-fill"
              style={{ width: `${Math.min(100, (cs.exp / need) * 100)}%` }}
            />
          </div>
        </div>
        <div className="detail-points">
          <span className="hud-label">剩余属性点</span>
          <b>{cs.attrPoints}</b>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-block">
          <h3>属性</h3>
          {ATTR_ROWS.map((row) => (
            <div key={row.key} className="attr-row" title={row.hint}>
              <span className="attr-label">{row.label}</span>
              <span className="attr-value">{finalValue(row.key)}</span>
              <span className="attr-alloc muted">已加 {cs.attrs[row.key]}</span>
              <button
                className="attr-plus"
                disabled={cs.attrPoints < 1}
                onClick={() => onAlloc(row.key)}
                title={row.hint}
              >
                ＋
              </button>
            </div>
          ))}
          <p className="muted attr-note">升级不成长基础属性，全部成长来自属性点。</p>
        </div>

        <div className="detail-block">
          <h3>装备</h3>
          <div className="equip-slots">
            {EQUIP_SLOTS.map((s) => (
              <div key={s.id} className="equip-slot">
                <span className="equip-emoji">{s.emoji}</span>
                <span>{s.label}</span>
                <small>空</small>
              </div>
            ))}
          </div>
          <p className="muted attr-note">装备系统尚未开放。</p>
        </div>
      </div>

      <div className="detail-block">
        <h3>个人卡组({cs.deck.length} 张)</h3>
        <div className="personal-deck">
          {cs.deck.map((card) => (
            <CardView key={card.uid} card={card} playable selected={false} />
          ))}
        </div>
        <div className="deck-actions">
          <button
            className="primary"
            disabled={drawLocked || cs.attrPoints < RULES.progression.drawCost}
            onClick={() => onDraw()}
          >
            抽取行动卡（−{RULES.progression.drawCost} 属性点）
          </button>
          <span className="muted">从专属卡池随机 {RULES.progression.drawChoices} 选 1，可能出现重复卡。</span>
        </div>
      </div>
    </section>
  );
}

// 3 选 1 弹层 —— 无关闭按钮: 属性点已消耗, pendingDraw 持久化, 刷新也逃不掉。
function DrawModal({
  charName,
  options,
  onPick,
}: {
  charName: string;
  options: string[];
  onPick: (defId: string) => void;
}) {
  return (
    <div className="draw-modal">
      <div className="draw-panel">
        <div className="screen-kicker">卡组改造 / {charName}</div>
        <h2 className="terminal-heading">选择一张行动卡</h2>
        <p className="muted">属性点已消耗，必须选择一张加入个人卡组。</p>
        <div className="reward-cards">
          {options.map((defId, i) => {
            // 候选允许重复 defId, 故 key/uid 用下标
            const preview: Card = { ...getCardDef(defId), uid: `preview-${i}`, upgraded: false };
            return (
              <div key={i} className="reward-choice">
                <span className="choice-index">MOD-{String(i + 1).padStart(2, "0")}</span>
                <CardView card={preview} playable selected={false} onClick={() => onPick(defId)} />
                <button className="primary" onClick={() => onPick(defId)}>
                  选择此卡
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
