// ★ 探索场景的队员档案 ★ —— 底栏点立绘或背包选择装备时打开。
//
// 版面(琥珀工业, 面板 1700×904): 整面铺场景插图; 左栏 = 无框大立绘 + 名牌 + 生命污染 + 队员切换条;
//   右栏 = 小队羁绊卡 + 页签栏 + 内容面板(属性装备 / 卡组)。
// 视觉: 外壳沿用探索浮层的折角外框与展开动画(explorePanel.panel-box), 主题色统一走 --k(琥珀)。
// ★ 卡组页悬停卡牌时, 大卡详情(DeckCardPeek)盖在左栏立绘区上, 与城镇角色详情同一套。
// ★ 页签、悬停预览等状态都挂在本组件上, 切换队员只换 charId —— 页签不会被重置回属性页。
// ★ 换装规则不在这里: 能不能换由 allowed + 队员存活给出理由, 换装回调直达 runStore。

import { useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
import { getCharacter, getItemDef } from "@/data";
import type { ExploreState } from "@/explore/types";
import type { GearSlot } from "@/items/gearSlots";
import type { EquipSlot, ItemStack } from "@/items/types";
import { deriveStats, useTownStore } from "@/store/town/townStore";
import { partyDossierScene } from "@/ui/art/explore/partyDossierArt";
import { playSfx } from "@/ui/audio";
import { previewStatsWith } from "@/ui/character/CharacterDetailView/equipPreview";
import ItemTooltip, { tooltipPointFromElement, type TooltipPoint } from "@/ui/common/item/ItemTooltip";
import { cx } from "@/ui/common/shared/cx";
import { useDialogFocus } from "@/ui/explore/ExploreScreen/useDialogFocus";
import { panelRevealVars } from "@/ui/explore/styles/panelReveal";
import { DeckBoard } from "./parts/DeckBoard";
import { DeckCardPeek } from "./parts/DeckCardPeek";
import { DossierBackdrop } from "./parts/DossierBackdrop";
import { DossierFrameDecor } from "./parts/DossierFrameDecor";
import { DossierTabs, type DossierTab } from "./parts/DossierTabs";
import { EquipRow } from "./parts/EquipRow";
import { MemberStage } from "./parts/MemberStage";
import { MemberSwitcher } from "./parts/MemberSwitcher";
import { SquadBondStrip } from "./parts/SquadBondStrip";
import { StatsBoard } from "./parts/StatsBoard";
import { ARCHIVE_ACCENT } from "./partyDossierTheme";
import s from "./PartyDossier.module.css";

interface Props {
  session: ExploreState;
  charId: string;
  /** 当前阶段能否动背包(换装同一道闸)。 */
  allowed: boolean;
  equipFocus?: { slot: EquipSlot } | null;
  onSelect: (charId: string) => void;
  onEquip: (uid: string, slot: GearSlot) => void;
  onUnequip: (slot: GearSlot) => void;
  onClose: () => void;
  /** 遮罩层附加类名 —— 场景据此压 z-index。 */
  className?: string;
}

export function PartyDossier({
  session,
  charId,
  allowed,
  equipFocus,
  onSelect,
  onEquip,
  onUnequip,
  onClose,
  className,
}: Props) {
  const characters = useTownStore((state) => state.characters);
  const townParty = useTownStore((state) => state.party);
  const [tab, setTab] = useState<DossierTab>("loadout");
  const [hoverPreview, setHoverPreview] = useState<{ slot: GearSlot; stack: ItemStack } | null>(null);
  const [tooltip, setTooltip] = useState<{ stack: ItemStack; point: TooltipPoint } | null>(null);
  const [hoveredCardUid, setHoveredCardUid] = useState<string | null>(null);
  const { panel, onKeyDown: onDialogKeyDown } = useDialogFocus({ active: true, onEscape: onClose });

  const member = session.party.find((item) => item.charId === charId);
  const character = characters[charId];
  const candidates = useMemo(
    () => session.backpack.filter((stack) => getItemDef(stack.itemId).category === "equipment"),
    [session.backpack],
  );

  useEffect(() => {
    playSfx("panel");
  }, []);

  useEffect(() => {
    if (equipFocus) setTab("loadout");
  }, [equipFocus]);

  // 换人只清掉跟着旧队员走的悬停态; 页签保持不动。
  useEffect(() => {
    setHoverPreview(null);
    setTooltip(null);
    setHoveredCardUid(null);
  }, [charId]);

  useEffect(() => {
    if (tab !== "deck") setHoveredCardUid(null);
  }, [tab]);

  const stats = useMemo(() => (character ? deriveStats(character) : null), [character]);
  const preview = useMemo(() => {
    if (!character) return null;
    if (hoverPreview) return previewStatsWith(character, hoverPreview.slot, hoverPreview.stack);
    return null;
  }, [character, hoverPreview]);

  if (!member || !character || !stats) return null;

  const def = getCharacter(charId);
  const index = session.party.findIndex((item) => item.charId === charId);
  const hoveredCard = tab === "deck" ? character.deck.find((card) => card.uid === hoveredCardUid) ?? null : null;
  const lockedReason = !allowed ? "此时无法换装" : !member.alive ? "阵亡队员无法换装" : undefined;

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    onDialogKeyDown(event);
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const next = session.party[index + (event.key === "ArrowLeft" ? -1 : 1)];
    if (!next) return;
    event.preventDefault();
    onSelect(next.charId);
  };

  return (
    <div
      className={cx(s.layer, className)}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={panel}
        className={cx(s.panel, s.reveal)}
        style={{ "--k": ARCHIVE_ACCENT, ...panelRevealVars() } as CSSProperties}
        role="dialog"
        aria-modal="true"
        aria-label={`${def.name} · 队员档案`}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <DossierBackdrop scene={partyDossierScene(charId)} />
        <span className={s.scan} aria-hidden="true" />

        <div className={s.left}>
          <MemberStage
            charId={charId}
            name={def.name}
            emoji={def.emoji}
            color={def.color}
            rank={{ index: index + 1, total: session.party.length }}
            vitals={{ hp: member.hp, hpLimit: member.hpLimit, maxHp: member.maxHp }}
            pollution={character.pollution}
            sick={character.sick}
            quirks={character.quirks}
            down={!member.alive}
          />
          <MemberSwitcher members={session.party} selected={charId} onSelect={onSelect} />
          {hoveredCard && <DeckCardPeek card={hoveredCard} />}
        </div>

        <DossierFrameDecor />

        <header className={s.top}>
          <h2 className={s.title}>远征小队 · 队员档案</h2>
          <i className={s.slashes} aria-hidden="true" />
          <i className={s.titleRule} aria-hidden="true" />
        </header>
        <button type="button" className={s.close} aria-label="关闭队员档案" onClick={onClose}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <div className={s.right}>
          <SquadBondStrip characters={characters} party={townParty} charId={charId} />
          <DossierTabs value={tab} deckCount={character.deck.length} onChange={setTab} />
          <div className={s.content}>
            {/* key = 页签: 切页时内容重新入场; 换队员不换 key, 页签与滚动位置都留着。 */}
            <div key={tab} className={s.pane}>
              {tab === "loadout" ? (
                <>
                  <EquipRow
                    level={character.deckLevel}
                    equipped={character.equipped}
                    candidates={candidates}
                    lockedReason={lockedReason}
                    highlightedKind={equipFocus?.slot}
                    onEquip={onEquip}
                    onUnequip={onUnequip}
                    onPreview={setHoverPreview}
                    onShowTooltip={(element, stack) => setTooltip({ stack, point: tooltipPointFromElement(element) })}
                    onHideTooltip={() => setTooltip(null)}
                  />
                  <StatsBoard stats={stats} preview={preview} />
                </>
              ) : (
                <DeckBoard deck={character.deck} hoveredUid={hoveredCardUid} onHoverCard={setHoveredCardUid} />
              )}
            </div>
          </div>
        </div>

        <span className={s.bar} aria-hidden="true" />
      </section>
      {tooltip && <ItemTooltip stack={tooltip.stack} point={tooltip.point} />}
    </div>
  );
}
