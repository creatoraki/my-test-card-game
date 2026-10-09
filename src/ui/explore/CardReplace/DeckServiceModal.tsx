// 卡组面板(苔绿工业温室): 换牌 / 删牌 / 复制共用一套骨架, 费用由调用方结算, 文案与事实表见 deckServiceModes。
// (三选一抽牌是全队混合抽, 不选人, 不走本面板, 直接弹 CardRewardPicker。)
//
// 两段式, 始终同一张面板:
//   ① 选卡: 左侧卡组柜(四列竖向滚动), 右侧培养舱放大展示已选卡并列明结果范围 / 模组去向;
//   ② 结果: 调用方 onConfirm 结算后把结果写进 result, 培养舱内原地演出(ChamberSequence),
//      左侧卡组柜在演出收束前保持结算前的快照, 收束时才同步成结果并闪亮新卡位; 「完成」才由调用方收尾。
// 布局为 1920×1080 画布上的固定坐标(parts/deckGeometry), 外壳 / 舱体 / 页签 / 按钮为可选素材。
// ⚠ portal 到设计画布([data-stage-canvas]), 与卡牌奖励三选一同层(z-index 300)。
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Card } from "@/engine";
import type { ExploreState } from "@/explore/types";
import { useTownStore } from "@/store/town/townStore";
import type { CharacterState } from "@/store/town/townTypes";
import { playSfx } from "@/ui/audio";
import { useRevealPresence } from "@/ui/common/frame/ModalReveal";
import { chamberFacts, DECK_SERVICE_TEXT, resultFacts, type DeckServiceMode } from "./deckServiceModes";
import { ReplaceChamber, type ChamberStatus } from "./ReplaceChamber";
import { ReplaceDeckGrid, type ReplaceDeckEntry } from "./ReplaceDeckGrid";
import { useReplaceSequence } from "./useReplaceSequence";
import { ChamberSequence } from "./parts/ChamberSequence";
import { DeckButton } from "./parts/DeckButton";
import { DeckCardSkinProvider, type DeckCardSkin } from "./parts/DeckCardFace";
import { DeckFooterNote } from "./parts/DeckFooterNote";
import { DeckHeader } from "./parts/DeckHeader";
import { DeckShell } from "./parts/DeckShell";
import { DeckTabs } from "./parts/DeckTabs";
import s from "./DeckServiceModal.module.css";

const CLOSE_MS = 240;

export interface DeckServiceResult {
  charId: string;
  before?: Card;
  after?: Card;
}

interface Props {
  mode: DeckServiceMode;
  /** false = 关闭(带退场动画)。 */
  open: boolean;
  result: DeckServiceResult | null;
  /** 可选的存活角色; 目标已锁定为交互者时只用于显示名字。 */
  members: ExploreState["party"];
  /** 可由调用方提供独立角色数据；缺省使用城镇档案。 */
  characters?: Record<string, CharacterState>;
  lockedCharId: string | null;
  /** 顶部小标签, 区分来源(物件服务 / 战斗奖励 / 锻造师)。 */
  kicker: string;
  paymentNote?: string;
  unavailableReason?: string | null;
  /** 单张卡无法处理的原因; null = 可选。 */
  cardReason: (character: CharacterState, card: Card) => string | null;
  /** 整个角色无法处理的原因; null = 可选。 */
  characterReason?: (character: CharacterState) => string | null;
  /** 执行服务。失败返回 false。 */
  onConfirm: (charId: string, uid: string) => boolean;
  /** 结果展示后点「完成」。 */
  onFinish: () => void;
  /** 未出结果时放弃; 缺省同 onFinish。 */
  onAbandon?: () => void;
  abandonLabel?: string;
  /** 卡面皮肤: hand = 原手牌卡面(缺省); pick = 三选一同款卡面(钢框 + 紫色霓虹选中框)。 */
  cardSkin?: DeckCardSkin;
}

export function DeckServiceModal({
  mode, open, result, members, characters: characterData, lockedCharId, kicker, paymentNote, unavailableReason,
  cardReason, characterReason, onConfirm, onFinish, onAbandon, abandonLabel, cardSkin = "hand",
}: Props) {
  const presence = useRevealPresence(open, open ? { mode, result, members, lockedCharId } : null, CLOSE_MS);
  const shown = presence.data;
  const characters = useTownStore((state) => characterData ?? state.characters);
  const [pickedChar, setPickedChar] = useState<string | null>(null);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const settledRef = useRef(false);
  /** 结算前的卡组快照: 演出收束前左侧卡组柜按它显示。 */
  const frozenRef = useRef<ReplaceDeckEntry[] | null>(null);

  const shownMode = shown?.mode ?? mode;
  const text = DECK_SERVICE_TEXT[shownMode];
  const shownResult = shown?.result ?? null;
  const fallbackCharId = shown?.members.find((member) => characters[member.charId] && !characterReason?.(characters[member.charId]))?.charId
    ?? shown?.members[0]?.charId ?? null;
  const charId = shownResult?.charId ?? shown?.lockedCharId
    ?? shown?.members.find((member) => member.charId === pickedChar)?.charId
    ?? fallbackCharId;
  const character = charId ? characters[charId] : undefined;
  const entries = useMemo<ReplaceDeckEntry[]>(
    () => character ? character.deck.map((card) => ({ card, lockedReason: cardReason(character, card) })) : [],
    [character, cardReason],
  );
  const runKey = shownResult ? `${shownResult.charId}-${shownResult.before?.uid ?? ""}-${shownResult.after?.uid ?? ""}` : null;
  const phase = useReplaceSequence(runKey, shownMode);

  useEffect(() => {
    if (!open) return;
    settledRef.current = false;
    frozenRef.current = null;
  }, [open]);
  useEffect(() => {
    setSelectedUid(null);
    setFailed(false);
  }, [charId]);

  if (typeof document === "undefined" || !presence.mounted || !shown) return null;

  const settledView = phase === "settle" || phase === "done";
  const gridEntries = shownResult && !settledView && frozenRef.current ? frozenRef.current : entries;
  const selected = entries.find((entry) => entry.card.uid === selectedUid && !entry.lockedReason) ?? null;
  const available = entries.filter((entry) => !entry.lockedReason).length;
  const ownerName = shown.members.find((member) => member.charId === charId)?.name ?? "角色";
  const busy = presence.closing || settledRef.current;
  const pickable = !shownResult && !shown.lockedCharId && shown.members.length > 1;
  const charReason = character ? characterReason?.(character) ?? null : "当前没有可处理的角色";
  const blocked = unavailableReason || charReason;
  const done = phase === "done";

  const settle = (handler: () => void) => {
    if (busy) return;
    settledRef.current = true;
    playSfx(shownResult ? "confirm" : "back");
    handler();
  };
  const confirm = () => {
    if (!charId || busy || blocked || !selected) return;
    playSfx("confirm");
    frozenRef.current = entries;
    const ok = onConfirm(charId, selected.card.uid);
    if (!ok) frozenRef.current = null;
    setFailed(!ok);
  };

  const note = shownResult
    ? done ? text.summary(shownResult.before, shownResult.after, ownerName) : text.phaseNote[phase] ?? text.phaseNote.scan ?? ""
    : failed ? "服务未执行，请重新选择"
      : unavailableReason ? unavailableReason
        : charReason ? `${ownerName}：${charReason}`
          : !available ? `${ownerName}的卡组里没有可处理的卡牌`
            : selected ? text.picked(selected.card) : text.prompt;
  const noteTone = shownResult ? (done ? "good" : undefined) : failed || blocked ? "danger" : undefined;
  const status: ChamberStatus = shownResult ? (done ? "done" : "running") : selected ? "ready" : "idle";

  return createPortal(
    <div
      className={s.layer}
      data-closing={presence.closing ? "" : undefined}
      role="dialog"
      aria-modal="true"
      aria-label={text.title}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <DeckCardSkinProvider value={cardSkin}>
        <section className={s.frame}>
          <DeckShell />
          <DeckHeader kicker={kicker} title={text.title} caption={shownResult ? text.doneCaption : text.caption} />

          <DeckTabs
            members={shown.members}
            activeId={charId}
            pickable={pickable}
            count={`共 ${gridEntries.length} 张 · ${text.countLabel} ${available} 张`}
            onPick={setPickedChar}
          />
          {gridEntries.length ? (
            <ReplaceDeckGrid
              entries={gridEntries}
              selectedUid={shownResult ? (settledView ? null : shownResult.before?.uid ?? null) : selected?.card.uid ?? null}
              freshUid={shownResult && settledView ? shownResult.after?.uid ?? null : null}
              interactive={!shownResult}
              actionLabel={text.slotAction}
              onSelect={setSelectedUid}
            />
          ) : (
            <p className={s.notice}>当前没有可处理的角色卡组。</p>
          )}

          <ReplaceChamber
            label={text.chamber}
            card={selected?.card ?? null}
            facts={shownResult
              ? resultFacts(shown.mode, shownResult.before, shownResult.after, done)
              : chamberFacts(shown.mode, character, selected?.card ?? null)}
            status={status}
            emptyText={text.emptyText}
            sequence={shownResult
              ? <ChamberSequence key={runKey} mode={shown.mode} before={shownResult.before} after={shownResult.after} phase={phase} />
              : undefined}
          />

          <DeckFooterNote tone={noteTone}>
            {note}{!shownResult && paymentNote ? ` · ${paymentNote}` : ""}
          </DeckFooterNote>
          <div data-sfx="off">
            {shownResult ? (
              <DeckButton variant="confirm" label="完成" disabled={!done} onClick={() => settle(onFinish)} />
            ) : (
              <>
                <DeckButton variant="abandon" label={abandonLabel ?? text.abandon} onClick={() => settle(onAbandon ?? onFinish)} />
                <DeckButton variant="confirm" label={text.confirm} disabled={Boolean(blocked) || !selected} onClick={confirm} />
              </>
            )}
          </div>
        </section>
      </DeckCardSkinProvider>
    </div>,
    document.querySelector<HTMLElement>("[data-stage-canvas]") ?? document.body,
  );
}
