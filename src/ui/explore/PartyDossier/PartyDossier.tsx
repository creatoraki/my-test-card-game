// ★ 探索场景的队员档案 ★ —— 底栏点立绘、或背包里点装备的「装备」时打开。
//
// 版面: 左栏 = 「01 队员」立绘舞台 + 生命污染 + 队员切换条; 右栏 = 「02 小队羁绊」常驻条
//   + 「03 队员配置」主分区(页签: 属性装备 / 卡组)。
// 视觉: 外壳沿用探索浮层的折角外框与展开动画(explorePanel.panel-box), 分区用研究中心式编号面板,
//   主题色统一走 --k。
// ★ 页签、悬停预览等状态都挂在本组件上, 切换队员只换 charId —— 页签不会被重置回属性页。
// ★ 换装规则不在这里: 能不能换由 allowed + 队员存活给出理由, 换装回调直达 runStore。

import { useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
import { getCharacter, getItemDef } from "@/data";
import type { ExploreState } from "@/explore/types";
import type { EquipSlot, ItemStack } from "@/items/types";
import { deriveStats, useTownStore } from "@/store/town/townStore";
import { playSfx } from "@/ui/audio";
import { previewStatsWith } from "@/ui/character/CharacterDetailView/equipPreview";
import ItemTooltip, { tooltipPointFromElement, type TooltipPoint } from "@/ui/common/item/ItemTooltip";
import { cx } from "@/ui/common/shared/cx";
import { DOSSIER_ACCENT } from "@/ui/explore/EventDossier";
import { useDialogFocus } from "@/ui/explore/ExploreScreen/useDialogFocus";
import { panelRevealVars } from "@/ui/explore/styles/panelReveal";
import { DeckBoard } from "./parts/DeckBoard";
import { DossierSection } from "./parts/DossierSection";
import { DossierTabs, type DossierTab } from "./parts/DossierTabs";
import { EquipRow } from "./parts/EquipRow";
import { MemberStage } from "./parts/MemberStage";
import { MemberSwitcher } from "./parts/MemberSwitcher";
import { PendingChip } from "./parts/PendingChip";
import { SquadBondStrip } from "./parts/SquadBondStrip";
import { StatsBoard } from "./parts/StatsBoard";
import s from "./PartyDossier.module.css";

const pad2 = (value: number) => String(value).padStart(2, "0");

interface Props {
  session: ExploreState;
  charId: string;
  /** 背包「装备」带进来的装备 uid; 已不在背包里(穿上了)就视同没有。 */
  pendingUid: string | null;
  /** 当前阶段能否动背包(换装同一道闸)。 */
  allowed: boolean;
  onSelect: (charId: string) => void;
  onEquip: (uid: string) => void;
  onUnequip: (slot: EquipSlot) => void;
  onCancelPending: () => void;
  onClose: () => void;
  /** 遮罩层附加类名 —— 场景据此压 z-index。 */
  className?: string;
}

export function PartyDossier({
  session,
  charId,
  pendingUid,
  allowed,
  onSelect,
  onEquip,
  onUnequip,
  onCancelPending,
  onClose,
  className,
}: Props) {
  const characters = useTownStore((state) => state.characters);
  const townParty = useTownStore((state) => state.party);
  const [tab, setTab] = useState<DossierTab>("loadout");
  const [hoverPreview, setHoverPreview] = useState<{ slot: EquipSlot; stack: ItemStack } | null>(null);
  const [tooltip, setTooltip] = useState<{ stack: ItemStack; point: TooltipPoint } | null>(null);
  const { panel, onKeyDown: onDialogKeyDown } = useDialogFocus({ active: true, onEscape: onClose });

  const member = session.party.find((item) => item.charId === charId);
  const character = characters[charId];
  const pending = pendingUid ? session.backpack.find((stack) => stack.uid === pendingUid) ?? null : null;
  const pendingSlot = pending ? getItemDef(pending.itemId).slot : undefined;
  const candidates = useMemo(
    () => session.backpack.filter((stack) => getItemDef(stack.itemId).category === "equipment"),
    [session.backpack],
  );

  useEffect(() => {
    playSfx("panel");
  }, []);

  // 背包里又点了一件「装备」: 跳回属性装备页, 让待换上的那张卡露出来。
  useEffect(() => {
    if (pendingUid) setTab("loadout");
  }, [pendingUid]);

  // 换人只清掉跟着旧队员走的悬停态; 页签保持不动。
  useEffect(() => {
    setHoverPreview(null);
    setTooltip(null);
  }, [charId]);

  const stats = useMemo(() => (character ? deriveStats(character) : null), [character]);
  const preview = useMemo(() => {
    if (!character) return null;
    if (hoverPreview) return previewStatsWith(character, hoverPreview.slot, hoverPreview.stack);
    if (pending && pendingSlot) return previewStatsWith(character, pendingSlot, pending);
    return null;
  }, [character, hoverPreview, pending, pendingSlot]);

  if (!member || !character || !stats) return null;

  const def = getCharacter(charId);
  const index = session.party.findIndex((item) => item.charId === charId);
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
        style={{ "--k": DOSSIER_ACCENT, ...panelRevealVars() } as CSSProperties}
        role="dialog"
        aria-modal="true"
        aria-label={`${def.name} · 队员档案`}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <span className={s.scan} aria-hidden="true" />

        <header className={s.top}>
          <span className={s.tag}>档案</span>
          <p className={s.kicker}>远征小队 · 队员档案</p>
          <i className={s.kickerRule} aria-hidden="true" />
          <span className={s.hint}>左右方向键切换队员</span>
          <button type="button" className={s.close} aria-label="关闭队员档案" onClick={onClose}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <div className={s.body}>
          <DossierSection
            index="01"
            title="队员"
            deco="OPERATOR"
            extra={
              <span className={s.rank}>
                {pad2(index + 1)}
                <i> / {pad2(session.party.length)}</i>
              </span>
            }
            bodyClassName={s.memberBody}
          >
            <MemberStage
              charId={charId}
              name={def.name}
              emoji={def.emoji}
              vitals={{ hp: member.hp, hpLimit: member.hpLimit, maxHp: member.maxHp }}
              pollution={character.pollution}
              sick={character.sick}
              quirks={character.quirks}
              down={!member.alive}
            />
            <MemberSwitcher members={session.party} selected={charId} onSelect={onSelect} />
          </DossierSection>

          <div className={s.right}>
            <SquadBondStrip characters={characters} party={townParty} charId={charId} />
            <DossierSection
              index="03"
              title="队员配置"
              deco="LOADOUT"
              extra={
                <>
                  {pending && <PendingChip stack={pending} onCancel={onCancelPending} />}
                  <DossierTabs value={tab} deckCount={character.deck.length} onChange={setTab} />
                </>
              }
              className={s.main}
              bodyClassName={s.mainBody}
            >
              {/* key = 页签: 切页时内容重新入场; 换队员不换 key, 页签与滚动位置都留着。 */}
              <div key={tab} className={s.pane}>
                {tab === "loadout" ? (
                  <>
                    <EquipRow
                      equipped={character.equipped}
                      candidates={candidates}
                      pending={pending}
                      lockedReason={lockedReason}
                      onEquip={onEquip}
                      onUnequip={onUnequip}
                      onPreview={setHoverPreview}
                      onShowTooltip={(element, stack) => setTooltip({ stack, point: tooltipPointFromElement(element) })}
                      onHideTooltip={() => setTooltip(null)}
                    />
                    <StatsBoard stats={stats} preview={preview} />
                  </>
                ) : (
                  <DeckBoard deck={character.deck} />
                )}
              </div>
            </DossierSection>
          </div>
        </div>

        <span className={s.bar} aria-hidden="true" />
      </section>
      {tooltip && <ItemTooltip stack={tooltip.stack} point={tooltip.point} />}
    </div>
  );
}
