import { makeCard } from "@/data";
import type { ExploreState } from "@/explore/types";
import { HandCard } from "@/ui/common/card/HandCard";
import { EventPanelStage, EventPanelBody, EventPanelFoot, EventPanelButton, EventPanelNotice } from "@/ui/common/widget/EventPanel";
import { MemberList } from "./RewardCharacters";
import s from "@/ui/explore/styles/rewardKit.module.css";
export function FreeDraw({
  members,
  selected,
  character,
  onSelect,
  onStart,
  onSkip,
  onAbandon,
}: {
  members: ExploreState["party"];
  selected: string | null;
  character: { pendingDraw: string[] | null } | null;
  onSelect: (id: string) => void;
  onStart: () => void;
  onSkip: () => void;
  /** 候选为空时结束奖励: 清掉候选, 不加入任何卡牌。 */
  onAbandon: () => void;
}) {
  if (!character?.pendingDraw) {
    return (
      <EventPanelStage>
        <EventPanelBody caption="选择一名角色，生成三张角色专属候选卡牌。" scroll={false}>
          {members.length ? (
            <MemberList members={members} selected={selected} onSelect={onSelect} />
          ) : (
            <EventPanelNotice>当前没有可用的存活角色。</EventPanelNotice>
          )}
        </EventPanelBody>
        <EventPanelFoot note={members.length ? (selected ? "本次抽卡不额外消耗经验" : "请选择角色") : "奖励无法执行"}>
          {members.length ? (
            <>
              <EventPanelButton tone="primary" disabled={!selected} onClick={onStart}>
                开始锻造
              </EventPanelButton>
              <EventPanelButton onClick={onSkip}>放弃锻造</EventPanelButton>
            </>
          ) : (
            <EventPanelButton onClick={onSkip}>结束奖励</EventPanelButton>
          )}
        </EventPanelFoot>
      </EventPanelStage>
    );
  }
  // 候选非空时三选一由 RewardOverlay 交给 CardRewardPicker 弹窗, 这里只剩「没有可生成候选」的兜底。
  return (
    <EventPanelStage>
      <EventPanelBody caption="当前角色没有可生成的卡牌候选。">
        <EventPanelNotice>当前角色没有可生成的卡牌候选。</EventPanelNotice>
      </EventPanelBody>
      <EventPanelFoot note="本次免费锻造无法执行">
        <EventPanelButton onClick={onAbandon}>结束奖励</EventPanelButton>
      </EventPanelFoot>
    </EventPanelStage>
  );
}

export function FreeRemove({
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


