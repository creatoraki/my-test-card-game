// ★ 普通卡替换弹窗 ★ —— 卡牌置换终端等「普通卡替换」待办的独立弹窗(替代原奖励面板里的简易卡格)。
//
// 两段式:
//   ① 选卡: 左侧整副卡组(放大 1.1 倍), 右侧置换舱放大展示已选卡并列明结果范围 / 模组去向 / 食品费用;
//   ② 演出: 确认后服务层扣款换卡、把前后两张卡写进待办 result(待办不出队), 本弹窗据此播放置换演出,
//      演出结束「完成」才由调用方把待办出队。
// ⚠ portal 到设计画布([data-stage-canvas]), 与卡牌奖励三选一同层(z-index 300), 不依赖奖励面板的尺寸。
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { cardDisplayName } from "@/engine";
import type { ExploreState, PendingAction } from "@/explore/types";
import { serviceFoodCount } from "@/explore/curio/foodPayment";
import { useExploreStore } from "@/store/explore/exploreStore";
import { replaceExploreCard } from "@/store/explore/exploreGrowthServices";
import { commonReplaceCandidates } from "@/store/town/deckCards";
import { useTownStore } from "@/store/town/townStore";
import { playSfx } from "@/ui/audio";
import { useRevealPresence } from "@/ui/common/frame/ModalReveal";
import { PickFrameDecor } from "@/ui/common/card/CardRewardPicker/PickFrameDecor";
import { cx } from "@/ui/common/shared/cx";
import { ReplaceChamber } from "./ReplaceChamber";
import { ReplaceDeckGrid, type ReplaceDeckEntry } from "./ReplaceDeckGrid";
import { ReplaceShowcase } from "./ReplaceShowcase";
import { useReplaceSequence } from "./useReplaceSequence";
import s from "./CardReplaceModal.module.css";

const CLOSE_MS = 240;

export type ReplaceCardAction = Extract<PendingAction, { kind: "replaceCard" }>;

interface Props {
  /** null = 关闭(带退场动画)。 */
  action: ReplaceCardAction | null;
  /** 可选的存活角色; 目标已锁定为交互者时只用于显示名字。 */
  members: ExploreState["party"];
  lockedCharId: string | null;
  onFinish: () => void;
}

export function CardReplaceModal({ action, members, lockedCharId, onFinish }: Props) {
  const presence = useRevealPresence(Boolean(action), action ? { action, members, lockedCharId } : null, CLOSE_MS);
  const shown = presence.data;
  const characters = useTownStore((state) => state.characters);
  const foodHave = useExploreStore((state) => state.session ? serviceFoodCount(state.session) : 0);
  const [pickedChar, setPickedChar] = useState<string | null>(null);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const settledRef = useRef(false);

  const result = shown?.action.result ?? null;
  const charId = result?.charId ?? shown?.lockedCharId
    ?? shown?.members.find((member) => member.charId === pickedChar)?.charId
    ?? shown?.members[0]?.charId ?? null;
  const character = charId ? characters[charId] : undefined;
  const entries = useMemo<ReplaceDeckEntry[]>(
    () => character ? character.deck.map((card) => ({ card, candidates: commonReplaceCandidates(character, card.uid).length })) : [],
    [character],
  );
  const phase = useReplaceSequence(result ? `${result.charId}-${result.after.uid}` : null);

  useEffect(() => {
    if (action) settledRef.current = false;
  }, [action]);
  useEffect(() => {
    setSelectedUid(null);
    setFailed(false);
  }, [charId]);

  if (typeof document === "undefined" || !presence.mounted || !shown) return null;

  const foodCost = shown.action.foodCost ?? 0;
  const short = foodHave < foodCost;
  const selected = entries.find((entry) => entry.card.uid === selectedUid && entry.candidates > 0) ?? null;
  const replaceable = entries.filter((entry) => entry.candidates > 0).length;
  const ownerName = shown.members.find((member) => member.charId === charId)?.name ?? "角色";
  const busy = presence.closing || settledRef.current;
  const pickable = !result && !shown.lockedCharId && shown.members.length > 1;

  const finish = () => {
    if (busy) return;
    settledRef.current = true;
    playSfx(result ? "confirm" : "back");
    onFinish();
  };
  const confirm = () => {
    if (!selected || !charId || short || busy) return;
    playSfx("confirm");
    setFailed(!replaceExploreCard(charId, selected.card.uid));
  };

  const note = result
    ? phase === "done" ? "置换完成，原卡及其模组已移除" : "置换进行中……"
    : failed ? "置换失败，未扣除任何食品，请重新选择"
      : short ? `临期食品不足：需要 ${foodCost} 份，当前持有 ${foodHave} 份，本次不会扣款`
        : !replaceable ? `${ownerName}的卡组里没有可以替换的卡牌`
          : selected ? `确认后消耗临期食品 ×${foodCost}，「${cardDisplayName(selected.card)}」将被移除`
            : "点击卡牌放入置换舱";

  return createPortal(
    <div
      className={s.layer}
      data-closing={presence.closing ? "" : undefined}
      role="dialog"
      aria-modal="true"
      aria-label="普通卡替换"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <section className={s.frame}>
        <PickFrameDecor />

        <header className={s.head}>
          <span className={s.kicker}>置换协议 / 服务</span>
          <h2 className={s.title}>普通卡替换</h2>
          <p className={s.caption}>
            {result ? "置换舱已完成本次置换。" : "选择一张卡牌放入置换舱，它会被替换为一张随机普通卡，原卡及其模组一并移除。"}
          </p>
        </header>

        {result ? (
          <div className={s.showcase}>
            <ReplaceShowcase before={result.before} after={result.after} ownerName={ownerName} phase={phase} />
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
                <span className={s.count}>共 {entries.length} 张 · 可替换 {replaceable} 张</span>
              </div>
              {entries.length
                ? <ReplaceDeckGrid entries={entries} selectedUid={selected?.card.uid ?? null} onSelect={setSelectedUid} />
                : <p className={s.notice}>当前没有可处理的角色卡组。</p>}
            </div>
            <ReplaceChamber card={selected?.card ?? null} candidates={selected?.candidates ?? 0} foodCost={foodCost} foodHave={foodHave} />
          </div>
        )}

        <footer className={s.foot}>
          <span className={s.note} data-tone={!result && (short || failed) ? "danger" : undefined}>{note}</span>
          <div className={s.actions} data-sfx="off">
            {result ? (
              <button type="button" className={cx(s.button, s.primary)} disabled={phase !== "done"} onClick={finish}>
                完成
              </button>
            ) : (
              <>
                <button type="button" className={s.button} onClick={finish}>放弃置换</button>
                <button type="button" className={cx(s.button, s.primary)} disabled={!selected || short} onClick={confirm}>
                  确认替换
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
