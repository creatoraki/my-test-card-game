// 角色详情态 —— 编队页内的第二种态(不是独立页面), 由 FormationScreen 装配。
//
// ★ 版面两栏: 左侧是 434×772 的立绘取景窗(FigureStage), 右侧是一块可切换的工作区(Workbench,
//   属性 / 装备 / 卡组)。旧版三栏并排把每一块都压得太小, 现在一次只做一件事。
// ★ 属性面板是**只读**的(角色不设等级也不加点); 个人卡组开放扩充、精简、升级三项锻造;
//   装备穿戴/卸下直接落 townStore。编队调整统一回编队态完成。
// ★ 与编队态之间的重组过场: 本组件只需按 morphing / leaving 两个开关让位,
//   飞行编排在 formationMorph/ 里。
// ⚠ 所有坐标都是「设计 px」(1920×1080 画布内)。

import { useCallback, useEffect, useMemo, useState } from "react";
import { deckUpgradeCost, RULES, type Rarity } from "@/engine";
import { getCharacter, getItemDef } from "@/data";
import type { EquipSlot } from "@/items/types";
import { availablePools, deckForgeCosts, deriveStats, useTownStore, vitalsOf } from "@/store/townStore";
import { DeckCardHoverPreview } from "@/ui/character/DeckCardHoverPreview";
import { DeckForgeOverlay } from "@/ui/character/DeckForgeOverlay";
import { DeckUpgradeOverlay } from "@/ui/character/DeckUpgradeOverlay";
import { FIGURE_RECT } from "@/ui/character/FormationScreen/formationMorph/morphChoreo";
import { cx } from "@/ui/common/cx";
import { FigureStage } from "./FigureStage";
import { DeckPanel } from "./Workbench/DeckPanel";
import { EquipPanel } from "./Workbench/EquipPanel";
import { StatsPanel } from "./Workbench/StatsPanel";
import { Workbench, type WorkbenchTab } from "./Workbench/Workbench";
import s from "./CharacterDetailView.module.css";

interface Props {
  charId: string;
  /** 过场期间立绘由飞行层代演。 */
  morphing: boolean;
  /** 回程: 工作区向左收拢。 */
  leaving: boolean;
  /**
   * 本层是否响应 Esc。⚠ 训练点分配弹窗开着时必须交出去 —— 那一层也听 Esc,
   * 两个 window 监听会同时触发, 表现为"关弹窗顺手把详情也退了"。
   */
  escEnabled: boolean;
  onBack: () => void;
}

export function CharacterDetailView({ charId, morphing, leaving, escEnabled, onBack }: Props) {
  const characters = useTownStore((state) => state.characters);
  const party = useTownStore((state) => state.party);
  const storage = useTownStore((state) => state.storage);
  const day = useTownStore((state) => state.day);
  const equipItem = useTownStore((state) => state.equipItem);
  const unequipItem = useTownStore((state) => state.unequipItem);
  const forgeDraw = useTownStore((state) => state.forgeDraw);
  const removeCard = useTownStore((state) => state.removeCard);
  const upgradeDeck = useTownStore((state) => state.upgradeDeck);
  const pickDraw = useTownStore((state) => state.pickDraw);
  const cancelDraw = useTownStore((state) => state.cancelDraw);

  const [tab, setTab] = useState<WorkbenchTab>("stats");
  const [activeSlot, setActiveSlot] = useState<EquipSlot | null>(null);
  const [forgeMode, setForgeMode] = useState<"draw" | "remove" | "upgrade" | null>(null);
  const [selectedCardUid, setSelectedCardUid] = useState<string | null>(null);
  const [hoveredCardUid, setHoveredCardUid] = useState<string | null>(null);

  const cs = characters[charId];

  // 换人: 一切工作区状态归零。
  useEffect(() => {
    setTab("stats");
    setActiveSlot(null);
    setForgeMode(null);
    setSelectedCardUid(null);
    setHoveredCardUid(null);
  }, [charId]);

  // 选中/悬浮的卡被抽走或删掉后要跟着失效。
  useEffect(() => {
    if (selectedCardUid && !cs?.deck.some((card) => card.uid === selectedCardUid)) {
      setSelectedCardUid(null);
    }
    if (hoveredCardUid && !cs?.deck.some((card) => card.uid === hoveredCardUid)) {
      setHoveredCardUid(null);
    }
  }, [cs, selectedCardUid, hoveredCardUid]);

  // 离开装备页就收起仓库 —— 回来时从「没选部位」重新开始, 免得看到上次的残留。
  useEffect(() => {
    if (tab !== "equip") setActiveSlot(null);
    if (tab !== "deck") setHoveredCardUid(null);
  }, [tab]);

  // 抽卡结果尚未领取(存档里带着 pendingDraw): 直接跳到卡组页把演出接上。
  useEffect(() => {
    if (!cs?.pendingDraw) return;
    setTab("deck");
    setForgeMode("draw");
  }, [cs?.pendingDraw]);

  const closeForge = useCallback(() => {
    if (forgeMode === "draw") cancelDraw(charId);
    setForgeMode(null);
  }, [cancelDraw, charId, forgeMode]);

  // Esc: 由内向外逐层退出 —— 锻造浮层 → 装备仓库 → 回编队态。
  // ⚠ 编队态那一层的 Esc 在 FormationScreen 里, 它只在 roster 态响应, 两边不会打架。
  useEffect(() => {
    if (!escEnabled) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (forgeMode) return; // 浮层自己处理
      if (activeSlot) {
        setActiveSlot(null);
        return;
      }
      onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeSlot, escEnabled, forgeMode, onBack]);

  const drawerCandidates = useMemo(
    () =>
      activeSlot
        ? storage.filter((stack) => {
            const def = getItemDef(stack.itemId);
            return def.category === "equipment" && def.slot === activeSlot;
          })
        : [],
    [activeSlot, storage],
  );

  if (!cs) return null;

  const def = getCharacter(charId);
  const stats = deriveStats(cs);
  // ★ 血条读**存档**里的三段值, 不是面板上限: 上一趟远征打掉的血与体力极限是永久损伤,
  //   据点里看到的就该是伤后的样子(vitalsOf 顺带把装备变动导致的越界夹回来)。
  const vitals = vitalsOf(cs);
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
  const drawDisabledReason = !hasDrawPool
    ? "该角色暂无可抽卡池"
    : cs.exp < costs.draw
      ? "经验不足"
      : undefined;
  const hoveredCard = cs.deck.find((card) => card.uid === hoveredCardUid) ?? null;

  return (
    <div className={cx(s.view, leaving && s["is-leaving"])}>
      <FigureStage
        characterId={def.id}
        emoji={def.emoji}
        name={def.name}
        color={def.color}
        vitals={vitals}
        pollution={cs.pollution}
        sick={cs.sick}
        quirks={cs.quirks}
        onField={party.includes(charId)}
        hidden={morphing || leaving}
        style={{
          left: `${FIGURE_RECT.x}px`,
          top: `${FIGURE_RECT.y}px`,
          width: `${FIGURE_RECT.w}px`,
          height: `${FIGURE_RECT.h}px`,
        }}
      />

      {/* ★ 与编队态卡阵占同一条水平带(y 196..968) —— 重组时工作区正是在卡阵原地长出来的。 */}
      <Workbench
        style={{ left: "550px", top: "196px", width: "1282px", height: "772px" }}
        tab={tab}
        onTabChange={setTab}
        exp={cs.exp}
        growing={morphing}
        leaving={leaving}
      >
        {tab === "stats" && <StatsPanel stats={stats} />}
        {tab === "equip" && (
          <EquipPanel
            equipped={cs.equipped}
            activeSlot={activeSlot}
            candidates={drawerCandidates}
            onSelect={setActiveSlot}
            onUnequip={(slot) => unequipItem(charId, slot)}
            onEquip={(uid) => equipItem(charId, uid)}
            onCloseDrawer={() => setActiveSlot(null)}
          />
        )}
        {tab === "deck" && (
          <DeckPanel
            deck={cs.deck}
            deckLevel={cs.deckLevel}
            minDeckSize={cs.minDeckSize}
            exp={cs.exp}
            costs={costs}
            canRemove={canRemove}
            drawDisabledReason={drawDisabledReason}
            selectedCardUid={selectedCardUid}
            onSelectCard={setSelectedCardUid}
            onHoverCard={setHoveredCardUid}
            onDraw={() => setForgeMode("draw")}
            onRemove={() => setForgeMode("remove")}
            onUpgrade={() => setForgeMode("upgrade")}
          />
        )}
      </Workbench>

      {/* 卡面详情浮卡: 只在卡组页、且没有别的浮层挡着时出。 */}
      {tab === "deck" && !forgeMode && hoveredCard && (
        <DeckCardHoverPreview card={hoveredCard} className={s["card-preview"]} />
      )}

      {/* 锻造浮层挂在本态根层 —— 它们是全屏层, 挂进工作区会被 overflow 裁掉。 */}
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
          drawDisabledReason={drawDisabledReason}
          onStartDraw={() => forgeDraw(charId)}
          onComplete={() => setForgeMode(null)}
          onPickDraw={(cardDefId) => pickDraw(charId, cardDefId)}
          onRemoveCard={(uid) => removeCard(charId, uid)}
          onClose={closeForge}
        />
      ) : null}
    </div>
  );
}
