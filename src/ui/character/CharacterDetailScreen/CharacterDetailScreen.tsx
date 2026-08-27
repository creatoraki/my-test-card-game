// 角色详情页 —— 据点的**一级全屏页**(runStore 的 screen === "charDetail"), 从编队页点卡面进来。
// ⚠ 它不是浮层: 原先这套内容是冬眠仓「队员档案」modal 里的右栏(1240×680 面板里的一小半),
//   独立成页后立绘、属性、卡组各有自己的一栏, 不再互相挤。
//
// ★ 属性面板仍是**只读**的; 个人卡组已开放扩充、精简、升级三项锻造操作。
//   成本口径统一读取 RULES.deck 与 townStore 的 deckForgeCosts, 角色也不设等级。
// ★ 装备槽是本页的即时操作区: 点击部位后右侧切换对应仓库, 穿戴/卸下直接复用 townStore。
//   角色状态在这里仅作展示, 编队调整统一从编队页完成。
//
// 版面与视觉与编队页同族(同一张背景、同一套亮玻璃配方), 左上用面包屑返回编队,
// 右上羁绊是 96px 巨型图标, 旋钮在 CharacterDetailScreen.css 的 --cd-*。
// 与全项目同一套「1920×1080 设计画布 + 等比缩放」机制(见 ui/stage.ts): 所有坐标都是「设计 px」。

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { deckUpgradeCost, RULES, type Rarity, type StatBlock } from "@/engine";
import { getCharacter, getItemDef } from "@/data";
import type { EquipSlot } from "@/items/types";
import { useRunStore } from "@/store/runStore";
import { availablePools, deckForgeCosts, deriveStats, useTownStore, vitalsOf } from "@/store/townStore";
import { DeckCard } from "@/ui/character/DeckCard";
import { DeckCardHoverPreview } from "@/ui/character/DeckCardHoverPreview";
import { DeckForgeBar } from "@/ui/character/DeckForgeBar";
import { DeckForgeOverlay } from "@/ui/character/DeckForgeOverlay";
import { DeckUpgradeOverlay } from "@/ui/character/DeckUpgradeOverlay";
import { EquipmentDrawer } from "@/ui/character/EquipmentDrawer";
import { EquipmentSlots } from "@/ui/character/EquipmentSlots";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import { HpBar } from "@/ui/common/HpBar/HpBar";
import { PollutionMeter } from "@/ui/common/PollutionMeter/PollutionMeter";
import { QuirkPips } from "@/ui/common/QuirkPips/QuirkPips";
import { SquadBondBar } from "@/ui/common/SquadBondBar";
import { StatIcon } from "@/ui/common/StatIcon";
import { REF_DEFAULT_PCT, STAT_GROUPS } from "@/ui/common/statGroups";
import { cx } from "@/ui/common/cx";
import { useCountUp } from "@/ui/hooks/useCountUp";
import { StageCanvas } from "@/ui/app/StageCanvas";
import { setSharedPortrait } from "@/ui/character/sharedPortrait";
import { CRYO_BG_ART } from "@/ui/art/sceneArt";
import s from "./CharacterDetailScreen.module.css";

// ===================== 属性表 =====================
// ★ 分组与 ref 旋钮已抽到 ui/common/statGroups.ts —— 角色详情页与角色档案 Modal 共用同一份,
//   两处不再各写一遍。suffix "%" 的项在数据里存的是百分点整数(见 engine/types.StatBlock)。

// 内容错峰入场的公共起点(ms)。⚠ 与 CharacterDetailScreen.css 里 cdContentIn 的 animation-delay
// 起点是同一个数, 改一处要改两处 —— JS 只有数值滚动的起跑时间要跟它对齐。
const CONTENT_DELAY_MS = 260;
// 相邻两块内容之间的错峰间隔。⚠ 同样与 CSS 里 `var(--i) * 55ms` 那条算式对齐。
const STAGGER_MS = 55;

// 错峰入场的序号。CSS 用 --i 算 animation-delay, 这里只负责把序号递给样式层。
const stagger = (i: number): CSSProperties => ({ "--i": i }) as CSSProperties;

// ===================== 主组件 =====================

export function CharacterDetailScreen() {
  const characters = useTownStore((s) => s.characters);
  const awakened = useTownStore((s) => s.awakened);
  const party = useTownStore((s) => s.party);
  const storage = useTownStore((s) => s.storage);
  const day = useTownStore((s) => s.day);
  const equipItem = useTownStore((s) => s.equipItem);
  const unequipItem = useTownStore((s) => s.unequipItem);
  const forgeDraw = useTownStore((s) => s.forgeDraw);
  const removeCard = useTownStore((s) => s.removeCard);
  const upgradeDeck = useTownStore((s) => s.upgradeDeck);
  const pickDraw = useTownStore((s) => s.pickDraw);
  const cancelDraw = useTownStore((s) => s.cancelDraw);
  const charId = useRunStore((s) => s.detailCharId);
  const closeCharDetail = useRunStore((s) => s.closeCharDetail);
  const [activeSlot, setActiveSlot] = useState<EquipSlot | null>(null);
  const [forgeMode, setForgeMode] = useState<"draw" | "remove" | "upgrade" | null>(null);
  const [selectedCardUid, setSelectedCardUid] = useState<string | null>(null);
  const [hoveredCardUid, setHoveredCardUid] = useState<string | null>(null);

  // ---- 与编队页之间的共享元素过场 ----
  // ★ 本页这一侧**不需要任何运行时逻辑**: 每个名字在本页都只有一份, 全部写死在
  //   CharacterDetailScreen.css 里。浏览器靠"两侧同名"自己完成配对与形变。
  //   编排见 app/ScreenTransition/ScreenTransition.tsx 的 viewTransition 分支, 画面见 app/viewTransition.global.css。
  //
  // 返回编队页: 唯一要做的是把"飞的是谁"交出去 —— 编队页是新挂载的, 不然它不知道
  // 该给哪张卡挂 vt-portrait。
  // ⚠ 必须在切 screen **之前**存: closeCharDetail 会让 ScreenTransition 立刻发起过场,
  //   编队页在那次同步提交里就要读到它。
  const back = useCallback(() => {
    if (!charId) return;
    setSharedPortrait(charId);
    closeCharDetail();
  }, [charId, closeCharDetail]);

  const cs = charId ? characters[charId] : undefined;
  // 兜底: 存档重置 / 直接落在这一页而 detailCharId 已失效时, 退回编队页而不是渲染半张空白。
  // ⚠ 放在 effect 里而不是渲染期间 —— 渲染期间 set 别的 store 会触发 React 的更新警告。
  const invalid = !cs || !charId || !awakened.includes(charId);
  useEffect(() => {
    if (invalid) closeCharDetail();
  }, [invalid, closeCharDetail]);

  useEffect(() => {
    setActiveSlot(null);
    setForgeMode(null);
    setSelectedCardUid(cs?.deck[0]?.uid ?? null);
    setHoveredCardUid(null);
  }, [charId]);

  useEffect(() => {
    const firstCardUid = cs?.deck[0]?.uid ?? null;
    if (!cs?.deck.some((card) => card.uid === selectedCardUid)) setSelectedCardUid(firstCardUid);
  }, [cs, selectedCardUid]);

  useEffect(() => {
    if (!cs?.deck.some((card) => card.uid === hoveredCardUid)) setHoveredCardUid(null);
  }, [cs, hoveredCardUid]);

  useEffect(() => {
    if (activeSlot) setHoveredCardUid(null);
  }, [activeSlot]);

  useEffect(() => {
    if (activeSlot) setForgeMode(null);
  }, [activeSlot]);

  useEffect(() => {
    if (cs?.pendingDraw) setForgeMode("draw");
  }, [cs?.pendingDraw]);

  const closeForge = useCallback(() => {
    if (forgeMode === "draw" && charId) cancelDraw(charId);
    setForgeMode(null);
  }, [cancelDraw, charId, forgeMode]);

  const finishForge = useCallback(() => {
    setForgeMode(null);
  }, []);

  const pickForgedCard = useCallback(
    (cardDefId: string) => {
      if (charId) pickDraw(charId, cardDefId);
    },
    [charId, pickDraw],
  );

  const removeForgedCard = useCallback(
    (uid: string) => {
      if (charId) removeCard(charId, uid);
    },
    [charId, removeCard],
  );

  const openEquipmentSlot = useCallback((slot: EquipSlot) => {
    setForgeMode(null);
    setActiveSlot(slot);
  }, []);

  // Esc 返回编队页。与左上面包屑按钮同一个出口(都走 back, 才能一并触发返回的飞行)。
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (forgeMode) return;
      if (activeSlot) {
        setActiveSlot(null);
        return;
      }
      back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeSlot, back, closeForge, forgeMode]);

  const drawerCandidates = useMemo(
    () =>
      activeSlot && cs
        ? storage.filter((stack) => {
            const def = getItemDef(stack.itemId);
            return def.category === "equipment" && def.slot === activeSlot;
          })
        : [],
    [activeSlot, cs, storage],
  );

  if (!cs || !charId) return null;

  const def = getCharacter(charId);
  const stats = deriveStats(cs);
  // ★ 血条读**存档**里的三段值, 不是面板上限: 上一趟远征打掉的血与体力极限是永久损伤,
  //   据点里看到的就该是伤后的样子(vitalsOf 顺带把装备变动导致的越界夹回来)。
  const vitals = vitalsOf(cs);
  const onField = party.includes(charId);
  const hoveredCard = cs.deck.find((card) => card.uid === hoveredCardUid) ?? null;
  const costs = deckForgeCosts(cs, day);
  const pools = availablePools(cs);
  const hasPool: Record<Rarity, boolean> = {
    common: pools.common.length > 0,
    uncommon: pools.uncommon.length > 0,
    rare: pools.rare.length > 0,
  };
  const hasDrawPool = hasPool.common || hasPool.uncommon || hasPool.rare;
  const canConfirmDraw = !cs.pendingDraw && cs.exp >= costs.draw && hasDrawPool;
  const canRemove = cs.exp >= costs.remove && cs.deck.length > cs.minDeckSize;
  const canUpgrade = costs.upgrade != null && cs.exp >= costs.upgrade;

  return (
    <StageCanvas
      viewportClassName={s["cd-viewport"]}
      className={cx(s["screen"], s["cd-stage"])}
    >
      {/* ⚠ 背景刻意**不挂 view-transition-name**: 与编队页是同一张冬眠仓.png ⇒ 落进 root 快照,
          两页那片区域像素一致, 默认交叉淡化因此完全看不见 —— 这就是"底图不动"的来源。 */}
        <img className={s["cd-bg"]} src={CRYO_BG_ART} alt="" draggable={false} />
        <div className={s["cd-veil"]} />

        {/* ---- 左上: 面包屑与身份 ---- */}
        <header className={s["cd-header"]} style={{ left: "72px", top: "48px" }}>
          <nav className={s["cd-crumb"]} aria-label="角色路径">
            <button className={s["cd-back"]} type="button" onClick={back}>
              ← 编队
            </button>
            <span className={s["cd-crumb-separator"]} aria-hidden="true">▸</span>
            <span className={s["cd-crumb-current"]}>{def.name}</span>
          </nav>
          <h2 className={s["cd-title"]}>{def.name}</h2>
          <p className={s["cd-sub"]}>
            可用经验 {cs.exp} · 累计 {cs.expEarned} · 卡组 Lv.{cs.deckLevel}/{RULES.deck.levelMax} · 最小卡组下限{" "}
            {cs.minDeckSize} 张 · {onField ? "出战中" : "待命"} · 上阵 {party.length}/{RULES.progression.partySize}
          </p>
          <div className={s["cd-conditions"]}>
            <QuirkPips sick={cs.sick} quirks={cs.quirks} className={s["cd-quirks"]} />
          </div>
        </header>

        {/* 羁绊读的是全队装备口径, 不是这名角色自己的羁绊; 换装后会即时刷新。 */}
        <SquadBondBar
          className={s["cd-bonds"]}
          characters={characters}
          party={party}
          style={{ right: "72px", top: "48px" }}
        />

        {/* ---- 主体三栏 ----
            ★ 位置/尺寸旋钮全在下面的内联 style(设计 px); CSS 只负责每一栏内部的机制。
              420(立绘) + 600(属性) + 剩余(卡组), 两道 24px 的槽。 */}
        <div
          className={s["cd-body"]}
          style={{
            left: "72px",
            top: "216px",
            width: "1776px",
            height: "764px",
            gap: "24px",
            gridTemplateColumns: "420px 600px 1fr",
          }}
        >
          {/* 立绘栏 */}
          <div className={s["cd-figure-col"]}>
            {/* 立绘展示柜 = 与编队卡立绘窗配对的那一端(view-transition-name: vt-portrait,
                写在 CSS 里)。⚠ 这里不需要 ref 也不需要任何测量 —— 位置全归浏览器算。 */}
            <div className={cx(s["cd-figure"], s["cd-vitrine"])}>
              <CharacterPortrait
                characterId={def.id}
                emoji={def.emoji}
                alt={def.name}
                className={s["cd-bust"]}
              />
            </div>
            <div className={s["cd-status-bars"]}>
              <div className={s["cd-hp"]}>
                <HpBar hp={vitals.hp} hpLimit={vitals.hpLimit} maxHp={vitals.maxHp} flush />
              </div>
              <PollutionMeter value={cs.pollution} />
            </div>
          </div>

          {/* 属性栏: 装备配置置于顶部, 下方是三组属性。 */}
          <div className={s["cd-stats-col"]}>
            <EquipmentSlots
              className={s["cd-equipment-slots"]}
              equipped={cs.equipped}
              activeSlot={activeSlot}
              onSelect={openEquipmentSlot}
              onUnequip={(slot) => unequipItem(charId, slot)}
            />
            {/* <span className={s["cd-section-label"]}>面板属性 · 只读</span> */}
            <div className={s["cd-stat-groups"]}>
              {STAT_GROUPS.map((g, gi) => (
                <div
                  key={g.title}
                  className={cx(s["cd-stat-group"], g.wide && s["is-wide"])}
                  style={stagger(gi)}
                >
                  <span className={s["cd-stat-group-title"]}>{g.title}</span>
                  <div className={cx(s["cd-stat-rows"], g.wide && s["is-two-col"])}>
                    {g.rows.map((row) => (
                      <AttrRow
                        key={row.key}
                        statKey={row.key}
                        label={row.label}
                        value={stats[row.key]}
                        pct={row.pct}
                        ref100={row.ref ?? (row.pct ? REF_DEFAULT_PCT : undefined)}
                        // 与 CSS 里这一组的 animation-delay 对齐: 数字要在这一组浮现出来之后才开滚。
                        delay={CONTENT_DELAY_MS + gi * STAGGER_MS}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 右侧工作区: 默认展示个人卡组, 点击左侧装备槽后切换到对应部位仓库。 */}
          <div className={s["cd-deck-col"]}>
            {activeSlot ? (
              <EquipmentDrawer
                slot={activeSlot}
                current={cs.equipped[activeSlot]}
                candidates={drawerCandidates}
                onEquip={(uid) => equipItem(charId, uid)}
                onUnequip={() => unequipItem(charId, activeSlot)}
                onClose={() => setActiveSlot(null)}
              />
            ) : (
              <div className={s["cd-deck-panel"]}>
                <div className={s["cd-deck-head"]}>
                  <div>
                    <span className={s["cd-section-label"]}>个人卡组</span>
                    <p className={s["cd-deck-sub"]}>构筑档案 · 扩充 / 精简 / 升级</p>
                  </div>
                  <div className={s["cd-deck-readout"]}>
                    <span>{cs.deck.length} 张</span>
                    <span>
                      Lv.{cs.deckLevel}/{RULES.deck.levelMax}
                    </span>
                    <span>下限 {cs.minDeckSize}</span>
                  </div>
                </div>
                <DeckForgeBar
                  costs={costs}
                  exp={cs.exp}
                  deckLevel={cs.deckLevel}
                  deckSize={cs.deck.length}
                  minDeckSize={cs.minDeckSize}
                  canDraw
                  canRemove={canRemove}
                  canOpenUpgrade={costs.upgrade != null}
                  onDraw={() => setForgeMode("draw")}
                  onRemove={() => setForgeMode("remove")}
                  onUpgrade={() => setForgeMode("upgrade")}
                  drawDisabledReason={
                    !hasDrawPool ? "该角色暂无可抽卡池" : cs.exp < costs.draw ? "经验不足" : undefined
                  }
                />
                <div className={s["cd-deck-content"]}>
                  <div className={s["cd-deck-grid"]} data-deck-anchor>
                    {cs.deck.map((card, i) => (
                      <div key={card.uid} className={s["cd-deck-cell"]} style={stagger(i)}>
                        <DeckCard
                          card={card}
                          index={i}
                          focusStyle="zoom"
                          selected={card.uid === selectedCardUid}
                          onClick={() => setSelectedCardUid(card.uid)}
                          onMouseEnter={() => setHoveredCardUid(card.uid)}
                          onMouseLeave={() =>
                            setHoveredCardUid((current) => (current === card.uid ? null : current))
                          }
                          onFocus={() => setHoveredCardUid(card.uid)}
                          onBlur={() =>
                            setHoveredCardUid((current) => (current === card.uid ? null : current))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {!activeSlot && !forgeMode && hoveredCard && <DeckCardHoverPreview card={hoveredCard} />}

        {forgeMode === "upgrade" ? (
          <DeckUpgradeOverlay
            deckLevel={cs.deckLevel}
            levelMax={RULES.deck.levelMax}
            exp={cs.exp}
            upgradeCost={costs.upgrade}
            nextUpgradeCost={deckUpgradeCost(cs.deckLevel + 1)}
            deckSize={cs.deck.length}
            minDeckSize={cs.minDeckSize}
            hasPool={hasPool}
            canUpgrade={canUpgrade}
            onConfirm={() => upgradeDeck(charId)}
            onClose={closeForge}
          />
        ) : forgeMode ? (
          <DeckForgeOverlay
            mode={forgeMode}
            pendingDraw={cs.pendingDraw}
            deck={cs.deck}
            minDeckSize={cs.minDeckSize}
            drawCost={costs.draw}
            exp={cs.exp}
            deckLevel={cs.deckLevel}
            deckSize={cs.deck.length}
            hasPool={hasPool}
            canConfirmDraw={canConfirmDraw}
            drawDisabledReason={
              !hasDrawPool ? "该角色暂无可抽卡池" : cs.exp < costs.draw ? "经验不足" : undefined
            }
            onStartDraw={() => forgeDraw(charId)}
            onComplete={finishForge}
            onPickDraw={pickForgedCard}
            onRemoveCard={removeForgedCard}
            onClose={closeForge}
          />
        ) : null}

    </StageCanvas>
  );
}

// 一行属性: 标签 + 滚动数值 + 底部占比微条。
// ⚠ 条长走 ref(见 STAT_GROUPS 顶部注释)——**纯展示**, 与结算无关; 超过 ref 的值条画满不溢出。
function AttrRow({
  statKey,
  label,
  value,
  pct,
  ref100,
  delay,
}: {
  statKey: keyof StatBlock;
  label: string;
  value: number;
  pct?: boolean;
  ref100?: number;
  delay: number;
}) {
  const shown = useCountUp(Math.round(value), delay);
  const fill = ref100 ? Math.max(0, Math.min(1, value / ref100)) : 0;
  return (
    <div className={s["cd-attr"]} style={{ "--pct": fill } as CSSProperties}>
      <StatIcon statKey={statKey} className={s["cd-attr-icon"]} />
      <span className={s["cd-attr-label"]}>{label}</span>
      <strong className={s["cd-attr-value"]}>
        {shown}
        {pct ? "%" : ""}
      </strong>
    </div>
  );
}
