// 角色详情态 —— 编队页内的第二种态(不是独立页面), 由 FormationScreen 装配。
//
// ★ 版面两栏: 左侧是 434×772 的立绘取景窗(FigureStage), 右侧是一块可切换的工作区(Workbench,
//   属性装备 / 卡组)。装备候选借立绘位展开, 属性表与装备槽在同一页并列。
// ★ 属性面板是**只读**的(角色不设等级也不加点); 个人卡组开放扩充、精简、升级三项锻造;
//   装备穿戴/卸下直接落 townStore。编队调整统一回编队态完成。
// ★ 与编队态之间的重组过场: 本组件只需按 morphing / leaving 两个开关让位,
//   飞行编排在 formationMorph/ 里。
// ⚠ 所有坐标都是「设计 px」(1920×1080 画布内)。

import { useEffect, useState } from "react";
import { getCharacter } from "@/data";
import { deriveStats, useTownStore, vitalsOf } from "@/store/townStore";
import { DeckCardHoverPreview } from "@/ui/character/DeckCardHoverPreview";
import { DeckForgeStack } from "@/ui/character/DeckForge/DeckForgeStack";
import type { ForgeView } from "@/ui/character/DeckForge/forgeMorph";
import { FIGURE_RECT } from "@/ui/character/FormationScreen/formationMorph/morphChoreo";
import { EquipPicker } from "./EquipPicker";
import { cx } from "@/ui/common/cx";
import { FigureStage } from "./FigureStage";
import { DeckPanel } from "./Workbench/DeckPanel";
import { ProfilePanel } from "./Workbench/ProfilePanel";
import { Workbench, type WorkbenchTab } from "./Workbench/Workbench";
import { useEquipPreview } from "./useEquipPreview";
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
  const equipItem = useTownStore((state) => state.equipItem);
  const unequipItem = useTownStore((state) => state.unequipItem);

  const [tab, setTab] = useState<WorkbenchTab>("profile");
  const [forgeView, setForgeView] = useState<ForgeView | null>(null);
  const [hoveredCardUid, setHoveredCardUid] = useState<string | null>(null);

  const cs = characters[charId];
  const equipPreview = useEquipPreview(cs, storage);
  const { activeSlot, candidates, previewStats } = equipPreview;

  // 换人: 一切工作区状态归零。
  useEffect(() => {
    setTab("profile");
    equipPreview.clear();
    setForgeView(null);
    setHoveredCardUid(null);
  }, [charId]);

  // 悬浮的卡被抽走或删掉后要跟着失效。
  useEffect(() => {
    if (hoveredCardUid && !cs?.deck.some((card) => card.uid === hoveredCardUid)) {
      setHoveredCardUid(null);
    }
  }, [cs, hoveredCardUid]);

  // 离开属性装备页就收起仓库；离开卡组页则关闭卡牌详情与锻造中枢。
  useEffect(() => {
    if (tab !== "profile") equipPreview.clear();
    if (tab !== "deck") setHoveredCardUid(null);
    if (tab !== "deck") setForgeView(null);
  }, [tab]);

  // 抽卡结果尚未领取(存档里带着 pendingDraw): 直接跳到卡组页把演出接上。
  useEffect(() => {
    if (!cs?.pendingDraw) return;
    setTab("deck");
    setForgeView("draw");
  }, [cs?.pendingDraw]);

  // Esc: 锻造层自己处理逐层退出, 详情态只在没有锻造层时响应。
  // ⚠ 编队态那一层的 Esc 在 FormationScreen 里, 它只在 roster 态响应, 两边不会打架。
  useEffect(() => {
    if (!escEnabled) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (forgeView) return;
      if (activeSlot) {
        equipPreview.clear();
        return;
      }
      onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeSlot, escEnabled, forgeView, onBack]);

  if (!cs) return null;

  const def = getCharacter(charId);
  const stats = deriveStats(cs);
  // ★ 血条读**存档**里的三段值, 不是面板上限: 上一趟远征打掉的血与体力极限是永久损伤,
  //   据点里看到的就该是伤后的样子(vitalsOf 顺带把装备变动导致的越界夹回来)。
  const vitals = vitalsOf(cs);
  const hoveredCard = cs.deck.find((card) => card.uid === hoveredCardUid) ?? null;
  // 卡面详情借立绘位展开(与换装候选同一块地方, 两者分属不同 tab, 不会同时在场)。
  const cardDetailOpen = tab === "deck" && !forgeView && hoveredCard != null;

  return (
    <div className={cx(s.view, forgeView && s["is-forge-open"], leaving && s["is-leaving"])}>
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
        dimmed={cardDetailOpen}
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
        {tab === "profile" && (
          <ProfilePanel
            stats={stats}
            preview={previewStats}
            equipped={cs.equipped}
            activeSlot={activeSlot}
            onSelect={(slot) => {
              equipPreview.setActiveSlot(slot);
              equipPreview.setHoveredStack(null);
            }}
          />
        )}
        {tab === "deck" && (
          <DeckPanel
            deck={cs.deck}
            deckLevel={cs.deckLevel}
            minDeckSize={cs.minDeckSize}
            hoveredUid={hoveredCardUid}
            onHoverCard={setHoveredCardUid}
            onOpenForge={() => setForgeView("hub")}
          />
        )}
      </Workbench>

      {activeSlot && tab === "profile" && (
        <EquipPicker
          slot={activeSlot}
          current={cs.equipped[activeSlot]}
          candidates={candidates}
          character={cs}
          onEquip={(uid) => {
            equipItem(charId, uid);
            equipPreview.clear();
          }}
          onUnequip={() => {
            unequipItem(charId, activeSlot);
            equipPreview.clear();
          }}
          onClose={equipPreview.clear}
          onHoverCandidate={equipPreview.setHoveredStack}
          style={{
            left: `${FIGURE_RECT.x}px`,
            top: `${FIGURE_RECT.y}px`,
            width: `${FIGURE_RECT.w}px`,
            height: `${FIGURE_RECT.h}px`,
          }}
        />
      )}

      {/* 卡面详情浮卡: 只在卡组页、且没有别的浮层挡着时出。
          ★ 落点是**立绘窗的正中央** —— 外壳跟着 FIGURE_RECT 走, 居中交给 flex,
            浮卡自己不再持有任何版面坐标(旧版组件内外各写一套, 长期打架)。 */}
      {cardDetailOpen && hoveredCard && (
        <div
          className={s["card-preview-stage"]}
          style={{
            left: `${FIGURE_RECT.x}px`,
            top: `${FIGURE_RECT.y}px`,
            width: `${FIGURE_RECT.w}px`,
            height: `${FIGURE_RECT.h}px`,
          }}
        >
          <DeckCardHoverPreview card={hoveredCard} />
        </div>
      )}

      {/* 锻造层挂在本态根层 —— 全屏外壳不能放进会裁切的工作区。 */}
      {tab === "deck" && forgeView && (
        <DeckForgeStack
          charId={charId}
          view={forgeView}
          onViewChange={(next) => setForgeView(next)}
          onClose={() => setForgeView(null)}
        />
      )}
    </div>
  );
}
