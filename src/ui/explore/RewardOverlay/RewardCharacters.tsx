import { useEffect, useState } from "react";
import { makeCard } from "@/data";
import { getQuirkDef, type QuirkId } from "@/engine";
import type { ExploreState } from "@/explore/types";
import { useTownStore } from "@/store/town/townStore";
import { HandCard } from "@/ui/common/card/HandCard";
import { PartyMemberCard } from "@/ui/common/unit/PartyMemberCard";
import { cx } from "@/ui/common/shared/cx";
import { EventPanelStage, EventPanelBody, EventPanelFoot, EventPanelButton, EventPanelNotice, EventPanelPick } from "@/ui/common/widget/EventPanel";
import s from "@/ui/explore/styles/rewardKit.module.css";
export function MemberList({
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

export function CharacterPicker({
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

export function PartyReward({
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
      <EventPanelBody caption={caption} scroll={false}>
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

export function QuirkReward({
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

export function PurifyReward({
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


