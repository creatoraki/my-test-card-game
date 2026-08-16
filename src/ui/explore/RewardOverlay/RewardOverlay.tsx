// ★ 事件奖励浮层 ★ —— 事件结算后 pendingActions 逐条弹出的处理面板。
//
// ⚠ 版式不在这里: 外框(936×680)取自 explorePanel 的 panel-box, 页眉/正文/底栏/按钮/选择卡
//   全部来自 ui/common/EventPanel 的原语 —— 与落点事件面板同一套设计语言,
//   这样「选完选项 → 弹出奖励」时页眉基线与按钮行不会跳。
//   本文件只负责: 奖励种类 → 内容与文案。
import { useEffect, useState } from "react";
import { getCharacter, getItemDef, makeCard } from "@/data";
import { getQuirkDef } from "@/engine";
import type { QuirkId } from "@/engine";
import type { ExploreState, PendingAction } from "@/explore/types";
import { EQUIP_SLOTS, useTownStore } from "@/store/townStore";
import { useExploreStore } from "@/store/exploreStore";
import { useRunStore } from "@/store/runStore";
import type { EquipSlot, ItemStack } from "@/items/types";
import { SLOT_LABEL } from "@/items/types";
import { HandCard } from "@/ui/battle/HandCard";
import { PartyMemberCard } from "@/ui/common/PartyMemberCard";
import ItemTooltip, {
  tooltipPointFromRect,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { inventoryThemeVars } from "@/ui/common/item/inventoryTheme";
import { cx } from "@/ui/common/cx";
import { useRevealPresence } from "@/ui/common/ModalReveal";
import {
  EventPanelBody,
  EventPanelButton,
  EventPanelFoot,
  EventPanelFrame,
  EventPanelNotice,
  EventPanelPick,
  EventPanelStage,
} from "@/ui/common/EventPanel";
import { EXPLORE_BACKPACK_COLORS } from "@/ui/explore/styles/inventoryPalettes";
import { panelRevealCloseMs, panelRevealVars } from "@/ui/explore/styles/panelReveal";
import s from "./RewardOverlay.module.css";

// 奖励浮层的主色。★ 只在这里出现一次, 通过 EventPanelFrame 的 accent 下发给页眉/边线/按钮。
const REWARD_ACCENT = "#a7c9ff";

interface RewardView {
  session: ExploreState;
  action: PendingAction;
}

interface RewardOverlayProps {
  gate: boolean;
}

export default function RewardOverlay({ gate }: RewardOverlayProps) {
  const session = useExploreStore((state) => state.session);
  const grantExpTo = useExploreStore((state) => state.grantExpTo);
  const resolvePendingAction = useExploreStore((state) => state.resolvePendingAction);
  const acceptEquipOffer = useExploreStore((state) => state.acceptEquipOffer);
  const reforgeBackpackItem = useExploreStore((state) => state.reforgeBackpackItem);
  const resolvePendingHeal = useRunStore((state) => state.resolvePendingHeal);
  const resolvePendingQuirk = useRunStore((state) => state.resolvePendingQuirk);
  const resolvePendingPollution = useRunStore((state) => state.resolvePendingPollution);
  const resolvePendingPurification = useRunStore((state) => state.resolvePendingPurification);
  const characters = useTownStore((state) => state.characters);
  const party = useTownStore((state) => state.party);
  const grantFreeDraw = useTownStore((state) => state.grantFreeDraw);
  const pickDraw = useTownStore((state) => state.pickDraw);
  const removeCardFree = useTownStore((state) => state.removeCardFree);
  const reforgeEquipped = useTownStore((state) => state.reforgeEquipped);
  const [selectedChar, setSelectedChar] = useState<string | null>(null);

  const currentAction = session?.pendingActions[0];
  const presence = useRevealPresence<RewardView | null>(
    gate && Boolean(session && currentAction),
    session && currentAction ? { session, action: currentAction } : null,
    panelRevealCloseMs(),
  );
  const view = presence.data;
  const displayedSession = view?.session ?? session;
  const action = view?.action;
  useEffect(() => {
    setSelectedChar(null);
  }, [action?.kind]);
  if (!presence.mounted || !displayedSession || !action) return null;

  const selectableCharacters = displayedSession.party.filter((member) => member.alive);
  const chosenCharId = selectedChar && characters[selectedChar] ? selectedChar : null;
  const chosenCharacter = chosenCharId ? characters[chosenCharId] : null;
  const detailStage = action.kind === "forgeDraw"
    ? Boolean(chosenCharacter?.pendingDraw)
    : (action.kind === "forgeRemove" || action.kind === "cureQuirk" || action.kind === "purifyCards")
      ? Boolean(chosenCharacter)
      : false;
  const finish = () => resolvePendingAction();

  return (
    <div className={s["reward-layer"]} data-closing={presence.closing || undefined}>
      <section
        className={cx(s["reward-panel"], s["panel-reveal"])}
        data-closing={presence.closing || undefined}
        style={panelRevealVars()}
        aria-label="事件奖励"
      >
        <span className={s["panel-bar"]} aria-hidden />
        <span className={s["panel-frame"]} aria-hidden />
        <span className={s["panel-scan"]} aria-hidden />
        <EventPanelFrame
          accent={REWARD_ACCENT}
          kicker="成长协议 / REWARD"
          title={titleOf(action.kind)}
          status={<span className={s["reward-step"]}>待处理奖励</span>}
          contentKey={`${action.kind}-${detailStage ? "detail" : "pick"}`}
        >
          {action.kind === "expOne" && (
            <CharacterPicker
              members={selectableCharacters}
              selected={chosenCharId}
              onSelect={setSelectedChar}
              caption={`选择一名存活角色，获得 ${action.amount} 点经验。`}
              onSkip={finish}
              onConfirm={() => {
                if (!chosenCharId) return;
                grantExpTo(chosenCharId);
                finish();
              }}
            />
          )}

          {action.kind === "forgeDraw" && (
            <FreeDraw
              members={selectableCharacters}
              selected={chosenCharId}
              character={chosenCharacter}
              onSelect={setSelectedChar}
              onStart={() => {
                if (chosenCharId) grantFreeDraw(chosenCharId);
              }}
              onSkip={finish}
              onPick={(cardId) => {
                if (!chosenCharId) return;
                pickDraw(chosenCharId, cardId);
                finish();
              }}
            />
          )}

          {action.kind === "forgeRemove" && (
            <FreeRemove
              members={selectableCharacters}
              selected={chosenCharId}
              character={chosenCharacter}
              onSelect={setSelectedChar}
              onSkip={finish}
              onRemove={(uid) => {
                if (!chosenCharId) return;
                removeCardFree(chosenCharId, uid);
                finish();
              }}
            />
          )}

          {action.kind === "equipOffer" && (
            <EquipOffers
              offers={action.offers}
              onPick={(index) => {
                acceptEquipOffer(index);
                finish();
              }}
              onSkip={finish}
            />
          )}

          {action.kind === "reforge" && (
            <ReforgePicker
              backpack={displayedSession.backpack}
              characters={party.map((id) => ({ charId: id, character: characters[id] })).filter(
                (entry): entry is { charId: string; character: NonNullable<typeof entry.character> } =>
                  Boolean(entry.character),
              )}
              bias={action.bias}
              onBackpack={(uid) => {
                reforgeBackpackItem(uid);
                finish();
              }}
              onEquipped={(charId, slot) => {
                reforgeEquipped(charId, slot, action.bias);
                finish();
              }}
              onSkip={finish}
            />
          )}

          {action.kind === "healOne" && (
            <CharacterPicker
              members={selectableCharacters}
              selected={chosenCharId}
              onSelect={setSelectedChar}
              caption={action.full ? "选择一名存活角色，将当前生命恢复至体力极限。" : `选择一名存活角色，回复 ${Math.round(action.percent * 100)}% 当前生命。`}
              onSkip={finish}
              onConfirm={() => {
                if (chosenCharId) resolvePendingHeal(chosenCharId, false);
              }}
            />
          )}

          {action.kind === "healLimitOne" && (
            <CharacterPicker
              members={selectableCharacters}
              selected={chosenCharId}
              onSelect={setSelectedChar}
              caption={action.full ? "选择一名存活角色，将体力极限恢复至基础最大生命。" : `选择一名存活角色，修复 ${Math.round(action.percent * 100)}% 体力极限。`}
              onSkip={finish}
              onConfirm={() => {
                if (chosenCharId) resolvePendingHeal(chosenCharId, true);
              }}
            />
          )}

          {action.kind === "cureQuirk" && (
            action.scope === "party" ? (
              <PartyReward
                caption={`全队存活角色各治疗 ${action.count} 个怪癖。`}
                onSkip={finish}
                onConfirm={() => resolvePendingQuirk()}
              />
            ) : (
              <QuirkReward
                members={selectableCharacters}
                selected={chosenCharId}
                character={chosenCharacter}
                count={action.count}
                onSelect={setSelectedChar}
                onSkip={finish}
                onConfirm={(quirkId) => resolvePendingQuirk(chosenCharId ?? undefined, quirkId)}
              />
            )
          )}

          {action.kind === "reducePollution" && (
            action.scope === "party" ? (
              <PartyReward
                caption={`全队存活角色污染值降低 ${action.amount}。`}
                onSkip={finish}
                onConfirm={() => resolvePendingPollution()}
              />
            ) : (
              <CharacterPicker
                members={selectableCharacters}
                selected={chosenCharId}
                onSelect={setSelectedChar}
                caption={`选择一名存活角色，污染值降低 ${action.amount}。`}
                onSkip={finish}
                onConfirm={() => {
                  if (chosenCharId) resolvePendingPollution(chosenCharId);
                }}
              />
            )
          )}

          {action.kind === "purifyCards" && (
            <PurifyReward
              members={selectableCharacters}
              selected={chosenCharId}
              character={chosenCharacter}
              scope={action.scope}
              count={action.count}
              onSelect={setSelectedChar}
              onSkip={finish}
              onConfirm={(uids) => resolvePendingPurification(chosenCharId ?? undefined, uids)}
            />
          )}
        </EventPanelFrame>
      </section>
    </div>
  );
}

function titleOf(kind: string): string {
  switch (kind) {
    case "expOne":
      return "定向训练";
    case "forgeDraw":
      return "免费卡组锻造";
    case "forgeRemove":
      return "免费卡组整理";
    case "equipOffer":
      return "装备候选";
    case "reforge":
      return "羁绊重铸";
    case "healOne":
      return "指定角色治疗";
    case "healLimitOne":
      return "指定角色体力极限修复";
    case "cureQuirk":
      return "怪癖治疗";
    case "reducePollution":
      return "污染值降低";
    case "purifyCards":
      return "污染卡净化";
    default:
      return "事件奖励";
  }
}

/** 角色选择列 —— 三处奖励共用, 复用行动分镜的选择卡样式。 */
function MemberList({
  members,
  selected,
  onSelect,
}: {
  members: ExploreState["party"];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const characters = useTownStore((state) => state.characters);
  return (
    <div className={s["pick-list"]}>
      {members.map((member) => (
        <PartyMemberCard
          key={member.charId}
          as="button"
          charId={member.charId}
          emoji={member.emoji}
          name={member.name}
          hp={member.hp}
          hpLimit={member.hpLimit}
          maxHp={member.maxHp}
          pollution={characters[member.charId]?.pollution ?? 0}
          down={!member.alive}
          className={cx(s["member-choice"], selected === member.charId && s["is-selected"])}
          onClick={() => onSelect(member.charId)}
        />
      ))}
    </div>
  );
}

function CharacterPicker({
  members,
  selected,
  onSelect,
  caption,
  onSkip,
  onConfirm,
}: {
  members: ExploreState["party"];
  selected: string | null;
  onSelect: (id: string) => void;
  caption: string;
  onSkip: () => void;
  onConfirm: () => void;
}) {
  return (
    <EventPanelStage>
      <EventPanelBody caption={caption} scroll={false}>
        {members.length ? (
          <MemberList members={members} selected={selected} onSelect={onSelect} />
        ) : (
          <EventPanelNotice>当前没有可用的存活角色。</EventPanelNotice>
        )}
      </EventPanelBody>
      <EventPanelFoot note={members.length ? (selected ? "目标已锁定" : "请选择角色") : "奖励无法执行"}>
        {members.length ? (
          <EventPanelButton tone="primary" disabled={!selected} onClick={onConfirm}>
            确认奖励
          </EventPanelButton>
        ) : (
          <EventPanelButton onClick={onSkip}>结束奖励</EventPanelButton>
        )}
      </EventPanelFoot>
    </EventPanelStage>
  );
}

function PartyReward({
  caption,
  onSkip,
  onConfirm,
}: {
  caption: string;
  onSkip: () => void;
  onConfirm: () => void;
}) {
  return (
    <EventPanelStage>
      <EventPanelBody caption={caption} scroll={!character}>
        <EventPanelNotice>确认后立即应用到当前远征的全部存活角色。</EventPanelNotice>
      </EventPanelBody>
      <EventPanelFoot note="确认后立即应用到当前远征的存活角色">
        <EventPanelButton onClick={onSkip}>结束奖励</EventPanelButton>
        <EventPanelButton tone="primary" onClick={onConfirm}>
          确认奖励
        </EventPanelButton>
      </EventPanelFoot>
    </EventPanelStage>
  );
}

function QuirkReward({
  members,
  selected,
  character,
  count,
  onSelect,
  onSkip,
  onConfirm,
}: {
  members: ExploreState["party"];
  selected: string | null;
  character: { quirks: QuirkId[] } | null;
  count: number;
  onSelect: (id: string) => void;
  onSkip: () => void;
  onConfirm: (quirkId: QuirkId) => void;
}) {
  const quirks = character?.quirks ?? [];
  const caption = !character
    ? `选择一名存活角色，治疗 ${count} 个怪癖。`
    : quirks.length
      ? `选择要治疗的怪癖。当前角色可治疗 ${count} 个。`
      : "该角色当前没有可治疗的怪癖。";
  return (
    <EventPanelStage>
      <EventPanelBody caption={caption} scroll={!character}>
        {!character ? (
          <MemberList members={members} selected={selected} onSelect={onSelect} />
        ) : quirks.length ? (
          <div className={s["quirk-list"]}>
            {quirks.map((quirkId, index) => {
              const quirk = getQuirkDef(quirkId);
              return (
                <EventPanelPick
                  key={quirkId}
                  index={index}
                  leading={<span className={s["character-emoji"]}>{quirk?.emoji ?? "?"}</span>}
                  name={quirk?.name ?? quirkId}
                  desc={quirk?.desc ?? ""}
                  onClick={() => onConfirm(quirkId)}
                />
              );
            })}
          </div>
        ) : (
          <EventPanelNotice>该角色当前没有可治疗的怪癖。</EventPanelNotice>
        )}
      </EventPanelBody>
      <EventPanelFoot note={character ? (quirks.length ? "选择一个怪癖即可确认" : "奖励无法执行") : "请选择角色"}>
        <EventPanelButton onClick={onSkip}>结束奖励</EventPanelButton>
      </EventPanelFoot>
    </EventPanelStage>
  );
}

function PurifyReward({
  members,
  selected,
  character,
  scope,
  count,
  onSelect,
  onSkip,
  onConfirm,
}: {
  members: ExploreState["party"];
  selected: string | null;
  character: { deck: ReturnType<typeof makeCard>[] } | null;
  scope: "one" | "party";
  count: number;
  onSelect: (id: string) => void;
  onSkip: () => void;
  onConfirm: (uids?: string[]) => void;
}) {
  const contaminated = character?.deck.filter((card) => card.contaminated) ?? [];
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  useEffect(() => {
    setSelectedCards([]);
  }, [selected]);
  if (scope === "party") {
    return (
      <PartyReward
        caption={`全队存活角色各净化 ${count} 张污染卡。`}
        onSkip={onSkip}
        onConfirm={() => onConfirm()}
      />
    );
  }
  const caption = !character
    ? `选择一名存活角色，净化最多 ${count} 张污染卡。`
    : contaminated.length
      ? `选择最多 ${count} 张污染卡进行净化。`
      : "该角色当前没有污染卡。";
  return (
    <EventPanelStage>
      <EventPanelBody caption={caption} scroll={!character}>
        {!character ? (
          <MemberList members={members} selected={selected} onSelect={onSelect} />
        ) : contaminated.length ? (
          <div className={s["card-list"]} data-pick-grid>
            {contaminated.map((card, index) => {
              const picked = selectedCards.includes(card.uid);
              return (
                <div
                  className={cx(s["card-choice"], picked && s["is-selected"])}
                  key={card.uid}
                  onClick={() => {
                    setSelectedCards((current) =>
                      picked
                        ? current.filter((uid) => uid !== card.uid)
                        : current.length < count
                          ? [...current, card.uid]
                          : current,
                    );
                  }}
                >
                  <HandCard
                    card={card}
                    variant="pile"
                    playable
                    selected={picked}
                    dealDelay={Math.min(index, 14) * 22}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <EventPanelNotice>该角色当前没有污染卡。</EventPanelNotice>
        )}
      </EventPanelBody>
      <EventPanelFoot
        note={character ? `${selectedCards.length}/${Math.min(count, contaminated.length)} 张已选择` : "请选择角色"}
      >
        <EventPanelButton onClick={onSkip}>结束奖励</EventPanelButton>
        {character && contaminated.length > 0 && (
          <EventPanelButton tone="primary" disabled={!selectedCards.length} onClick={() => onConfirm(selectedCards)}>
            确认净化
          </EventPanelButton>
        )}
      </EventPanelFoot>
    </EventPanelStage>
  );
}

function FreeDraw({
  members,
  selected,
  character,
  onSelect,
  onStart,
  onSkip,
  onPick,
}: {
  members: ExploreState["party"];
  selected: string | null;
  character: { pendingDraw: string[] | null } | null;
  onSelect: (id: string) => void;
  onStart: () => void;
  onSkip: () => void;
  onPick: (cardId: string) => void;
}) {
  if (!character?.pendingDraw) {
    return (
      <EventPanelStage>
        <EventPanelBody caption="选择一名角色，免费生成三张角色专属卡牌。" scroll={false}>
          {members.length ? (
            <MemberList members={members} selected={selected} onSelect={onSelect} />
          ) : (
            <EventPanelNotice>当前没有可用的存活角色。</EventPanelNotice>
          )}
        </EventPanelBody>
        <EventPanelFoot note={members.length ? (selected ? "免费锻造不消耗经验" : "请选择角色") : "奖励无法执行"}>
          {members.length ? (
            <EventPanelButton tone="primary" disabled={!selected} onClick={onStart}>
              开始锻造
            </EventPanelButton>
          ) : (
            <EventPanelButton onClick={onSkip}>结束奖励</EventPanelButton>
          )}
        </EventPanelFoot>
      </EventPanelStage>
    );
  }
  return (
    <EventPanelStage>
      <EventPanelBody
        caption={character.pendingDraw.length ? "三张候选卡牌已经生成，选择一张加入卡组。" : "当前角色没有可生成的卡牌候选。"}
      >
        {character.pendingDraw.length ? (
          <div className={s["card-list"]} data-pick-grid>
            {character.pendingDraw.map((cardId, index) => (
              <div className={s["card-choice"]} key={cardId} onClick={() => onPick(cardId)}>
                <HandCard
                  card={makeCard(cardId)}
                  variant="pile"
                  playable
                  selected={false}
                  dealDelay={Math.min(index, 14) * 22}
                />
              </div>
            ))}
          </div>
        ) : (
          <EventPanelNotice>当前角色没有可生成的卡牌候选。</EventPanelNotice>
        )}
      </EventPanelBody>
      <EventPanelFoot note={character.pendingDraw.length ? "选择一张即可完成锻造" : "本次免费锻造无法执行"}>
        {!character.pendingDraw.length && <EventPanelButton onClick={onSkip}>结束奖励</EventPanelButton>}
      </EventPanelFoot>
    </EventPanelStage>
  );
}

function FreeRemove({
  members,
  selected,
  character,
  onSelect,
  onSkip,
  onRemove,
}: {
  members: ExploreState["party"];
  selected: string | null;
  character: { deck: ReturnType<typeof makeCard>[]; minDeckSize: number } | null;
  onSelect: (id: string) => void;
  onSkip: () => void;
  onRemove: (uid: string) => void;
}) {
  const removable = character && character.deck.length > character.minDeckSize ? character.deck : [];
  if (!character) {
    return (
      <EventPanelStage>
        <EventPanelBody caption="选择一名角色，从其卡组中免费移除一张卡牌。" scroll={false}>
          {members.length ? (
            <MemberList members={members} selected={selected} onSelect={onSelect} />
          ) : (
            <EventPanelNotice>当前没有可处理的角色卡组。</EventPanelNotice>
          )}
        </EventPanelBody>
        <EventPanelFoot note={members.length ? "选择角色后展开其卡组" : "本次免费删卡无法执行"}>
          {!members.length && <EventPanelButton onClick={onSkip}>结束奖励</EventPanelButton>}
        </EventPanelFoot>
      </EventPanelStage>
    );
  }
  return (
    <EventPanelStage>
      <EventPanelBody
        caption={
          removable.length
            ? `选择要移除的卡牌。卡组至少保留 ${character.minDeckSize} 张。`
            : "当前角色已经达到最小卡组下限。"
        }
      >
        {removable.length ? (
          <div className={s["card-list"]} data-pick-grid>
            {removable.map((card, index) => (
              <div className={s["card-choice"]} key={card.uid} onClick={() => onRemove(card.uid)}>
                <HandCard
                  card={card}
                  variant="pile"
                  playable
                  selected={false}
                  dealDelay={Math.min(index, 14) * 22}
                />
              </div>
            ))}
          </div>
        ) : (
          <EventPanelNotice>当前角色已经达到最小卡组下限。</EventPanelNotice>
        )}
      </EventPanelBody>
      <EventPanelFoot note={removable.length ? "点击卡牌即可移除" : "本次免费删卡无法执行"}>
        {!removable.length && <EventPanelButton onClick={onSkip}>结束奖励</EventPanelButton>}
      </EventPanelFoot>
    </EventPanelStage>
  );
}

function EquipOffers({
  offers,
  onPick,
  onSkip,
}: {
  offers: ItemStack[];
  onPick: (index: number) => void;
  onSkip: () => void;
}) {
  const [hovered, setHovered] = useState<{ uid: string; point: TooltipPoint } | null>(null);

  useEffect(() => {
    if (hovered && !offers.some((stack) => stack.uid === hovered.uid)) {
      setHovered(null);
    }
  }, [hovered, offers]);

  const hoveredStack = hovered
    ? offers.find((stack) => stack.uid === hovered.uid) ?? null
    : null;

  return (
    <EventPanelStage>
      <EventPanelBody caption="候选属性已在事件结算时确定，选择一件放入拾取框。">
        {offers.length ? (
          <div className={s["item-list"]}>
            {offers.map((stack, index) => (
              <div
                className={s["item-choice"]}
                key={stack.uid}
                onPointerEnter={(event) =>
                  setHovered({
                    uid: stack.uid,
                    point: tooltipPointFromRect(event.currentTarget.getBoundingClientRect()),
                  })
                }
                onPointerLeave={() =>
                  setHovered((current) => (current?.uid === stack.uid ? null : current))
                }
              >
                <ItemSlot stack={stack} showName={false} onClick={() => onPick(index)} />
              </div>
            ))}
          </div>
        ) : (
          <EventPanelNotice>当前没有可用装备候选。</EventPanelNotice>
        )}
      </EventPanelBody>
      {hoveredStack && hovered && (
        <ItemTooltip
          stack={hoveredStack}
          point={hovered.point}
          themeStyle={inventoryThemeVars(EXPLORE_BACKPACK_COLORS)}
        />
      )}
      <EventPanelFoot note="未选择的候选不会进入背包">
        <EventPanelButton onClick={onSkip}>放弃候选</EventPanelButton>
      </EventPanelFoot>
    </EventPanelStage>
  );
}

function ReforgePicker({
  backpack,
  characters,
  bias,
  onBackpack,
  onEquipped,
  onSkip,
}: {
  backpack: ItemStack[];
  characters: { charId: string; character: { equipped: Record<EquipSlot, ItemStack | null> } }[];
  bias?: "offense" | "defense";
  onBackpack: (uid: string) => void;
  onEquipped: (charId: string, slot: EquipSlot) => void;
  onSkip: () => void;
}) {
  const backpackEquipment = backpack.filter((stack) => getItemDef(stack.itemId).category === "equipment");
  const equipped = characters.flatMap(({ charId, character }) =>
    EQUIP_SLOTS.flatMap((slot) => {
      const stack = character.equipped?.[slot];
      return stack ? [{ charId, slot, stack }] : [];
    }),
  );
  const [hovered, setHovered] = useState<{ uid: string; point: TooltipPoint } | null>(null);

  useEffect(() => {
    const available = [...backpackEquipment, ...equipped.map((entry) => entry.stack)];
    if (hovered && !available.some((stack) => stack.uid === hovered.uid)) {
      setHovered(null);
    }
  }, [backpackEquipment, equipped, hovered]);

  const hoveredStack = hovered
    ? [...backpackEquipment, ...equipped.map((entry) => entry.stack)].find((stack) => stack.uid === hovered.uid) ?? null
    : null;

  return (
    <EventPanelStage>
      <EventPanelBody
        caption={`选择一件装备重铸羁绊${bias ? `，当前偏向${bias === "offense" ? "攻击" : "防御"}` : ""}。`}
      >
        {backpackEquipment.length || equipped.length ? (
          <div className={s["reforge-groups"]}>
            <div>
              <span className={s["group-label"]}>探索背包</span>
              <div className={s["item-list"]}>
                {backpackEquipment.map((stack) => (
                  <div
                    className={s["item-choice"]}
                    key={stack.uid}
                    onPointerEnter={(event) =>
                      setHovered({
                        uid: stack.uid,
                        point: tooltipPointFromRect(event.currentTarget.getBoundingClientRect()),
                      })
                    }
                    onPointerLeave={() =>
                      setHovered((current) => (current?.uid === stack.uid ? null : current))
                    }
                  >
                    <ItemSlot stack={stack} showName={false} onClick={() => onBackpack(stack.uid)} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span className={s["group-label"]}>角色装备</span>
              <div className={s["item-list"]}>
                {equipped.map(({ charId, slot, stack }) => (
                  <div
                    className={s["equipped-choice"]}
                    key={`${charId}-${slot}`}
                    onPointerEnter={(event) =>
                      setHovered({
                        uid: stack.uid,
                        point: tooltipPointFromRect(event.currentTarget.getBoundingClientRect()),
                      })
                    }
                    onPointerLeave={() =>
                      setHovered((current) => (current?.uid === stack.uid ? null : current))
                    }
                  >
                    <ItemSlot stack={stack} showName={false} onClick={() => onEquipped(charId, slot)} />
                    <span>{getCharacter(charId).name} · {SLOT_LABEL[slot]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EventPanelNotice>没有可重铸的装备。</EventPanelNotice>
        )}
      </EventPanelBody>
      {hoveredStack && hovered && (
        <ItemTooltip
          stack={hoveredStack}
          point={hovered.point}
          themeStyle={inventoryThemeVars(EXPLORE_BACKPACK_COLORS)}
        />
      )}
      <EventPanelFoot
        note={backpackEquipment.length || equipped.length ? "未选择的装备保持原样" : "本次羁绊重铸无法执行"}
      >
        <EventPanelButton onClick={onSkip}>结束奖励</EventPanelButton>
      </EventPanelFoot>
    </EventPanelStage>
  );
}
