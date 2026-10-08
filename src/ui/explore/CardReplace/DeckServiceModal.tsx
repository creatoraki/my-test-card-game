// 卡组面板: 换牌 / 删牌 / 复制 / 抽牌共用一套骨架, 费用由调用方结算, 文案与事实表见 deckServiceModes。
//
// 两段式:
//   ① 选卡: 左侧整副卡组(放大 1.1 倍), 右侧舱位放大展示已选卡并列明结果范围 / 模组去向;
//      抽牌只选角色, 卡组只读;
//   ② 结果: 调用方 onConfirm 结算后把结果写进 result, 本弹窗据此播放演出(换牌走置换演出, 其余直接展示),
//      「完成」才由调用方收尾。抽牌确认后由调用方关闭本弹窗、改弹三选一。
// ⚠ portal 到设计画布([data-stage-canvas]), 与卡牌奖励三选一同层(z-index 300), 不依赖奖励面板的尺寸。
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Card } from "@/engine";
import type { ExploreState } from "@/explore/types";
import { useTownStore } from "@/store/town/townStore";
import type { CharacterState } from "@/store/town/townTypes";
import { playSfx } from "@/ui/audio";
import { useRevealPresence } from "@/ui/common/frame/ModalReveal";
import { PickFrameDecor } from "@/ui/common/card/CardRewardPicker/PickFrameDecor";
import { cx } from "@/ui/common/shared/cx";
import { chamberFacts, DECK_SERVICE_TEXT, type DeckServiceMode } from "./deckServiceModes";
import { DeckServiceOutcome } from "./DeckServiceOutcome";
import { ReplaceChamber } from "./ReplaceChamber";
import { ReplaceDeckGrid, type ReplaceDeckEntry } from "./ReplaceDeckGrid";
import { ReplaceShowcase } from "./ReplaceShowcase";
import { useReplaceSequence } from "./useReplaceSequence";
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
  lockedCharId: string | null;
  /** 顶部小标题, 区分来源(物件服务 / 战斗奖励 / 锻造师)。 */
  kicker: string;
  paymentNote?: string;
  unavailableReason?: string | null;
  /** 单张卡无法处理的原因; null = 可选。 */
  cardReason: (character: CharacterState, card: Card) => string | null;
  /** 整个角色无法处理的原因; null = 可选。 */
  characterReason?: (character: CharacterState) => string | null;
  /** 执行服务; 抽牌时 uid 为 null。失败返回 false。 */
  onConfirm: (charId: string, uid: string | null) => boolean;
  /** 结果展示后点「完成」。 */
  onFinish: () => void;
  /** 未出结果时放弃; 缺省同 onFinish。 */
  onAbandon?: () => void;
  abandonLabel?: string;
}

export function DeckServiceModal({
  mode, open, result, members, lockedCharId, kicker, paymentNote, unavailableReason,
  cardReason, characterReason, onConfirm, onFinish, onAbandon, abandonLabel,
}: Props) {
  const presence = useRevealPresence(open, open ? { mode, result, members, lockedCharId } : null, CLOSE_MS);
  const shown = presence.data;
  const characters = useTownStore((state) => state.characters);
  const [pickedChar, setPickedChar] = useState<string | null>(null);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const settledRef = useRef(false);

  const text = DECK_SERVICE_TEXT[shown?.mode ?? mode];
  const drawing = shown?.mode === "draw";
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
  const replaceKey = shown?.mode === "replace" && shownResult?.after ? `${shownResult.charId}-${shownResult.after.uid}` : null;
  const phase = useReplaceSequence(replaceKey);

  useEffect(() => {
    if (open) settledRef.current = false;
  }, [open]);
  useEffect(() => {
    setSelectedUid(null);
    setFailed(false);
  }, [charId]);

  if (typeof document === "undefined" || !presence.mounted || !shown) return null;

  const selected = drawing ? null : entries.find((entry) => entry.card.uid === selectedUid && !entry.lockedReason) ?? null;
  const available = entries.filter((entry) => !entry.lockedReason).length;
  const ownerName = shown.members.find((member) => member.charId === charId)?.name ?? "角色";
  const busy = presence.closing || settledRef.current;
  const pickable = !shownResult && !shown.lockedCharId && shown.members.length > 1;
  const charReason = character ? characterReason?.(character) ?? null : "当前没有可处理的角色";
  const blocked = unavailableReason || charReason;
  const done = shown.mode !== "replace" || phase === "done";

  const settle = (handler: () => void) => {
    if (busy) return;
    settledRef.current = true;
    playSfx(shownResult ? "confirm" : "back");
    handler();
  };
  const confirm = () => {
    if (!charId || busy || blocked || (!drawing && !selected)) return;
    playSfx("confirm");
    setFailed(!onConfirm(charId, selected?.card.uid ?? null));
  };

  const note = shownResult
    ? done ? text.doneNote : "置换进行中……"
    : failed ? "服务未执行，请重新选择"
      : unavailableReason ? unavailableReason
        : charReason ? `${ownerName}：${charReason}`
          : drawing ? `将为${ownerName}生成候选`
            : !available ? `${ownerName}的卡组里没有可处理的卡牌`
              : selected ? text.picked(selected.card) : text.prompt;

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
      <section className={s.frame}>
        <PickFrameDecor />

        <header className={s.head}>
          <span className={s.kicker}>{kicker}</span>
          <h2 className={s.title}>{text.title}</h2>
          <p className={s.caption}>{shownResult ? text.doneCaption : text.caption}</p>
        </header>

        {shownResult ? (
          <div className={s.showcase}>
            {shown.mode === "replace" && shownResult.before && shownResult.after
              ? <ReplaceShowcase before={shownResult.before} after={shownResult.after} ownerName={ownerName} phase={phase} />
              : <DeckServiceOutcome mode={shown.mode} before={shownResult.before} after={shownResult.after} ownerName={ownerName} />}
          </div>
        ) : (
          <div className={s.body}>
            <div className={s.deck}>
              <div className={s.toolbar}>
                {pickable ? (
                  <div className={s.tabs} role="tablist" aria-label="选择角色">
                    {shown.members.map((member) => (
                      <button
                        key={member.charId}
                        type="button"
                        role="tab"
                        aria-selected={member.charId === charId}
                        className={cx(s.tab, member.charId === charId && s.tabActive)}
                        onClick={() => setPickedChar(member.charId)}
                      >
                        {member.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className={s.owner}><i aria-hidden />{ownerName}的卡组</span>
                )}
                <span className={s.count}>共 {entries.length} 张{drawing ? "" : ` · ${text.countLabel} ${available} 张`}</span>
              </div>
              {entries.length
                ? <ReplaceDeckGrid entries={entries} selectedUid={selected?.card.uid ?? null} labels={text.slot} readOnly={drawing} onSelect={setSelectedUid} />
                : <p className={s.notice}>当前没有可处理的角色卡组。</p>}
            </div>
            <ReplaceChamber
              label={text.chamber}
              card={selected?.card ?? null}
              facts={chamberFacts(shown.mode, character, selected?.card ?? null, ownerName)}
              ready={drawing ? !charReason : Boolean(selected)}
              emptyText={text.emptyText}
            />
          </div>
        )}

        <footer className={s.foot}>
          <span className={s.note} data-tone={!shownResult && (failed || blocked) ? "danger" : undefined}>
            {note}{!shownResult && paymentNote ? ` · ${paymentNote}` : ""}
          </span>
          <div className={s.actions} data-sfx="off">
            {shownResult ? (
              <button type="button" className={cx(s.button, s.primary)} disabled={!done} onClick={() => settle(onFinish)}>
                完成
              </button>
            ) : (
              <>
                <button type="button" className={s.button} onClick={() => settle(onAbandon ?? onFinish)}>{abandonLabel ?? text.abandon}</button>
                <button type="button" className={cx(s.button, s.primary)} disabled={Boolean(blocked) || (!drawing && !selected)} onClick={confirm}>
                  {text.confirm}
                </button>
              </>
            )}
          </div>
        </footer>
      </section>
    </div>,
    document.querySelector<HTMLElement>("[data-stage-canvas]") ?? document.body,
  );
}
